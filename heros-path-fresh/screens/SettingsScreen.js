/*
 * SETTINGS SCREEN (COMPREHENSIVE APP CONFIGURATION)
 * ==================================================
 * 
 * PURPOSE:
 * This is the comprehensive control center for Hero's Path, providing users with extensive
 * customization options for themes, discovery preferences, account management, and app
 * behavior. It also includes developer tools and utilities for testing and debugging.
 * Think of it as the "mission control" where users can customize every aspect of their
 * Hero's Path experience and where developers can access powerful testing tools.
 * 
 * FUNCTIONALITY:
 * - Theme Management: Switch between Light, Dark, and Adventure UI themes
 * - Map Style Control: Choose from 5 different map styles (Standard, Satellite, etc.)
 * - User Profile Management: Edit profile information and account settings
 * - Discovery Preferences: Access detailed place type preferences
 * - Language Selection: Choose interface language (internationalization support)
 * - Account Operations: Sign out, delete account, data management
 * - Data Migration: Handle app version updates and data structure changes
 * - Testing Utilities: API connectivity testing, migration testing, data viewing
 * - Developer Tools: Journey deletion, data purging, debug utilities (dev builds only)
 * - Performance Monitoring: API testing and connectivity validation
 * 
 * WHY IT EXISTS:
 * Modern mobile apps require extensive customization options to meet diverse user needs.
 * This screen centralizes all app configuration in one place while also serving as a
 * development and testing interface. It ensures users can personalize their experience
 * while providing developers with tools to maintain and debug the complex Hero's Path
 * systems.
 * 
 * KEY FEATURES:
 * - Complete Theme System: Full control over app appearance and map styling
 * - User Management: Profile editing, account settings, and authentication controls
 * - Preference Management: Detailed discovery and interface preferences
 * - Developer Tools: Comprehensive testing and debugging utilities
 * - Data Management: Migration, backup, and cleanup utilities
 * - Performance Testing: API connectivity and migration testing tools
 * - Modern UI: Card-based layout with consistent styling and theming
 * - Safety Features: Confirmation dialogs for destructive operations
 * 
 * MAJOR SECTIONS:
 * 1. **Profile Management**: Edit user profile, display name, bio
 * 2. **Theme Customization**: UI themes and map style selection
 * 3. **Discovery Settings**: Place type preferences and discovery behavior
 * 4. **Language Settings**: Interface language selection
 * 5. **Developer Section**: Testing tools, data management, debug utilities
 * 6. **Account Actions**: Sign out, reset preferences, account management
 * 7. **Data Migration**: Handle app updates and data structure changes
 * 8. **Performance Tools**: API testing and connectivity validation
 * 
 * RELATIONSHIPS:
 * - Uses ThemeContext extensively for theme management and styling
 * - Integrates with UserContext for profile management and authentication
 * - Connects to DiscoveriesService for preference management and API testing
 * - Uses DataMigrationService for handling app version updates
 * - Works with JourneyService for data management and cleanup
 * - Navigates to DiscoveryPreferencesScreen for detailed preference management
 * - Uses multiple utility services for testing and validation
 * - Integrates with Firebase for data operations and user management
 * 
 * REFERENCED BY:
 * - AppNavigator.js (as part of the Settings stack navigation)
 * - Users access this for all app customization and configuration
 * - Developers use this for testing, debugging, and data management
 * - Support workflows for troubleshooting user issues
 * 
 * REFERENCES:
 * - ThemeContext.js (for theme management and styling)
 * - UserContext.js (for profile and authentication)
 * - DiscoveriesService.js (for preferences and API testing)
 * - DataMigrationService.js (for data migration workflows)
 * - JourneyService.js (for data management and cleanup)
 * - FirestoreDataViewer.js (for debugging database content)
 * - Multiple UI components for consistent interface design
 * 
 * IMPORTANCE TO APP:
 * CRITICAL - This screen is essential for user satisfaction and app maintenance.
 * It provides the customization options that make Hero's Path feel personal and
 * functional for each user. It also contains critical developer tools that enable
 * app maintenance, testing, and troubleshooting. Without good settings management,
 * the app would feel rigid and difficult to maintain.
 * 
 * IMPROVEMENT SUGGESTIONS:
 * 1. Add settings search - search through settings options
 * 2. Add settings backup - backup and restore all user settings
 * 3. Add settings sharing - share configurations between devices
 * 4. Add settings recommendations - suggest optimal settings for user patterns
 * 5. Add settings analytics - track which settings are most commonly changed
 * 6. Add settings validation - ensure settings combinations work well together
 * 7. Add settings tutorials - guided tours for complex settings
 * 8. Add settings shortcuts - quick access to frequently changed settings
 * 9. Add settings automation - automatic settings based on context or time
 * 10. Add settings presets - pre-configured setting bundles for different use cases
 * 11. Add settings automation - automatic settings based on context or time
 * 12. Add accessibility settings - enhanced accessibility and usability options
 * 13. Add privacy controls - granular privacy settings and data control
 * 14. Add notification settings - detailed notification preferences
 * 15. Add performance settings - battery optimization and performance tuning
 * 16. Add sync settings - control what data syncs between devices
 * 17. Add export settings - export settings for support or analysis
 * 18. Add settings versioning - track and revert settings changes
 * 19. Add smart defaults - AI-powered default settings based on usage patterns
 * 20. Add settings compliance - ensure settings meet legal and privacy requirements
 * 21. Add settings integration - integrate with device settings and other apps
 */
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
import { useTheme } from '../contexts/ThemeContext';
import { getFallbackTheme } from '../styles/theme';
import Logger from '../utils/Logger';
import { useUser } from '../contexts/UserContext';
import { PLACE_TYPES } from '../constants/PlaceTypes';
import { testPlacesAPIMigration } from '../services/DiscoveriesService';
import { useNavigation } from '@react-navigation/native';
import DataMigrationService from '../services/DataMigrationService';
import * as Location from 'expo-location';
import JourneyService from '../services/JourneyService';
import FirestoreDataViewer from '../utils/FirestoreDataViewer';
import DiscoveryService from '../services/DiscoveryService';
import AnimationDemo from '../components/AnimationDemo';
import { Spacing, Typography, Layout, Shadows } from '../styles/theme';

