// services/PingService.js
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { searchNearbyPlaces } from './NewPlacesService';
import { getUserDiscoveryPreferences, getMinRatingPreference } from './DiscoveriesService';
import Logger from '../utils/Logger';

class PingService {
  constructor() {
    this.cooldownTime = 10000; // 10 seconds
    this.maxCreditsPerMonth = 50;
    this.searchRadius = 500; // 500m
    this.maxResultsPerPing = 10;
  }

  /**
   * Get user's ping data (cooldown and credits)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Ping data
   */
  async getUserPingData(userId) {
    try {
      const pingDataRef = doc(db, 'users', userId, 'pingData', 'current');
      const pingDataSnap = await getDoc(pingDataRef);
      
      if (pingDataSnap.exists()) {
        const data = pingDataSnap.data();
        
        // Check if credits are corrupted (timestamp values)
        if (typeof data.creditsRemaining === 'object' || data.creditsRemaining > 1000000) {
          Logger.warn('PING_SERVICE', 'Detected corrupted credits data in getUserPingData, resetting to default', { 
            userId, 
            corruptedCredits: data.creditsRemaining 
          });
          
          // Reset corrupted data
          const cleanData = {
            lastPingTime: data.lastPingTime,
            creditsRemaining: this.maxCreditsPerMonth,
            lastCreditReset: serverTimestamp(),
            totalPingsUsed: 0
          };
          
          await setDoc(pingDataRef, cleanData);
          return cleanData;
        }
        
        return data;
      } else {
        // Initialize default ping data
        const defaultData = {
          lastPingTime: null,
          creditsRemaining: this.maxCreditsPerMonth,
          lastCreditReset: serverTimestamp(),
          totalPingsUsed: 0
        };
        await setDoc(pingDataRef, defaultData);
        return defaultData;
      }
    } catch (error) {
      Logger.error('PING_SERVICE', 'Failed to get user ping data', error);
      throw error;
    }
  }

  /**
   * Check if user can ping (cooldown and credits)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Eligibility status
   */
  async checkPingEligibility(userId) {
    try {
      const userData = await this.getUserPingData(userId);
      const now = Date.now();
      
      // Check if credits need to be reset (monthly)
      const lastReset = userData.lastCreditReset?.toDate?.() || new Date(userData.lastCreditReset) || new Date(0);
      const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
      
      if (lastReset < monthAgo) {
        // Reset credits for new month
        await this.resetMonthlyCredits(userId);
        userData.creditsRemaining = this.maxCreditsPerMonth;
        userData.lastCreditReset = new Date();
      }
      
      // Check cooldown
      if (userData.lastPingTime && (now - userData.lastPingTime) < this.cooldownTime) {
        return {
          canPing: false,
          reason: 'cooldown',
          cooldownRemaining: Math.ceil((this.cooldownTime - (now - userData.lastPingTime)) / 1000),
          creditsRemaining: userData.creditsRemaining
        };
      }
      
      // Check credits
      if (userData.creditsRemaining <= 0) {
        return {
          canPing: false,
          reason: 'no_credits',
          creditsRemaining: 0
        };
      }
      
      return {
        canPing: true,
        creditsRemaining: userData.creditsRemaining
      };
    } catch (error) {
      Logger.error('PING_SERVICE', 'Failed to check ping eligibility', error);
      throw error;
    }
  }

  /**
   * Reset monthly credits
   * @param {string} userId - User ID
   */
  async resetMonthlyCredits(userId) {
    try {
      const pingDataRef = doc(db, 'users', userId, 'pingData', 'current');
      await updateDoc(pingDataRef, {
        creditsRemaining: this.maxCreditsPerMonth,
        lastCreditReset: serverTimestamp()
      });
      Logger.info('PING_SERVICE', 'Reset monthly credits', { userId });
    } catch (error) {
      Logger.error('PING_SERVICE', 'Failed to reset monthly credits', error);
    }
  }

