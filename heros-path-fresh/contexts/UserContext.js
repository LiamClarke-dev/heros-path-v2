// contexts/UserContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import UserProfileService from '../services/UserProfileService';
import DataMigrationService from '../services/DataMigrationService';

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
  const [migrationLoading, setMigrationLoading] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [error, setError] = useState(null);

  // Listen for authentication state changes
  useEffect(() => {
    let unsubscribe;
    
    try {
      // Check if auth is properly initialized
      if (auth && typeof auth.onAuthStateChanged === 'function') {
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          setUser(firebaseUser);
          if (firebaseUser) {
            // Load user profile from Firestore
            const result = await UserProfileService.getUserProfile(firebaseUser.uid);
            if (!result.success || !result.profile) {
              // Create default profile for new user
              await UserProfileService.createOrUpdateProfile(firebaseUser.uid, {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || 'Hero Explorer',
                photoURL: firebaseUser.photoURL,
                emailVerified: firebaseUser.emailVerified,
                lastSignInAt: new Date().toISOString(),
                isNewUser: true,
                bio: '',
                location: '',
                preferences: {
                  notifications: true,
                  privacy: 'public',
                  units: 'metric'
                },
                stats: {
                  totalWalks: 0,
                  totalDistance: 0,
                  totalTime: 0,
                  discoveries: 0
                }
              });
            }
            await loadUserProfile(firebaseUser.uid);
            
            // Check and handle data migration
            await checkAndHandleMigration(firebaseUser.uid);
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    } catch (error) {
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

  // Check and handle data migration
  const checkAndHandleMigration = async (userId) => {
    try {
      setMigrationLoading(true);
      const status = await DataMigrationService.getMigrationStatus(userId);
      setMigrationStatus(status);
      
      // If not migrated and has data to migrate, start migration
      if (!status.hasMigrated && (status.stats.hasJourneys || status.stats.hasSavedPlaces || status.stats.hasDismissedPlaces)) {
        console.log('Starting data migration for user:', userId);
        const migrationResult = await DataMigrationService.migrateAllData(userId);
        setMigrationStatus(prev => ({ ...prev, migrationResult }));
        console.log('Migration completed:', migrationResult);
      }
    } catch (error) {
      console.error('Error during migration check:', error);
      setError('Migration failed: ' + error.message);
    } finally {
      setMigrationLoading(false);
    }
  };

  // Manual migration trigger
  const triggerMigration = async () => {
    if (!user) {
      throw new Error('User must be authenticated to trigger migration');
    }

    try {
      setMigrationLoading(true);
      const result = await DataMigrationService.migrateAllData(user.uid);
      setMigrationStatus(prev => ({ ...prev, migrationResult: result }));
      return result;
    } catch (error) {
      console.error('Error triggering migration:', error);
      throw error;
    } finally {
      setMigrationLoading(false);
    }
  };

  // Get migration status
  const getMigrationStatus = async () => {
    if (!user) {
      throw new Error('User must be authenticated to get migration status');
    }

    try {
      const status = await DataMigrationService.getMigrationStatus(user.uid);
      setMigrationStatus(status);
      return status;
    } catch (error) {
      console.error('Error getting migration status:', error);
      throw error;
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    profileLoading,
    migrationLoading,
    migrationStatus,
    error,
    createOrUpdateProfile,
    updateProfile,
    signOutUser,
    refreshProfile,
    searchUsers,
    getFriendsList,
    addFriend,
    removeFriend,
    triggerMigration,
    getMigrationStatus,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}; 