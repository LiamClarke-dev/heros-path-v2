// screens/SettingsScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  TextInput,
  Image,
  Switch
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Typography } from '../styles/theme';
import { useUser } from '../contexts/UserContext';

const LANG_KEY = '@user_language';
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'zh-CN', label: '中文（简体）' },
];

export default function SettingsScreen() {
  const { user, userProfile, profileLoading, updateProfile, signOutUser } = useUser();
  const [language, setLanguage] = useState('en');
  const [editingProfile, setEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    location: '',
  });

  // Load saved language on mount
  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY)
      .then(val => {
        if (val) setLanguage(val);
      })
      .catch(() => {/* ignore */});
  }, []);

  // Update edit form when profile changes
  useEffect(() => {
    if (userProfile) {
      setEditForm({
        displayName: userProfile.displayName || '',
        bio: userProfile.bio || '',
        location: userProfile.location || '',
      });
    }
  }, [userProfile]);

  // When user taps a language option
  const selectLanguage = async (code) => {
    setLanguage(code);
    await AsyncStorage.setItem(LANG_KEY, code);
  };

  // Handle profile editing
  const startEditing = () => {
    setEditingProfile(true);
  };

  const cancelEditing = () => {
    setEditForm({
      displayName: userProfile?.displayName || '',
      bio: userProfile?.bio || '',
      location: userProfile?.location || '',
    });
    setEditingProfile(false);
  };

  const saveProfile = async () => {
    try {
      await updateProfile(editForm);
      setEditingProfile(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  // Handle sign out
  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOutUser();
              // User will be automatically redirected to SignInScreen by App.js
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        }
      ]
    );
  };

  if (profileLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* User Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Profile</Text>
        
        <View style={styles.profileHeader}>
          <Image 
            source={{ uri: userProfile?.photoURL || 'https://via.placeholder.com/80' }}
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userProfile?.displayName || 'Hero Explorer'}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            {userProfile?.location && (
              <Text style={styles.profileLocation}>📍 {userProfile.location}</Text>
            )}
          </View>
        </View>

        {editingProfile ? (
          <View style={styles.editForm}>
            <TextInput
              style={styles.input}
              placeholder="Display Name"
              value={editForm.displayName}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, displayName: text }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Bio"
              value={editForm.bio}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, bio: text }))}
              multiline
              numberOfLines={3}
            />
            <TextInput
              style={styles.input}
              placeholder="Location"
              value={editForm.location}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, location: text }))}
            />
            <View style={styles.editButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={cancelEditing}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.editButton} onPress={startEditing}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        )}

        {userProfile?.bio && (
          <View style={styles.bioContainer}>
            <Text style={styles.bioText}>{userProfile.bio}</Text>
          </View>
        )}
      </View>

      {/* Stats Section */}
      {userProfile?.stats && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userProfile.stats.totalWalks || 0}</Text>
              <Text style={styles.statLabel}>Walks</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userProfile.stats.totalDistance || 0}km</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userProfile.stats.discoveries || 0}</Text>
              <Text style={styles.statLabel}>Discoveries</Text>
            </View>
          </View>
        </View>
      )}

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Preferences</Text>
        
        <View style={styles.preferenceItem}>
          <Text style={styles.preferenceLabel}>Language</Text>
          <View style={styles.languageOptions}>
      {LANGUAGES.map(({code, label}) => (
        <TouchableOpacity
          key={code}
          style={[
                  styles.languageOption,
                  language === code && styles.languageOptionActive
          ]}
          onPress={() => selectLanguage(code)}
        >
          <Text
            style={[
                    styles.languageOptionText,
                    language === code && styles.languageOptionTextActive
            ]}
          >
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
        </View>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Account</Text>
        
        <TouchableOpacity style={styles.dangerButton} onPress={handleSignOut}>
          <Text style={styles.dangerButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    ...Typography.body,
    color: Colors.text,
  },
  section: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.tabInactive + '30',
  },
  sectionHeader: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: Spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    ...Typography.body,
    color: Colors.text + '80',
    marginBottom: 4,
  },
  profileLocation: {
    ...Typography.body,
    color: Colors.text + '80',
  },
  editButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    ...Typography.body,
    color: Colors.background,
    fontWeight: '600',
  },
  editForm: {
    marginTop: Spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.tabInactive + '50',
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Typography.body,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.tabInactive + '30',
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  cancelButtonText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  saveButtonText: {
    ...Typography.body,
    color: Colors.background,
    fontWeight: '600',
  },
  bioContainer: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.tabInactive + '20',
    borderRadius: 8,
  },
  bioText: {
    ...Typography.body,
    color: Colors.text,
    fontStyle: 'italic',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    ...Typography.h2,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  statLabel: {
    ...Typography.body,
    color: Colors.text + '80',
    marginTop: 4,
  },
  preferenceItem: {
    marginBottom: Spacing.md,
  },
  preferenceLabel: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  languageOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  languageOption: {
    padding: Spacing.sm,
    borderRadius: 4,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.tabInactive + '20',
  },
  languageOptionActive: {
    backgroundColor: Colors.primary,
  },
  languageOptionText: {
    ...Typography.body,
    color: Colors.text,
  },
  languageOptionTextActive: {
    color: Colors.background,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  dangerButtonText: {
    ...Typography.body,
    color: Colors.background,
    fontWeight: '600',
  },
});
