/**
 * DISCOVERY SERVICE (DISCOVERY DATA MANAGEMENT)
 * ==============================================
 * 
 * PURPOSE:
 * This service manages all CRUD operations for discovered places, handling user interactions
 * like saving, dismissing, and undoing actions. It maintains data consistency across multiple
 * Firestore collections and provides the foundation for the discovery workflow. Think of it
 * as the database manager for all discovery-related data, ensuring that user actions are
 * properly recorded and synchronized across the app.
 * 
 * FUNCTIONALITY:
 * - Manages discovery records with complete CRUD operations
 * - Handles place dismissal with undo functionality and state tracking
 * - Maintains saved places collection with proper metadata
 * - Provides journey completion status tracking based on discovery interactions
 * - Ensures data consistency across discoveries, dismissed places, and saved places
 * - Supports batch operations for efficient bulk updates
 * - Provides comprehensive discovery statistics and analytics
 * - Implements proper error handling and logging for all operations
 * - Manages discovery metadata including timestamps and user context
 * - Handles data synchronization between different discovery states
 * 
 * WHY IT EXISTS:
 * Hero's Path users interact with discovered places in complex ways - saving interesting
 * places, dismissing unwanted ones, and changing their minds later. This service centralizes
 * all discovery data management, ensuring that user actions are properly recorded and that
 * the app can provide consistent experiences like undo functionality and accurate completion
 * tracking. It's the foundation that makes the discovery system reliable and user-friendly.
 * 
 * KEY FEATURES:
 * - Complete discovery lifecycle management: create, read, update, delete
 * - Undo/redo functionality: reverse dismissal and save actions
 * - State synchronization: consistent data across all discovery collections
 * - Journey completion tracking: automatic status updates based on user interactions
 * - Batch operations: efficient handling of multiple discovery updates
 * - Discovery analytics: comprehensive statistics about user discovery patterns
 * - Data consistency: proper handling of concurrent operations and edge cases
 * - Error recovery: graceful handling of database errors and conflicts
 * 
 * RELATIONSHIPS:
 * - Used by DiscoveriesService.js for data persistence and retrieval
 * - Provides data to DiscoveriesScreen.js for displaying discoveries
 * - Works with JourneyService.js for journey completion status updates
 * - Integrates with PingService.js for ping result storage
 * - May work with DiscoveryConsolidationService.js for data merging
 * - Connects to Firebase Firestore for all data persistence
 * - Used by discovery workflows throughout the app
 * 
 * REFERENCED BY:
 * - DiscoveriesService.js (primary consumer for discovery operations)
 * - DiscoveriesScreen.js (for user interface interactions)
 * - PingService.js (for storing ping-based discoveries)
 * - Journey completion workflows (for status tracking)
 * - Discovery analytics and statistics systems
 * 
 * REFERENCES:
 * - Firebase Firestore (for all data persistence)
 * - Logger utility (for debugging and operation tracking)
 * - Firestore batch operations (for efficient bulk updates)
 * - Server timestamps (for consistent time tracking)
 * 
 * IMPORTANCE TO APP:
 * CRITICAL - This service is fundamental to Hero's Path's discovery experience. Without
 * reliable discovery data management, users would lose their saved places, be unable
 * to undo actions, and experience inconsistent behavior. The data consistency guarantees
 * are essential for user trust and app reliability. This service enables the entire
 * discovery workflow that makes Hero's Path valuable to users.
 * 
 * IMPROVEMENT SUGGESTIONS:
 * 1. Add discovery categorization - organize discoveries by themes or categories
 * 2. Add discovery tagging - user-defined tags for personal organization
 * 3. Add discovery notes - let users add personal notes to discoveries
 * 4. Add discovery sharing - share discoveries with friends or community
 * 5. Add discovery collections - create custom collections of related discoveries
 * 6. Add discovery search - search through personal discovery history
 * 7. Add discovery filtering - advanced filtering by date, type, rating, etc.
 * 8. Add discovery analytics - insights about discovery patterns and preferences
 * 9. Add discovery backup - export and backup discovery data
 * 10. Add discovery sync - synchronize discoveries across multiple devices
 * 11. Add discovery collaboration - collaborative discovery collections
 * 12. Add discovery recommendations - suggest discoveries based on history
 * 13. Add discovery verification - verify and update outdated discovery information
 * 14. Add discovery ratings - personal rating system for discoveries
 * 15. Add discovery photos - attach personal photos to discoveries
 * 16. Add discovery reviews - personal reviews and experiences
 * 17. Add discovery reminders - location-based reminders for saved places
 * 18. Add discovery goals - set and track discovery goals and achievements
 * 19. Add discovery insights - AI-powered insights about discovery behavior
 * 20. Add discovery social features - like, comment, and discuss discoveries
 *
 * Handles CRUD operations for discoveries, dismissed places, and saved places.
 * - Manages Firestore records and state synchronization.
 * - Provides undo/redo and data consistency logic.
 * - Used by DiscoveriesService for all data persistence and retrieval.
 */
