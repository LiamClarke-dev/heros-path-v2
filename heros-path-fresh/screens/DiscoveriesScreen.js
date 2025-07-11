// screens/DiscoveriesScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Swipeable } from 'react-native-gesture-handler';
import { getSuggestionsForRoute } from '../services/DiscoveriesService';
import { PLACE_TYPES } from '../constants/PlaceTypes';
import { Colors, Spacing, Typography, Layout } from '../styles/theme';

const LANGUAGE_KEY = '@user_language';
const ROUTES_KEY   = '@saved_routes';

export default function DiscoveriesScreen() {
  const [savedRoutes, setSavedRoutes]             = useState([]);
  const [selectedRoute, setSelectedRoute]         = useState(null);
  const [filterType, setFilterType]               = useState(null);
  const [language, setLanguage]                   = useState('en');
  const [suggestions, setSuggestions]             = useState([]);
  const [loading, setLoading]                     = useState(false);
  const [routeDropdownVisible, setRouteDropdownVisible] = useState(false);
  const [typeDropdownVisible, setTypeDropdownVisible]   = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ROUTES_KEY)
      .then(json => {
        const raw = json ? JSON.parse(json) : [];
        const journeys = raw
          .map(j => j.id ? j : {
            id: String(Date.now()),
            coords: j,
            date: new Date().toISOString(),
          })
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        setSavedRoutes(journeys);
        if (journeys.length) setSelectedRoute(journeys[0]);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY)
      .then(lang => lang && setLanguage(lang));
  }, []);

  useEffect(() => {
    if (!selectedRoute?.coords) return;
    setLoading(true);
    getSuggestionsForRoute(selectedRoute.coords, { type: filterType, language })
      .then(setSuggestions)
      .finally(() => setLoading(false));
  }, [selectedRoute, filterType, language]);

  const handleSave = async place => {
    const saved = JSON.parse(await AsyncStorage.getItem('savedPlaces')) || [];
    if (saved.find(p => p.placeId === place.placeId)) return;
    await AsyncStorage.setItem(
      'savedPlaces',
      JSON.stringify([...saved, place])
    );
    setSuggestions(s => s.filter(p => p.placeId !== place.placeId));
  };
  const handleDismiss = id =>
    setSuggestions(s => s.filter(p => p.placeId !== id));

  if (!savedRoutes.length) {
    return (
      <View style={styles.center}>
        <Text>No past journeys found.</Text>
      </View>
    );
  }
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading…</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={suggestions}
      keyExtractor={item => item.placeId}
      ListHeaderComponent={() => (
        <View style={styles.headerRow}>
          {/* Journey dropdown */}
          <View style={styles.dropdownWrapper}>
            <TouchableOpacity
              style={styles.pickerToggle}
              onPress={() => setRouteDropdownVisible(true)}
            >
              <Text style={styles.pickerToggleText}>
                {new Date(selectedRoute.date).toLocaleDateString()} (
                {selectedRoute.coords.length} pts) ▼
              </Text>
            </TouchableOpacity>
            <Modal
              visible={routeDropdownVisible}
              transparent animationType="fade"
              onRequestClose={() => setRouteDropdownVisible(false)}
            >
              <TouchableOpacity
                style={styles.modalBackdrop}
                activeOpacity={1}
                onPressOut={() => setRouteDropdownVisible(false)}
              >
                <View style={styles.modalContent}>
                  {savedRoutes.map(j => (
                    <TouchableOpacity
                      key={j.id}
                      style={styles.modalItem}
                      onPress={() => {
                        setSelectedRoute(j);
                        setRouteDropdownVisible(false);
                      }}
                    >
                      <Text style={styles.modalItemText}>
                        {new Date(j.date).toLocaleString()} — {j.coords.length} pts
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
            </Modal>
          </View>

          {/* Discovery Type dropdown */}
          <View style={styles.dropdownWrapper}>
            <TouchableOpacity
              style={styles.pickerToggle}
              onPress={() => setTypeDropdownVisible(true)}
            >
              <Text style={styles.pickerToggleText}>
                {filterType
                  ? (PLACE_TYPES.find(t => t.key === filterType)?.label || 'All Types')
                  : 'All Types'} ▼
              </Text>
            </TouchableOpacity>
            <Modal
              visible={typeDropdownVisible}
              transparent animationType="fade"
              onRequestClose={() => setTypeDropdownVisible(false)}
            >
              <TouchableOpacity
                style={styles.modalBackdrop}
                activeOpacity={1}
                onPressOut={() => setTypeDropdownVisible(false)}
              >
                <View style={styles.modalContent}>
                 <TouchableOpacity
                   style={styles.modalItem}
                   onPress={() => {
                     setFilterType(null);
                     setTypeDropdownVisible(false);
                   }}
                 >
                   <Text style={styles.modalItemText}>All Types</Text>
                 </TouchableOpacity>
                 {PLACE_TYPES
                   .filter(t => t.key !== 'all')
                   .map(({ key, label }) => (
                    <TouchableOpacity
                      key={key}
                      style={styles.modalItem}
                      onPress={() => {
                        setFilterType(key);
                        setTypeDropdownVisible(false);
                      }}
                    >
                      <Text style={styles.modalItemText}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
        </View>
      )}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={() => (
        <View style={styles.center}>
          <Text>No suggestions for this journey.</Text>
        </View>
      )}
      renderItem={({ item }) => (
        <Swipeable
          renderLeftActions={() => (
            <TouchableOpacity
              style={[styles.action, styles.save]}
              onPress={() => handleSave(item)}
            >
              <Text style={styles.actionText}>Save</Text>
            </TouchableOpacity>
          )}
          renderRightActions={() => (
            <TouchableOpacity
              style={[styles.action, styles.dismiss]}
              onPress={() => handleDismiss(item.placeId)}
            >
              <Text style={styles.actionText}>Dismiss</Text>
            </TouchableOpacity>
          )}
        >
          <View style={styles.card}>
            {item.thumbnail && (
              <Image source={{ uri: item.thumbnail }} style={styles.thumb} />
            )}
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              {item.category && (
                <Text style={styles.category}>
                  {item.category.replace('_', ' ')}
                </Text>
              )}
              {item.description && (
                <Text style={styles.description}>{item.description}</Text>
              )}
              <Text style={styles.meta}>
                ★ {item.rating ?? '—'} ({item.userRatingsTotal ?? '0'})
              </Text>
              <TouchableOpacity
                onPress={() => {
                  const url =
                    `https://www.google.com/maps/search/?api=1` +
                    `&query=${encodeURIComponent(item.name)}` +
                    `&query_place_id=${item.placeId}`;
                  Linking.openURL(url);
                }}
              >
                <Text style={styles.link}>View on Maps</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Swipeable>
      )}
      style={styles.listContainer}
    />
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.md,
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
  },
  modalItem: {
    paddingVertical: Spacing.sm,
  },
  modalItemText: {
    ...Typography.body,
    color: Colors.text,
  },
  tabBarContainer: { backgroundColor: Colors.background },
  tabBar: {
    height: Layout.buttonHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  tabButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Layout.borderRadius * 2,
    marginHorizontal: Spacing.xs,
  },
  tabButtonActive: { backgroundColor: Colors.primary },
  tabText: { ...Typography.body, color: Colors.text },
  tabTextActive: {
    color: Colors.background,
    fontWeight: Typography.body.fontWeight,
  },
  listContainer: { flex: 1, backgroundColor: Colors.background },
  listContent: { paddingVertical: Spacing.sm },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  description: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: Spacing.xs / 2,
  },
  meta: { ...Typography.body, color: Colors.tabInactive },
  link: { ...Typography.body, color: Colors.primary, marginTop: Spacing.xs },
  action: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginVertical: Spacing.sm,
    borderRadius: Layout.borderRadius,
  },
  save: { backgroundColor: Colors.swipeSave },
  dismiss: { backgroundColor: Colors.swipeDismiss },
  actionText: {
    ...Typography.body,
    color: Colors.background,
  },
});
