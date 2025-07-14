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
import { Spacing, Typography, getFallbackTheme } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';
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
  const { getCurrentThemeColors } = useTheme();
  const colors = getCurrentThemeColors() || getFallbackTheme();
  const styles = getStyles(colors);
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

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.tabInactive + '30',
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    ...Typography.h2,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  resetButton: {
    padding: Spacing.sm,
  },
  section: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.tabInactive + '30',
  },
  sectionHeader: {
    ...Typography.h2,
    color: colors.text,
    marginBottom: Spacing.md,
  },
  sectionDescription: {
    ...Typography.body,
    color: colors.text + '80',
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
    borderColor: colors.tabInactive + '50',
    backgroundColor: colors.background,
  },
  ratingOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ratingOptionText: {
    ...Typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  ratingOptionTextActive: {
    color: colors.background,
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
    backgroundColor: colors.tabInactive + '20',
    borderRadius: 8,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryTitle: {
    ...Typography.body,
    color: colors.text,
    fontWeight: '600',
    marginLeft: Spacing.sm,
    flex: 1,
  },
  categoryCount: {
    ...Typography.body,
    color: colors.text + '80',
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
    color: colors.text,
    flex: 1,
  },
}); 