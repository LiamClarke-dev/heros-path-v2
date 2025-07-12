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
      return { success: true, discovery };
    } catch (error) {
      console.error('Error creating discovery:', error);
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
      let q = query(discoveriesRef, orderBy('createdAt', 'desc'));
      
      // Apply filters
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
      return { success: true };
    } catch (error) {
      console.error('Error dismissing place:', error);
      throw error;
    }
  }

  // Get all dismissed places for a user
  async getDismissedPlaces(userId) {
    try {
      const dismissedRef = this.getUserDismissedRef(userId);
      const q = query(dismissedRef, orderBy('dismissedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const dismissedPlaces = [];
      querySnapshot.forEach((doc) => {
        dismissedPlaces.push(doc.data());
      });
      
      return { success: true, dismissedPlaces };
    } catch (error) {
      console.error('Error getting dismissed places:', error);
      throw error;
    }
  }

  // Check if a place is dismissed
  async isPlaceDismissed(userId, placeId) {
    try {
      const dismissedRef = doc(db, 'journeys', userId, 'dismissed', placeId);
      const dismissedSnap = await getDoc(dismissedRef);
      
      if (dismissedSnap.exists()) {
        const data = dismissedSnap.data();
        return { 
          success: true, 
          dismissed: true, 
          dismissedForever: data.dismissedForever || false,
          dismissedAt: data.dismissedAt,
          reason: data.reason
        };
      } else {
        return { success: true, dismissed: false };
      }
    } catch (error) {
      console.error('Error checking if place is dismissed:', error);
      throw error;
    }
  }

  // Remove a place from dismissed list
  async undismissPlace(userId, placeId) {
    try {
      const dismissedRef = doc(db, 'journeys', userId, 'dismissed', placeId);
      await deleteDoc(dismissedRef);
      return { success: true };
    } catch (error) {
      console.error('Error undismissing place:', error);
      throw error;
    }
  }

  // Get discovery statistics for a user
  async getDiscoveryStats(userId) {
    try {
      const discoveriesRef = this.getUserDiscoveriesRef(userId);
      const querySnapshot = await getDocs(discoveriesRef);
      
      let totalDiscoveries = 0;
      let savedCount = 0;
      let dismissedCount = 0;
      const placeTypes = {};
      
      querySnapshot.forEach((doc) => {
        const discovery = doc.data();
        totalDiscoveries++;
        
        if (discovery.saved) savedCount++;
        if (discovery.dismissed) dismissedCount++;
        
        if (discovery.placeType) {
          placeTypes[discovery.placeType] = (placeTypes[discovery.placeType] || 0) + 1;
        }
      });
      
      return {
        success: true,
        stats: {
          totalDiscoveries,
          savedCount,
          dismissedCount,
          placeTypes,
          saveRate: totalDiscoveries > 0 ? (savedCount / totalDiscoveries) * 100 : 0,
          dismissRate: totalDiscoveries > 0 ? (dismissedCount / totalDiscoveries) * 100 : 0,
        }
      };
    } catch (error) {
      console.error('Error getting discovery stats:', error);
      // Return empty stats instead of throwing for better UX
      return {
        success: false,
        stats: {
          totalDiscoveries: 0,
          savedCount: 0,
          dismissedCount: 0,
          placeTypes: {},
          saveRate: 0,
          dismissRate: 0,
        },
        error: error.message
      };
    }
  }

  // Batch operations for multiple discoveries
  async batchUpdateDiscoveries(userId, updates) {
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
      return { success: true };
    } catch (error) {
      console.error('Error batch updating discoveries:', error);
      throw error;
    }
  }

  // Get discoveries by journey
  async getDiscoveriesByJourney(userId, journeyId) {
    try {
      return await this.getUserDiscoveries(userId, { journeyId });
    } catch (error) {
      console.error('Error getting discoveries by journey:', error);
      throw error;
    }
  }

  // Get saved places only
  async getSavedPlaces(userId) {
    try {
      return await this.getUserDiscoveries(userId, { saved: true });
    } catch (error) {
      console.error('Error getting saved places:', error);
      throw error;
    }
  }
}

export default new DiscoveryService(); 