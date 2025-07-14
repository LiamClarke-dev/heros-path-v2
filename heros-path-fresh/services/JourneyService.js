/**
 * JOURNEY SERVICE (ROUTE DATA MANAGEMENT)
 * ========================================
 * 
 * PURPOSE:
 * This service manages all aspects of user journeys (walking routes) including creation,
 * storage, retrieval, and deletion. It handles the complete lifecycle of journey data
 * from the moment a user completes a walk until they decide to delete it. Think of it
 * as the database manager for all walking route information, ensuring data consistency
 * and providing comprehensive journey management capabilities.
 * 
 * FUNCTIONALITY:
 * - Creates and stores new journeys with metadata (distance, duration, coordinates)
 * - Retrieves user's journey history with proper ordering and filtering
 * - Updates journey information and completion status tracking
 * - Provides comprehensive journey deletion with full data cleanup
 * - Manages journey statistics and analytics for user insights
 * - Handles soft deletion and restoration for data recovery
 * - Supports bulk operations for managing multiple journeys
 * - Integrates with discovery consolidation for journey-based place suggestions
 * - Provides data cleanup utilities for development and user account management
 * - Ensures data consistency across journeys, discoveries, and user preferences
 * 
 * WHY IT EXISTS:
 * Hero's Path users generate significant amounts of route data over time. This service
 * centralizes all journey management logic, ensuring data integrity and providing
 * efficient access to route information. It also handles the complex relationships
 * between journeys and their associated discoveries, making sure that data cleanup
 * is comprehensive and consistent.
 * 
 * KEY FEATURES:
 * - Complete CRUD operations for journey data
 * - Comprehensive data cleanup including associated discoveries
 * - Journey statistics and analytics calculation
 * - Soft deletion with restoration capabilities
 * - Bulk operations for efficient data management
 * - Integration with discovery systems for enhanced functionality
 * - Data consistency guarantees across related collections
 * - Development utilities for testing and debugging
 * 
 * RELATIONSHIPS:
 * - Used by MapScreen.js for saving completed walks
 * - Integrates with DiscoveryService.js for managing journey-associated discoveries
 * - Works with DiscoveryConsolidationService.js for journey-based place suggestions
 * - Provides data to PastJourneysScreen.js for displaying journey history
 * - Uses Firebase Firestore for persistent journey storage
 * - Connects with user statistics and analytics systems
 * - Supports development workflows and data management tools
 * 
 * REFERENCED BY:
 * - MapScreen.js (for saving new journeys after walks)
 * - PastJourneysScreen.js (for displaying and managing journey history)
 * - DiscoveriesScreen.js (for journey-related discovery workflows)
 * - User profile and statistics components
 * - Development and admin tools for data management
 * 
 * REFERENCES:
 * - Firebase Firestore (for persistent data storage)
 * - DiscoveryConsolidationService.js (for discovery integration)
 * - DiscoveriesService.js (for user preferences)
 * - AsyncStorage (for temporary data and caching)
 * - Logger utility (for debugging and error tracking)
 * 
 * IMPORTANCE TO APP:
 * CRITICAL - This service is fundamental to Hero's Path's data management. Without
 * reliable journey storage and management, users would lose their walking history
 * and the app couldn't provide discovery suggestions. The data integrity guarantees
 * are essential for maintaining user trust and ensuring consistent app behavior.
 * 
 * IMPROVEMENT SUGGESTIONS:
 * 1. Add journey analytics - detailed insights about walking patterns
 * 2. Add journey export - export route data to GPX, KML, or other formats
 * 3. Add journey sharing - share routes with friends or the community
 * 4. Add journey templates - save favorite routes as reusable templates
 * 5. Add journey goals - set and track walking goals and achievements
 * 6. Add journey categorization - organize routes by type, difficulty, or purpose
 * 7. Add journey optimization - suggest improvements to existing routes
 * 8. Add journey recommendations - suggest new routes based on history
 * 9. Add journey collaboration - plan and share routes with others
 * 10. Add journey backup - cloud backup and sync across devices
 * 11. Add journey privacy - granular privacy controls for route data
 * 12. Add journey verification - validate route data integrity
 * 13. Add journey compression - optimize storage for large route datasets
 * 14. Add journey search - search through journey history by various criteria
 * 15. Add journey comparison - compare different routes and performances
 * 16. Add journey notifications - reminders and suggestions based on journey patterns
 * 17. Add journey weather integration - associate weather data with journeys
 * 18. Add journey social features - like, comment, and rate community routes
 * 19. Add journey fitness integration - connect with fitness apps and devices
 * 20. Add journey AI insights - AI-powered analysis of walking patterns and suggestions
 *
 * Manages user journeys (routes, metadata, deletion, etc.).
 * - Provides CRUD for journeys, deletion of associated data, and status tracking.
 * - Handles journey completion, undo, and data cleanup.
 * - Ensures data consistency across journeys and discoveries.
 */
