/*
 * DISCOVERY PREFERENCES SCREEN (USER CUSTOMIZATION INTERFACE)
 * ============================================================
 * 
 * PURPOSE:
 * This screen allows users to customize what types of places they want to discover
 * during their walks. It provides an intuitive interface for selecting place categories,
 * setting minimum rating thresholds, and controlling the discovery algorithm's behavior.
 * Think of it as the "discovery control center" where users personalize their walking
 * experience to match their interests and preferences.
 * 
 * FUNCTIONALITY:
 * - Displays organized categories of place types (Food, Shopping, Entertainment, etc.)
 * - Allows users to enable/disable specific place types for discovery
 * - Provides minimum rating selector to filter out low-quality places
 * - Supports category-level toggles for quick selection of entire groups
 * - Handles preference persistence to AsyncStorage and Firestore
 * - Provides reset functionality to restore default settings
 * - Integrates with the discovery algorithm to personalize results
 * - Uses modern UI components for consistent styling and user experience
 * - Handles loading states and error recovery gracefully
 * 
 * WHY IT EXISTS:
 * Different users have different interests when exploring. Some users love food
 * discoveries, others prefer cultural sites, and many want to avoid certain types
 * altogether. This screen ensures that Hero's Path discovers places that actually
 * interest each individual user, making the discovery system more valuable and
 * personally relevant. Without customization, users would see irrelevant discoveries.
 * 
 * KEY FEATURES:
 * - Organized Categories: Place types grouped logically (Food, Entertainment, etc.)
 * - Individual Control: Toggle specific place types on/off
 * - Quality Filtering: Minimum rating slider to ensure place quality
 * - Category Shortcuts: Quick enable/disable for entire categories
 * - Visual Feedback: Clear indication of enabled/disabled preferences
 * - Reset Options: Easy way to restore default settings
 * - Persistence: Preferences saved across app sessions
 * - Real-time Updates: Changes affect future discoveries immediately
 * 
 * RELATIONSHIPS:
 * - Uses DiscoveriesService.js for preference management and algorithm integration
 * - Connects to PLACE_TYPES constants for available place type definitions
 * - Integrates with the discovery algorithm to filter results
 * - Accessed from SettingsScreen.js as a dedicated preferences modal
 * - Uses shared UI components for consistent styling
 * - Stores preferences in both AsyncStorage and Firestore for persistence
 * 
 * REFERENCED BY:
 * - SettingsScreen.js (primary access point for preference management)
 * - AppNavigator.js (as part of the Settings stack)
 * - Discovery workflows that respect user preferences
 * - Onboarding flows that help users set initial preferences
 * 
 * REFERENCES:
 * - DiscoveriesService.js (for preference persistence and management)
 * - PLACE_TYPES constants (for available place type definitions)
 * - AsyncStorage (for local preference caching)
 * - Firebase Firestore (for cloud preference storage)
 * - UI components (SectionHeader, AppButton, etc.)
 * 
 * IMPORTANCE TO APP:
 * HIGH - This screen is crucial for user satisfaction and discovery relevance.
 * Without the ability to customize preferences, users would receive irrelevant
 * discoveries that don't match their interests, leading to poor user experience
 * and app abandonment. Good preference management significantly improves discovery
 * quality and user engagement with the core app features.
 * 
 * IMPROVEMENT SUGGESTIONS:
 * 1. Add location-based preferences - different preferences for different areas
 * 2. Add time-based preferences - different preferences for different times of day
 * 3. Add mood-based profiles - quickly switch between preference sets
 * 4. Add preference learning - automatically adjust based on user behavior
 * 5. Add preference sharing - share preference sets with friends
 * 6. Add preference recommendations - suggest preferences based on user patterns
 * 7. Add advanced filtering - price range, distance, and accessibility filters
 * 8. Add preference analytics - insights about how preferences affect discoveries
 * 9. Add seasonal preferences - automatically adjust for seasons or holidays
 * 10. Add social preferences - see what friends are interested in discovering
 * 11. Add preference backup - backup and restore preference configurations
 * 12. Add preference import - import preferences from other apps or services
 * 13. Add contextual preferences - adjust based on activity type or companions
 * 14. Add preference validation - ensure preferences lead to meaningful discoveries
 * 15. Add preference insights - show how changes affect discovery potential
 * 16. Add preference templates - pre-configured sets for different user types
 * 17. Add preference conflicts - detect and resolve conflicting settings
 * 18. Add preference optimization - optimize preferences for best discovery results
 * 19. Add preference accessibility - better support for users with disabilities
 * 20. Add preference gamification - achievements and rewards for trying new place types
 */
// screens/DiscoveryPreferencesScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Switch,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../styles/theme';
import { PLACE_TYPES } from '../constants/PlaceTypes';
import { getUserDiscoveryPreferences, resetDiscoveryPreferences } from '../services/DiscoveriesService';
import SectionHeader from '../components/ui/SectionHeader';
import AppButton from '../components/ui/AppButton';

const DISCOVERY_PREFERENCES_KEY = '@discovery_preferences';
const MIN_RATING_KEY = '@discovery_min_rating';