  /**
   * Update ping usage (decrement credits and update timestamp)
   * @param {string} userId - User ID
   */
  async updatePingUsage(userId) {
    try {
      const pingDataRef = doc(db, 'users', userId, 'pingData', 'current');
      
      // Get current data first
      const pingDataSnap = await getDoc(pingDataRef);
      const currentData = pingDataSnap.data();
      
      // Check if credits are corrupted (timestamp values)
      let currentCredits = currentData.creditsRemaining;
      let currentTotalPings = currentData.totalPingsUsed;
      
      // If credits are corrupted (timestamp), reset them
      if (typeof currentCredits === 'object' || currentCredits > 1000000) {
        Logger.warn('PING_SERVICE', 'Detected corrupted credits data, resetting to default', { 
          userId, 
          corruptedCredits: currentCredits 
        });
        currentCredits = this.maxCreditsPerMonth;
        currentTotalPings = 0;
      }
      
      // Calculate new values
      const newCreditsRemaining = Math.max(0, (currentCredits || this.maxCreditsPerMonth) - 1);
      const newTotalPingsUsed = (currentTotalPings || 0) + 1;
      
      // Update in a single operation
      await updateDoc(pingDataRef, {
        lastPingTime: Date.now(),
        creditsRemaining: newCreditsRemaining,
        totalPingsUsed: newTotalPingsUsed
      });
      
      Logger.info('PING_SERVICE', 'Updated ping usage', { 
        userId, 
        creditsRemaining: newCreditsRemaining,
        totalPingsUsed: newTotalPingsUsed
      });
    } catch (error) {
      Logger.error('PING_SERVICE', 'Failed to update ping usage', error);
      throw error;
    }
  }

  /**
   * Store ping results in Firestore
   * @param {string} userId - User ID
   * @param {string} journeyId - Journey ID
   * @param {Array} places - Array of places found
   * @param {Object} location - Current location when pinged
   */
  async storePingResults(userId, journeyId, places, location) {
    try {
      // Validate input parameters
      if (!userId || !journeyId || !location) {
        throw new Error('Missing required parameters for storing ping results');
      }
      
      if (!Array.isArray(places)) {
        Logger.warn('PING_SERVICE', 'Places parameter is not an array, converting to empty array', { places });
        places = [];
      }
      
      const pingId = `ping_${Date.now()}`;
      const pingResultsRef = doc(db, 'journeys', userId, 'pingResults', journeyId, 'pings', pingId);
      
      // Clean and validate place data before storing
      Logger.debug('PING_SERVICE', 'Cleaning place data for storage', { 
        placesCount: places.length,
        samplePlace: places[0] ? Object.keys(places[0]) : 'no places'
      });
      
      const cleanedPlaces = places.map(place => {
        // Remove undefined values and ensure required fields exist
        const cleanedPlace = {
          placeId: place.placeId || null,
          name: place.name || 'Unknown Place',
          address: place.address || null,
          latitude: place.latitude || null,
          longitude: place.longitude || null,
          rating: place.rating || null,
          userRatingsTotal: place.userRatingsTotal || null,
          types: place.types || [],
          primaryType: place.primaryType || 'point_of_interest',
          source: 'ping',
          pingTimestamp: Date.now()
        };
        
        // Remove any remaining undefined values
        Object.keys(cleanedPlace).forEach(key => {
          if (cleanedPlace[key] === undefined) {
            delete cleanedPlace[key];
          }
        });
        
        return cleanedPlace;
      });
      
      Logger.debug('PING_SERVICE', 'Cleaned places data', { 
        cleanedPlacesCount: cleanedPlaces.length,
        sampleCleanedPlace: cleanedPlaces[0] ? Object.keys(cleanedPlaces[0]) : 'no places'
      });
      
      const pingData = {
        id: pingId,
        journeyId,
        places: cleanedPlaces,
        location: {
          latitude: location.latitude || null,
          longitude: location.longitude || null,
          accuracy: location.accuracy || null,
          timestamp: location.timestamp || null
        },
        timestamp: serverTimestamp(),
        placesCount: cleanedPlaces.length
      };
      
      await setDoc(pingResultsRef, pingData);
      
      Logger.info('PING_SERVICE', 'Stored ping results', { 
        userId, 
        journeyId, 
        pingId, 
        placesCount: places.length 
      });
      
      return pingId;
    } catch (error) {
      Logger.error('PING_SERVICE', 'Failed to store ping results', error);
      throw error;
    }
  }

  /**
   * Get all ping results for a journey
   * @param {string} userId - User ID
   * @param {string} journeyId - Journey ID
   * @returns {Promise<Array>} Array of ping results
   */
  async getPingResultsForJourney(userId, journeyId) {
    try {
      const pingResultsRef = collection(db, 'journeys', userId, 'pingResults', journeyId, 'pings');
      const q = query(pingResultsRef);
      const querySnapshot = await getDocs(q);
      
      const pingResults = [];
      querySnapshot.forEach((doc) => {
        pingResults.push(doc.data());
      });
      
      return pingResults;
    } catch (error) {
      Logger.error('PING_SERVICE', 'Failed to get ping results for journey', error);
      return [];
    }
  }

