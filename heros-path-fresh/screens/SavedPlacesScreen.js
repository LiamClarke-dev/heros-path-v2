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
  name: { ...Typography.body, fontWeight: Typography.h1.fontWeight },
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