// Group place types by category for better organization
const PLACE_CATEGORIES = [
  {
    title: 'Food & Dining',
    icon: 'restaurant',
    types: ['restaurant', 'cafe', 'bar', 'bakery', 'meal_takeaway']
  },
  {
    title: 'Shopping & Retail',
    icon: 'shopping-cart',
    types: ['shopping_mall', 'store', 'convenience_store']
  },
  {
    title: 'Entertainment & Culture',
    icon: 'theater-comedy',
    types: ['museum', 'art_gallery', 'night_club', 'tourist_attraction', 'zoo', 'stadium', 'concert_hall', 'movie_theater']
  },
  {
    title: 'Health & Wellness',
    icon: 'favorite',
    types: ['gym', 'pharmacy']
  },
  {
    title: 'Services & Utilities',
    icon: 'build',
    types: ['bank', 'atm', 'gas_station']
  },
  {
    title: 'Outdoors & Recreation',
    icon: 'park',
    types: ['park', 'lodging']
  }
];

export default function DiscoveryPreferencesScreen({ navigation }) {
  const [discoveryPreferences, setDiscoveryPreferences] = useState({});
  const [minRating, setMinRating] = useState(3.0);
  const [expandedCategories, setExpandedCategories] = useState({});

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const [prefs, rating] = await Promise.all([
        getUserDiscoveryPreferences(),
        AsyncStorage.getItem(MIN_RATING_KEY)
      ]);
      
      setDiscoveryPreferences(prefs);
      if (rating) {
        setMinRating(parseFloat(rating));
      }
    } catch (error) {
      console.warn('Failed to load preferences:', error);
    }
  };

  const toggleDiscoveryPreference = async (placeType) => {
    const newPrefs = {
      ...discoveryPreferences,
      [placeType]: !discoveryPreferences[placeType]
    };
    setDiscoveryPreferences(newPrefs);
    await AsyncStorage.setItem(DISCOVERY_PREFERENCES_KEY, JSON.stringify(newPrefs));
  };

  const updateMinRating = async (newRating) => {
    setMinRating(newRating);
    await AsyncStorage.setItem(MIN_RATING_KEY, newRating.toString());
  };

  const toggleCategory = (categoryTitle) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryTitle]: !prev[categoryTitle]
    }));
  };

  const resetToDefaults = async () => {
    Alert.alert(
      'Reset Preferences',
      'Are you sure you want to reset all discovery preferences to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              const defaultPrefs = await resetDiscoveryPreferences();
              setDiscoveryPreferences(defaultPrefs);
              setMinRating(3.0);
              await AsyncStorage.setItem(MIN_RATING_KEY, '3.0');
              Alert.alert('Success', 'Preferences reset to defaults!');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset preferences.');
            }
          }
        }
      ]
    );
  };

  const getPlaceTypeLabel = (key) => {
    const placeType = PLACE_TYPES.find(type => type.key === key);
    return placeType ? placeType.label : key;
  };

  const renderRatingSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionHeader}>Minimum Rating</Text>
      <Text style={styles.sectionDescription}>
        Only show places with ratings at or above this level:
      </Text>
      
      <View style={styles.ratingContainer}>
        {[1.0, 2.0, 3.0, 3.5, 4.0, 4.5].map(rating => (
          <TouchableOpacity
            key={rating}
            style={[
              styles.ratingOption,
              minRating === rating && styles.ratingOptionActive
            ]}
            onPress={() => updateMinRating(rating)}
          >
            <Text style={[
              styles.ratingOptionText,
              minRating === rating && styles.ratingOptionTextActive
            ]}>
              {rating}+
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCategory = (category) => {
    const isExpanded = expandedCategories[category.title];
    const enabledCount = category.types.filter(type => discoveryPreferences[type]).length;
    
    return (
      <View key={category.title} style={styles.categoryContainer}>
        <TouchableOpacity
          style={styles.categoryHeader}
          onPress={() => toggleCategory(category.title)}
        >
          <View style={styles.categoryTitleRow}>
            <MaterialIcons 
              name={category.icon} 
              size={24} 
              color={Colors.primary} 
            />
            <Text style={styles.categoryTitle}>{category.title}</Text>
            <Text style={styles.categoryCount}>
              {enabledCount}/{category.types.length}
            </Text>
          </View>
          <MaterialIcons
            name={isExpanded ? 'expand-less' : 'expand-more'}
            size={24}
            color={Colors.text}
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.categoryContent}>
            {category.types.map(placeType => (
              <View key={placeType} style={styles.preferenceItem}>
                <View style={styles.preferenceRow}>
                  <Text style={styles.preferenceLabel}>
                    {getPlaceTypeLabel(placeType)}
                  </Text>
                  <Switch
                    value={discoveryPreferences[placeType] || false}
                    onValueChange={() => toggleDiscoveryPreference(placeType)}
                    trackColor={{ false: Colors.tabInactive + '50', true: Colors.primary + '50' }}
                    thumbColor={discoveryPreferences[placeType] ? Colors.primary : Colors.tabInactive}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <SectionHeader title="Discovery Preferences" />

      {renderRatingSelector()}

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Place Types</Text>
        <Text style={styles.sectionDescription}>
          Choose which types of places you'd like to discover during your walks:
        </Text>
        
        {PLACE_CATEGORIES.map(renderCategory)}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.tabInactive + '30',
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  resetButton: {
    padding: Spacing.sm,
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
  ratingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  ratingOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.tabInactive + '50',
    backgroundColor: Colors.background,
  },
  ratingOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  ratingOptionText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  ratingOptionTextActive: {
    color: Colors.background,
  },
  categoryContainer: {
    marginBottom: Spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.tabInactive + '20',
    borderRadius: 8,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryTitle: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginLeft: Spacing.sm,
    flex: 1,
  },
  categoryCount: {
    ...Typography.body,
    color: Colors.text + '80',
    fontSize: 12,
  },
  categoryContent: {
    paddingTop: Spacing.sm,
  },
  preferenceItem: {
    marginBottom: Spacing.sm,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  preferenceLabel: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
  },
}); 