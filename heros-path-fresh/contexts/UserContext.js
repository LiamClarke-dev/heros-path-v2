// contexts/UserContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import UserProfileService from '../services/UserProfileService';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState(null);

  // Listen for authentication state changes
  useEffect(() => {
    let unsubscribe;
    
    try {
      // Check if auth is properly initialized
      if (auth && typeof auth.onAuthStateChanged === 'function') {
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          console.log('Auth state changed:', firebaseUser ? 'User logged in' : 'User logged out');
          setUser(firebaseUser);
          
          if (firebaseUser) {
            // Load user profile from Firestore
            await loadUserProfile(firebaseUser.uid);
          } else {
            setUserProfile(null);
          }
          
          setLoading(false);
        });
      } else {
        console.warn('Firebase Auth not properly initialized, skipping auth state listener');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error setting up auth state listener:', error);
      setError(error.message);
      setLoading(false);
    }

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Load user profile from Firestore
  const loadUserProfile = async (userId) => {
    try {
      setProfileLoading(true);
      const result = await UserProfileService.getUserProfile(userId);
      
      if (result.success && result.profile) {
        setUserProfile(result.profile);
      } else {
        // Profile doesn't exist yet, will be created on first sign-in
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUserProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  // Create or update user profile
  const createOrUpdateProfile = async (profileData) => {
    if (!user) {
      throw new Error('User must be authenticated to create/update profile');
    }

    try {
      setProfileLoading(true);
      const result = await UserProfileService.createOrUpdateProfile(user.uid, profileData);
      
      if (result.success) {
        setUserProfile(result.profile);
        return result.profile;
      }
    } catch (error) {
      console.error('Error creating/updating profile:', error);
      throw error;
    } finally {
      setProfileLoading(false);
    }
  };

  // Update specific profile fields
  const updateProfile = async (updates) => {
    if (!user) {
      throw new Error('User must be authenticated to update profile');
    }

    try {
      setProfileLoading(true);
      await UserProfileService.updateProfile(user.uid, updates);
      
      // Update local state
      setUserProfile(prev => ({
        ...prev,
        ...updates
      }));
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    } finally {
      setProfileLoading(false);
    }
  };

  // Sign out user
  const signOutUser = async () => {
    try {
      if (auth && typeof auth.signOut === 'function') {
        await signOut(auth);
      } else {
        console.warn('Firebase Auth not properly initialized, cannot sign out');
      }
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Refresh user profile
  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user.uid);
    }
  };

  // Search users
  const searchUsers = async (searchTerm) => {
    if (!user) {
      throw new Error('User must be authenticated to search users');
    }

    try {
      const result = await UserProfileService.searchUsers(searchTerm, user.uid);
      return result.users;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  };

  // Get friends list
  const getFriendsList = async () => {
    if (!user) {
      throw new Error('User must be authenticated to get friends list');
    }

    try {
      const result = await UserProfileService.getFriendsList(user.uid);
      return result.friends;
    } catch (error) {
      console.error('Error getting friends list:', error);
      throw error;
    }
  };

  // Add friend
  const addFriend = async (friendId) => {
    if (!user) {
      throw new Error('User must be authenticated to add friend');
    }

    try {
      await UserProfileService.addFriend(user.uid, friendId);
      await refreshProfile(); // Refresh to get updated friends list
    } catch (error) {
      console.error('Error adding friend:', error);
      throw error;
    }
  };

  // Remove friend
  const removeFriend = async (friendId) => {
    if (!user) {
      throw new Error('User must be authenticated to remove friend');
    }

    try {
      await UserProfileService.removeFriend(user.uid, friendId);
      await refreshProfile(); // Refresh to get updated friends list
    } catch (error) {
      console.error('Error removing friend:', error);
      throw error;
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    profileLoading,
    error,
    createOrUpdateProfile,
    updateProfile,
    signOutUser,
    refreshProfile,
    searchUsers,
    getFriendsList,
    addFriend,
    removeFriend,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}; 