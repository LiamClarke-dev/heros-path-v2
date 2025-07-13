// services/DiscoveryConsolidationService.js
import { 
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { searchAlongRoute } from './DiscoveriesService';
import PingService from './PingService';
import DiscoveryService from './DiscoveryService';
import Logger from '../utils/Logger';

class DiscoveryConsolidationService {
  /**
   * Consolidate SAR and ping results for a completed journey
   * @param {string} userId - User ID
   * @param {string} journeyId - Journey ID
   * @param {Array} routeCoords - Journey route coordinates
   * @param {Object} preferences - User discovery preferences
   * @returns {Promise<Object>} Consolidation result
   */
  async consolidateJourneyDiscoveries(userId, journeyId, routeCoords, preferences) {
    const startTime = Date.now();
    Logger.debug('CONSOLIDATION_SERVICE', 'Starting journey discovery consolidation', { 
      userId, 
      journeyId, 
      routeCoordsCount: routeCoords?.length || 0 
    });

    try {
      // 1. Get SAR results
      const sarResults = await this.getSARResults(routeCoords, preferences);
      Logger.debug('CONSOLIDATION_SERVICE', `SAR returned ${sarResults.length} places`);

      // 2. Get ping results
      const pingResults = await this.getPingResults(userId, journeyId);
      Logger.debug('CONSOLIDATION_SERVICE', `Found ${pingResults.length} ping results`);

      // 3. Extract places from ping results
      const pingPlaces = this.extractPlacesFromPingResults(pingResults);
      Logger.debug('CONSOLIDATION_SERVICE', `Extracted ${pingPlaces.length} places from pings`);

      // 4. Merge and deduplicate all places
      const allPlaces = [...sarResults, ...pingPlaces];
      const consolidatedPlaces = this.deduplicateAndMergePlaces(allPlaces);
      Logger.debug('CONSOLIDATION_SERVICE', `Consolidated to ${consolidatedPlaces.length} unique places`);

      // 5. Save consolidated discoveries to Firestore
      const savedCount = await this.saveConsolidatedDiscoveries(userId, journeyId, consolidatedPlaces);

      // 6. Archive ping results
      await PingService.archivePingResults(userId, journeyId);

      const duration = Date.now() - startTime;
      Logger.performance('CONSOLIDATION_SERVICE', 'consolidateJourneyDiscoveries', duration, {
        userId,
        journeyId,
        sarPlaces: sarResults.length,
        pingPlaces: pingPlaces.length,
        consolidatedPlaces: consolidatedPlaces.length,
        savedCount
      });

      return {
        success: true,
        sarPlaces: sarResults.length,
        pingPlaces: pingPlaces.length,
        consolidatedPlaces: consolidatedPlaces.length,
        savedCount
      };

    } catch (error) {
      Logger.error('CONSOLIDATION_SERVICE', 'Journey discovery consolidation failed', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get SAR results for the route
   * @param {Array} routeCoords - Route coordinates
   * @param {Object} preferences - User preferences
   * @returns {Promise<Array>} SAR results
   */
  async getSARResults(routeCoords, preferences) {
    try {
      const sarResults = await searchAlongRoute(routeCoords, preferences, 'en');
      
      // Add source metadata
      return sarResults.map(place => ({
        ...place,
        source: 'sar',
        sarTimestamp: Date.now()
      }));
    } catch (error) {
      Logger.error('CONSOLIDATION_SERVICE', 'Failed to get SAR results', error);
      return [];
    }
  }

  /**
   * Get ping results for the journey
   * @param {string} userId - User ID
   * @param {string} journeyId - Journey ID
   * @returns {Promise<Array>} Ping results
   */
  async getPingResults(userId, journeyId) {
    try {
      return await PingService.getPingResultsForJourney(userId, journeyId);
    } catch (error) {
      Logger.error('CONSOLIDATION_SERVICE', 'Failed to get ping results', error);
      return [];
    }
  }

  /**
   * Extract places from ping results
   * @param {Array} pingResults - Array of ping result objects
   * @returns {Array} Array of places
   */
  extractPlacesFromPingResults(pingResults) {
    const allPlaces = [];
    
    pingResults.forEach(pingResult => {
      if (pingResult.places && Array.isArray(pingResult.places)) {
        pingResult.places.forEach(place => {
          allPlaces.push({
            ...place,
            source: 'ping',
            pingId: pingResult.id,
            pingTimestamp: pingResult.timestamp
          });
        });
      }
    });

    return allPlaces;
  }

  /**
   * Deduplicate and merge places from different sources
   * @param {Array} places - Array of places from SAR and pings
   * @returns {Array} Deduplicated and merged places
   */
  deduplicateAndMergePlaces(places) {
    if (!places || places.length === 0) {
      return [];
    }

    // Group places by placeId
    const placeGroups = {};
    
    places.forEach(place => {
      const placeId = place.placeId;
      if (!placeGroups[placeId]) {
        placeGroups[placeId] = [];
      }
      placeGroups[placeId].push(place);
    });

    // Merge each group into a single place
    const mergedPlaces = Object.values(placeGroups).map(group => {
      return this.mergePlaceGroup(group);
    });

    // Sort by source priority (SAR first, then ping)
    mergedPlaces.sort((a, b) => {
      const sourcePriority = { sar: 1, ping: 2 };
      return (sourcePriority[a.primarySource] || 3) - (sourcePriority[b.primarySource] || 3);
    });

    return mergedPlaces;
  }

  /**
   * Merge a group of places with the same placeId
   * @param {Array} placeGroup - Array of places with same placeId
   * @returns {Object} Merged place
   */
  mergePlaceGroup(placeGroup) {
    if (placeGroup.length === 1) {
      return placeGroup[0];
    }

    // Sort by source priority (SAR first, then ping)
    placeGroup.sort((a, b) => {
      const sourcePriority = { sar: 1, ping: 2 };
      return (sourcePriority[a.source] || 3) - (sourcePriority[b.source] || 3);
    });

    const primaryPlace = placeGroup[0];
    const mergedPlace = { ...primaryPlace };

    // Determine primary source
    mergedPlace.primarySource = primaryPlace.source;
    mergedPlace.allSources = placeGroup.map(p => p.source);

    // Merge additional metadata
    mergedPlace.pingCount = placeGroup.filter(p => p.source === 'ping').length;
    mergedPlace.sarCount = placeGroup.filter(p => p.source === 'sar').length;

    // Use best rating if available
    const bestRating = Math.max(...placeGroup.map(p => p.rating || 0));
    if (bestRating > 0) {
      mergedPlace.rating = bestRating;
    }

    // Use highest user rating count
    const maxUserRatings = Math.max(...placeGroup.map(p => p.userRatingsTotal || 0));
    if (maxUserRatings > 0) {
      mergedPlace.userRatingsTotal = maxUserRatings;
    }

    // Combine all types
    const allTypes = new Set();
    placeGroup.forEach(p => {
      if (p.types && Array.isArray(p.types)) {
        p.types.forEach(type => allTypes.add(type));
      }
    });
    mergedPlace.types = Array.from(allTypes);

    // Use most complete address
    const bestAddress = placeGroup.find(p => p.formatted_address && p.formatted_address.length > 0);
    if (bestAddress) {
      mergedPlace.formatted_address = bestAddress.formatted_address;
    }

    return mergedPlace;
  }

  /**
   * Save consolidated discoveries to Firestore
   * @param {string} userId - User ID
   * @param {string} journeyId - Journey ID
   * @param {Array} places - Array of consolidated places
   * @returns {Promise<number>} Number of places saved
   */
  async saveConsolidatedDiscoveries(userId, journeyId, places) {
    try {
      const batch = writeBatch(db);
      let savedCount = 0;

      for (const place of places) {
        try {
          const discoveryData = {
            placeId: place.placeId,
            placeName: place.name,
            placeType: place.primaryType || place.types?.[0] || 'unknown',
            placeData: {
              name: place.name,
              types: place.types || [],
              primaryType: place.primaryType || place.types?.[0] || 'unknown',
              rating: place.rating || null,
              userRatingsTotal: place.userRatingsTotal || 0,
              location: place.location || { lat: 0, lng: 0 },
              formatted_address: place.formatted_address || '',
              photos: place.photos || []
            },
            location: place.location || { lat: 0, lng: 0 },
            journeyId: journeyId,
            source: place.primarySource || 'consolidated',
            allSources: place.allSources || [place.source || 'unknown'],
            pingCount: place.pingCount || 0,
            sarCount: place.sarCount || 0,
            saved: false,
            dismissed: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };

          // Create discovery using DiscoveryService
          const result = await DiscoveryService.createDiscovery(userId, discoveryData);
          if (result.success) {
            savedCount++;
          }
        } catch (placeError) {
          Logger.warn('CONSOLIDATION_SERVICE', 'Failed to save individual place', { 
            placeId: place.placeId, 
            error: placeError.message 
          });
        }
      }

      Logger.info('CONSOLIDATION_SERVICE', 'Saved consolidated discoveries', { 
        userId, 
        journeyId, 
        savedCount, 
        totalPlaces: places.length 
      });

      return savedCount;
    } catch (error) {
      Logger.error('CONSOLIDATION_SERVICE', 'Failed to save consolidated discoveries', error);
      throw error;
    }
  }

  /**
   * Get consolidation statistics for a journey
   * @param {string} userId - User ID
   * @param {string} journeyId - Journey ID
   * @returns {Promise<Object>} Consolidation statistics
   */
  async getConsolidationStats(userId, journeyId) {
    try {
      const discoveriesRef = collection(db, 'journeys', userId, 'discoveries');
      const q = query(discoveriesRef, where('journeyId', '==', journeyId));
      const querySnapshot = await getDocs(q);

      const stats = {
        totalDiscoveries: 0,
        sarDiscoveries: 0,
        pingDiscoveries: 0,
        mixedSourceDiscoveries: 0
      };

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        stats.totalDiscoveries++;
        
        if (data.allSources && data.allSources.length > 1) {
          stats.mixedSourceDiscoveries++;
        } else if (data.source === 'sar') {
          stats.sarDiscoveries++;
        } else if (data.source === 'ping') {
          stats.pingDiscoveries++;
        }
      });

      return stats;
    } catch (error) {
      Logger.error('CONSOLIDATION_SERVICE', 'Failed to get consolidation stats', error);
      return {
        totalDiscoveries: 0,
        sarDiscoveries: 0,
        pingDiscoveries: 0,
        mixedSourceDiscoveries: 0
      };
    }
  }
}

// Export singleton instance
export default new DiscoveryConsolidationService(); 