  /**
   * Ping for nearby places during active walk
   * @param {string} userId - User ID
   * @param {string} journeyId - Journey ID
   * @param {Object} currentLocation - Current location {latitude, longitude}
   * @returns {Promise<Object>} Ping result
   */
  async pingNearbyPlaces(userId, journeyId, currentLocation) {
    const startTime = Date.now();
    Logger.debug('PING_SERVICE', 'Starting ping for nearby places', { 
      userId, 
      journeyId, 
      location: currentLocation 
    });
    
    try {
      // 1. Check eligibility
      const eligibility = await this.checkPingEligibility(userId);
      if (!eligibility.canPing) {
        return { 
          error: eligibility.reason,
          cooldownRemaining: eligibility.cooldownRemaining,
          creditsRemaining: eligibility.creditsRemaining
        };
      }
      
      // 2. Get user preferences
      const preferences = await getUserDiscoveryPreferences();
      const minRating = await getMinRatingPreference();
      
      // 3. Search for nearby places
      // Get enabled place types from preferences
      const enabledTypes = Object.keys(preferences).filter(type => preferences[type]);
      
      if (enabledTypes.length === 0) {
        Logger.debug('PING_SERVICE', 'No enabled place types, returning empty results');
        return { places: [], creditsRemaining: eligibility.creditsRemaining };
      }
      
      // Search for each enabled type and combine results
      const allPlaces = [];
      for (const type of enabledTypes) {
        try {
          const typePlaces = await searchNearbyPlaces(
            currentLocation.latitude,
            currentLocation.longitude,
            this.searchRadius,
            type,
            { maxResults: Math.ceil(this.maxResultsPerPing / enabledTypes.length) }
          );
          allPlaces.push(...typePlaces);
        } catch (error) {
          Logger.warn('PING_SERVICE', `Failed to search for type ${type}`, { error: error.message });
        }
      }
      
      // Limit to max results and remove duplicates
      const places = allPlaces
        .slice(0, this.maxResultsPerPing)
        .filter((place, index, self) => 
          index === self.findIndex(p => p.placeId === place.placeId)
        );
      
      // 4. Filter by minimum rating
      const filteredPlaces = places.filter(place => 
        !place.rating || place.rating >= minRating
      );
      
      // 5. Store ping results
      const pingId = await this.storePingResults(userId, journeyId, filteredPlaces, currentLocation);
      
      // 6. Update usage and get updated credits
      await this.updatePingUsage(userId);
      
      // Get updated user data to return correct credits remaining
      const updatedUserData = await this.getUserPingData(userId);
      
      const duration = Date.now() - startTime;
      Logger.performance('PING_SERVICE', 'pingNearbyPlaces', duration, { 
        userId, 
        journeyId, 
        placesFound: places.length,
        placesAfterFiltering: filteredPlaces.length
      });
      
      return { 
        places: filteredPlaces, 
        creditsRemaining: updatedUserData.creditsRemaining,
        pingId
      };
      
    } catch (error) {
      Logger.error('PING_SERVICE', 'Ping failed', error);
      return { error: 'ping_failed' };
    }
  }

  /**
   * Archive ping results after journey completion
   * @param {string} userId - User ID
   * @param {string} journeyId - Journey ID
   */
  async archivePingResults(userId, journeyId) {
    try {
      // For now, we'll just delete ping results to keep the database clean
      // In the future, we could move them to an archive collection
      const pingResultsRef = collection(db, 'journeys', userId, 'pingResults', journeyId, 'pings');
      const q = query(pingResultsRef);
      const querySnapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      Logger.info('PING_SERVICE', 'Archived ping results', { userId, journeyId, count: querySnapshot.size });
    } catch (error) {
      Logger.error('PING_SERVICE', 'Failed to archive ping results', error);
    }
  }

  /**
   * Get ping statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Ping statistics
   */
  async getPingStats(userId) {
    try {
      const userData = await this.getUserPingData(userId);
      return {
        creditsRemaining: userData.creditsRemaining,
        totalPingsUsed: userData.totalPingsUsed || 0,
        maxCreditsPerMonth: this.maxCreditsPerMonth,
        cooldownTime: this.cooldownTime
      };
    } catch (error) {
      Logger.error('PING_SERVICE', 'Failed to get ping stats', error);
      return {
        creditsRemaining: 0,
        totalPingsUsed: 0,
        maxCreditsPerMonth: this.maxCreditsPerMonth,
        cooldownTime: this.cooldownTime
      };
    }
  }
}

// Export singleton instance
export default new PingService(); 