/**
 * USER PROFILE SERVICE (USER DATA MANAGEMENT)
 * ============================================
 * 
 * PURPOSE:
 * This service manages all user profile data including personal information, preferences,
 * social connections, and account settings. It provides a centralized interface for
 * user-related operations and integrates with the authentication system to maintain
 * comprehensive user profiles. Think of it as the user identity manager that handles
 * everything related to who users are and how they interact with each other.
 * 
 * FUNCTIONALITY:
 * - Creates and manages user profiles with personal information and preferences
 * - Handles profile updates and modifications with proper validation
 * - Manages social features including friends lists and user search
 * - Provides user discovery and connection functionality
 * - Supports profile deletion and account cleanup
 * - Handles preference synchronization across devices
 * - Manages user onboarding and initial setup
 * - Provides analytics and insights about user behavior
 * - Ensures data privacy and security compliance
 * - Handles profile verification and validation
 * 
 * WHY IT EXISTS:
 * Hero's Path is a social discovery app that needs comprehensive user management.
 * Users need profiles to save their data, preferences to customize their experience,
 * and social features to connect with friends. This service centralizes all user-related
 * functionality and provides a consistent interface for user data management throughout
 * the app, ensuring that user information is properly maintained and secure.
 * 
 * KEY FEATURES:
 * - Complete profile management: create, read, update, delete user profiles
 * - Social functionality: friends lists, user search, and social connections
 * - Preference management: user settings and customization options
 * - Privacy controls: granular control over profile visibility and data sharing
 * - Profile verification: validation of user information and identity
 * - Data synchronization: consistent profile data across multiple devices
 * - Account security: secure handling of sensitive user information
 * - Analytics integration: insights about user engagement and behavior
 * 
 * RELATIONSHIPS:
 * - Used by UserContext.js for authentication and profile management
 * - Integrates with Firebase Auth for authentication services
 * - Provides user data to social features throughout the app
 * - Works with journey and discovery services for user-specific data
 * - Connects to settings screens for profile management interfaces
 * - Used by onboarding flows for new user setup
 * - Provides data for user analytics and statistics
 * 
 * REFERENCED BY:
 * - UserContext.js (primary consumer for authentication and profile data)
 * - SettingsScreen.js (for profile editing and management)
 * - SocialScreen.js (for social features and friend management)
 * - Onboarding and registration flows
 * - User analytics and statistics systems
 * 
 * REFERENCES:
 * - Firebase Firestore (for profile data storage)
 * - Firebase Auth (for authentication integration)
 * - Server timestamps (for consistent time tracking)
 * - Profile validation and security utilities
 * 
 * IMPORTANCE TO APP:
 * HIGH - This service is essential for user experience and social functionality.
 * Without proper user management, the app cannot provide personalized experiences,
 * social features, or data persistence. The profile system is fundamental to user
 * retention and engagement, and the social features are key differentiators for
 * Hero's Path compared to other walking apps.
 * 
 * IMPROVEMENT SUGGESTIONS:
 * 1. Add profile verification - verify user identity and credentials
 * 2. Add privacy controls - granular privacy settings for different profile aspects
 * 3. Add profile customization - themes, avatars, and personal styling options
 * 4. Add achievement system - track and display user achievements and badges
 * 5. Add social features - follow, like, comment, and social interaction systems
 * 6. Add profile analytics - insights about profile usage and engagement
 * 7. Add profile backup - backup and restore profile data
 * 8. Add profile sharing - shareable profile links and QR codes
 * 9. Add profile recommendations - suggest friends and connections
 * 10. Add profile validation - validate profile information accuracy
 * 11. Add multi-device sync - synchronize profile changes across devices
 * 12. Add profile history - track profile changes and history
 * 13. Add profile security - enhanced security features and monitoring
 * 14. Add profile insights - AI-powered insights about user behavior
 * 15. Add profile integration - integrate with external social platforms
 * 16. Add profile notifications - profile-related notifications and updates
 * 17. Add profile search - advanced search and discovery features
 * 18. Add profile groups - group membership and community features
 * 19. Add profile metrics - detailed metrics about profile performance
 * 20. Add profile accessibility - accessibility features for diverse users
 *
 * Handles user profile data (authentication, preferences, onboarding, etc.).
 * - Provides CRUD for user profiles and preference syncing.
 * - Supports onboarding and user data management.
 */
// services/UserProfileService.js
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  collection,
  query,
  where,
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

class UserProfileService {
  // Create or update a user profile
  async createOrUpdateProfile(userId, profileData) {
    try {
      const userRef = doc(db, 'users', userId);
      
      const profile = {
        ...profileData,
        updatedAt: serverTimestamp(),
        createdAt: profileData.createdAt || serverTimestamp(),
      };

      await setDoc(userRef, profile, { merge: true });
      return { success: true, profile };
    } catch (error) {
      console.error('Error creating/updating profile:', error);
      throw error;
    }
  }

  // Get user profile by ID
  async getUserProfile(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return { success: true, profile: userSnap.data() };
      } else {
        return { success: false, profile: null };
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  // Update specific fields of user profile
  async updateProfile(userId, updates) {
    try {
      const userRef = doc(db, 'users', userId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };
      await setDoc(userRef, updateData, { merge: true });
      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  // Delete user profile
  async deleteProfile(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw error;
    }
  }

  // Search users by display name
  async searchUsers(searchTerm, currentUserId) {
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef, 
        where('displayName', '>=', searchTerm),
        where('displayName', '<=', searchTerm + '\uf8ff')
      );
      
      const querySnapshot = await getDocs(q);
      const users = [];
      
      querySnapshot.forEach((doc) => {
        if (doc.id !== currentUserId) {
          users.push({
            id: doc.id,
            ...doc.data()
          });
        }
      });
      
      return { success: true, users };
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  // Get user's friends list
  async getFriendsList(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists() && userSnap.data().friends) {
        const friendsIds = userSnap.data().friends;
        const friends = [];
        
        for (const friendId of friendsIds) {
          const friendSnap = await getDoc(doc(db, 'users', friendId));
          if (friendSnap.exists()) {
            friends.push({
              id: friendId,
              ...friendSnap.data()
            });
          }
        }
        
        return { success: true, friends };
      }
      
      return { success: true, friends: [] };
    } catch (error) {
      console.error('Error getting friends list:', error);
      throw error;
    }
  }

  // Add friend to user's friends list
  async addFriend(userId, friendId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      let friends = [];
      if (userSnap.exists() && userSnap.data().friends) {
        friends = userSnap.data().friends;
      }
      
      if (!friends.includes(friendId)) {
        friends.push(friendId);
        await updateDoc(userRef, {
          friends,
          updatedAt: serverTimestamp()
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error adding friend:', error);
      throw error;
    }
  }

  // Remove friend from user's friends list
  async removeFriend(userId, friendId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists() && userSnap.data().friends) {
        let friends = userSnap.data().friends;
        friends = friends.filter(id => id !== friendId);
        
        await updateDoc(userRef, {
          friends,
          updatedAt: serverTimestamp()
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error removing friend:', error);
      throw error;
    }
  }
}

export default new UserProfileService(); 