// --- New UI Components ---
const SectionCard = ({ children, style }) => {
  const { getCurrentThemeColors } = useTheme();
  const colors = getCurrentThemeColors() || getFallbackTheme();
  return (
    <View style={[{
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginVertical: 10,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    }, style]}>
      {children}
    </View>
  );
};

// --- REFACTOR: Enhanced SettingsButton for overflow, accessibility, and polish ---
const SettingsButton = ({ onPress, icon, label, style, color, textColor, disabled, accessibilityLabel }) => {
  const { getCurrentThemeColors } = useTheme();
  const colors = getCurrentThemeColors() || getFallbackTheme();
  return (
    <TouchableOpacity
      style={[{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: color || colors.buttonSecondary,
        marginVertical: 4,
        opacity: disabled ? 0.5 : 1,
        minWidth: 100,
        maxWidth: 160,
        minHeight: 44,
        elevation: 1,
      }, style]}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel || label}
      activeOpacity={0.8}
    >
      {icon && <MaterialIcons name={icon} size={20} color={textColor || colors.primary} style={{ marginRight: 8 }} />}
      <Text
        style={{ color: textColor || colors.text, fontSize: 15, fontWeight: '500', flexShrink: 1 }}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// --- REFACTOR: SectionHeader for bolder headers ---
const SectionHeader = ({ icon, title }) => {
  const { getCurrentThemeColors } = useTheme();
  const colors = getCurrentThemeColors() || getFallbackTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
      {icon && <MaterialIcons name={icon} size={24} color={colors.primary} style={{ marginRight: 10 }} />}
      <Text style={{ fontWeight: 'bold', fontSize: 20, color: colors.text }}>{title}</Text>
    </View>
  );
};

