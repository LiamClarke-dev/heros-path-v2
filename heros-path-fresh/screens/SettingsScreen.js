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
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../styles/theme';
import { useUser } from '../contexts/UserContext';
import { PLACE_TYPES } from '../constants/PlaceTypes';
import { testPlacesAPIMigration } from '../services/DiscoveriesService';

const LANG_KEY = '@user_language';
const DISCOVERY_PREFERENCES_KEY = '@discovery_preferences';
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'zh-CN', label: '中文（简体）' },
];

export default function SettingsScreen() {
  const { user, userProfile, profileLoading, updateProfile, signOutUser } = useUser();
  const [language, setLanguage] = useState('en');
  const [editingProfile, setEditingProfile] = useState(false);
  const [discoveryPreferences, setDiscoveryPreferences] = useState({});
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [testingMigration, setTestingMigration] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    location: '',
  });

  // Load saved language and discovery preferences on mount
  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY)
      .then(val => {
        if (val) setLanguage(val);
      })
      .catch(() => {/* ignore */});
    
    // Use the service function to get preferences (which handles syncing)
    import('../services/DiscoveriesService').then(({ getUserDiscoveryPreferences }) => {
      getUserDiscoveryPreferences()
        .then(prefs => {
          setDiscoveryPreferences(prefs);
        })
        .catch(() => {/* ignore */});
    });
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

  // Handle discovery preference toggle
  const toggleDiscoveryPreference = async (placeType) => {
    const newPrefs = {
      ...discoveryPreferences,
      [placeType]: !discoveryPreferences[placeType]
    };
    setDiscoveryPreferences(newPrefs);
    await AsyncStorage.setItem(DISCOVERY_PREFERENCES_KEY, JSON.stringify(newPrefs));
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

  // Test Places API migration
  const handleTestMigration = async () => {
    setTestingMigration(true);
    try {
      const status = await testPlacesAPIMigration();
      setMigrationStatus(status);
    } catch (error) {
      Alert.alert('Error', 'Failed to test API migration. Please try again.');
    } finally {
      setTestingMigration(false);
    }
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

      {/* Discovery Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Discovery Preferences</Text>
        <Text style={styles.sectionDescription}>
          Choose which types of places you'd like to discover during your walks:
        </Text>
        
        <TouchableOpacity 
          style={styles.preferenceLink}
          onPress={() => navigation.navigate('DiscoveryPreferences')}
        >
          <View style={styles.preferenceLinkContent}>
            <View style={styles.preferenceLinkLeft}>
              <MaterialIcons name="tune" size={24} color={Colors.primary} />
              <Text style={styles.preferenceLinkText}>Configure Discovery Settings</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={Colors.text + '60'} />
          </View>
        </TouchableOpacity>
      </View>

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

      {/* API Migration Testing Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>API Migration Status</Text>
        <Text style={styles.sectionDescription}>
          Test the Google Places API migration from Legacy to New API:
        </Text>
        
        <TouchableOpacity 
          style={[styles.editButton, testingMigration && styles.disabledButton]} 
          onPress={handleTestMigration}
          disabled={testingMigration}
        >
          {testingMigration ? (
            <ActivityIndicator size="small" color={Colors.background} />
          ) : (
            <Text style={styles.editButtonText}>Test API Migration</Text>
          )}
        </TouchableOpacity>

        {migrationStatus && (
          <View style={styles.migrationStatus}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>New API:</Text>
              <View style={[
                styles.statusIndicator, 
                migrationStatus.newAPI ? styles.statusSuccess : styles.statusError
              ]}>
                <Text style={styles.statusText}>
                  {migrationStatus.newAPI ? '✅ Working' : '❌ Failed'}
                </Text>
              </View>
            </View>
            
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Legacy API:</Text>
              <View style={[
                styles.statusIndicator, 
                migrationStatus.legacyAPI ? styles.statusSuccess : styles.statusError
              ]}>
                <Text style={styles.statusText}>
                  {migrationStatus.legacyAPI ? '✅ Working' : '❌ Failed'}
                </Text>
              </View>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Status:</Text>
              <Text style={[
                styles.statusText,
                migrationStatus.migrationStatus === 'READY' ? styles.statusSuccess : 
                migrationStatus.migrationStatus === 'FALLBACK' ? styles.statusWarning :
                styles.statusError
              ]}>
                {migrationStatus.migrationStatus}
              </Text>
            </View>

            {migrationStatus.recommendation && (
              <View style={styles.recommendationContainer}>
                <Text style={styles.recommendationText}>{migrationStatus.recommendation}</Text>
              </View>
            )}

            {migrationStatus.newAPIError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorLabel}>New API Error:</Text>
                <Text style={styles.errorText}>{migrationStatus.newAPIError}</Text>
              </View>
            )}

            {migrationStatus.legacyAPIError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorLabel}>Legacy API Error:</Text>
                <Text style={styles.errorText}>{migrationStatus.legacyAPIError}</Text>
              </View>
            )}
          </View>
        )}
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
  sectionDescription: {
    ...Typography.body,
    color: Colors.text + '80',
    marginBottom: Spacing.md,
    fontStyle: 'italic',
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
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  preferenceLabel: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
    fontWeight: '600',
  },
  preferenceLink: {
    backgroundColor: Colors.tabInactive + '20',
    borderRadius: 8,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  preferenceLinkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preferenceLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  preferenceLinkText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginLeft: Spacing.sm,
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
  disabledButton: {
    opacity: 0.6,
  },
  migrationStatus: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.tabInactive + '20',
    borderRadius: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statusLabel: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  statusIndicator: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusSuccess: {
    backgroundColor: '#4CAF50' + '30',
  },
  statusWarning: {
    backgroundColor: '#FF9800' + '30',
  },
  statusError: {
    backgroundColor: '#F44336' + '30',
  },
  statusText: {
    ...Typography.body,
    fontWeight: '600',
  },
  recommendationContainer: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.primary + '20',
    borderRadius: 4,
  },
  recommendationText: {
    ...Typography.body,
    color: Colors.text,
    fontStyle: 'italic',
  },
  errorContainer: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: '#F44336' + '20',
    borderRadius: 4,
  },
  errorLabel: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  errorText: {
    ...Typography.body,
    color: Colors.text + '80',
    fontSize: 12,
  },
});
