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
import { useNavigation } from '@react-navigation/native';
import DataMigrationService from '../services/DataMigrationService';
import * as Location from 'expo-location';
import JourneyService from '../services/JourneyService';
import FirestoreDataViewer from '../utils/FirestoreDataViewer';
import DiscoveryService from '../services/DiscoveryService';

const LANG_KEY = '@user_language';
const DISCOVERY_PREFERENCES_KEY = '@discovery_preferences';
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'zh-CN', label: '中文（简体）' },
];

export default function SettingsScreen() {
  const { user, userProfile, profileLoading, updateProfile, signOutUser, migrationStatus: userMigrationStatus, triggerMigration } = useUser();
  const navigation = useNavigation();
  const [language, setLanguage] = useState('en');
  const [editingProfile, setEditingProfile] = useState(false);
  const [developerSectionExpanded, setDeveloperSectionExpanded] = useState(false);
  const [developerLoading, setDeveloperLoading] = useState(false);
  const [discoveryPreferences, setDiscoveryPreferences] = useState({});
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [testingMigration, setTestingMigration] = useState(false);
  const [dataMigrationStatus, setDataMigrationStatus] = useState(null);
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

  // Check data migration status
  const checkDataMigrationStatus = async () => {
    if (user) {
      const status = await DataMigrationService.checkMigrationStatus(user.uid);
      setMigrationStatus(status);
    }
  };

  // Developer Functions
  const fixJourneyStatuses = async () => {
    Alert.alert(
      'Fix Journey Statuses?',
      'This will update all journey completion statuses to be accurate. This is useful if some journeys show incorrect review status.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Fix Statuses',
          onPress: async () => {
            try {
              setDeveloperLoading(true);
              const result = await JourneyService.getUserJourneys(user.uid);
              if (!result.success) {
                Alert.alert('Error', 'Failed to load journeys');
                return;
              }
              
              let fixedCount = 0;
              for (const journey of result.journeys) {
                try {
                  await DiscoveryService.updateJourneyCompletionStatus(user.uid, journey.id);
                  fixedCount++;
                } catch (error) {
                  console.error(`Error fixing journey ${journey.id}:`, error);
                }
              }
              
              Alert.alert('Success', `Fixed completion status for ${fixedCount} journeys.`);
            } catch (error) {
              console.error('Error fixing journey statuses:', error);
              Alert.alert('Error', 'Failed to fix journey statuses');
            } finally {
              setDeveloperLoading(false);
            }
          },
        },
      ]
    );
  };

  const deleteAllJourneys = async () => {
    Alert.alert(
      'Delete ALL Journeys?',
      'This will permanently delete ALL your journeys and all associated data (discoveries, dismissed places, etc.). This action cannot be undone.\n\nAre you sure you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'DELETE ALL',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeveloperLoading(true);
              const result = await JourneyService.deleteAllJourneys(user.uid);
              Alert.alert('Success', `Deleted ${result.deletedCount} journeys and all associated data.`);
            } catch (error) {
              console.error('Error deleting all journeys:', error);
              Alert.alert('Error', 'Failed to delete all journeys');
            } finally {
              setDeveloperLoading(false);
            }
          },
        },
      ]
    );
  };

  const purgeAllAccountData = async () => {
    Alert.alert(
      '🚨 PURGE ALL ACCOUNT DATA?',
      'This will PERMANENTLY DELETE ALL your data:\n\n• All journeys and routes\n• All saved places\n• All dismissed places\n• All discovery preferences\n• All app settings\n• All local storage data\n\nThis action CANNOT be undone and will give you a completely fresh start.\n\nAre you absolutely sure you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '🚨 PURGE EVERYTHING',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeveloperLoading(true);
              const result = await JourneyService.purgeAllUserData(user.uid);
              
              Alert.alert(
                '✅ Account Purged Successfully',
                `All your data has been completely removed:\n\n• ${result.deletedJourneys} journeys deleted\n• ${result.deletedDiscoveries} discoveries deleted\n• ${result.deletedDismissed} dismissed places deleted\n• ${result.clearedStorageKeys} app settings cleared\n\nYou now have a completely fresh account!`
              );
            } catch (error) {
              console.error('Error purging account data:', error);
              Alert.alert('Error', 'Failed to purge account data. Please try again.');
            } finally {
              setDeveloperLoading(false);
            }
          },
        },
      ]
    );
  };

  // Manual data migration trigger
  const handleManualMigration = async () => {
    if (!user) return;

    try {
      const result = await triggerMigration();
      setDataMigrationStatus(prev => ({ ...prev, migrationResult: result }));
      Alert.alert('Migration Complete', result.message);
    } catch (error) {
      Alert.alert('Migration Error', error.message);
    }
  };

  // Check migration status on mount
  useEffect(() => {
    checkDataMigrationStatus();
  }, [user]);

  

  const renderDeveloperSection = () => {
    if (!user) return null;
    
    return (
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => setDeveloperSectionExpanded(!developerSectionExpanded)}
        >
          <View style={styles.sectionHeaderContent}>
            <MaterialIcons name="developer-mode" size={24} color={Colors.warning} />
            <Text style={styles.sectionTitle}>🛠️ Developer Tools</Text>
          </View>
          <MaterialIcons 
            name={developerSectionExpanded ? "expand-less" : "expand-more"} 
            size={24} 
            color={Colors.textSecondary} 
          />
        </TouchableOpacity>
        
        {developerSectionExpanded && (
          <View style={styles.developerContent}>
            {developerLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingText}>Processing...</Text>
              </View>
            )}
            
            {/* Migration Status */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>📊 Migration Status</Text>
              
              <TouchableOpacity 
                style={styles.settingItem} 
                onPress={async () => {
                  try {
                    const status = await DataMigrationService.checkMigrationStatus(user.uid);
                    Alert.alert(
                      'Migration Status',
                      `Status: ${status.hasMigrated ? '✅ Migrated' : '⏳ Not Migrated'}\n\n` +
                      `Last Check: ${status.lastChecked ? new Date(status.lastChecked).toLocaleString() : 'Never'}\n` +
                      `User ID: ${user.uid}`
                    );
                  } catch (error) {
                    Alert.alert('Error', `Failed to check migration status: ${error.message}`);
                  }
                }}
              >
                <View style={styles.settingContent}>
                  <MaterialIcons name="cloud-sync" size={24} color={Colors.primary} />
                  <Text style={styles.settingText}>Check Migration Status</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.settingItem} 
                onPress={async () => {
                  try {
                    setDeveloperLoading(true);
                    await triggerMigration();
                    Alert.alert('Success', 'Migration triggered successfully');
                  } catch (error) {
                    Alert.alert('Error', `Failed to trigger migration: ${error.message}`);
                  } finally {
                    setDeveloperLoading(false);
                  }
                }}
              >
                <View style={styles.settingContent}>
                  <MaterialIcons name="sync" size={24} color={Colors.primary} />
                  <Text style={styles.settingText}>Trigger Data Migration</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Data Management */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>🗂️ Data Management</Text>
              
              <TouchableOpacity 
                style={styles.settingItem} 
                onPress={fixJourneyStatuses}
              >
                <View style={styles.settingContent}>
                  <MaterialIcons name="build" size={24} color={Colors.primary} />
                  <Text style={styles.settingText}>🔧 Fix Journey Statuses</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.settingItem, styles.dangerItem]} 
                onPress={deleteAllJourneys}
              >
                <View style={styles.settingContent}>
                  <MaterialIcons name="delete-forever" size={24} color={Colors.error} />
                  <Text style={[styles.settingText, styles.dangerText]}>🗑️ DELETE ALL JOURNEYS</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={Colors.error} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.settingItem, styles.criticalItem]} 
                onPress={purgeAllAccountData}
              >
                <View style={styles.settingContent}>
                  <MaterialIcons name="warning" size={24} color={Colors.critical} />
                  <Text style={[styles.settingText, styles.criticalText]}>🚨 PURGE EVERYTHING</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={Colors.critical} />
              </TouchableOpacity>
            </View>

            {/* Debug Tools */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>🔍 Debug Tools</Text>
              
              <TouchableOpacity 
                style={styles.settingItem} 
                onPress={async () => {
                  try {
                    const result = await JourneyService.getUserJourneys(user.uid);
                    if (result.success) {
                      Alert.alert(
                        'Your Journey Data', 
                        `Found ${result.journeys.length} journeys\n\nLatest journey: ${result.journeys[0]?.name || 'None'}\nTotal route points: ${result.journeys.reduce((total, journey) => total + (journey.route?.length || 0), 0)}`
                      );
                    } else {
                      Alert.alert('Error', 'Failed to load your journey data');
                    }
                  } catch (error) {
                    Alert.alert('Error', `Failed to check your journey data: ${error.message}`);
                  }
                }}
              >
                <View style={styles.settingContent}>
                  <MaterialIcons name="storage" size={24} color={Colors.primary} />
                  <Text style={styles.settingText}>Check Your Journey Data</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.settingItem} 
                onPress={async () => {
                  try {
                    const foregroundStatus = await Location.getForegroundPermissionsAsync();
                    const backgroundStatus = await Location.getBackgroundPermissionsAsync();
                    
                    Alert.alert(
                      'Location Permissions Status',
                      `Foreground: ${foregroundStatus.status}\nBackground: ${backgroundStatus.status}\n\nLocation Services: ${foregroundStatus.canAskAgain ? 'Can ask again' : 'Cannot ask again'}`
                    );
                  } catch (error) {
                    Alert.alert('Error', `Failed to check permissions: ${error.message}`);
                  }
                }}
              >
                <View style={styles.settingContent}>
                  <MaterialIcons name="location-on" size={24} color={Colors.primary} />
                  <Text style={styles.settingText}>Check Location Permissions</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.settingItem} 
                onPress={async () => {
                  try {
                    Alert.alert('Loading...', 'Calculating your journey statistics...');
                    const result = await FirestoreDataViewer.getUserJourneyStats(user.uid);
                    if (result.success) {
                      const { stats } = result;
                      Alert.alert(
                        'Your Journey Statistics',
                        `📊 Your Personal Statistics:\n\n` +
                        `🗺️ Total Journeys: ${stats.totalJourneys}\n` +
                        `📍 Total Route Points: ${stats.totalRoutePoints}\n` +
                        `📈 Avg Points per Journey: ${stats.averageRoutePointsPerJourney.toFixed(1)}\n` +
                        `✅ Journeys with Routes: ${stats.journeysWithRoutes}\n` +
                        `❌ Journeys without Routes: ${stats.journeysWithoutRoutes}\n\n` +
                        `📅 Your Activity:\n` +
                        `• Oldest Journey: ${stats.oldestJourney?.toLocaleDateString() || 'None'}\n` +
                        `• Newest Journey: ${stats.newestJourney?.toLocaleDateString() || 'None'}\n` +
                        `• Total Distance: ${stats.totalDistance.toFixed(1)}m\n` +
                        `• Total Duration: ${Math.round(stats.totalDuration / 60)}min`
                      );
                    } else {
                      Alert.alert('Error', `Failed to get your statistics: ${result.error}`);
                    }
                  } catch (error) {
                    Alert.alert('Error', `Failed to get your statistics: ${error.message}`);
                  }
                }}
              >
                <View style={styles.settingContent}>
                  <MaterialIcons name="analytics" size={24} color={Colors.primary} />
                  <Text style={styles.settingText}>Your Journey Statistics</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.settingItem} 
                onPress={async () => {
                  try {
                    Alert.alert('Loading...', 'Exporting your journey data...');
                    const result = await FirestoreDataViewer.exportUserJourneyData(user.uid);
                    if (result.success) {
                      const data = result.objectData;
                      Alert.alert(
                        'Your Data Export Ready',
                        `✅ Your personal journey data has been prepared for export\n\n` +
                        `📊 Summary:\n` +
                        `• Your Journeys: ${data.journeys.length}\n` +
                        `• Your Route Points: ${data.journeys.reduce((total, j) => total + (j.route?.length || 0), 0)}\n` +
                        `• Export Date: ${new Date(data.exportDate).toLocaleString()}\n\n` +
                        `🔒 Privacy: This export contains only your personal data\n\n` +
                        `💡 Check the console for the full JSON data.`,
                        [
                          { text: 'OK' },
                          { 
                            text: 'Copy to Console', 
                            onPress: () => {
                              console.log('📋 YOUR EXPORTED JOURNEY DATA:', data);
                              Alert.alert('Copied!', 'Your data logged to console. Check your development console.');
                            }
                          }
                        ]
                      );
                    } else {
                      Alert.alert('Error', `Failed to export your data: ${result.error}`);
                    }
                  } catch (error) {
                    Alert.alert('Error', `Failed to export your data: ${error.message}`);
                  }
                }}
              >
                <View style={styles.settingContent}>
                  <MaterialIcons name="file-download" size={24} color={Colors.primary} />
                  <Text style={styles.settingText}>Export Your Journey Data</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
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

      {/* Data Migration Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Data Migration</Text>
        <Text style={styles.sectionDescription}>
          Migrate your local data to the cloud for cross-device sync and backup.
        </Text>

        <TouchableOpacity
          style={styles.testButton}
          onPress={handleManualMigration}
          disabled={!user}
        >
          <Text style={styles.testButtonText}>
            {user ? 'Migrate Data to Cloud' : 'Sign in to migrate'}
          </Text>
        </TouchableOpacity>

        {dataMigrationStatus && (
          <View style={styles.migrationStatusContainer}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Migration Status:</Text>
              <View style={[
                styles.statusIndicator,
                dataMigrationStatus.hasMigrated ? styles.statusSuccess : styles.statusWarning
              ]}>
                <Text style={styles.statusText}>
                  {dataMigrationStatus.hasMigrated ? '✅ Complete' : '⏳ Pending'}
                </Text>
              </View>
            </View>

            {!dataMigrationStatus.hasMigrated && dataMigrationStatus.stats && (
              <View style={styles.migrationStats}>
                <Text style={styles.migrationStatsTitle}>Data to migrate:</Text>
                <Text style={styles.migrationStatsText}>
                  • Journeys: {dataMigrationStatus.stats.journeysCount}
                </Text>
                <Text style={styles.migrationStatsText}>
                  • Saved Places: {dataMigrationStatus.stats.savedPlacesCount}
                </Text>
                <Text style={styles.migrationStatsText}>
                  • Dismissed Places: {dataMigrationStatus.stats.dismissedPlacesCount}
                </Text>
              </View>
            )}

            {dataMigrationStatus.migrationResult && (
              <View style={styles.migrationResult}>
                <Text style={styles.migrationResultTitle}>Last Migration:</Text>
                <Text style={styles.migrationResultText}>
                  {dataMigrationStatus.migrationResult.message}
                </Text>
                {dataMigrationStatus.migrationResult.results && (
                  <View style={styles.migrationDetails}>
                    <Text style={styles.migrationDetailsText}>
                      Journeys: {dataMigrationStatus.migrationResult.results.journeys.migrated}/{dataMigrationStatus.migrationResult.results.journeys.total}
                    </Text>
                    <Text style={styles.migrationDetailsText}>
                      Saved Places: {dataMigrationStatus.migrationResult.results.savedPlaces.migrated}/{dataMigrationStatus.migrationResult.results.savedPlaces.total}
                    </Text>
                    <Text style={styles.migrationDetailsText}>
                      Dismissed Places: {dataMigrationStatus.migrationResult.results.dismissedPlaces.migrated}/{dataMigrationStatus.migrationResult.results.dismissedPlaces.total}
                    </Text>
                  </View>
                )}
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

              {renderDeveloperSection()}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.tabInactive + '30',
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginLeft: Spacing.sm,
  },
  expandIcon: {
    marginLeft: Spacing.sm,
  },
  developerContent: {
    paddingTop: Spacing.sm,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background + '80',
    zIndex: 1,
  },
  subsection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.tabInactive + '30',
  },
  subsectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.sm,
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
  migrationStatusContainer: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.tabInactive + '20',
    borderRadius: 8,
  },
  migrationStats: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: 4,
  },
  migrationStatsTitle: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  migrationStatsText: {
    ...Typography.body,
    color: Colors.text + '80',
    fontSize: 14,
    marginBottom: 2,
  },
  migrationResult: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.primary + '20',
    borderRadius: 4,
  },
  migrationResultTitle: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  migrationResultText: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  migrationDetails: {
    marginTop: Spacing.sm,
  },
  migrationDetailsText: {
    ...Typography.body,
    color: Colors.text + '80',
    fontSize: 12,
    marginBottom: 2,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.tabInactive + '30',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    ...Typography.body,
    color: Colors.text,
    marginLeft: Spacing.sm,
  },
  dangerItem: {
    backgroundColor: '#FF3B30' + '10',
    borderColor: '#FF3B30' + '30',
  },
  dangerText: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  criticalItem: {
    backgroundColor: '#F44336' + '10',
    borderColor: '#F44336' + '30',
  },
  criticalText: {
    color: '#F44336',
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    ...Typography.body,
    color: Colors.background,
    fontWeight: '600',
  },
});
