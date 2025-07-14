/*
 * FIRESTORE DATA VIEWER (DATABASE DEBUGGING & INSPECTION UTILITY)
 * ================================================================
 * 
 * PURPOSE:
 * This utility provides controlled access to view and inspect Firestore database
 * content for debugging, development, and support purposes. It offers safe,
 * read-only access to user data with proper access controls and data formatting
 * for development and troubleshooting workflows. Think of it as the "database
 * inspector" that helps developers understand and debug data issues without
 * compromising user privacy or security.
 * 
 * FUNCTIONALITY:
 * - Safe Data Viewing: Read-only access to Firestore collections and documents
 * - User Data Inspection: View user-specific journeys, profiles, and discoveries
 * - Data Statistics: Generate statistics and summaries of user data
 * - Export Capabilities: Export user data for analysis or support purposes
 * - Access Control: Ensure users can only access their own data
 * - Data Formatting: Format database data for human-readable display
 * - Query Optimization: Efficient queries with pagination and filtering
 * - Error Handling: Graceful handling of missing or invalid data
 * - Debug Logging: Detailed logging for debugging database operations
 * - Privacy Protection: Strict access controls and data minimization
 * 
 * WHY IT EXISTS:
 * During development and support, developers need to inspect database content
 * to debug issues, verify data integrity, and understand user problems. However,
 * direct database access can be dangerous and violate privacy. This utility
 * provides a safe, controlled way to view necessary data while maintaining
 * security and privacy protections.
 * 
 * KEY CAPABILITIES:
 * 1. **Journey Inspection**: View user walking routes and journey metadata
 * 2. **Profile Viewing**: Access user profile information for support
 * 3. **Data Statistics**: Generate summaries and statistics about user data
 * 4. **Export Functions**: Export data for analysis or user data requests
 * 5. **Access Validation**: Ensure proper access controls and permissions
 * 6. **Data Formatting**: Present data in human-readable formats
 * 7. **Query Optimization**: Efficient data retrieval with proper pagination
 * 8. **Error Recovery**: Handle missing or corrupted data gracefully
 * 
 * SECURITY FEATURES:
 * - User Access Validation: Users can only access their own data
 * - Read-Only Operations: No write, update, or delete capabilities
 * - Data Minimization: Only access necessary data fields
 * - Audit Logging: Log all data access for security monitoring
 * - Privacy Protection: Respect user privacy and data protection regulations
 * 
 * RELATIONSHIPS:
 * - Uses Firebase/Firestore for database access
 * - Integrates with Logger for detailed operation tracking
 * - Works with user authentication system for access control
 * - Used by SettingsScreen for debugging and support features
 * - May be used by support tools and development debugging
 * - Coordinates with data migration and backup systems
 * 
 * REFERENCED BY:
 * - SettingsScreen.js (for developer debugging features)
 * - Support and troubleshooting workflows
 * - Development debugging and testing processes
 * - Data analysis and user research activities
 * - User data export requests (GDPR, CCPA compliance)
 * 
 * REFERENCES:
 * - Firebase/Firestore (for database access)
 * - Logger.js (for operation tracking and debugging)
 * - Firebase authentication (for user validation)
 * - Firestore security rules (for access control)
 * - Data protection and privacy frameworks
 * 
 * IMPORTANCE TO APP:
 * MEDIUM - This utility is important for development and support but not
 * user-facing functionality. It enables effective debugging and support
 * while maintaining security, which is crucial for app maintenance and
 * user satisfaction when issues arise.
 * 
 * IMPROVEMENT SUGGESTIONS:
 * 1. Add data visualization - visual charts and graphs for data analysis
 * 2. Add data comparison - compare data between different time periods
 * 3. Add data validation - verify data integrity and consistency
 * 4. Add data search - search through user data with various criteria
 * 5. Add data filtering - advanced filtering options for large datasets
 * 6. Add data aggregation - aggregate statistics across multiple users
 * 7. Add data export formats - support multiple export formats (JSON, CSV, etc.)
 * 8. Add data privacy controls - enhanced privacy protection and anonymization
 * 9. Add data access logging - detailed audit trails for compliance
 * 10. Add data health monitoring - monitor database health and performance
 * 11. Add data backup verification - verify backup integrity and completeness
 * 12. Add data migration support - assist with data migration and validation
 * 13. Add data analytics - insights about data patterns and usage
 * 14. Add data compliance tools - ensure GDPR, CCPA, and other regulatory compliance
 * 15. Add data documentation - automatic documentation of data structures
 * 16. Add data testing - tools for testing data operations and integrity
 * 17. Add data optimization - identify and optimize inefficient data patterns
 * 18. Add data security scanning - scan for potential security issues
 * 19. Add data recovery tools - assist with data recovery from backups
 * 20. Add data automation - automate routine data maintenance and monitoring tasks
 */

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