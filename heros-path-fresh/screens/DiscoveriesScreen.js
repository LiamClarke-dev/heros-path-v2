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
import Toast from 'react-native-root-toast';
import { MaterialIcons } from '@expo/vector-icons';
import { getSuggestionsForRoute, getPlaceDetailsWithSummaries } from '../services/DiscoveriesService';
import { PLACE_TYPES } from '../constants/PlaceTypes';
import { Colors, Spacing, Typography, Layout } from '../styles/theme';
import { useFocusEffect } from '@react-navigation/native';

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
  const [aiSummaries, setAiSummaries]             = useState({});
  const [loadingSummaries, setLoadingSummaries]   = useState({});

  const loadSavedRoutes = () => {
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
  };

  useEffect(() => {
    loadSavedRoutes();
  }, []);

  // Refresh routes when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadSavedRoutes();
    }, [])
  );

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY)
      .then(lang => lang && setLanguage(lang));
  }, []);

  useEffect(() => {
    if (!selectedRoute?.coords) return;
    setLoading(true);
    
    // Use the new preferences system when no specific filter is selected
    const options = { 
      type: filterType, 
      language,
      usePreferences: !filterType // Use preferences when no specific type is selected
    };
    
    getSuggestionsForRoute(selectedRoute.coords, options)
      .then(newSuggestions => {
        setSuggestions(newSuggestions);
        // Show toast notification for new discoveries
        const count = newSuggestions.length;
        if (count > 0) {
          const message = `${count} new suggestion${count === 1 ? '' : 's'} found for this journey`;
          Toast.show(message, {
            duration: Toast.durations.LONG,
            position: Toast.positions.BOTTOM,
          });
        }
      })
      .finally(() => setLoading(false));
  }, [selectedRoute, filterType, language]);

  const handleSave = async place => {
    const saved = JSON.parse(await AsyncStorage.getItem('savedPlaces')) || [];
    if (saved.find(p => p.placeId === place.placeId)) {
      Toast.show('Place already saved!', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
      });
      return;
    }
    
    // Ensure the place has location data for map pins
    const placeWithLocation = {
      ...place,
      latitude: place.latitude || null,
      longitude: place.longitude || null,
    };
    
    await AsyncStorage.setItem(
      'savedPlaces',
      JSON.stringify([...saved, placeWithLocation])
    );
    setSuggestions(s => s.filter(p => p.placeId !== place.placeId));
    
    Toast.show('Place saved!', {
      duration: Toast.durations.SHORT,
      position: Toast.positions.BOTTOM,
    });
  };
  
  const handleDismiss = id =>
    setSuggestions(s => s.filter(p => p.placeId !== id));

  const fetchAiSummary = async (placeId) => {
    if (aiSummaries[placeId] || loadingSummaries[placeId]) return;
    
    setLoadingSummaries(prev => ({ ...prev, [placeId]: true }));
    
    try {
      const enhancedDetails = await getPlaceDetailsWithSummaries(placeId, language);
      if (enhancedDetails?.summaries) {
        setAiSummaries(prev => ({ ...prev, [placeId]: enhancedDetails.summaries }));
      }
    } catch (error) {
      console.warn('Failed to fetch AI summary for place:', placeId, error);
    } finally {
      setLoadingSummaries(prev => ({ ...prev, [placeId]: false }));
    }
  };

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
                  <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
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
                  </ScrollView>
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
                  <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
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
                  </ScrollView>
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
                  {item.combinedTypes && item.combinedTypes.length > 1 && (
                    <Text style={styles.combinedTypes}>
                      {' • ' + item.combinedTypes.slice(1).map(type => type.replace('_', ' ')).join(', ')}
                    </Text>
                  )}
                </Text>
              )}
              {item.description && (
                <Text style={styles.description}>{item.description}</Text>
              )}
              
              {/* AI Summary Section */}
              {aiSummaries[item.placeId] && (
                <View style={styles.summaryContainer}>
                  <Text style={styles.summaryTitle}>AI Summary</Text>
                  <Text style={styles.summaryText}>
                    {aiSummaries[item.placeId].overview?.text || aiSummaries[item.placeId].text || 'Summary available'}
                  </Text>
                </View>
              )}
              
              {!aiSummaries[item.placeId] && !loadingSummaries[item.placeId] && (
                <TouchableOpacity
                  style={styles.summaryButton}
                  onPress={() => fetchAiSummary(item.placeId)}
                >
                  <MaterialIcons name="auto-awesome" size={16} color={Colors.primary} />
                  <Text style={styles.summaryButtonText}>Get AI Summary</Text>
                </TouchableOpacity>
              )}
              
              {loadingSummaries[item.placeId] && (
                <View style={styles.summaryLoading}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.summaryLoadingText}>Loading AI summary...</Text>
                </View>
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
  summaryContainer: {
    backgroundColor: Colors.primary + '10',
    padding: Spacing.sm,
    borderRadius: Layout.borderRadius,
    marginVertical: Spacing.xs,
  },
  summaryTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: Spacing.xs / 2,
  },
  summaryText: {
    ...Typography.body,
    color: Colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  summaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    padding: Spacing.sm,
    borderRadius: Layout.borderRadius,
    marginVertical: Spacing.xs,
  },
  summaryButtonText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  summaryLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  summaryLoadingText: {
    ...Typography.body,
    color: Colors.text + '80',
    marginLeft: Spacing.xs,
  },
});
