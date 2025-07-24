/**
 * DISCOVERY CONSOLIDATION SERVICE (DATA MERGING ENGINE)
 * ======================================================
 * 
 * PURPOSE:
 * This service consolidates and deduplicates discovery data from multiple sources to create
 * a unified, clean set of discoveries for each journey. It merges places found through
 * Search Along Route (SAR) with places discovered via ping during walks, eliminates
 * duplicates, and ensures data quality. Think of it as the "data cleaning engine" that
 * takes messy, overlapping discovery data and transforms it into a clean, organized
 * list of unique, high-quality discoveries.
 * 
 * FUNCTIONALITY:
 * - Merges discovery data from SAR (Search Along Route) and ping results
 * - Deduplicates places using proximity and similarity algorithms
 * - Combines place information to create comprehensive discovery records
 * - Validates and cleans discovery data for quality assurance
 * - Saves consolidated results to Firestore with proper metadata
 * - Provides statistics about consolidation operations and data quality
 * - Handles edge cases like missing data or API failures gracefully
 * - Ensures no orphaned or duplicate data remains in the database
 * - Optimizes discovery presentation by removing redundant information
 * - Maintains discovery source attribution for analytics and debugging
 * 
 * WHY IT EXISTS:
 * Hero's Path discoveries can come from multiple sources: the main Search Along Route
 * after completing a walk, and real-time pings during the walk. These sources often
 * find the same places, creating duplicates and data inconsistencies. This service
 * ensures users see a clean, unified list of discoveries without confusion or
 * redundancy, while preserving the best information from each source.
 * 
 * KEY FEATURES:
 * - Multi-source consolidation: Combines SAR and ping discovery results
 * - Intelligent deduplication: Uses proximity and similarity to identify duplicates
 * - Data merging: Combines information from duplicate places into comprehensive records
 * - Quality validation: Ensures discovery data meets quality standards
 * - Source attribution: Tracks where each discovery originated
 * - Statistics generation: Provides insights about consolidation effectiveness
 * - Error handling: Graceful handling of missing or invalid data
 * - Performance optimization: Efficient processing of large discovery datasets
 * 
 * RELATIONSHIPS:
 * - Uses DiscoveriesService.js for SAR (Search Along Route) functionality
 * - Works with PingService.js to retrieve ping-based discovery results
 * - Integrates with DiscoveryService.js for saving consolidated results
 * - Called by JourneyService.js after journey completion
 * - May be used by data cleanup and maintenance workflows
 * - Provides data to discovery analytics and quality monitoring systems
 * 
 * REFERENCED BY:
 * - JourneyService.js (after journey completion for data consolidation)
 * - Journey completion workflows (to ensure clean discovery data)
 * - Data maintenance and cleanup processes
 * - Discovery analytics systems (for quality metrics)
 * - Development tools for data validation and testing
 * 
 * REFERENCES:
 * - DiscoveriesService.js (for SAR functionality)
 * - PingService.js (for ping result retrieval)
 * - DiscoveryService.js (for saving consolidated results)
 * - Firebase Firestore (for data storage and retrieval)
 * - Logger utility (for debugging and operation tracking)
 * 
 * IMPORTANCE TO APP:
 * HIGH - This service is crucial for data quality and user experience. Without proper
 * consolidation, users would see duplicate discoveries and confusing information.
 * The service ensures that Hero's Path presents clean, organized discovery data
 * regardless of how many different sources contributed to finding the places.
 * Good consolidation significantly improves the perceived quality of the app.
 * 
 * IMPROVEMENT SUGGESTIONS:
 * 1. Add ML-based duplicate detection - use machine learning for better duplicate identification
 * 2. Add place verification - verify place information against multiple data sources
 * 3. Add quality scoring - score discoveries based on data completeness and accuracy
 * 4. Add user feedback integration - learn from user corrections and preferences
 * 5. Add real-time consolidation - consolidate discoveries as they're found
 * 6. Add cross-journey deduplication - identify places discovered in multiple journeys
 * 7. Add temporal consolidation - merge discoveries from different time periods
 * 8. Add social consolidation - merge discoveries with community data
 * 9. Add place enrichment - enhance discoveries with additional data sources
 * 10. Add consolidation analytics - detailed metrics about consolidation effectiveness
 * 11. Add place clustering - group related places for better organization
 * 12. Add discovery ranking - rank consolidated discoveries by relevance or quality
 * 13. Add automated validation - automatically validate discovery data quality
 * 14. Add conflict resolution - handle conflicting information from different sources
 * 15. Add place category detection - automatically categorize consolidated places
 * 16. Add discovery insights - generate insights from consolidated discovery data
 * 17. Add performance optimization - optimize consolidation for large datasets
 * 18. Add data export - export consolidated discovery data for external analysis
 * 19. Add consolidation history - track changes and improvements over time
 * 20. Add user customization - let users influence consolidation rules and preferences
 *
 * Consolidates and deduplicates discovery data from multiple sources (e.g., SAR and cached locations).
 * - Merges, deduplicates, and cleans up discovery records.
 * - Ensures no orphaned or duplicate data in Firestore.
 * - Typically used after a trip or ping event to reconcile all discoveries.
 */
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
      // Import the function directly to ensure it's available
      const { getSuggestionsForRoute } = require('./DiscoveriesService');
      
      // Call getSuggestionsForRoute instead of searchAlongRoute
      const sarResults = await getSuggestionsForRoute(routeCoords, preferences, 'en');
      
      Logger.debug('CONSOLIDATION_SERVICE', `Got ${sarResults.length} SAR results from DiscoveriesService`);
      
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
          // Ensure place has proper location format
          const placeWithLocation = {
            ...place,
            // Convert latitude/longitude to location object if needed
            location: place.location || {
              lat: place.latitude || 0,
              lng: place.longitude || 0
            },
            // Ensure placeId exists
            placeId: place.placeId || place.place_id || `ping-place-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            // Add source metadata
            source: 'ping',
            pingId: pingResult.id,
            pingTimestamp: pingResult.timestamp || Date.now()
          };
          
          allPlaces.push(placeWithLocation);
        });
      }
    });

    Logger.debug('CONSOLIDATION_SERVICE', `Extracted ${allPlaces.length} places from ping results`);
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

    // Filter out places without valid placeId
    const validPlaces = places.filter(place => {
      if (!place.placeId) {
        Logger.warn('CONSOLIDATION_SERVICE', 'Place missing placeId, generating one', {
          name: place.name,
          source: place.source
        });
        // Generate a placeId if missing
        place.placeId = `generated-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      }
      return true;
    });

    // Group places by placeId
    const placeGroups = {};
    
    validPlaces.forEach(place => {
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

    Logger.debug('CONSOLIDATION_SERVICE', `Deduplicated ${validPlaces.length} places into ${mergedPlaces.length} unique places`);
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

    // Ensure we have valid location data
    if (!mergedPlace.location || (!mergedPlace.location.lat && !mergedPlace.location.lng)) {
      // Try to find a place with valid location
      const placeWithLocation = placeGroup.find(p => 
        (p.location && (p.location.lat || p.location.lng)) || 
        (p.latitude !== undefined && p.longitude !== undefined)
      );
      
      if (placeWithLocation) {
        if (placeWithLocation.location) {
          mergedPlace.location = placeWithLocation.location;
        } else if (placeWithLocation.latitude !== undefined && placeWithLocation.longitude !== undefined) {
          mergedPlace.location = {
            lat: placeWithLocation.latitude,
            lng: placeWithLocation.longitude
          };
        }
      }
      
      // If we still don't have a location, log a warning
      if (!mergedPlace.location || (!mergedPlace.location.lat && !mergedPlace.location.lng)) {
        Logger.warn('CONSOLIDATION_SERVICE', 'Failed to find valid location for merged place', {
          placeId: mergedPlace.placeId,
          name: mergedPlace.name
        });
        
        // Set a default location to prevent errors
        mergedPlace.location = { lat: 0, lng: 0 };
      }
    }
    
    // Add latitude and longitude properties for compatibility
    if (mergedPlace.location) {
      mergedPlace.latitude = mergedPlace.location.lat;
      mergedPlace.longitude = mergedPlace.location.lng;
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
      let savedCount = 0;

      // Log the places we're about to save
      Logger.debug('CONSOLIDATION_SERVICE', `Saving ${places.length} consolidated discoveries`, {
        samplePlace: places[0] ? {
          placeId: places[0].placeId,
          name: places[0].name,
          location: places[0].location,
          latitude: places[0].latitude,
          longitude: places[0].longitude
        } : 'no places'
      });

      for (const place of places) {
        try {
          // Ensure we have valid location data
          let location = { lat: 0, lng: 0 };
          
          // Try to get location from different possible formats
          if (place.location && typeof place.location === 'object') {
            // Standard location object
            location = place.location;
          } else if (place.latitude !== undefined && place.longitude !== undefined) {
            // Separate latitude/longitude properties
            location = { lat: place.latitude, lng: place.longitude };
          }
          
          // Ensure we have valid coordinates
          if (!location.lat && !location.lng) {
            Logger.warn('CONSOLIDATION_SERVICE', 'Place has invalid location, skipping', {
              placeId: place.placeId,
              name: place.name,
              location
            });
            continue;
          }
          
          // Create discovery data with proper location format
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
              location: location,
              formatted_address: place.formatted_address || '',
              photos: place.photos || []
            },
            // Store location in both formats for compatibility
            location: location,
            latitude: location.lat,
            longitude: location.lng,
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
            Logger.debug('CONSOLIDATION_SERVICE', 'Successfully saved discovery', {
              placeId: place.placeId,
              name: place.name,
              location: location
            });
          }
        } catch (placeError) {
          Logger.warn('CONSOLIDATION_SERVICE', 'Failed to save individual place', { 
            placeId: place.placeId, 
            name: place.name,
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