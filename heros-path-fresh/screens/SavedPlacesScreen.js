/*
 * SAVED PLACES SCREEN (PERSONAL DISCOVERY COLLECTION)
 * ====================================================
 * 
 * PURPOSE:
 * This screen displays all the places that users have saved during their discovery
 * review process, creating a personal collection of interesting locations they want
 * to remember or visit. It serves as both a wishlist and a record of places that
 * caught their attention during walks. Think of it as the user's "personal travel
 * guide" built from their own exploration discoveries.
 * 
 * FUNCTIONALITY:
 * - Displays a comprehensive list of all user-saved places from discoveries
 * - Provides filtering capabilities to organize places by type or category
 * - Shows detailed place information including photos, ratings, and descriptions
 * - Supports swipe actions for quick management (unsave, share, etc.)
 * - Integrates with external mapping and navigation apps
 * - Handles place detail modals with comprehensive information display
 * - Automatically refreshes when returning from other screens
 * - Manages loading states and empty state messaging
 * - Uses modern UI components for consistent visual experience
 * - Provides export and sharing capabilities for saved places
 * 
 * WHY IT EXISTS:
 * Users discover many interesting places during their walks but need a way to remember
 * and organize them. This screen transforms the discovery process from passive viewing
 * into active collection building. It gives users a sense of accomplishment and
 * provides practical value by maintaining a personalized list of places they want
 * to visit or remember.
 * 
 * KEY FEATURES:
 * - Personal Collection: Curated list of user-selected interesting places
 * - Smart Filtering: Filter saved places by category, type, or other criteria
 * - Detailed Information: Rich place details including photos and descriptions
 * - External Integration: Links to maps, reviews, and navigation apps
 * - Quick Management: Swipe actions for efficient place management
 * - Visual Organization: Clear categorization and visual hierarchy
 * - Real-time Updates: Automatically reflects changes from discovery reviews
 * - Empty State Guidance: Helpful messaging when no places are saved yet
 * 
 * RELATIONSHIPS:
 * - Uses DiscoveryService.js for loading and managing saved place data
 * - Integrates with discovery workflows in DiscoveriesScreen.js
 * - Connected to UserContext for authentication and user data
 * - Uses PLACE_TYPES constants for filtering and categorization
 * - Part of the Discoveries tab navigation alongside DiscoveriesScreen
 * - Uses shared UI components for consistent interface design
 * - May integrate with external mapping and review services
 * 
 * REFERENCED BY:
 * - AppNavigator.js (as part of the Discoveries tab navigation)
 * - DiscoveriesScreen.js (users save places that appear here)
 * - Discovery completion workflows that populate this screen
 * - User travel planning and revisiting workflows
 * 
 * REFERENCES:
 * - DiscoveryService.js (for saved place data management)
 * - PLACE_TYPES constants (for filtering and categorization)
 * - UserContext.js (for authentication and user data)
 * - UI components (Card, ListItem, AppButton, SectionHeader)
 * - External linking (for maps and navigation integration)
 * - React Navigation (for screen focus and state management)
 * 
 * IMPORTANCE TO APP:
 * HIGH - This screen is crucial for converting discovery browsing into lasting value.
 * It transforms the app from just showing interesting places to actually helping users
 * build a personal collection they can use for future planning and exploration. This
 * creates long-term engagement and makes the discovery process feel more meaningful
 * and practical.
 * 
 * IMPROVEMENT SUGGESTIONS:
 * 1. Add place collections - organize saved places into custom collections
 * 2. Add place notes - personal notes and memories for each saved place
 * 3. Add place photos - attach personal photos to saved places
 * 4. Add visit tracking - mark places as visited and track visit history
 * 5. Add place sharing - share saved places with friends or export lists
 * 6. Add place recommendations - suggest similar places based on saved items
 * 7. Add place planning - plan routes that visit multiple saved places
 * 8. Add place reminders - location-based reminders when near saved places
 * 9. Add place categories - custom categories beyond standard place types
 * 10. Add place search - search through saved places by name or attributes
 * 11. Add place analytics - insights about saved place patterns and preferences
 * 12. Add place backup - backup and restore saved place collections
 * 13. Add place import - import places from other apps or services
 * 14. Add place reviews - personal ratings and reviews for saved places
 * 15. Add place social features - see friends' saved places and recommendations
 * 16. Add place optimization - optimize saved place organization automatically
 * 17. Add place accessibility - accessibility information for saved places
 * 18. Add place updates - notifications when saved places have updates
 * 19. Add place visualization - map view showing all saved places
 * 20. Add place achievements - rewards for reaching saved place milestones
 */
// screens/SavedPlacesScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Linking,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useIsFocused } from '@react-navigation/native';
import { PLACE_TYPES } from '../constants/PlaceTypes';
import { Colors, Spacing, Typography, Layout } from '../styles/theme';
import { useUser } from '../contexts/UserContext';
import DiscoveryService from '../services/DiscoveryService';
import Card from '../components/ui/Card';
import ListItem from '../components/ui/ListItem';
import AppButton from '../components/ui/AppButton';
import SectionHeader from '../components/ui/SectionHeader';