// services/JourneyService.js
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  collection,
  query,
  orderBy,
  getDocs,
  serverTimestamp,
  writeBatch,
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Logger from '../utils/Logger';
import DiscoveryConsolidationService from './DiscoveryConsolidationService';
import { getUserDiscoveryPreferences } from './DiscoveriesService';

class JourneyService {
  // Get user's journeys collection reference
  getUserJourneysRef(userId) {
    return collection(db, 'journeys', userId, 'journeys');
  }

  // Create a new journey
  async createJourney(userId, journeyData) {
    try {
      const journeysRef = this.getUserJourneysRef(userId);
      const journeyRef = doc(journeysRef);
      
      const journey = {
        id: journeyRef.id,
        ...journeyData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(journeyRef, journey);
      return { success: true, journey };
    } catch (error) {
      console.error('Error creating journey:', error);
      throw error;
    }
  }

  // Get a specific journey by ID
  async getJourney(userId, journeyId) {
    try {
      const journeyRef = doc(db, 'journeys', userId, 'journeys', journeyId);
      const journeySnap = await getDoc(journeyRef);
      
      if (journeySnap.exists()) {
        return { success: true, journey: journeySnap.data() };
      } else {
        return { success: false, journey: null };
      }
    } catch (error) {
      console.error('Error getting journey:', error);
      throw error;
    }
  }

  // Get all journeys for a user
  async getUserJourneys(userId) {
    try {
      const journeysRef = this.getUserJourneysRef(userId);
      const q = query(journeysRef);
      const querySnapshot = await getDocs(q);
      
      const journeys = [];
      querySnapshot.forEach((doc) => {
        const journeyData = doc.data();
        // Filter out soft-deleted journeys
        if (!journeyData.isDeleted) {
          journeys.push(journeyData);
        }
      });
      
      // Sort in memory instead of using orderBy to avoid index requirements
      journeys.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
        return dateB - dateA; // Descending order
      });
      
      return { success: true, journeys };
    } catch (error) {
      console.error('Error getting user journeys:', error);
      throw error;
    }
  }

  // Update a journey
  async updateJourney(userId, journeyId, updates) {
    try {
      const journeyRef = doc(db, 'journeys', userId, 'journeys', journeyId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };
      await updateDoc(journeyRef, updateData);
      return { success: true };
    } catch (error) {
      console.error('Error updating journey:', error);
      throw error;
    }
  }

  // Delete a journey and all associated data
  async deleteJourney(userId, journeyId) {
    try {
      Logger.debug(`🗑️ [JOURNEY_SERVICE] Starting comprehensive deletion of journey: ${journeyId}`);
      
      // 1. Get all discoveries for this journey first
      const discoveriesRef = collection(db, 'journeys', userId, 'discoveries');
      const discoveriesQuery = query(discoveriesRef, where('journeyId', '==', journeyId));
      const discoveriesSnap = await getDocs(discoveriesQuery);
      
      Logger.debug(`🗑️ [JOURNEY_SERVICE] Found ${discoveriesSnap.size} discoveries to process`);
      
      // 2. Separate saved discoveries from regular discoveries
      const savedDiscoveries = [];
      const regularDiscoveries = [];
      
      discoveriesSnap.forEach(doc => {
        const data = doc.data();
        if (data.saved === true) {
          savedDiscoveries.push(doc);
        } else {
          regularDiscoveries.push(doc);
        }
      });
      
      Logger.debug(`🗑️ [JOURNEY_SERVICE] Found ${savedDiscoveries.length} saved places to update`);
      Logger.debug(`🗑️ [JOURNEY_SERVICE] Found ${regularDiscoveries.length} regular discoveries to delete`);
      
      // 3. Get dismissed places that reference this journey
      const dismissedRef = collection(db, 'journeys', userId, 'dismissed');
      const dismissedQuery = query(dismissedRef, where('journeyId', '==', journeyId));
      const dismissedSnap = await getDocs(dismissedQuery);
      
      Logger.debug(`🗑️ [JOURNEY_SERVICE] Found ${dismissedSnap.size} dismissed places to delete`);
      
      // 4. First batch: Delete journey, regular discoveries, and dismissed places
      const deleteBatch = writeBatch(db);
      
      // Delete the journey record
      const journeyRef = doc(db, 'journeys', userId, 'journeys', journeyId);
      deleteBatch.delete(journeyRef);
      
      // Delete regular discoveries
      regularDiscoveries.forEach(doc => {
        deleteBatch.delete(doc.ref);
      });
      
      // Delete dismissed places
      dismissedSnap.forEach(doc => {
        deleteBatch.delete(doc.ref);
      });
      
      // Execute deletion batch
      await deleteBatch.commit();
      
      // 5. Second batch: Update saved discoveries (separate operation to avoid Firebase error)
      if (savedDiscoveries.length > 0) {
        const updateBatch = writeBatch(db);
        
        savedDiscoveries.forEach(doc => {
          updateBatch.update(doc.ref, { 
            journeyId: null,
            updatedAt: serverTimestamp()
          });
        });
        
        await updateBatch.commit();
      }
      
      Logger.debug(`🗑️ [JOURNEY_SERVICE] Successfully deleted journey ${journeyId} and all associated data`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting journey:', error);
      throw error;
    }
  }

  // Soft delete a journey (mark as deleted but keep data)
  async softDeleteJourney(userId, journeyId) {
    try {
      const journeyRef = doc(db, 'journeys', userId, 'journeys', journeyId);
      await updateDoc(journeyRef, {
        deletedAt: serverTimestamp(),
        isDeleted: true,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error soft deleting journey:', error);
      throw error;
    }
  }

  // Restore a soft-deleted journey
  async restoreJourney(userId, journeyId) {
    try {
      const journeyRef = doc(db, 'journeys', userId, 'journeys', journeyId);
      await updateDoc(journeyRef, {
        deletedAt: null,
        isDeleted: false,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error restoring journey:', error);
      throw error;
    }
  }

  // Delete multiple journeys (batch operation)
  async deleteMultipleJourneys(userId, journeyIds) {
    try {
      const batch = writeBatch(db);
      
      journeyIds.forEach(journeyId => {
        const journeyRef = doc(db, 'journeys', userId, 'journeys', journeyId);
        batch.delete(journeyRef);
      });
      
      await batch.commit();
      return { success: true };
    } catch (error) {
      console.error('Error deleting multiple journeys:', error);
      throw error;
    }
  }

  // Get journey statistics for a user
  async getJourneyStats(userId) {
    try {
      const journeysRef = this.getUserJourneysRef(userId);
      const querySnapshot = await getDocs(journeysRef);
      
      let totalDistance = 0;
      let totalDuration = 0;
      let journeyCount = 0;
      
      querySnapshot.forEach((doc) => {
        const journey = doc.data();
        totalDistance += journey.distance || 0;
        totalDuration += journey.duration || 0;
        journeyCount++;
      });
      
      return {
        success: true,
        stats: {
          totalJourneys: journeyCount,
          totalDistance: totalDistance,
          totalDuration: totalDuration,
          averageDistance: journeyCount > 0 ? totalDistance / journeyCount : 0,
          averageDuration: journeyCount > 0 ? totalDuration / journeyCount : 0,
        }
      };
    } catch (error) {
      console.error('Error getting journey stats:', error);
      // Return empty stats instead of throwing for better UX
      return {
        success: false,
        stats: {
          totalJourneys: 0,
          totalDistance: 0,
          totalDuration: 0,
          averageDistance: 0,
          averageDuration: 0,
        },
        error: error.message
      };
    }
  }

  // Delete all journeys for a user (for development/clean slate)
  async deleteAllJourneys(userId) {
    try {
      Logger.debug(`🗑️ [JOURNEY_SERVICE] Starting deletion of ALL journeys for user: ${userId}`);
      
      // Get all journeys first
      const journeysResult = await this.getUserJourneys(userId);
      if (!journeysResult.success || journeysResult.journeys.length === 0) {
        Logger.debug(`🗑️ [JOURNEY_SERVICE] No journeys found to delete`);
        return { success: true, deletedCount: 0 };
      }
      
      const journeyIds = journeysResult.journeys.map(j => j.id);
      Logger.debug(`🗑️ [JOURNEY_SERVICE] Found ${journeyIds.length} journeys to delete:`, journeyIds);
      
      // Delete each journey with full cleanup
      for (const journeyId of journeyIds) {
        await this.deleteJourney(userId, journeyId);
      }
      
      Logger.debug(`🗑️ [JOURNEY_SERVICE] Successfully deleted all ${journeyIds.length} journeys`);
      return { success: true, deletedCount: journeyIds.length };
    } catch (error) {
      console.error('Error deleting all journeys:', error);
      throw error;
    }
  }

  // 🚨 COMPREHENSIVE ACCOUNT CLEANUP - PURGE ALL USER DATA
  async purgeAllUserData(userId) {
    const startTime = Date.now();
    Logger.warn('JOURNEY_SERVICE', '🚨 STARTING COMPREHENSIVE ACCOUNT CLEANUP', { userId });
    
    try {
      // 1. DELETE ALL JOURNEYS AND ASSOCIATED DATA
      Logger.info('JOURNEY_SERVICE', 'Step 1: Deleting all journeys and associated data', { userId });
      const journeysResult = await this.deleteAllJourneys(userId);
      
      // 2. DELETE ALL DISCOVERIES (including saved places)
      Logger.info('JOURNEY_SERVICE', 'Step 2: Deleting all discoveries', { userId });
      const discoveriesRef = collection(db, 'journeys', userId, 'discoveries');
      const discoveriesQuery = query(discoveriesRef);
      const discoveriesSnap = await getDocs(discoveriesQuery);
      
      if (!discoveriesSnap.empty) {
        const deleteBatch = writeBatch(db);
        discoveriesSnap.forEach(doc => {
          deleteBatch.delete(doc.ref);
        });
        await deleteBatch.commit();
        Logger.info('JOURNEY_SERVICE', `Deleted ${discoveriesSnap.size} discoveries`, { userId });
      }
      
      // 3. DELETE ALL DISMISSED PLACES
      Logger.info('JOURNEY_SERVICE', 'Step 3: Deleting all dismissed places', { userId });
      const dismissedRef = collection(db, 'journeys', userId, 'dismissed');
      const dismissedQuery = query(dismissedRef);
      const dismissedSnap = await getDocs(dismissedQuery);
      
      if (!dismissedSnap.empty) {
        const deleteBatch = writeBatch(db);
        dismissedSnap.forEach(doc => {
          deleteBatch.delete(doc.ref);
        });
        await deleteBatch.commit();
        Logger.info('JOURNEY_SERVICE', `Deleted ${dismissedSnap.size} dismissed places`, { userId });
      }
      
      // 4. CLEAR ALL ASYNCSTORAGE DATA
      Logger.info('JOURNEY_SERVICE', 'Step 4: Clearing all AsyncStorage data', { userId });
      const asyncStorageKeys = [
        '@user_language',
        '@discovery_preferences',
        '@discovery_min_rating',
        '@saved_routes',
        '@show_saved_places',
        '@explored_segments',
        '@dismissal_preference',
        '@discovery_onboarding_shown',
        'savedRoutes',
        'savedPlaces',
        'dismissedPlaces',
        'lastRoute',
        'dismissedPlaces',
        'savedPlaces'
      ];
      
      // Clear all AsyncStorage keys
      await Promise.all(
        asyncStorageKeys.map(key => AsyncStorage.removeItem(key))
      );
      Logger.info('JOURNEY_SERVICE', `Cleared ${asyncStorageKeys.length} AsyncStorage keys`, { userId });
      
      // 5. CLEAR USER PROFILE DATA (if exists)
      Logger.info('JOURNEY_SERVICE', 'Step 5: Clearing user profile data', { userId });
      try {
        const userProfileRef = doc(db, 'users', userId);
        const userProfileSnap = await getDoc(userProfileRef);
        
        if (userProfileSnap.exists()) {
          // Clear profile data but keep the document for auth purposes
          await updateDoc(userProfileRef, {
            displayName: null,
            bio: null,
            location: null,
            preferences: null,
            lastCleaned: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          Logger.info('JOURNEY_SERVICE', 'Cleared user profile data', { userId });
        }
      } catch (profileError) {
        Logger.warn('JOURNEY_SERVICE', 'Failed to clear user profile data', { userId, error: profileError.message });
      }
      
      const duration = Date.now() - startTime;
      Logger.warn('JOURNEY_SERVICE', '✅ COMPREHENSIVE ACCOUNT CLEANUP COMPLETE', { 
        userId, 
        duration,
        deletedJourneys: journeysResult.deletedCount,
        deletedDiscoveries: discoveriesSnap.size,
        deletedDismissed: dismissedSnap.size,
        clearedStorageKeys: asyncStorageKeys.length
      });
      
      return {
        success: true,
        deletedJourneys: journeysResult.deletedCount,
        deletedDiscoveries: discoveriesSnap.size,
        deletedDismissed: dismissedSnap.size,
        clearedStorageKeys: asyncStorageKeys.length,
        duration
      };
      
    } catch (error) {
      Logger.error('JOURNEY_SERVICE', '❌ COMPREHENSIVE ACCOUNT CLEANUP FAILED', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Consolidate discoveries when a journey ends
   * @param {string} userId - User ID
   * @param {string} journeyId - Journey ID
   * @param {Array} routeCoords - Journey route coordinates
   * @returns {Promise<Object>} Consolidation result
   */
  async consolidateJourneyDiscoveries(userId, journeyId, routeCoords) {
    try {
      Logger.info('JOURNEY_SERVICE', 'Starting journey discovery consolidation', { 
        userId, 
        journeyId, 
        routeCoordsCount: routeCoords?.length || 0 
      });

      // Get user preferences for discovery
      const preferences = await getUserDiscoveryPreferences();
      
      // Consolidate SAR and ping results
      const result = await DiscoveryConsolidationService.consolidateJourneyDiscoveries(
        userId, 
        journeyId, 
        routeCoords, 
        preferences
      );

      if (result.success) {
        Logger.info('JOURNEY_SERVICE', 'Journey discovery consolidation completed', {
          userId,
          journeyId,
          sarPlaces: result.sarPlaces,
          pingPlaces: result.pingPlaces,
          consolidatedPlaces: result.consolidatedPlaces,
          savedCount: result.savedCount
        });
      } else {
        Logger.error('JOURNEY_SERVICE', 'Journey discovery consolidation failed', {
          userId,
          journeyId,
          error: result.error
        });
      }

      return result;
    } catch (error) {
      Logger.error('JOURNEY_SERVICE', 'Journey discovery consolidation error', {
        userId,
        journeyId,
        error: error.message
      });
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new JourneyService(); 