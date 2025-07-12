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
  writeBatch 
} from 'firebase/firestore';
import { db } from '../firebase';

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
      const q = query(journeysRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const journeys = [];
      querySnapshot.forEach((doc) => {
        journeys.push(doc.data());
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

  // Delete a journey
  async deleteJourney(userId, journeyId) {
    try {
      const journeyRef = doc(db, 'journeys', userId, 'journeys', journeyId);
      await deleteDoc(journeyRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting journey:', error);
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
      throw error;
    }
  }
}

export default new JourneyService(); 