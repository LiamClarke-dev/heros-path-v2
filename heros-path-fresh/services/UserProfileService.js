/**
 * UserProfileService
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