// utils/FirestoreDataViewer.js
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit,
  startAfter,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import Logger from './Logger';

class FirestoreDataViewer {
  
  // Get current user's journeys only
  async getUserJourneys(userId) {
    try {
      Logger.debug('FIRESTORE_VIEWER', `Getting journeys for user: ${userId}`);
      
      const userJourneysRef = collection(db, 'journeys', userId, 'journeys');
      const querySnapshot = await getDocs(userJourneysRef);
      
      const journeys = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        journeys.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt) || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt) || new Date()
        });
      });
      
      // Sort by creation date (newest first)
      journeys.sort((a, b) => b.createdAt - a.createdAt);
      
      Logger.debug('FIRESTORE_VIEWER', `Found ${journeys.length} journeys for user ${userId}`);
      return { success: true, journeys };
    } catch (error) {
      Logger.error('FIRESTORE_VIEWER', `Error getting journeys for user ${userId}`, error);
      return { success: false, error: error.message };
    }
  }

  // Get current user's journey statistics only
  async getUserJourneyStats(userId) {
    try {
      Logger.debug('FIRESTORE_VIEWER', `Getting journey statistics for user: ${userId}`);
      
      const journeysResult = await this.getUserJourneys(userId);
      if (!journeysResult.success) {
        return journeysResult;
      }
      
      const { journeys } = journeysResult;
      
      // Calculate statistics for current user only
      const statsData = {
        totalJourneys: journeys.length,
        totalRoutePoints: journeys.reduce((total, journey) => total + (journey.route?.length || 0), 0),
        averageRoutePointsPerJourney: journeys.length > 0 ? 
          journeys.reduce((total, journey) => total + (journey.route?.length || 0), 0) / journeys.length : 0,
        journeysWithRoutes: journeys.filter(j => j.route && j.route.length > 0).length,
        journeysWithoutRoutes: journeys.filter(j => !j.route || j.route.length === 0).length,
        oldestJourney: journeys.length > 0 ? journeys[journeys.length - 1].createdAt : null,
        newestJourney: journeys.length > 0 ? journeys[0].createdAt : null,
        totalDistance: journeys.reduce((total, journey) => total + (journey.distance || 0), 0),
        totalDuration: journeys.reduce((total, journey) => total + (journey.duration || 0), 0)
      };
      
      Logger.debug('FIRESTORE_VIEWER', 'User journey statistics calculated', statsData);
      return { success: true, stats: statsData, journeys };
    } catch (error) {
      Logger.error('FIRESTORE_VIEWER', 'Error getting user journey statistics', error);
      return { success: false, error: error.message };
    }
  }

  // Export current user's data only
  async exportUserJourneyData(userId) {
    try {
      Logger.debug('FIRESTORE_VIEWER', `Exporting journey data for user: ${userId}`);
      
      const result = await this.getUserJourneys(userId);
      if (!result.success) return result;
      
      const data = {
        userId,
        journeys: result.journeys,
        exportDate: new Date().toISOString(),
        privacyNote: "This export contains only your personal journey data"
      };
      
      // Convert to JSON string
      const jsonData = JSON.stringify(data, null, 2);
      
      Logger.debug('FIRESTORE_VIEWER', 'User journey data exported successfully');
      return { success: true, data: jsonData, objectData: data };
    } catch (error) {
      Logger.error('FIRESTORE_VIEWER', 'Error exporting user journey data', error);
      return { success: false, error: error.message };
    }
  }

  // Get current user's profile information only
  async getUserProfile(userId) {
    try {
      Logger.debug('FIRESTORE_VIEWER', `Getting profile for user: ${userId}`);
      
      const userProfileRef = doc(db, 'users', userId);
      const userProfileSnap = await getDoc(userProfileRef);
      
      if (userProfileSnap.exists()) {
        const data = userProfileSnap.data();
        Logger.debug('FIRESTORE_VIEWER', `Found profile for user ${userId}`);
        return { 
          success: true, 
          profile: {
            userId,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt) || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt) || new Date()
          }
        };
      } else {
        Logger.debug('FIRESTORE_VIEWER', `No profile found for user ${userId}`);
        return { success: true, profile: null };
      }
    } catch (error) {
      Logger.error('FIRESTORE_VIEWER', `Error getting profile for user ${userId}`, error);
      return { success: false, error: error.message };
    }
  }

  // Validate user can only access their own data
  validateUserAccess(requestedUserId, currentUserId) {
    if (requestedUserId !== currentUserId) {
      Logger.error('FIRESTORE_VIEWER', `Security violation: User ${currentUserId} attempted to access data for user ${requestedUserId}`);
      return false;
    }
    return true;
  }
}

export default new FirestoreDataViewer(); 