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
      console.log(`🗑️ [JOURNEY_SERVICE] Starting comprehensive deletion of journey: ${journeyId}`);
      
      // 1. Get all discoveries for this journey first
      const discoveriesRef = collection(db, 'journeys', userId, 'discoveries');
      const discoveriesQuery = query(discoveriesRef, where('journeyId', '==', journeyId));
      const discoveriesSnap = await getDocs(discoveriesQuery);
      
      console.log(`🗑️ [JOURNEY_SERVICE] Found ${discoveriesSnap.size} discoveries to process`);
      
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
      
      console.log(`🗑️ [JOURNEY_SERVICE] Found ${savedDiscoveries.length} saved places to update`);
      console.log(`🗑️ [JOURNEY_SERVICE] Found ${regularDiscoveries.length} regular discoveries to delete`);
      
      // 3. Get dismissed places that reference this journey
      const dismissedRef = collection(db, 'journeys', userId, 'dismissed');
      const dismissedQuery = query(dismissedRef, where('journeyId', '==', journeyId));
      const dismissedSnap = await getDocs(dismissedQuery);
      
      console.log(`🗑️ [JOURNEY_SERVICE] Found ${dismissedSnap.size} dismissed places to delete`);
      
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
      
      console.log(`🗑️ [JOURNEY_SERVICE] Successfully deleted journey ${journeyId} and all associated data`);
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
      console.log(`🗑️ [JOURNEY_SERVICE] Starting deletion of ALL journeys for user: ${userId}`);
      
      // Get all journeys first
      const journeysResult = await this.getUserJourneys(userId);
      if (!journeysResult.success || journeysResult.journeys.length === 0) {
        console.log(`🗑️ [JOURNEY_SERVICE] No journeys found to delete`);
        return { success: true, deletedCount: 0 };
      }
      
      const journeyIds = journeysResult.journeys.map(j => j.id);
      console.log(`🗑️ [JOURNEY_SERVICE] Found ${journeyIds.length} journeys to delete:`, journeyIds);
      
      // Delete each journey with full cleanup
      for (const journeyId of journeyIds) {
        await this.deleteJourney(userId, journeyId);
      }
      
      console.log(`🗑️ [JOURNEY_SERVICE] Successfully deleted all ${journeyIds.length} journeys`);
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
}

export default new JourneyService(); 