export default function SavedPlacesScreen() {
  const { user, migrationStatus } = useUser();
  const [allPlaces, setAllPlaces] = useState([]);
  const [filterType, setFilterType] = useState(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const isFocused = useIsFocused();

  const loadSavedPlaces = async () => {
    if (!user) {
      setAllPlaces([]);
      return;
    }

    try {
      setLoading(true);
      const result = await DiscoveryService.getSavedPlaces(user.uid);
      
      if (result.success) {
        // Transform Firestore discoveries to match existing UI expectations
        const places = result.discoveries.map(discovery => ({
          placeId: discovery.placeId,
          name: discovery.placeName || discovery.placeData?.name,
          category: discovery.placeType,
          combinedTypes: discovery.placeData?.types || [],
          rating: discovery.placeData?.rating,
          userRatingsTotal: discovery.placeData?.user_ratings_total,
          description: discovery.placeData?.formatted_address,
          thumbnail: discovery.placeData?.photos?.[0]?.photo_reference 
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${discovery.placeData.photos[0].photo_reference}&key=YOUR_API_KEY`
            : null,
          // Preserve original place data for compatibility
          ...discovery.placeData
        }));
        
        setAllPlaces(places);
      } else {
        setAllPlaces([]);
      }
    } catch (error) {
      console.error('Failed to load saved places:', error);
      setAllPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadSavedPlaces();
    }
  }, [isFocused]);

  const handleRemove = async placeId => {
    if (!user) return;

    try {
      // Find the discovery to remove
      const discoveryToRemove = allPlaces.find(p => p.placeId === placeId);
      if (discoveryToRemove) {
        // Update the discovery to mark it as not saved
        await DiscoveryService.updateDiscovery(user.uid, discoveryToRemove.id, {
          saved: false
        });
        // Reload the list
        await loadSavedPlaces();
      }
    } catch (error) {
      console.error('Failed to remove saved place:', error);
    }
  };

  const places = filterType
    ? allPlaces.filter(p => p.category === filterType)
    : allPlaces;

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Please sign in to view saved places.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading saved places...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <SectionHeader title="Saved Places" />
      {/* Category dropdown and filter UI can be refactored later */}
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={places}
          keyExtractor={item => item.placeId}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={() => (
            <Text style={{ textAlign: 'center', marginTop: 40, color: '#888' }}>
              No saved places{filterType ? ` in ${PLACE_TYPES.find(t => t.key === filterType)?.label}` : ''}.
            </Text>
          )}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: 8 }}>
              <ListItem
                title={item.name}
                subtitle={item.description}
                left={item.thumbnail ? (
                  <Image source={{ uri: item.thumbnail }} style={{ width: 48, height: 48, borderRadius: 8 }} />
                ) : null}
                right={
                  <AppButton
                    title="Remove"
                    variant="danger"
                    onPress={() => handleRemove(item.placeId)}
                    style={{ paddingVertical: 6, paddingHorizontal: 12, marginLeft: 8 }}
                    textStyle={{ fontSize: 14 }}
                  />
                }
                onPress={() => {
                  const url =
                    `https://www.google.com/maps/search/?api=1` +
                    `&query=${encodeURIComponent(item.name)}` +
                    `&query_place_id=${item.placeId}`;
                  Linking.openURL(url);
                }}
              />
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerRow: {
    flexDirection: 'row',
    padding: Spacing.sm,
    backgroundColor: Colors.background,
  },
  dropdownWrapper: {
    flex: 1,
    marginHorizontal: Spacing.xs / 2,
  },
  pickerToggle: {
    padding: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius,
    borderWidth: 1,
    borderColor: Colors.tabInactive,
  },
  pickerToggleText: {
    ...Typography.body,
    color: Colors.text,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius,
    padding: Spacing.md,
    maxHeight: 300, // Limit height to prevent overflow
  },
  modalScrollView: {
    maxHeight: 250, // Leave room for padding
  },
  modalItem: {
    paddingVertical: Spacing.sm,
  },
  modalItemText: {
    ...Typography.body,
    color: Colors.text,
  },
  listContent: { paddingVertical: Spacing.sm },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { ...Typography.body, textAlign: 'center', color: Colors.text },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    padding: Spacing.md,
    margin: Spacing.sm,
    borderRadius: Layout.borderRadius,
    elevation: 2,
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: Layout.borderRadius,
    marginRight: Spacing.md,
  },
  info: { flex: 1 },
  name: { ...Typography.body, fontWeight: 'bold' },
  category: {
    ...Typography.body,
    fontStyle: 'italic',
    color: Colors.tabInactive,
    marginVertical: Spacing.xs / 2,
  },
  combinedTypes: {
    ...Typography.body,
    fontStyle: 'italic',
    color: Colors.primary,
    fontSize: 12,
  },
  description: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: Spacing.xs / 2,
  },
  meta: { ...Typography.body, color: Colors.tabInactive },
  link: { ...Typography.body, color: Colors.primary, marginTop: Spacing.xs },
  dismiss: {
    justifyContent: 'center',
    backgroundColor: Colors.swipeDismiss,
    paddingHorizontal: Spacing.md,
  },
  actionText: { ...Typography.body, color: Colors.background },
});