// services/DiscoveryService.js
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  collection,
  query,
  orderBy,
  where,
  getDocs,
  serverTimestamp,
  writeBatch 
} from 'firebase/firestore';
import { db } from '../firebase';
import Logger from '../utils/Logger';

class DiscoveryService {
  // Get user's discoveries collection reference
  getUserDiscoveriesRef(userId) {
    return collection(db, 'journeys', userId, 'discoveries');
  }

  // Get user's dismissed places collection reference
  getUserDismissedRef(userId) {
    return collection(db, 'journeys', userId, 'dismissed');
  }

  // Create a new discovery
  async createDiscovery(userId, discoveryData) {
    const startTime = Date.now();
    Logger.discoveryAction('DISCOVERY_SERVICE', 'CREATE', discoveryData.placeId, discoveryData.journeyId, { userId });
    
    try {
      const discoveriesRef = this.getUserDiscoveriesRef(userId);
      const discoveryRef = doc(discoveriesRef);
      
      const discovery = {
        id: discoveryRef.id,
        ...discoveryData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(discoveryRef, discovery);
      
      // Update journey completion status if this discovery is for a specific journey
      if (discoveryData.journeyId) {
        try {
          await this.updateJourneyCompletionStatus(userId, discoveryData.journeyId);
        } catch (statusError) {
          Logger.warn('DISCOVERY_SERVICE', 'Failed to update journey status after creating discovery', { journeyId: discoveryData.journeyId, error: statusError.message });
        }
      }
      
      const duration = Date.now() - startTime;
      Logger.performance('DISCOVERY_SERVICE', 'createDiscovery', duration, { userId, placeId: discoveryData.placeId });
      
      return { success: true, discovery };
    } catch (error) {
      Logger.error('DISCOVERY_SERVICE', 'Error creating discovery', error);
      throw error;
    }
  }

  // Get a specific discovery by ID
  async getDiscovery(userId, discoveryId) {
    try {
      const discoveryRef = doc(db, 'journeys', userId, 'discoveries', discoveryId);
      const discoverySnap = await getDoc(discoveryRef);
      
      if (discoverySnap.exists()) {
        return { success: true, discovery: discoverySnap.data() };
      } else {
        return { success: false, discovery: null };
      }
    } catch (error) {
      console.error('Error getting discovery:', error);
      throw error;
    }
  }

  // Get all discoveries for a user
  async getUserDiscoveries(userId, filters = {}) {
    try {
      const discoveriesRef = this.getUserDiscoveriesRef(userId);
      let q = query(discoveriesRef);
      
      // Apply filters (simplified to avoid composite index requirements)
      if (filters.journeyId) {
        q = query(q, where('journeyId', '==', filters.journeyId));
      }
      if (filters.placeType) {
        q = query(q, where('placeType', '==', filters.placeType));
      }
      if (filters.saved !== undefined) {
        q = query(q, where('saved', '==', filters.saved));
      }
      if (filters.dismissed !== undefined) {
        q = query(q, where('dismissed', '==', filters.dismissed));
      }
      
      const querySnapshot = await getDocs(q);
      
      const discoveries = [];
      querySnapshot.forEach((doc) => {
        discoveries.push(doc.data());
      });
      
      // Sort in memory instead of using orderBy to avoid index requirements
      discoveries.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
        return dateB - dateA; // Descending order
      });
      
      return { success: true, discoveries };
    } catch (error) {
      console.error('Error getting user discoveries:', error);
      throw error;
    }
  }

  // Update a discovery
  async updateDiscovery(userId, discoveryId, updates) {
    try {
      const discoveryRef = doc(db, 'journeys', userId, 'discoveries', discoveryId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };
      await updateDoc(discoveryRef, updateData);
      return { success: true };
    } catch (error) {
      console.error('Error updating discovery:', error);
      throw error;
    }
  }

  // Delete a discovery
  async deleteDiscovery(userId, discoveryId) {
    try {
      const discoveryRef = doc(db, 'journeys', userId, 'discoveries', discoveryId);
      await deleteDoc(discoveryRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting discovery:', error);
      throw error;
    }
  }

  // Mark a place as dismissed
  async dismissPlace(userId, placeId, dismissData = {}) {
    try {
      const dismissedRef = this.getUserDismissedRef(userId);
      const dismissedDoc = doc(dismissedRef, placeId);
      
      const dismissedPlace = {
        placeId,
        dismissedAt: serverTimestamp(),
        dismissedForever: dismissData.dismissedForever || false,
        reason: dismissData.reason || null,
        ...dismissData
      };

      await setDoc(dismissedDoc, dismissedPlace);
      
      // Also update the original discovery record to set dismissed: true
      try {
        const discoveriesRef = this.getUserDiscoveriesRef(userId);
        const discoveryQuery = query(discoveriesRef, where('placeId', '==', placeId));
        const discoverySnap = await getDocs(discoveryQuery);
        
        if (!discoverySnap.empty) {
          const discoveryDoc = discoverySnap.docs[0];
          await updateDoc(discoveryDoc.ref, { 
            dismissed: true,
            updatedAt: serverTimestamp()
          });
          Logger.discoveryAction('DISCOVERY_SERVICE', 'UPDATED_DISCOVERY_RECORD_DISMISSED', placeId, dismissData.journeyId, { userId });
        }
      } catch (updateError) {
        Logger.warn('DISCOVERY_SERVICE', 'Failed to update discovery record after dismiss', { placeId, error: updateError.message });
      }
      
      // Update journey completion status if this dismissal affects a journey
      if (dismissData.journeyId) {
        try {
          await this.updateJourneyCompletionStatus(userId, dismissData.journeyId);
        } catch (statusError) {
          Logger.warn('DISCOVERY_SERVICE', 'Failed to update journey status after dismissing place', { journeyId: dismissData.journeyId, error: statusError.message });
        }
      }
      
      return { success: true };
    } catch (error) {
      Logger.error('DISCOVERY_SERVICE', 'Error dismissing place', error);
      throw error;
    }
  }

  // Get all dismissed places for a user
  async getDismissedPlaces(userId) {
    Logger.discoveryAction('DISCOVERY_SERVICE', 'GET_DISMISSED_PLACES', null, null, { userId });
    try {
      const dismissedRef = this.getUserDismissedRef(userId);
      const q = query(dismissedRef);
      const querySnapshot = await getDocs(q);
      
      const dismissedPlaces = [];
      querySnapshot.forEach((doc) => {
        dismissedPlaces.push(doc.data());
      });
      
      // Sort in memory instead of using orderBy to avoid index requirements
      dismissedPlaces.sort((a, b) => {
        const dateA = a.dismissedAt?.toDate?.() || new Date(a.dismissedAt) || new Date(0);
        const dateB = b.dismissedAt?.toDate?.() || new Date(b.dismissedAt) || new Date(0);
        return dateB - dateA; // Descending order
      });
      
      Logger.discoveryAction('DISCOVERY_SERVICE', 'GET_DISMISSED_PLACES_SUCCESS', null, null, { userId, dismissedPlacesCount: dismissedPlaces.length });
      return { success: true, dismissedPlaces };
    } catch (error) {
      Logger.error('DISCOVERY_SERVICE', 'Error getting dismissed places', error);
      throw error;
    }
  }

  // Check if a place is dismissed
  async isPlaceDismissed(userId, placeId) {
    Logger.discoveryAction('DISCOVERY_SERVICE', 'IS_PLACE_DISMISSED', placeId, null, { userId });
    try {
      const dismissedRef = doc(db, 'journeys', userId, 'dismissed', placeId);
      const dismissedSnap = await getDoc(dismissedRef);
      
      if (dismissedSnap.exists()) {
        const data = dismissedSnap.data();
        Logger.discoveryAction('DISCOVERY_SERVICE', 'IS_PLACE_DISMISSED_SUCCESS', placeId, null, { userId, dismissed: true });
        return { 
          success: true, 
          dismissed: true, 
          dismissedForever: data.dismissedForever || false,
          dismissedAt: data.dismissedAt,
          reason: data.reason
        };
      } else {
        Logger.discoveryAction('DISCOVERY_SERVICE', 'IS_PLACE_DISMISSED_SUCCESS', placeId, null, { userId, dismissed: false });
        return { success: true, dismissed: false };
      }
    } catch (error) {
      Logger.error('DISCOVERY_SERVICE', 'Error checking if place is dismissed', error);
      throw error;
    }
  }

  // Remove a place from dismissed places
  async undismissPlace(userId, placeId) {
    Logger.discoveryAction('DISCOVERY_SERVICE', 'UNDISMISSED_PLACE', placeId, null, { userId });
    try {
      const dismissedRef = doc(db, 'journeys', userId, 'dismissed', placeId);
      const dismissedSnap = await getDoc(dismissedRef);
      
      if (dismissedSnap.exists()) {
        const dismissedData = dismissedSnap.data();
        await deleteDoc(dismissedRef);
        
        // Also update the original discovery record to set dismissed: false
        try {
          const discoveriesRef = this.getUserDiscoveriesRef(userId);
          const discoveryQuery = query(discoveriesRef, where('placeId', '==', placeId));
          const discoverySnap = await getDocs(discoveryQuery);
          
          if (!discoverySnap.empty) {
            const discoveryDoc = discoverySnap.docs[0];
            await updateDoc(discoveryDoc.ref, { 
              dismissed: false,
              updatedAt: serverTimestamp()
            });
            Logger.discoveryAction('DISCOVERY_SERVICE', 'UPDATED_DISCOVERY_RECORD', placeId, dismissedData.journeyId, { userId });
          }
        } catch (updateError) {
          Logger.warn('DISCOVERY_SERVICE', 'Failed to update discovery record after undismiss', { placeId, error: updateError.message });
        }
        
        // Update journey completion status if this undismissal affects a journey
        if (dismissedData.journeyId) {
          try {
            await this.updateJourneyCompletionStatus(userId, dismissedData.journeyId);
          } catch (statusError) {
            Logger.warn('DISCOVERY_SERVICE', 'Failed to update journey status after undismissing place', { journeyId: dismissedData.journeyId, error: statusError.message });
          }
        }
        
        Logger.discoveryAction('DISCOVERY_SERVICE', 'UNDISMISSED_PLACE_SUCCESS', placeId, null, { userId });
        return { success: true };
      } else {
        Logger.discoveryAction('DISCOVERY_SERVICE', 'UNDISMISSED_PLACE_SUCCESS', placeId, null, { userId });
        return { success: false, error: 'Place was not dismissed' };
      }
    } catch (error) {
      Logger.error('DISCOVERY_SERVICE', 'Error undismissing place', error);
      throw error;
    }
  }

  // Get discovery statistics for a user
  async getDiscoveryStats(userId) {
    Logger.discoveryAction('DISCOVERY_SERVICE', 'GET_DISCOVERY_STATS', null, null, { userId });
    try {
      const discoveriesRef = this.getUserDiscoveriesRef(userId);
      const dismissedRef = this.getUserDismissedRef(userId);
      
      const [discoveriesSnap, dismissedSnap] = await Promise.all([
        getDocs(discoveriesRef),
        getDocs(dismissedRef)
      ]);
      
      const totalDiscoveries = discoveriesSnap.size;
      const savedDiscoveries = discoveriesSnap.docs.filter(doc => doc.data().saved).length;
      const dismissedPlaces = dismissedSnap.size;
      
      const stats = {
        total: totalDiscoveries,
        saved: savedDiscoveries,
        dismissed: dismissedPlaces,
        pending: totalDiscoveries - savedDiscoveries
      };
      
      Logger.discoveryAction('DISCOVERY_SERVICE', 'GET_DISCOVERY_STATS_SUCCESS', null, null, { userId, stats });
      return { success: true, stats };
    } catch (error) {
      Logger.error('DISCOVERY_SERVICE', 'Error getting discovery stats', error);
      throw error;
    }
  }

  // Batch update multiple discoveries
  async batchUpdateDiscoveries(userId, updates) {
    Logger.discoveryAction('DISCOVERY_SERVICE', 'BATCH_UPDATE_DISCOVERIES', null, null, { userId, updatesCount: updates.length });
    try {
      const batch = writeBatch(db);
      
      updates.forEach(({ discoveryId, updates: discoveryUpdates }) => {
        const discoveryRef = doc(db, 'journeys', userId, 'discoveries', discoveryId);
        batch.update(discoveryRef, {
          ...discoveryUpdates,
          updatedAt: serverTimestamp(),
        });
      });
      
      await batch.commit();
      Logger.discoveryAction('DISCOVERY_SERVICE', 'BATCH_UPDATE_DISCOVERIES_SUCCESS', null, null, { userId, updatesCount: updates.length });
      return { success: true };
    } catch (error) {
      Logger.error('DISCOVERY_SERVICE', 'Error batch updating discoveries', error);
      throw error;
    }
  }

  // Get discoveries for a specific journey
  async getDiscoveriesByJourney(userId, journeyId) {
    Logger.discoveryAction('DISCOVERY_SERVICE', 'GET_DISCOVERIES_BY_JOURNEY', null, journeyId, { userId });
    try {
      const discoveriesRef = this.getUserDiscoveriesRef(userId);
      const q = query(discoveriesRef, where('journeyId', '==', journeyId));
      const querySnapshot = await getDocs(q);
      
      const discoveries = [];
      querySnapshot.forEach((doc) => {
        discoveries.push(doc.data());
      });
      
      Logger.discoveryAction('DISCOVERY_SERVICE', 'GET_DISCOVERIES_BY_JOURNEY_SUCCESS', null, journeyId, { userId, discoveriesCount: discoveries.length });
      return { success: true, discoveries };
    } catch (error) {
      Logger.error('DISCOVERY_SERVICE', 'Error getting discoveries by journey', error);
      throw error;
    }
  }

  // Get journey discoveries (alias for getDiscoveriesByJourney)
  async getJourneyDiscoveries(userId, journeyId) {
    return this.getDiscoveriesByJourney(userId, journeyId);
  }

  // Get saved places for a user
  async getSavedPlaces(userId) {
    Logger.discoveryAction('DISCOVERY_SERVICE', 'GET_SAVED_PLACES', null, null, { userId });
    try {
      const discoveriesRef = this.getUserDiscoveriesRef(userId);
      const q = query(discoveriesRef, where('saved', '==', true));
      const querySnapshot = await getDocs(q);
      
      const savedPlaces = [];
      querySnapshot.forEach((doc) => {
        savedPlaces.push(doc.data());
      });
      
      Logger.discoveryAction('DISCOVERY_SERVICE', 'GET_SAVED_PLACES_SUCCESS', null, null, { userId, savedPlacesCount: savedPlaces.length });
      return { success: true, discoveries: savedPlaces };
    } catch (error) {
      Logger.error('DISCOVERY_SERVICE', 'Error getting saved places', error);
      throw error;
    }
  }

  // Remove a place from dismissed places (alias for undismissPlace)
  async removeFromDismissedPlaces(userId, placeId) {
    return this.undismissPlace(userId, placeId);
  }

  // Remove a place from saved places
  async unsavePlace(userId, placeId) {
    Logger.discoveryAction('DISCOVERY_SERVICE', 'UNSAVE_PLACE', placeId, null, { userId });
    try {
      // First, find the discovery to get the journeyId
      const discoveriesResult = await this.getUserDiscoveries(userId, { saved: true });
      const savedDiscovery = discoveriesResult.discoveries.find(d => d.placeId === placeId);
      
      if (savedDiscovery) {
        // Update the discovery to mark it as not saved
        await this.updateDiscovery(userId, savedDiscovery.id, { saved: false });
        
        // Update journey completion status if this unsave affects a journey
        if (savedDiscovery.journeyId) {
          try {
            await this.updateJourneyCompletionStatus(userId, savedDiscovery.journeyId);
          } catch (statusError) {
            Logger.warn('DISCOVERY_SERVICE', 'Failed to update journey status after unsaving place', { journeyId: savedDiscovery.journeyId, error: statusError.message });
          }
        }
        
        Logger.discoveryAction('DISCOVERY_SERVICE', 'UNSAVE_PLACE_SUCCESS', placeId, null, { userId });
        return { success: true };
      } else {
        Logger.discoveryAction('DISCOVERY_SERVICE', 'UNSAVE_PLACE_SUCCESS', placeId, null, { userId });
        return { success: false, error: 'Place was not saved' };
      }
    } catch (error) {
      Logger.error('DISCOVERY_SERVICE', 'Error unsaving place', error);
      throw error;
    }
  }

  // Update journey completion status based on discoveries
  async updateJourneyCompletionStatus(userId, journeyId) {
    Logger.discoveryAction('DISCOVERY_SERVICE', 'UPDATE_JOURNEY_COMPLETION_STATUS', journeyId, null, { userId });
    try {
      
      // Get all discoveries for this journey
      const discoveriesResult = await this.getDiscoveriesByJourney(userId, journeyId);
      
      if (!discoveriesResult.success || !discoveriesResult.discoveries) {
        Logger.discoveryAction('DISCOVERY_SERVICE', 'UPDATE_JOURNEY_COMPLETION_STATUS_NO_DISCOVERIES', journeyId, null, { userId });
        return { success: false, error: 'No discoveries found' };
      }
      
      const discoveries = discoveriesResult.discoveries;
      const totalDiscoveries = discoveries.length;
      
      if (totalDiscoveries === 0) {
        Logger.discoveryAction('DISCOVERY_SERVICE', 'UPDATE_JOURNEY_COMPLETION_STATUS_NO_DISCOVERIES_MARK_COMPLETE', journeyId, null, { userId });
        // No discoveries means journey is complete (nothing to review)
        await this.updateJourneyStatus(userId, journeyId, true, 0, 0);
        return { success: true, completed: true, reviewedCount: 0, totalCount: 0 };
      }
      
      // Count reviewed discoveries (saved or dismissed)
      const reviewedDiscoveries = discoveries.filter(discovery => 
        discovery.saved || discovery.dismissed
      );
      const reviewedCount = reviewedDiscoveries.length;
      const isCompleted = reviewedCount === totalDiscoveries;
      
      Logger.discoveryAction('DISCOVERY_SERVICE', 'UPDATE_JOURNEY_COMPLETION_STATUS_SUCCESS', journeyId, null, { 
        userId, 
        totalDiscoveries, 
        reviewedCount, 
        isCompleted,
        discoveries: discoveries.map(d => ({
          placeId: d.placeId,
          saved: d.saved,
          dismissed: d.dismissed,
          placeName: d.placeName
        }))
      });
      
      // Update journey status
      await this.updateJourneyStatus(userId, journeyId, isCompleted, reviewedCount, totalDiscoveries);
      
      return { 
        success: true, 
        completed: isCompleted, 
        reviewedCount, 
        totalCount: totalDiscoveries 
      };
    } catch (error) {
      Logger.error('DISCOVERY_SERVICE', 'Error updating journey completion status', error);
      throw error;
    }
  }

  // Update journey status in Firestore
  async updateJourneyStatus(userId, journeyId, isCompleted, reviewedCount, totalCount) {
    try {
      const journeyRef = doc(db, 'journeys', userId, 'journeys', journeyId);
      const updateData = {
        isCompleted: isCompleted,
        reviewedDiscoveriesCount: reviewedCount,
        totalDiscoveriesCount: totalCount,
        completionPercentage: totalCount > 0 ? Math.round((reviewedCount / totalCount) * 100) : 0,
        lastStatusUpdate: serverTimestamp(),
      };
      
      await updateDoc(journeyRef, updateData);
      Logger.discoveryAction('DISCOVERY_SERVICE', 'UPDATE_JOURNEY_STATUS_SUCCESS', journeyId, null, { userId, isCompleted, reviewedCount, totalCount });
    } catch (error) {
      Logger.error('DISCOVERY_SERVICE', 'Error updating journey status', error);
      throw error;
    }
  }
}

export default new DiscoveryService(); 