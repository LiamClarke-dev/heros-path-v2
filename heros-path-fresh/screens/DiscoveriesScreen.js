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
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Swipeable } from 'react-native-gesture-handler';
import Toast from 'react-native-root-toast';
import { MaterialIcons } from '@expo/vector-icons';
import { getSuggestionsForRoute, getPlaceDetailsWithSummaries, getUserDiscoveryPreferences } from '../services/DiscoveriesService';
import { testAISummaries } from '../services/NewPlacesService';
import { PLACE_TYPES } from '../constants/PlaceTypes';
import { Colors, Spacing, Typography, Layout } from '../styles/theme';
import { useFocusEffect } from '@react-navigation/native';
import { useUser } from '../contexts/UserContext';
import DiscoveryService from '../services/DiscoveryService';
import JourneyService from '../services/JourneyService';
import { 
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import Logger from '../utils/Logger';

const LANGUAGE_KEY = '@user_language';
const ROUTES_KEY   = '@saved_routes';

// Remove dummy data
// const DUMMY_DISMISSED_PLACES = [...];
// const DUMMY_DISCOVERED_PLACES = [...];

export default function DiscoveriesScreen({ navigation, route }) {
  const { user, migrationStatus } = useUser();
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

  // Discovery management state
  const [showOnboarding, setShowOnboarding]       = useState(false);
  const [showDismissModal, setShowDismissModal]   = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showManageHistory, setShowManageHistory] = useState(false);
  const [placeToDismiss, setPlaceToDismiss]       = useState(null);
  const [dismissalPreference, setDismissalPreference] = useState('ask');
  const [rememberChoice, setRememberChoice]       = useState(false);
  const [recentlyDismissed, setRecentlyDismissed] = useState([]);
  const [dismissedSectionCollapsed, setDismissedSectionCollapsed] = useState(true);
  const [discoveredSectionCollapsed, setDiscoveredSectionCollapsed] = useState(true);

  // Real data state
  const [dismissedPlaces, setDismissedPlaces] = useState([]);
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Define all useCallback hooks at the top
  const loadDismissedAndSavedCallback = React.useCallback(async () => {
    Logger.debug('DISCOVERIES_SCREEN', 'loadDismissedAndSavedCallback called');
    if (!user) {
      Logger.debug('DISCOVERIES_SCREEN', 'No user, clearing dismissed and saved places');
      setDismissedPlaces([]);
      setSavedPlaces([]);
      return;
    }

    try {
      Logger.debug('DISCOVERIES_SCREEN', 'Loading dismissed and saved places from Firestore');
      const [dismissedResult, savedResult] = await Promise.all([
        DiscoveryService.getDismissedPlaces(user.uid),
        DiscoveryService.getSavedPlaces(user.uid)
      ]);

      if (dismissedResult.success) {
        Logger.debug('DISCOVERIES_SCREEN', `Loaded ${dismissedResult.dismissedPlaces.length} dismissed places`);
        setDismissedPlaces(dismissedResult.dismissedPlaces);
      }
      if (savedResult.success) {
        Logger.debug('DISCOVERIES_SCREEN', `Loaded ${savedResult.discoveries.length} saved places`);
        setSavedPlaces(savedResult.discoveries);
      }
    } catch (error) {
      Logger.error('DISCOVERIES_SCREEN', 'Error loading dismissed and saved places', error);
      
      // Fallback to AsyncStorage if Firestore fails
      try {
        Logger.debug('DISCOVERIES_SCREEN', 'Falling back to AsyncStorage');
        const dismissed = JSON.parse(await AsyncStorage.getItem('dismissedPlaces')) || [];
        const saved = JSON.parse(await AsyncStorage.getItem('savedPlaces')) || [];
        setDismissedPlaces(dismissed);
        setSavedPlaces(saved);
      } catch (fallbackError) {
        Logger.error('DISCOVERIES_SCREEN', 'Fallback to AsyncStorage also failed', fallbackError);
        setDismissedPlaces([]);
        setSavedPlaces([]);
      }
    }
  }, [user]);

  // Manual refresh function (pull-to-refresh) - ONLY reloads from Firestore, NO API calls
  const onRefresh = React.useCallback(async () => {
    Logger.debug('DISCOVERIES_SCREEN', 'onRefresh called - RELOADING FROM FIRESTORE ONLY');
    if (!selectedRoute || !user) {
      Logger.debug('DISCOVERIES_SCREEN', 'No selected route or user, skipping refresh');
      return;
    }
    
    setRefreshing(true);
    try {
      // Reload dismissed and saved places
      Logger.debug('DISCOVERIES_SCREEN', 'Reloading dismissed and saved places');
      await loadDismissedAndSavedCallback();
      
      // Reload suggestions for current journey from Firestore only
      Logger.debug('DISCOVERIES_SCREEN', 'Reloading journey discoveries from Firestore');
      const journeyDiscoveries = await DiscoveryService.getJourneyDiscoveries(user.uid, selectedRoute.id);
      
      let allSuggestions = [];
      
      if (journeyDiscoveries.success && journeyDiscoveries.discoveries) {
        const unreviewed = journeyDiscoveries.discoveries.filter(
          discovery => !discovery.saved && !discovery.dismissed
        );
        
        const firestoreSuggestions = unreviewed.map(discovery => ({
          placeId: discovery.placeId,
          name: discovery.placeData?.name || discovery.placeName || 'Unknown Place',
          types: discovery.placeData?.types || [discovery.placeType || 'unknown'],
          rating: discovery.placeData?.rating,
          photos: discovery.placeData?.photos || [],
          formatted_address: discovery.placeData?.formatted_address,
          latitude: discovery.location?.lat,
          longitude: discovery.location?.lng,
          category: discovery.placeType || 'unknown',
          fromFirestore: true,
          discoveryId: discovery.id
        }));
        
        allSuggestions = firestoreSuggestions;
      }
      
      setSuggestions(allSuggestions);
      
      Toast.show('Refreshed discoveries', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
      });
    } catch (error) {
      Logger.error('DISCOVERIES_SCREEN', 'Error refreshing discoveries', error);
      Toast.show('Failed to refresh', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
      });
    } finally {
      setRefreshing(false);
    }
  }, [selectedRoute, user, loadDismissedAndSavedCallback]);

  // Load dismissed and saved places from Firestore
  const loadDismissedAndSaved = async () => {
    Logger.debug('DISCOVERIES_SCREEN', 'loadDismissedAndSaved called');
    if (!user) {
      Logger.debug('DISCOVERIES_SCREEN', 'No user, clearing dismissed and saved places');
      setDismissedPlaces([]);
      setSavedPlaces([]);
      return;
    }

    try {
      Logger.debug('DISCOVERIES_SCREEN', 'Loading dismissed and saved places from Firestore');
      const [dismissedResult, savedResult] = await Promise.all([
        DiscoveryService.getDismissedPlaces(user.uid),
        DiscoveryService.getSavedPlaces(user.uid)
      ]);

      if (dismissedResult.success) {
        Logger.debug('DISCOVERIES_SCREEN', `Loaded ${dismissedResult.dismissedPlaces.length} dismissed places`);
        setDismissedPlaces(dismissedResult.dismissedPlaces);
      }
      if (savedResult.success) {
        Logger.debug('DISCOVERIES_SCREEN', `Loaded ${savedResult.discoveries.length} saved places`);
        setSavedPlaces(savedResult.discoveries);
      }
    } catch (error) {
      Logger.error('DISCOVERIES_SCREEN', 'Error loading dismissed and saved places', error);
      
      // Fallback to AsyncStorage if Firestore fails
      try {
        Logger.debug('DISCOVERIES_SCREEN', 'Falling back to AsyncStorage');
        const dismissed = JSON.parse(await AsyncStorage.getItem('dismissedPlaces')) || [];
        const saved = JSON.parse(await AsyncStorage.getItem('savedPlaces')) || [];
        setDismissedPlaces(dismissed);
        setSavedPlaces(saved);
      } catch (fallbackError) {
        Logger.error('DISCOVERIES_SCREEN', 'Fallback to AsyncStorage also failed', fallbackError);
        setDismissedPlaces([]);
        setSavedPlaces([]);
      }
    }
  };

  // Save dismissed places to Firestore
  const saveDismissedPlaces = async (placeId, dismissData = {}) => {
    if (!user) return;

    try {
      await DiscoveryService.dismissPlace(user.uid, placeId, dismissData);
      // Reload dismissed places to get updated list
      await loadDismissedAndSavedCallback();
    } catch (error) {
      Logger.error('DISCOVERIES_SCREEN', 'Error saving dismissed place', error);
      throw error;
    }
  };

  // Save saved places to Firestore
  const saveSavedPlaces = async (discoveryData) => {
    if (!user) return;

    try {
      await DiscoveryService.createDiscovery(user.uid, discoveryData);
      // Reload saved places to get updated list
      await loadDismissedAndSavedCallback();
    } catch (error) {
      Logger.error('DISCOVERIES_SCREEN', 'Error saving place', error);
      throw error;
    }
  };

  // Load on mount and when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadDismissedAndSavedCallback();
    }, [loadDismissedAndSavedCallback])
  );

  // When saving a place
  const handleSave = async place => {
    if (!user) {
      Toast.show('Please sign in to save places', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
      });
      return;
    }

    // Check if already saved
    if (savedPlaces.find(p => p.placeId === place.placeId)) {
      Toast.show('Place already saved!', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
      });
      return;
    }

    try {
      // Validate coordinates before creating discovery
      const lat = place.latitude || place.geometry?.location?.lat;
      const lng = place.longitude || place.geometry?.location?.lng;
      
      if (lat === undefined || lng === undefined || lat === null || lng === null) {
        Toast.show('Cannot save place - missing location data', {
          duration: Toast.durations.SHORT,
          position: Toast.positions.BOTTOM,
        });
        return;
      }
      
      // Create discovery data for Firestore
      const discoveryData = {
        journeyId: selectedRoute?.id || null,
        placeId: place.placeId,
        placeName: place.name,
        placeType: place.types?.[0] || 'unknown',
        location: {
          lat: lat,
          lng: lng,
        },
        discoveredAt: new Date(),
        dismissed: false,
        saved: true,
        // Store full place data for offline access
        placeData: {
          name: place.name,
          types: place.types || [],
          rating: place.rating,
          photos: place.photos || [],
          formatted_address: place.formatted_address,
          // Preserve any other relevant data, but filter out undefined values
          ...Object.fromEntries(
            Object.entries(place).filter(([_, value]) => value !== undefined)
          )
        }
      };

      await saveSavedPlaces(discoveryData);
      setSuggestions(s => s.filter(p => p.placeId !== place.placeId));
      Toast.show('Place saved!', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
      });
    } catch (error) {
      Logger.error('DISCOVERIES_SCREEN', 'Error saving place', error);
      Toast.show('Failed to save place', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
      });
    }
  };

  // When dismissing a place
  const dismissPlace = async (place, type) => {
    if (!user) {
      Toast.show('Please sign in to dismiss places', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
      });
      return;
    }

    try {
      setSuggestions(s => s.filter(p => p.placeId !== place.placeId));
      
      // Save to Firestore with full place data
      const dismissData = {
        dismissedForever: type === 'forever',
        reason: type === 'forever' ? 'user_dismissed_forever' : 'user_dismissed_temporary',
        journeyId: selectedRoute?.id, // Include journeyId for status updates
        // Store full place data for display in history
        placeData: {
          name: place.name,
          types: place.types || [],
          rating: place.rating,
          photos: place.photos || [],
          formatted_address: place.formatted_address,
          category: place.category || place.types?.[0] || 'unknown',
          // Preserve any other relevant data
          ...Object.fromEntries(
            Object.entries(place).filter(([_, value]) => value !== undefined)
          )
        }
      };
      
      await saveDismissedPlaces(place.placeId, dismissData);
      setRecentlyDismissed(prev => [...prev, { ...place, dismissedAt: new Date() }]);
      
      const message = type === 'forever' 
        ? `${place.name} hidden forever`
        : `${place.name} hidden for 30 days`;
      Toast.show(message, {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
      });
    } catch (error) {
      Logger.error('DISCOVERIES_SCREEN', 'Error dismissing place', error);
      Toast.show('Failed to dismiss place', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
      });
    }
  };

  // Remove dummy discoveredPlaces, use savedPlaces as discovered
  const discoveredPlaces = savedPlaces;

  const loadSavedRoutes = async () => {
    if (!user) {
      setSavedRoutes([]);
      return;
    }

    try {
      const result = await JourneyService.getUserJourneys(user.uid);
      
      if (result.success) {
        // Transform Firestore data to match existing UI expectations
        const journeys = result.journeys.map(journey => ({
          id: journey.id,
          coords: journey.route || [],
          date: journey.createdAt?.toDate?.() || new Date(journey.createdAt) || new Date(),
          name: journey.name,
          distance: journey.distance,
          duration: journey.duration,
          startLocation: journey.startLocation,
          endLocation: journey.endLocation,
        }));
        
        setSavedRoutes(journeys);
        
        // Set selected route from navigation params or default to first journey
        if (route.params?.selectedRoute) {
          setSelectedRoute(route.params.selectedRoute);
        } else if (journeys.length) {
          setSelectedRoute(journeys[0]);
        }
      } else {
        setSavedRoutes([]);
      }
    } catch (error) {
      Logger.error('DISCOVERIES_SCREEN', 'Error loading saved routes', error);
      
      // Fallback to AsyncStorage if Firestore fails
      try {
        const stored = await AsyncStorage.getItem('savedRoutes');
        const raw = stored ? JSON.parse(stored) : [];
        const journeys = raw
          .map(j => j.id ? j : {
            id: String(Date.now()),
            coords: j,
            date: new Date().toISOString(),
          })
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        setSavedRoutes(journeys);
        
        // Set selected route from navigation params or default to first journey
        if (route.params?.selectedRoute) {
          setSelectedRoute(route.params.selectedRoute);
        } else if (journeys.length) {
          setSelectedRoute(journeys[0]);
        }
      } catch (fallbackError) {
        Logger.error('DISCOVERIES_SCREEN', 'Fallback to AsyncStorage also failed', fallbackError);
        setSavedRoutes([]);
      }
    }
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
    
    // Load dismissal preference
    AsyncStorage.getItem('@dismissal_preference')
      .then(pref => pref && setDismissalPreference(pref));
  }, []);

  useEffect(() => {
    if (!selectedRoute?.coords || !user) return;
    setLoading(true);
    
    const loadJourneyDiscoveries = async () => {
      Logger.debug('DISCOVERIES_SCREEN', 'loadJourneyDiscoveries called');
      Logger.debug('DISCOVERIES_SCREEN', 'Selected route info:', {
        id: selectedRoute?.id,
        name: selectedRoute?.name,
        coordsLength: selectedRoute?.coords?.length,
        coordsType: typeof selectedRoute?.coords
      });
      
      try {
        // First, load existing discoveries from Firestore for this journey
        Logger.debug('DISCOVERIES_SCREEN', 'Loading existing discoveries from Firestore for journey:', selectedRoute.id);
        const journeyDiscoveries = await DiscoveryService.getJourneyDiscoveries(user.uid, selectedRoute.id);
        
        // Get user preferences for place types
        Logger.debug('DISCOVERIES_SCREEN', 'Getting user discovery preferences');
        const preferences = await getUserDiscoveryPreferences();
        
        // Filter preferences if a specific type is selected
        const filteredPreferences = filterType && filterType !== 'all' 
          ? { [filterType]: true }
          : preferences;
        
        let allSuggestions = [];
        let newSuggestions = [];
        
        if (journeyDiscoveries.success && journeyDiscoveries.discoveries) {
          // Add unreviewed discoveries from Firestore
          const unreviewed = journeyDiscoveries.discoveries.filter(
            discovery => !discovery.saved && !discovery.dismissed
          );
          
          Logger.debug('DISCOVERIES_SCREEN', `Journey discoveries breakdown:`, {
            total: journeyDiscoveries.discoveries.length,
            saved: journeyDiscoveries.discoveries.filter(d => d.saved).length,
            dismissed: journeyDiscoveries.discoveries.filter(d => d.dismissed).length,
            unreviewed: unreviewed.length,
            discoveries: journeyDiscoveries.discoveries.map(d => ({
              placeId: d.placeId,
              saved: d.saved,
              dismissed: d.dismissed,
              placeName: d.placeName
            }))
          });
          
          // Convert Firestore discoveries to suggestion format
          const firestoreSuggestions = unreviewed.map(discovery => ({
            placeId: discovery.placeId,
            name: discovery.placeData?.name || discovery.placeName || 'Unknown Place',
            types: discovery.placeData?.types || [discovery.placeType || 'unknown'],
            rating: discovery.placeData?.rating,
            photos: discovery.placeData?.photos || [],
            formatted_address: discovery.placeData?.formatted_address,
            latitude: discovery.location?.lat,
            longitude: discovery.location?.lng,
            category: discovery.placeType || 'unknown',
            fromFirestore: true, // Flag to identify Firestore-sourced suggestions
            discoveryId: discovery.id // Keep the discovery ID for updates
          }));
          
          allSuggestions = firestoreSuggestions;
          
          // Only make API calls if there are no existing discoveries OR if this is a new journey
          const hasExistingDiscoveries = journeyDiscoveries.discoveries.length > 0;
          const isNewJourney = !hasExistingDiscoveries;
          
          if (isNewJourney) {
            Logger.debug('DISCOVERIES_SCREEN', 'New journey detected - making API calls for initial discoveries');
            Logger.debug('DISCOVERIES_SCREEN', 'Calling getSuggestionsForRoute - THIS WILL MAKE API CALLS');
            Logger.debug('DISCOVERIES_SCREEN', 'Parameters for getSuggestionsForRoute:', {
              coordsLength: selectedRoute.coords?.length,
              coordsType: typeof selectedRoute.coords,
              preferences: filteredPreferences,
              language,
              userId: user.uid
            });
            
            try {
              newSuggestions = await getSuggestionsForRoute(
                selectedRoute.coords, 
                filteredPreferences, 
                language, 
                user.uid
              );
              Logger.debug('DISCOVERIES_SCREEN', 'getSuggestionsForRoute completed successfully', {
                newSuggestionsCount: newSuggestions?.length || 0
              });
            } catch (apiError) {
              Logger.error('DISCOVERIES_SCREEN', 'Error in getSuggestionsForRoute', apiError);
              newSuggestions = [];
            }
            
            allSuggestions = [...firestoreSuggestions, ...newSuggestions];
          } else {
            Logger.debug('DISCOVERIES_SCREEN', 'Existing journey with discoveries - skipping API calls to save performance');
            Logger.debug('DISCOVERIES_SCREEN', 'Found', journeyDiscoveries.discoveries.length, 'existing discoveries');
          }
        } else {
          // No existing discoveries, make API calls
          Logger.debug('DISCOVERIES_SCREEN', 'No existing discoveries found - making API calls');
          Logger.debug('DISCOVERIES_SCREEN', 'Calling getSuggestionsForRoute - THIS WILL MAKE API CALLS');
          Logger.debug('DISCOVERIES_SCREEN', 'Parameters for getSuggestionsForRoute (no existing discoveries):', {
            coordsLength: selectedRoute.coords?.length,
            coordsType: typeof selectedRoute.coords,
            preferences: filteredPreferences,
            language,
            userId: user.uid
          });
          
          try {
            newSuggestions = await getSuggestionsForRoute(
              selectedRoute.coords, 
              filteredPreferences, 
              language, 
              user.uid
            );
            Logger.debug('DISCOVERIES_SCREEN', 'getSuggestionsForRoute completed successfully (no existing discoveries)', {
              newSuggestionsCount: newSuggestions?.length || 0
            });
          } catch (apiError) {
            Logger.error('DISCOVERIES_SCREEN', 'Error in getSuggestionsForRoute (no existing discoveries)', apiError);
            newSuggestions = [];
          }
          
          allSuggestions = newSuggestions;
        }
        
        Logger.debug('DISCOVERIES_SCREEN', 'Total suggestions:', allSuggestions.length, '(Firestore:', allSuggestions.filter(s => s.fromFirestore).length, 'API:', allSuggestions.filter(s => !s.fromFirestore).length, ')');
        setSuggestions(allSuggestions);
        
        // Show toast notification for new discoveries
        const newCount = newSuggestions.length;
        if (newCount > 0) {
          const message = `${newCount} new suggestion${newCount === 1 ? '' : 's'} found for this journey`;
          Toast.show(message, {
            duration: Toast.durations.LONG,
            position: Toast.positions.BOTTOM,
          });
        }
      } catch (error) {
        Logger.error('DISCOVERIES_SCREEN', 'Failed to load journey discoveries', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadJourneyDiscoveries();
  }, [selectedRoute, filterType, language, user]);

  const handleDismiss = (place) => {
    if (dismissalPreference === 'ask') {
      setPlaceToDismiss(place);
      setShowDismissModal(true);
    } else {
      // Use saved preference
      const dismissalType = dismissalPreference === '30days' ? '30 days' : 'forever';
      dismissPlace(place, dismissalType);
    }
  };

  const handleDismissModalAction = (type) => {
    if (rememberChoice) {
      setDismissalPreference(type === '30days' ? '30days' : 'forever');
      AsyncStorage.setItem('@dismissal_preference', type === '30days' ? '30days' : 'forever');
    }
    
    dismissPlace(placeToDismiss, type);
    setShowDismissModal(false);
    setPlaceToDismiss(null);
    setRememberChoice(false);
  };

  const completeOnboarding = () => {
    setShowOnboarding(false);
    AsyncStorage.setItem('@discovery_onboarding_shown', 'true');
  };

  const showOnboardingAgain = () => {
    setShowOnboarding(true);
  };

  // Helper function to format time ago
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown time ago';
    
    let date;
    try {
      // Handle Firestore Timestamp objects
      if (timestamp && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else if (timestamp && timestamp.seconds) {
        // Handle Firestore Timestamp with seconds
        date = new Date(timestamp.seconds * 1000);
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else {
        date = new Date(timestamp);
      }
    } catch (error) {
      Logger.error('DISCOVERIES_SCREEN', 'Error parsing timestamp', error, timestamp);
      return 'Unknown time ago';
    }
    
    if (isNaN(date.getTime())) {
      return 'Unknown time ago';
    }
    
    const now = Date.now();
    const timeDiff = now - date.getTime();
    
    const minutes = Math.floor(timeDiff / (1000 * 60));
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  // Handle undo dismiss
  const handleUndoDismiss = async (place) => {
    Logger.debug('DISCOVERIES_SCREEN', 'handleUndoDismiss called for place:', place.placeId);
    try {
      // Remove from dismissed places
      Logger.debug('DISCOVERIES_SCREEN', 'Calling DiscoveryService.undismissPlace');
      await DiscoveryService.undismissPlace(user.uid, place.placeId);
      
      // Reload dismissed and saved places
      Logger.debug('DISCOVERIES_SCREEN', 'Reloading dismissed and saved places');
      await loadDismissedAndSavedCallback();
      
      // Refresh suggestions to show the restored place (without API calls)
      if (selectedRoute) {
        Logger.debug('DISCOVERIES_SCREEN', 'Refreshing suggestions after undo dismiss - NO API CALLS');
        const journeyDiscoveries = await DiscoveryService.getJourneyDiscoveries(user.uid, selectedRoute.id);
        
        let allSuggestions = [];
        
        if (journeyDiscoveries.success && journeyDiscoveries.discoveries) {
          const unreviewed = journeyDiscoveries.discoveries.filter(
            discovery => !discovery.saved && !discovery.dismissed
          );
          
          const firestoreSuggestions = unreviewed.map(discovery => ({
            placeId: discovery.placeId,
            name: discovery.placeData?.name || discovery.placeName || 'Unknown Place',
            types: discovery.placeData?.types || [discovery.placeType || 'unknown'],
            rating: discovery.placeData?.rating,
            photos: discovery.placeData?.photos || [],
            formatted_address: discovery.placeData?.formatted_address,
            latitude: discovery.location?.lat,
            longitude: discovery.location?.lng,
            category: discovery.placeType || 'unknown',
            fromFirestore: true,
            discoveryId: discovery.id
          }));
          
          allSuggestions = firestoreSuggestions;
        }
        
        setSuggestions(allSuggestions);
        
        // Manually update journey completion status to ensure it's correct
        try {
          await DiscoveryService.updateJourneyCompletionStatus(user.uid, selectedRoute.id);
          Logger.debug('DISCOVERIES_SCREEN', 'Manually updated journey completion status after undo dismiss');
        } catch (statusError) {
          Logger.warn('DISCOVERIES_SCREEN', 'Failed to update journey status after undo dismiss', { error: statusError.message });
        }
      }
      
      Toast.show('Place restored to suggestions', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
      });
    } catch (error) {
      Logger.error('DISCOVERIES_SCREEN', 'Error undoing dismiss', error);
      Toast.show('Failed to restore place', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
      });
    }
  };

  // Handle undo save
  const handleUndoSave = async (place) => {
    Logger.debug('DISCOVERIES_SCREEN', 'handleUndoSave called for place:', place.placeId);
    try {
      // Remove from saved places
      Logger.debug('DISCOVERIES_SCREEN', 'Calling DiscoveryService.unsavePlace');
      await DiscoveryService.unsavePlace(user.uid, place.placeId);
      
      // Reload dismissed and saved places
      Logger.debug('DISCOVERIES_SCREEN', 'Reloading dismissed and saved places');
      await loadDismissedAndSavedCallback();
      
      // Refresh suggestions to show the restored place (without API calls)
      if (selectedRoute) {
        Logger.debug('DISCOVERIES_SCREEN', 'Refreshing suggestions after undo save - NO API CALLS');
        const journeyDiscoveries = await DiscoveryService.getJourneyDiscoveries(user.uid, selectedRoute.id);
        
        let allSuggestions = [];
        
        if (journeyDiscoveries.success && journeyDiscoveries.discoveries) {
          const unreviewed = journeyDiscoveries.discoveries.filter(
            discovery => !discovery.saved && !discovery.dismissed
          );
          
          const firestoreSuggestions = unreviewed.map(discovery => ({
            placeId: discovery.placeId,
            name: discovery.placeData?.name || discovery.placeName || 'Unknown Place',
            types: discovery.placeData?.types || [discovery.placeType || 'unknown'],
            rating: discovery.placeData?.rating,
            photos: discovery.placeData?.photos || [],
            formatted_address: discovery.placeData?.formatted_address,
            latitude: discovery.location?.lat,
            longitude: discovery.location?.lng,
            category: discovery.placeType || 'unknown',
            fromFirestore: true,
            discoveryId: discovery.id
          }));
          
          allSuggestions = firestoreSuggestions;
        }
        
        setSuggestions(allSuggestions);
        
        // Manually update journey completion status to ensure it's correct
        try {
          await DiscoveryService.updateJourneyCompletionStatus(user.uid, selectedRoute.id);
          Logger.debug('DISCOVERIES_SCREEN', 'Manually updated journey completion status after undo save');
        } catch (statusError) {
          Logger.warn('DISCOVERIES_SCREEN', 'Failed to update journey status after undo save', { error: statusError.message });
        }
      }
      
      Toast.show('Place removed from saved', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
      });
    } catch (error) {
      Logger.error('DISCOVERIES_SCREEN', 'Error undoing save', error);
      Toast.show('Failed to remove place from saved', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
      });
    }
  };

  const fetchAiSummary = async (placeId) => {
    if (aiSummaries[placeId] || loadingSummaries[placeId]) return;
    
    setLoadingSummaries(prev => ({ ...prev, [placeId]: true }));
    
    try {
      const enhancedDetails = await getPlaceDetailsWithSummaries(placeId, language);
      if (enhancedDetails?.summaries) {
        setAiSummaries(prev => ({ ...prev, [placeId]: enhancedDetails.summaries }));
      } else {
        // If no summaries are available, set a flag to show "no summary available"
        setAiSummaries(prev => ({ ...prev, [placeId]: { noSummary: true } }));
      }
    } catch (error) {
      Logger.warn('DISCOVERIES_SCREEN', 'Failed to fetch AI summary for place:', placeId, error);
      // Set error state
      setAiSummaries(prev => ({ ...prev, [placeId]: { error: true } }));
    } finally {
      setLoadingSummaries(prev => ({ ...prev, [placeId]: false }));
    }
  };

  const testAISummariesFeature = async () => {
    try {
      const result = await testAISummaries();
      Alert.alert('Place Summaries Test Complete!', `Chicago: ${result.chicago ? 'Available' : 'Not available'}\nUser Place: ${result.userPlace ? 'Available' : 'Not available'}`);
    } catch (error) {
      Logger.error('DISCOVERIES_SCREEN', 'Place Summaries test failed', error);
      Alert.alert('Place Summaries test failed', error.message);
    }
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <Text>Please sign in to view discoveries.</Text>
      </View>
    );
  }

  if (!savedRoutes.length) {
    return (
      <View style={styles.center}>
        <Text>No past journeys found.</Text>
        {migrationStatus && !migrationStatus.hasMigrated && (
          <Text style={styles.migrationNote}>
            Your data will be migrated to the cloud when you sign in.
          </Text>
        )}
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
    <View style={styles.container}>
      <FlatList
        data={suggestions}
        keyExtractor={item => item.placeId}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={() => (
          <View>
            {/* Enhanced Header with Discovery Management */}
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerTitle}>Total Discoveries ({suggestions.length})</Text>
                <View style={styles.headerStats}>
                  <Text style={styles.headerStatText}>Saved: {savedPlaces?.length || 0}</Text>
                  <Text style={styles.headerStatText}>Dismissed: {dismissedPlaces.length}</Text>
                </View>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity
                  style={styles.gearButton}
                  onPress={() => setShowSettingsModal(true)}
                >
                  <MaterialIcons name="settings" size={20} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.manageButton}
                  onPress={() => setShowManageHistory(true)}
                >
                  <MaterialIcons name="history" size={16} color={Colors.background} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Journey and Type dropdowns side by side */}
            <View style={styles.dropdownsRow}>
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

            {/* AI Summaries Test Button - Commented out for future use */}
            {/* <TouchableOpacity
              style={styles.testButton}
              onPress={testAISummariesFeature}
            >
              <MaterialIcons name="science" size={16} color={Colors.primary} />
              <Text style={styles.testButtonText}>Test AI</Text>
            </TouchableOpacity> */}
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => {
          // Check if this journey has any discoveries at all
          const hasAnyDiscoveries = selectedRoute?.totalDiscoveriesCount > 0;
          
          if (!hasAnyDiscoveries) {
            return (
              <View style={styles.completionContainer}>
                <MaterialIcons name="explore" size={64} color={Colors.tabInactive} />
                <Text style={styles.completionTitle}>No Discoveries Found</Text>
                <Text style={styles.completionText}>
                  This journey didn't find any new places to review.
                </Text>
                <Text style={styles.completionSubtext}>
                  Try walking in a different area or check your discovery preferences.
                </Text>
              </View>
            );
          }
          
          return (
            <View style={styles.completionContainer}>
              <MaterialIcons name="check-circle" size={64} color={Colors.primary} />
              <Text style={styles.completionTitle}>Congratulations!</Text>
              <Text style={styles.completionText}>
                There are no more places to review on this journey.
              </Text>
              <Text style={styles.completionSubtext}>
                Get out there and explore to discover more!
              </Text>
            </View>
          );
        }}
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
                onPress={() => handleDismiss(item)}
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
                
                {/* Place Summary Section */}
                {aiSummaries[item.placeId] && (
                  <View style={styles.summaryContainer}>
                    <Text style={styles.summaryTitle}>Place Summary</Text>
                    {aiSummaries[item.placeId].noSummary ? (
                      <Text style={styles.summaryText}>No summary available for this place</Text>
                    ) : aiSummaries[item.placeId].error ? (
                      <View>
                        <Text style={styles.summaryText}>Failed to load summary</Text>
                        <TouchableOpacity
                          style={styles.retryButton}
                          onPress={() => fetchAiSummary(item.placeId)}
                        >
                          <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View>
                        <Text style={styles.summaryText}>
                          {aiSummaries[item.placeId].generativeSummary?.overview?.text ||
                           aiSummaries[item.placeId].editorialSummary?.text ||
                           (aiSummaries[item.placeId].topReview && `"${aiSummaries[item.placeId].topReview.text?.text || aiSummaries[item.placeId].topReview.text}" - ${aiSummaries[item.placeId].topReview.authorAttribution?.displayName || 'User'}`) ||
                           'No summary available for this place'}
                        </Text>
                        {/* Show summary type indicator */}
                        {(aiSummaries[item.placeId].generativeSummary || aiSummaries[item.placeId].editorialSummary) && (
                          <Text style={styles.summaryTypeIndicator}>
                            {aiSummaries[item.placeId].generativeSummary ? '🤖 AI Summary' : '📝 Editorial Summary'}
                          </Text>
                        )}
                        {aiSummaries[item.placeId].generativeSummary?.disclosureText?.text && (
                          <View style={styles.disclosureContainer}>
                            <Text style={styles.disclosureText}>
                              {aiSummaries[item.placeId].generativeSummary.disclosureText.text}
                            </Text>
                            {aiSummaries[item.placeId].generativeSummary?.overviewFlagContentUri && (
                              <TouchableOpacity
                                style={styles.flagButton}
                                onPress={() => {
                                  const url = aiSummaries[item.placeId].generativeSummary.overviewFlagContentUri;
                                  Linking.openURL(url);
                                }}
                              >
                                <MaterialIcons name="flag" size={12} color={Colors.tabInactive} />
                                <Text style={styles.flagButtonText}>Report</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )}
                
                {!aiSummaries[item.placeId] && !loadingSummaries[item.placeId] && (
                  <TouchableOpacity
                    style={styles.summaryButton}
                    onPress={() => fetchAiSummary(item.placeId)}
                  >
                    <MaterialIcons name="description" size={16} color={Colors.primary} />
                    <Text style={styles.summaryButtonText}>Get Summary</Text>
                  </TouchableOpacity>
                )}
                
                {loadingSummaries[item.placeId] && (
                  <View style={styles.summaryLoading}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                    <Text style={styles.summaryLoadingText}>Loading summary...</Text>
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

      {/* Onboarding Modal */}
      <Modal
        visible={showOnboarding}
        transparent
        animationType="fade"
        onRequestClose={completeOnboarding}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.onboardingModal}>
            <Text style={styles.onboardingTitle}>Welcome to Discoveries!</Text>
            <View style={styles.onboardingContent}>
              <View style={styles.onboardingItem}>
                <MaterialIcons name="swipe-right" size={24} color={Colors.primary} />
                <Text style={styles.onboardingText}>Swipe right to save a place</Text>
              </View>
              <View style={styles.onboardingItem}>
                <MaterialIcons name="swipe-left" size={24} color={Colors.primary} />
                <Text style={styles.onboardingText}>Swipe left to dismiss a place</Text>
              </View>
            </View>
            <View style={styles.onboardingButtons}>
              <TouchableOpacity
                style={styles.onboardingButton}
                onPress={completeOnboarding}
              >
                <Text style={styles.onboardingButtonText}>Got it!</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.onboardingButtonSecondary}
                onPress={showOnboardingAgain}
              >
                <Text style={styles.onboardingButtonTextSecondary}>Show me again</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Enhanced Dismiss Modal */}
      <Modal
        visible={showDismissModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDismissModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.dismissModal}>
            <Text style={styles.dismissModalTitle}>
              Dismiss "{placeToDismiss?.name}"?
            </Text>
            <View style={styles.dismissOptions}>
              <TouchableOpacity
                style={styles.dismissOption}
                onPress={() => handleDismissModalAction('30days')}
              >
                <MaterialIcons name="schedule" size={20} color={Colors.primary} />
                <Text style={styles.dismissOptionText}>Hide for 30 days</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dismissOption}
                onPress={() => handleDismissModalAction('forever')}
              >
                <MaterialIcons name="block" size={20} color={Colors.primary} />
                <Text style={styles.dismissOptionText}>Hide forever</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dismissOption}
                onPress={() => setShowDismissModal(false)}
              >
                <MaterialIcons name="cancel" size={20} color={Colors.tabInactive} />
                <Text style={styles.dismissOptionText}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.rememberChoiceContainer}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setRememberChoice(!rememberChoice)}
              >
                {rememberChoice && (
                  <MaterialIcons name="check" size={16} color={Colors.primary} />
                )}
              </TouchableOpacity>
              <Text style={styles.rememberChoiceText}>
                Remember my choice for future dismissals
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.settingsModal}>
            <Text style={styles.settingsModalTitle}>Discovery Settings</Text>
            <View style={styles.settingsContent}>
              <Text style={styles.settingsSectionTitle}>Default Dismissal:</Text>
              <TouchableOpacity
                style={[
                  styles.settingsOption,
                  dismissalPreference === 'ask' && styles.settingsOptionActive
                ]}
                onPress={() => setDismissalPreference('ask')}
              >
                <MaterialIcons 
                  name={dismissalPreference === 'ask' ? 'radio-button-checked' : 'radio-button-unchecked'} 
                  size={20} 
                  color={Colors.primary} 
                />
                <Text style={styles.settingsOptionText}>Ask each time</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.settingsOption,
                  dismissalPreference === '30days' && styles.settingsOptionActive
                ]}
                onPress={() => setDismissalPreference('30days')}
              >
                <MaterialIcons 
                  name={dismissalPreference === '30days' ? 'radio-button-checked' : 'radio-button-unchecked'} 
                  size={20} 
                  color={Colors.primary} 
                />
                <Text style={styles.settingsOptionText}>Hide for 30 days</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.settingsOption,
                  dismissalPreference === 'forever' && styles.settingsOptionActive
                ]}
                onPress={() => setDismissalPreference('forever')}
              >
                <MaterialIcons 
                  name={dismissalPreference === 'forever' ? 'radio-button-checked' : 'radio-button-unchecked'} 
                  size={20} 
                  color={Colors.primary} 
                />
                <Text style={styles.settingsOptionText}>Hide forever</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => setShowSettingsModal(false)}
            >
              <Text style={styles.settingsButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Manage History Modal */}
      <Modal
        visible={showManageHistory}
        transparent
        animationType="fade"
        onRequestClose={() => setShowManageHistory(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.manageHistoryModal}>
            <View style={styles.manageHistoryHeader}>
              <Text style={styles.manageHistoryTitle}>Manage Discovery History</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowManageHistory(false)}
              >
                <MaterialIcons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.manageHistoryContent} showsVerticalScrollIndicator={true}>
              <TouchableOpacity
                style={styles.manageHistorySectionHeader}
                onPress={() => setDismissedSectionCollapsed(!dismissedSectionCollapsed)}
              >
                <Text style={styles.manageHistorySectionTitle}>
                  ❌ Dismissed Places ({dismissedPlaces.length})
                </Text>
                <MaterialIcons 
                  name={dismissedSectionCollapsed ? "expand-more" : "expand-less"} 
                  size={20} 
                  color={Colors.text} 
                />
              </TouchableOpacity>
              
              {!dismissedSectionCollapsed && dismissedPlaces.map(place => (
                <View key={place.placeId} style={styles.manageHistoryItem}>
                  <View style={styles.manageHistoryItemInfo}>
                    <Text style={styles.manageHistoryItemName}>
                      {place.placeData?.name || place.name || 'Unknown Place'}
                    </Text>
                    <Text style={styles.manageHistoryItemCategory}>
                      {place.placeData?.category || place.category || 'Unknown Category'}
                    </Text>
                    <Text style={styles.manageHistoryItemTime}>
                      Dismissed {formatTimeAgo(place.dismissedAt)}
                    </Text>
                  </View>
                  <View style={styles.manageHistoryItemActions}>
                    <TouchableOpacity 
                      style={styles.restoreButton}
                      onPress={() => handleUndoDismiss(place)}
                    >
                      <Text style={styles.restoreButtonText}>Undo</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={styles.manageHistorySectionHeader}
                onPress={() => setDiscoveredSectionCollapsed(!discoveredSectionCollapsed)}
              >
                <Text style={styles.manageHistorySectionTitle}>
                  ✅ Saved Places ({discoveredPlaces.length})
                </Text>
                <MaterialIcons 
                  name={discoveredSectionCollapsed ? "expand-more" : "expand-less"} 
                  size={20} 
                  color={Colors.text} 
                />
              </TouchableOpacity>
              
              {!discoveredSectionCollapsed && discoveredPlaces.map(place => (
                <View key={place.placeId} style={styles.manageHistoryItem}>
                  <View style={styles.manageHistoryItemInfo}>
                    <Text style={styles.manageHistoryItemName}>
                      {place.placeData?.name || place.placeName || place.name || 'Unknown Place'}
                    </Text>
                    <Text style={styles.manageHistoryItemCategory}>
                      {place.placeData?.category || place.placeType || place.category || 'Unknown Category'}
                    </Text>
                    <Text style={styles.manageHistoryItemTime}>
                      Saved {formatTimeAgo(place.savedAt || place.discoveredAt)}
                    </Text>
                  </View>
                  <View style={styles.manageHistoryItemActions}>
                    <TouchableOpacity 
                      style={styles.restoreButton}
                      onPress={() => handleUndoSave(place)}
                    >
                      <Text style={styles.restoreButtonText}>Undo</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Shake to Undo Button (Demo) */}
      {recentlyDismissed.length > 0 && (
        <TouchableOpacity
          style={styles.shakeButton}
          onPress={() => {
            const lastDismissed = recentlyDismissed[recentlyDismissed.length - 1];
            Alert.alert(
              'Undo Dismiss',
              `Restore "${lastDismissed.name}" to suggestions?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Restore', 
                  onPress: () => {
                    setRecentlyDismissed(prev => prev.slice(0, -1));
                    Toast.show(`${lastDismissed.name} restored to suggestions`, {
                      duration: Toast.durations.SHORT,
                      position: Toast.positions.BOTTOM,
                    });
                  }
                }
              ]
            );
          }}
        >
          <MaterialIcons name="undo" size={20} color={Colors.background} />
          <Text style={styles.shakeButtonText}>Undo Last Dismiss</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  // Enhanced Header Styles
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.tabInactive + '20',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.xs / 2,
  },
  headerStats: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerStatText: {
    ...Typography.caption,
    color: Colors.tabInactive,
    fontSize: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  gearButton: {
    padding: Spacing.sm,
    borderRadius: Layout.borderRadius,
    backgroundColor: Colors.primary + '10',
  },
  manageButton: {
    padding: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Layout.borderRadius,
  },
  manageButtonText: {
    ...Typography.body,
    color: Colors.background,
    fontWeight: '600',
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
  retryButton: {
    backgroundColor: Colors.primary + '10',
    padding: Spacing.sm,
    borderRadius: Layout.borderRadius,
    marginTop: Spacing.xs,
  },
  retryButtonText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    padding: Spacing.sm,
    borderRadius: Layout.borderRadius,
    marginLeft: Spacing.xs,
  },
  testButtonText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  disclosureText: {
    ...Typography.body,
    color: Colors.tabInactive,
    fontSize: 12,
    marginTop: Spacing.xs / 2,
  },
  disclosureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs / 2,
  },
  flagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    padding: Spacing.xs,
    borderRadius: Layout.borderRadius,
    marginLeft: Spacing.xs,
  },
  flagButtonText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  summaryTypeIndicator: {
    ...Typography.body,
    color: Colors.tabInactive,
    fontSize: 12,
    marginTop: Spacing.xs / 2,
    fontStyle: 'italic',
  },

  // Onboarding Modal Styles
  onboardingModal: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius,
    padding: Spacing.lg,
    margin: Spacing.lg,
    alignItems: 'center',
  },
  onboardingTitle: {
    ...Typography.h1,
    color: Colors.text,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  onboardingContent: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  onboardingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.primary + '10',
    borderRadius: Layout.borderRadius,
  },
  onboardingText: {
    ...Typography.body,
    color: Colors.text,
    marginLeft: Spacing.md,
    flex: 1,
  },
  onboardingButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  onboardingButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Layout.borderRadius,
  },
  onboardingButtonText: {
    ...Typography.body,
    color: Colors.background,
    fontWeight: '600',
  },
  onboardingButtonSecondary: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.tabInactive + '20',
    borderRadius: Layout.borderRadius,
  },
  onboardingButtonTextSecondary: {
    ...Typography.body,
    color: Colors.text,
  },

  // Dismiss Modal Styles
  dismissModal: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius,
    padding: Spacing.lg,
    margin: Spacing.lg,
  },
  dismissModalTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  dismissOptions: {
    marginBottom: Spacing.lg,
  },
  dismissOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.primary + '10',
    borderRadius: Layout.borderRadius,
  },
  dismissOptionText: {
    ...Typography.body,
    color: Colors.text,
    marginLeft: Spacing.md,
    flex: 1,
  },
  rememberChoiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.tabInactive + '20',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  rememberChoiceText: {
    ...Typography.body,
    color: Colors.text,
    fontSize: 14,
  },

  // Settings Modal Styles
  settingsModal: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius,
    padding: Spacing.lg,
    margin: Spacing.lg,
  },
  settingsModalTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  settingsContent: {
    marginBottom: Spacing.lg,
  },
  settingsSectionTitle: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  settingsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.tabInactive + '10',
    borderRadius: Layout.borderRadius,
  },
  settingsOptionActive: {
    backgroundColor: Colors.primary + '20',
  },
  settingsOptionText: {
    ...Typography.body,
    color: Colors.text,
    marginLeft: Spacing.md,
    flex: 1,
  },
  settingsButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Layout.borderRadius,
    alignItems: 'center',
  },
  settingsButtonText: {
    ...Typography.body,
    color: Colors.background,
    fontWeight: '600',
  },

  // Manage History Modal Styles
  manageHistoryModal: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius,
    margin: Spacing.md,
    maxHeight: '80%',
  },
  manageHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.tabInactive + '20',
  },
  manageHistoryTitle: {
    ...Typography.h2,
    color: Colors.text,
    flex: 1,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  manageHistoryContent: {
    padding: Spacing.lg,
    maxHeight: '70%',
  },
  manageHistorySectionTitle: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  manageHistorySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.tabInactive + '10',
    borderRadius: Layout.borderRadius,
    marginBottom: Spacing.sm,
  },
  manageHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.tabInactive + '10',
    borderRadius: Layout.borderRadius,
  },
  manageHistoryItemInfo: {
    flex: 1,
  },
  manageHistoryItemName: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  manageHistoryItemCategory: {
    ...Typography.body,
    color: Colors.tabInactive,
    fontSize: 12,
    marginTop: 2,
  },
  manageHistoryItemTime: {
    ...Typography.body,
    color: Colors.tabInactive,
    fontSize: 12,
    marginTop: 2,
  },
  manageHistoryItemActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  restoreButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Layout.borderRadius,
  },
  restoreButtonText: {
    ...Typography.body,
    color: Colors.background,
    fontWeight: '600',
    fontSize: 12,
  },
  dismissButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.swipeDismiss,
    borderRadius: Layout.borderRadius,
  },
  dismissButtonText: {
    ...Typography.body,
    color: Colors.background,
    fontWeight: '600',
    fontSize: 12,
  },

  // Shake to Undo Button Styles
  shakeButton: {
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Layout.borderRadius * 2,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  shakeButtonText: {
    ...Typography.body,
    color: Colors.background,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  dropdownsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  completionTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  completionText: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    fontSize: 16,
  },
  completionSubtext: {
    ...Typography.body,
    color: Colors.tabInactive,
    textAlign: 'center',
    fontSize: 16,
  },
  migrationNote: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});