const LANG_KEY = '@user_language';
const DISCOVERY_PREFERENCES_KEY = '@discovery_preferences';
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'zh-CN', label: '中文（简体）' },
];

export default function SettingsScreen() {
  const { user, userProfile, profileLoading, updateProfile, signOutUser, migrationStatus: userMigrationStatus, triggerMigration } = useUser();
  const { 
    currentTheme, 
    currentMapStyle, 
    changeTheme, 
    changeMapStyle, 
    getCurrentThemeColors, 
    mapStyleConfigs,
    themeTypes,
    mapStyles,
    resetToDefaults
  } = useTheme();
  const navigation = useNavigation();
  
  const colors = getCurrentThemeColors() || getFallbackTheme();
  
  const [language, setLanguage] = useState('en');
  const [editingProfile, setEditingProfile] = useState(false);
  const [developerSectionExpanded, setDeveloperSectionExpanded] = useState(false);
  const [developerLoading, setDeveloperLoading] = useState(false);
  const [discoveryPreferences, setDiscoveryPreferences] = useState({});
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [testingMigration, setTestingMigration] = useState(false);
  const [dataMigrationStatus, setDataMigrationStatus] = useState(null);
  const [showAnimationDemo, setShowAnimationDemo] = useState(false);
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

  // Theme selection handlers
  const handleThemeChange = async (themeType) => {
    try {
      await changeTheme(themeType);
      Alert.alert('Theme Updated', `Switched to ${themeType} theme!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update theme. Please try again.');
    }
  };

  const handleMapStyleChange = async (mapStyle) => {
    try {
      await changeMapStyle(mapStyle);
      Alert.alert('Map Style Updated', `Switched to ${mapStyleConfigs[mapStyle].name} map style!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update map style. Please try again.');
    }
  };

  const handleResetPreferences = async () => {
    Alert.alert(
      'Reset to Defaults?',
      'This will reset your UI theme and map style to the default settings. Your other preferences will remain unchanged.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: async () => {
            try {
              await resetToDefaults();
              Alert.alert('Success', 'Theme and map style reset to defaults!');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset preferences. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Theme data for UI
  const themeOptions = [
    { type: themeTypes.LIGHT, name: 'Light', icon: 'light-mode' },
    { type: themeTypes.DARK, name: 'Dark', icon: 'dark-mode' },
    { type: themeTypes.ADVENTURE, name: 'Adventure', icon: 'explore' },
  ];

  // Map style data for UI
  const mapStyleOptions = Object.entries(mapStyleConfigs).map(([key, config]) => ({
    type: key,
    name: config.name,
    description: config.description,
    icon: config.icon,
  }));

  const renderDeveloperSection = () => {
    if (!user) return null;
    
    return (
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => setDeveloperSectionExpanded(!developerSectionExpanded)}
        >
          <View style={styles.sectionHeaderContent}>
            <MaterialIcons name="developer-mode" size={24} color={colors.warning} />
            <Text style={styles.sectionTitle}>🛠️ Developer Tools</Text>
          </View>
          <MaterialIcons 
            name={developerSectionExpanded ? "expand-less" : "expand-more"} 
            size={24} 
            color={colors.textSecondary} 
          />
        </TouchableOpacity>
        
        {developerSectionExpanded && (
          <View style={styles.developerContent}>
            {developerLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Processing...</Text>
              </View>
            )}
            
            {/* API Migration Testing */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>🌐 API Migration Testing</Text>
              
              <TouchableOpacity 
                style={[styles.settingItem, testingMigration && styles.disabledItem]} 
                onPress={handleTestMigration}
                disabled={testingMigration}
              >
                <View style={styles.settingContent}>
                  <MaterialIcons name="api" size={24} color={colors.primary} />
                  <Text style={styles.settingText}>
                    {testingMigration ? 'Testing API Migration...' : 'Test Places API Migration'}
                  </Text>
                </View>
                {testingMigration ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
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

            {/* Data Migration Status */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>📊 Data Migration Status</Text>
              
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
                  <MaterialIcons name="cloud-sync" size={24} color={colors.primary} />
                  <Text style={styles.settingText}>Check Migration Status</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
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
                  <MaterialIcons name="sync" size={24} color={colors.primary} />
                  <Text style={styles.settingText}>Trigger Data Migration</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
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

            {/* Data Management */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>🗂️ Data Management</Text>
              
              <TouchableOpacity 
                style={styles.settingItem} 
                onPress={fixJourneyStatuses}
              >
                <View style={styles.settingContent}>
                  <MaterialIcons name="build" size={24} color={colors.primary} />
                  <Text style={styles.settingText}>🔧 Fix Journey Statuses</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.settingItem, styles.dangerItem]} 
                onPress={deleteAllJourneys}
              >
                <View style={styles.settingContent}>
                  <MaterialIcons name="delete-forever" size={24} color={colors.error} />
                  <Text style={[styles.settingText, styles.dangerText]}>🗑️ DELETE ALL JOURNEYS</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.error} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.settingItem, styles.criticalItem]} 
                onPress={purgeAllAccountData}
              >
                <View style={styles.settingContent}>
                  <MaterialIcons name="warning" size={24} color={colors.critical} />
                  <Text style={[styles.settingText, styles.criticalText]}>🚨 PURGE EVERYTHING</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.critical} />
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
                  <MaterialIcons name="storage" size={24} color={colors.primary} />
                  <Text style={styles.settingText}>Check Your Journey Data</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
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
                  <MaterialIcons name="location-on" size={24} color={colors.primary} />
                  <Text style={styles.settingText}>Check Location Permissions</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
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
                  <MaterialIcons name="analytics" size={24} color={colors.primary} />
                  <Text style={styles.settingText}>Your Journey Statistics</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
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
                              Logger.debug('📋 YOUR EXPORTED JOURNEY DATA:', data);
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
                  <MaterialIcons name="file-download" size={24} color={colors.primary} />
                  <Text style={styles.settingText}>Export Your Journey Data</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.settingItem} 
                onPress={() => setShowAnimationDemo(true)}
              >
                <View style={styles.settingContent}>
                  <MaterialIcons name="animation" size={24} color={colors.primary} />
                  <Text style={styles.settingText}>🎨 Test Ping Animations</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (profileLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={{ backgroundColor: colors.background, padding: 16 }} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Profile Section */}
        <SectionCard>
          <SectionHeader icon="person" title="Profile" />
          <View style={styles.profileHeader}>
            <Image
              source={{ uri: userProfile?.photoURL || 'https://via.placeholder.com/80' }}
              style={styles.profileImage}
            />
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>{userProfile?.displayName || 'Hero Explorer'}</Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
              {userProfile?.location && (
                <Text style={[styles.profileLocation, { color: colors.textSecondary }]}>📍 {userProfile.location}</Text>
              )}
            </View>
          </View>
          {editingProfile ? (
            <View style={styles.editForm}>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.inputBackground, 
                  borderColor: colors.inputBorder, 
                  color: colors.inputText 
                }]}
                placeholder="Display Name"
                placeholderTextColor={colors.placeholder}
                value={editForm.displayName}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, displayName: text }))}
              />
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.inputBackground, 
                  borderColor: colors.inputBorder, 
                  color: colors.inputText 
                }]}
                placeholder="Bio"
                placeholderTextColor={colors.placeholder}
                value={editForm.bio}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, bio: text }))}
                multiline
                numberOfLines={3}
              />
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.inputBackground, 
                  borderColor: colors.inputBorder, 
                  color: colors.inputText 
                }]}
                placeholder="Location"
                placeholderTextColor={colors.placeholder}
                value={editForm.location}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, location: text }))}
              />
              <View style={styles.editButtons}>
                <SettingsButton label="Cancel" onPress={cancelEditing} icon="close" color={colors.buttonSecondary} textColor={colors.buttonTextSecondary} accessibilityLabel="Cancel Profile Edit" />
                <SettingsButton label="Save" onPress={saveProfile} icon="check" color={colors.buttonPrimary} textColor={colors.buttonText} accessibilityLabel="Save Profile" />
              </View>
            </View>
          ) : (
            <SettingsButton label="Edit Profile" onPress={startEditing} icon="edit" accessibilityLabel="Edit Profile" />
          )}
          {userProfile?.bio && (
            <View style={styles.bioContainer}>
              <Text style={styles.bioText}>{userProfile.bio}</Text>
            </View>
          )}
        </SectionCard>

        {/* Stats Section */}
        {userProfile?.stats && (
          <SectionCard>
            <SectionHeader icon="trending-up" title="Your Stats" />
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
          </SectionCard>
        )}

        {/* Preferences Section */}
        <SectionCard>
          <SectionHeader icon="tune" title="Preferences" />
          {/* Language, Discovery Preferences */}
          <View style={styles.preferenceItem}>
            <Text style={[styles.preferenceLabel, { color: colors.text }]}>Language</Text>
            <View style={styles.languageOptions}>
              {LANGUAGES.map(({code, label}) => (
                <SettingsButton
                  key={code}
                  label={label}
                  onPress={() => selectLanguage(code)}
                  color={language === code ? colors.buttonPrimary : colors.buttonSecondary}
                  textColor={language === code ? colors.buttonText : colors.text}
                  style={{ flex: 1, marginHorizontal: 2 }}
                  accessibilityLabel={`Language: ${label}`}
                />
              ))}
            </View>
          </View>
        </SectionCard>

        {/* Theme & Map Style Section */}
        <SectionCard>
          <SectionHeader icon="palette" title="Theme & Map Style" />
          <View style={[styles.preferenceItem, { flexDirection: 'column', gap: 12 }]}> 
            <Text style={[styles.preferenceLabel, { color: colors.text }]}>Theme</Text>
            <View style={[styles.themeOptions, { gap: 8 }]}> 
              {themeOptions.map((theme) => (
                <SettingsButton
                  key={theme.type}
                  label={theme.name}
                  onPress={() => handleThemeChange(theme.type)}
                  icon={theme.icon}
                  color={currentTheme === theme.type ? colors.buttonPrimary : colors.buttonSecondary}
                  textColor={currentTheme === theme.type ? colors.buttonText : colors.text}
                  style={{ marginHorizontal: 2, marginBottom: 8 }}
                  accessibilityLabel={`Theme: ${theme.name}`}
                />
              ))}
            </View>
          </View>
          <View style={[styles.preferenceItem, { flexDirection: 'column', gap: 12 }]}> 
            <Text style={[styles.preferenceLabel, { color: colors.text }]}>Map Style</Text>
            <View style={[styles.mapStyleOptions, { gap: 8 }]}> 
              {mapStyleOptions.map((mapStyle) => (
                <SettingsButton
                  key={mapStyle.type}
                  label={mapStyle.name}
                  onPress={() => handleMapStyleChange(mapStyle.type)}
                  icon={mapStyle.icon}
                  color={currentMapStyle === mapStyle.type ? colors.buttonPrimary : colors.buttonSecondary}
                  textColor={currentMapStyle === mapStyle.type ? colors.buttonText : colors.text}
                  style={{ marginHorizontal: 2, marginBottom: 8 }}
                  accessibilityLabel={`Map Style: ${mapStyle.name}`}
                />
              ))}
            </View>
          </View>
          <SettingsButton
            label="Reset UI and Map Styles to Defaults"
            onPress={handleResetPreferences}
            icon="settings-backup-restore"
            style={{ marginTop: 8, minWidth: 200 }}
            accessibilityLabel="Reset UI and Map Styles to Defaults"
          />
        </SectionCard>

        {/* Account Section */}
        <SectionCard>
          <SectionHeader icon="account-circle" title="Account" />
          <SettingsButton
            label="Sign Out"
            onPress={handleSignOut}
            icon="logout"
            color={colors.danger}
            textColor={colors.buttonText}
            accessibilityLabel="Sign Out"
          />
        </SectionCard>

        {/* Developer Tools Section (if user is dev) */}
        {user && (
          <SectionCard>
            <SectionHeader icon="developer-mode" title="Developer Tools" />
            {developerLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Processing...</Text>
              </View>
            )}
            
            {/* API Migration Testing */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>🌐 API Migration Testing</Text>
              
              <TouchableOpacity 
                style={[styles.settingItem, testingMigration && styles.disabledItem]} 
                onPress={handleTestMigration}
                disabled={testingMigration}
              >
                <View style={styles.settingContent}>
                  <MaterialIcons name="api" size={24} color={colors.primary} />
                  <Text style={styles.settingText}>
                    {testingMigration ? 'Testing API Migration...' : 'Test Places API Migration'}
                  </Text>
                </View>
                {testingMigration ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
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

            {/* Data Migration Status */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>📊 Data Migration Status</Text>
              
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
                  <MaterialIcons name="cloud-sync" size={24} color={colors.primary} />
                  <Text style={styles.settingText}>Check Migration Status</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
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
                  <MaterialIcons name="sync" size={24} color={colors.primary} />
                  <Text style={styles.settingText}>Trigger Data Migration</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
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

            {/* Data Management */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>🗂️ Data Management</Text>
              
              <TouchableOpacity 
                style={styles.settingItem} 
                onPress={fixJourneyStatuses}
              >
                <View style={styles.settingContent}>
                  <MaterialIcons name="build" size={24} color={colors.primary} />
                  <Text style={styles.settingText}>🔧 Fix Journey Statuses</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.settingItem, styles.dangerItem]} 
                onPress={deleteAllJourneys}
              >
                <View style={styles.settingContent}>
                  <MaterialIcons name="delete-forever" size={24} color={colors.error} />
                  <Text style={[styles.settingText, styles.dangerText]}>🗑️ DELETE ALL JOURNEYS</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.error} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.settingItem, styles.criticalItem]} 
                onPress={purgeAllAccountData}
              >
                <View style={styles.settingContent}>
                  <MaterialIcons name="warning" size={24} color={colors.critical} />
                  <Text style={[styles.settingText, styles.criticalText]}>🚨 PURGE EVERYTHING</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.critical} />
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
                  <MaterialIcons name="storage" size={24} color={colors.primary} />
                  <Text style={styles.settingText}>Check Your Journey Data</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
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
                  <MaterialIcons name="location-on" size={24} color={colors.primary} />
                  <Text style={styles.settingText}>Check Location Permissions</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
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
                  <MaterialIcons name="analytics" size={24} color={colors.primary} />
                  <Text style={styles.settingText}>Your Journey Statistics</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
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
                              Logger.debug('📋 YOUR EXPORTED JOURNEY DATA:', data);
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
                  <MaterialIcons name="file-download" size={24} color={colors.primary} />
                  <Text style={styles.settingText}>Export Your Journey Data</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.settingItem} 
                onPress={() => setShowAnimationDemo(true)}
              >
                <View style={styles.settingContent}>
                  <MaterialIcons name="animation" size={24} color={colors.primary} />
                  <Text style={styles.settingText}>🎨 Test Ping Animations</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </SectionCard>
        )}
      </ScrollView>

      {/* Animation Demo Modal */}
      {showAnimationDemo && (
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.modalBackground }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>🎨 Ping Animation Demo</Text>
              <TouchableOpacity 
                onPress={() => setShowAnimationDemo(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <AnimationDemo />
            </View>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: (props) => props.theme.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: (props) => props.theme.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    ...Typography.body,
    color: (props) => props.theme.text,
  },
  section: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: (props) => props.theme.tabInactive + '30',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: (props) => props.theme.tabInactive + '30',
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    ...Typography.sectionTitle,
    color: (props) => props.theme.text,
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
    backgroundColor: (props) => props.theme.background + '80',
    zIndex: 1,
  },
  subsection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: (props) => props.theme.tabInactive + '30',
  },
  subsectionTitle: {
    ...Typography.cardTitle,
    color: (props) => props.theme.text,
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
    color: (props) => props.theme.text,
    flex: 1,
    fontWeight: '600',
  },
  preferenceLink: {
    backgroundColor: (props) => props.theme.tabInactive + '20',
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
    color: (props) => props.theme.text,
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
    backgroundColor: (props) => props.theme.tabInactive + '20',
  },
  languageOptionActive: {
    backgroundColor: (props) => props.theme.primary,
  },
  languageOptionText: {
    ...Typography.body,
    color: (props) => props.theme.text,
  },
  languageOptionTextActive: {
    color: (props) => props.theme.background,
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
    color: (props) => props.theme.background,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  migrationStatus: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: (props) => props.theme.tabInactive + '20',
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
    color: (props) => props.theme.text,
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
    backgroundColor: (props) => props.theme.primary + '20',
    borderRadius: 4,
  },
  recommendationText: {
    ...Typography.body,
    color: (props) => props.theme.text,
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
    color: (props) => props.theme.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  errorText: {
    ...Typography.body,
    color: (props) => props.theme.text + '80',
    fontSize: 12,
  },
  migrationStatusContainer: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: (props) => props.theme.tabInactive + '20',
    borderRadius: 8,
  },
  migrationStats: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: (props) => props.theme.background,
    borderRadius: 4,
  },
  migrationStatsTitle: {
    ...Typography.body,
    color: (props) => props.theme.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  migrationStatsText: {
    ...Typography.body,
    color: (props) => props.theme.text + '80',
    fontSize: 14,
    marginBottom: 2,
  },
  migrationResult: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: (props) => props.theme.primary + '20',
    borderRadius: 4,
  },
  migrationResultTitle: {
    ...Typography.body,
    color: (props) => props.theme.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  migrationResultText: {
    ...Typography.body,
    color: (props) => props.theme.text,
    marginBottom: Spacing.sm,
  },
  migrationDetails: {
    marginTop: Spacing.sm,
  },
  migrationDetailsText: {
    ...Typography.body,
    color: (props) => props.theme.text + '80',
    fontSize: 12,
    marginBottom: 2,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: (props) => props.theme.tabInactive + '30',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    ...Typography.body,
    color: (props) => props.theme.text,
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
  disabledItem: {
    opacity: 0.6,
  },
  testButton: {
    backgroundColor: (props) => props.theme.primary,
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    ...Typography.body,
    color: (props) => props.theme.background,
    fontWeight: '600',
  },
  sectionDescription: {
    ...Typography.body,
    color: (props) => props.theme.textSecondary,
    marginBottom: Spacing.md,
  },
  editButton: {
    backgroundColor: (props) => props.theme.primary,
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    ...Typography.body,
    color: (props) => props.theme.background,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: (props) => props.theme.background,
    borderRadius: 16,
    width: '95%',
    height: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: (props) => props.theme.tabInactive + '30',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: (props) => props.theme.text,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
  },
  // New styles for Theme and Map Style sections
  themeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: 4,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    backgroundColor: (props) => props.theme.tabInactive + '20',
  },
  themeOptionActive: {
    backgroundColor: (props) => props.theme.primary,
  },
  themeOptionText: {
    ...Typography.body,
    color: (props) => props.theme.text,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  mapStyleOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
  },
  mapStyleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: 4,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    backgroundColor: (props) => props.theme.tabInactive + '20',
  },
  mapStyleOptionActive: {
    backgroundColor: (props) => props.theme.primary,
  },
  mapStyleOptionText: {
    ...Typography.body,
    color: (props) => props.theme.text,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
});
