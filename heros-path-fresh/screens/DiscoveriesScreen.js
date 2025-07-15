/*
 * DISCOVERIES SCREEN (CORE DISCOVERY INTERFACE)
 * ==============================================
 * 
 * PURPOSE:
 * This is one of the most important screens in Hero's Path - the main interface where
 * users review, save, and dismiss places discovered during their walks. It orchestrates
 * the entire discovery workflow from loading suggested places to handling user interactions
 * like saving favorites and dismissing unwanted places. Think of it as the "discovery
 * review center" where users decide which places interest them and deserve to be saved.
 * 
 * FUNCTIONALITY:
 * - Loads and displays places discovered along completed walking routes
 * - Provides swipe gestures for quick save/dismiss actions on discovered places
 * - Handles undo functionality for both save and dismiss operations
 * - Manages journey completion status tracking based on user interactions
 * - Integrates with AI summary generation for enhanced place information
 * - Provides filtering and categorization of discoveries by place type
 * - Handles onboarding for new users with guided discovery workflows
 * - Manages performance optimization with smart caching and API call reduction
 * - Provides comprehensive error handling and loading states
 * - Integrates with multiple services for data management and API calls
 * 
 * WHY IT EXISTS:
 * The discovery system is Hero's Path's key differentiator - finding interesting places
 * along your walking routes rather than just at destinations. This screen is where that
 * value proposition comes to life for users. It needs to make the discovery review
 * process engaging, efficient, and rewarding. Users spend significant time on this
 * screen reviewing their discoveries, so the experience must be polished and intuitive.
 * 
 * KEY FEATURES:
 * - Discovery Review: Comprehensive interface for reviewing discovered places
 * - Swipe Actions: Intuitive swipe-to-save and swipe-to-dismiss gestures
 * - Undo System: Ability to reverse save and dismiss actions
 * - AI Summaries: Enhanced place information with AI-generated summaries
 * - Filtering: Filter discoveries by place type and category
 * - Performance: Optimized loading with smart caching and minimal API calls
 * - Journey Tracking: Real-time journey completion status updates
 * - Onboarding: Guided experience for new users
 * - Error Handling: Comprehensive error recovery and user feedback
 * - Performance: Optimized loading with smart caching and minimal API calls
 * 
 * RELATIONSHIPS:
 * - Uses DiscoveriesService.js for place discovery and API coordination
 * - Works with DiscoveryService.js for data persistence and management
 * - Integrates with JourneyService.js for journey completion tracking
 * - Uses NewPlacesService.js for AI summaries and enhanced place data
 * - Connects with UserContext.js for authentication and user preferences
 * - Uses ThemeContext.js for styling and theming
 * - Works with useSuggestedPlaces hook for automatic place suggestions
 * - Integrates with various UI components for consistent user experience
 * 
 * REFERENCED BY:
 * - AppNavigator.js (as part of the Discoveries tab navigation)
 * - Users spend significant time on this screen reviewing discoveries
 * - Journey completion workflows that direct users to review discoveries
 * - Onboarding flows that introduce the discovery system
 * 
 * REFERENCES:
 * - DiscoveriesService.js (for place discovery algorithms)
 * - DiscoveryService.js (for CRUD operations on discoveries)
 * - JourneyService.js (for journey management)
 * - NewPlacesService.js (for AI summaries and enhanced place data)
 * - UserContext.js (for user authentication and preferences)
 * - ThemeContext.js (for styling and theming)
 * - Multiple UI components (Card, ListItem, AppButton, etc.)
 * - Firebase Firestore (for data persistence)
 * 
 * IMPORTANCE TO APP:
 * CRITICAL - This screen is absolutely essential to Hero's Path's value proposition.
 * It's where users experience the core benefit of the app - discovering interesting
 * places along their walks. The quality of this screen directly impacts user engagement,
 * retention, and satisfaction. Poor discovery experience would make the entire app
 * feel pointless, while great discovery experience creates lasting user engagement.
 * 
 * IMPROVEMENT SUGGESTIONS:
 * 1. Add discovery recommendations - AI-powered suggestions based on user history
 * 2. Add discovery sharing - share interesting discoveries with friends
 * 3. Add discovery collections - organize discoveries into custom collections
 * 4. Add discovery notes - let users add personal notes to discoveries
 * 5. Add discovery photos - attach personal photos to discovered places
 * 6. Add discovery ratings - personal rating system for places
 * 7. Add discovery search - search through discovery history
 * 8. Add discovery analytics - insights about discovery patterns
 * 9. Add discovery challenges - gamify discovery with goals and achievements
 * 10. Add discovery verification - verify and update place information
 * 11. Add discovery clustering - group nearby discoveries for better organization
 * 12. Add discovery timeline - chronological view of discovery history
 * 13. Add discovery export - export discovery data for external use
 * 14. Add discovery social features - community discussions about discoveries
 * 15. Add discovery notifications - alerts about interesting nearby places
 * 16. Add discovery planning - plan future walks based on discovery potential
 * 17. Add discovery insights - personalized insights about discovery behavior
 * 18. Add discovery optimization - optimize discovery algorithms based on user feedback
 * 19. Add discovery accessibility - improve accessibility for users with disabilities
 * 20. Add discovery performance - further optimize loading and interaction performance
 */

// screens/DiscoveriesScreen.js
import React, { useState, useEffect } from 'react';
import { GOOGLE_MAPS_API_KEY_IOS, GOOGLE_MAPS_API_KEY_ANDROID } from '../config';
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
  Animated,
  Dimensions,
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
import { useTheme } from '../contexts/ThemeContext';
import DiscoveryService from '../services/DiscoveryService';
import JourneyService from '../services/JourneyService';
import { 
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  serverTimestamp,
  writeBatch,
  doc
} from 'firebase/firestore';
import { db } from '../firebase';
import Logger from '../utils/Logger';
import Card from '../components/ui/Card';
import ListItem from '../components/ui/ListItem';
import AppButton from '../components/ui/AppButton';
import SectionHeader from '../components/ui/SectionHeader';

const LANGUAGE_KEY = '@user_language';
const ROUTES_KEY   = '@saved_routes';

// Helper function to get platform-specific API key
const getPlacesAPIKey = () => {
  const key = Platform.OS === 'ios' ? GOOGLE_MAPS_API_KEY_IOS : GOOGLE_MAPS_API_KEY_ANDROID;
  return key || ''; // Return empty string if undefined to avoid "key=undefined" in URL
};

// Remove dummy data
// const DUMMY_DISMISSED_PLACES = [...];
// const DUMMY_DISCOVERED_PLACES = [...];

export default function DiscoveriesScreen({ navigation, route }) {
  const { user, migrationStatus } = useUser();
  const { getCurrentThemeColors } = useTheme();
  const colors = getCurrentThemeColors();
  
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
        if (route.params?.journeyId) {
          // Find the journey by ID from the passed parameter
          const journey = journeys.find(j => j.id === route.params.journeyId);
          if (journey) {
            setSelectedRoute(journey);
          } else {
            Logger.warn('DISCOVERIES_SCREEN', 'Journey not found for ID:', route.params.journeyId);
            if (journeys.length > 0) {
              setSelectedRoute(journeys[0]);
            }
          }
        } else if (route.params?.selectedRoute) {
          setSelectedRoute(route.params.selectedRoute);
        } else if (journeys.length > 0) {
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
        if (route.params?.journeyId) {
          // Find the journey by ID from the passed parameter
          const journey = journeys.find(j => j.id === route.params.journeyId);
          if (journey) {
            setSelectedRoute(journey);
          } else {
            Logger.warn('DISCOVERIES_SCREEN', 'Journey not found for ID:', route.params.journeyId);
            if (journeys.length > 0) {
              setSelectedRoute(journeys[0]);
            }
          }
        } else if (route.params?.selectedRoute) {
          setSelectedRoute(route.params.selectedRoute);
        } else if (journeys.length > 0) {
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

    // Check if we should show onboarding
    AsyncStorage.getItem('@discovery_onboarding_shown')
      .then(shown => {
        if (!shown && user) {
          setShowOnboarding(true);
        }
      });
  }, [user]);

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
              
              // Save new discoveries to Firestore so they persist
              if (newSuggestions && newSuggestions.length > 0) {
                Logger.debug('DISCOVERIES_SCREEN', 'Saving new discoveries to Firestore', {
                  count: newSuggestions.length
                });
                
                try {
                  // Save each discovery using the existing DiscoveryService
                  for (const place of newSuggestions) {
                    const discoveryData = {
                      journeyId: selectedRoute.id,
                      placeId: place.placeId,
                      placeName: place.name,
                      placeType: place.types?.[0] || 'unknown',
                      location: {
                        lat: place.latitude || place.geometry?.location?.lat,
                        lng: place.longitude || place.geometry?.location?.lng,
                      },
                      discoveredAt: new Date(),
                      dismissed: false,
                      saved: false,
                      placeData: {
                        name: place.name,
                        types: place.types || [],
                        rating: place.rating,
                        photos: place.photos || [],
                        formatted_address: place.formatted_address,
                        ...Object.fromEntries(
                          Object.entries(place).filter(([_, value]) => value !== undefined)
                        )
                      }
                    };
                    
                    await DiscoveryService.createDiscovery(user.uid, discoveryData);
                  }
                  
                  Logger.debug('DISCOVERIES_SCREEN', 'Successfully saved new discoveries to Firestore');
                  
                  // Reload discoveries from Firestore to get the saved data
                  const updatedJourneyDiscoveries = await DiscoveryService.getJourneyDiscoveries(user.uid, selectedRoute.id);
                  if (updatedJourneyDiscoveries.success && updatedJourneyDiscoveries.discoveries) {
                    const unreviewed = updatedJourneyDiscoveries.discoveries.filter(
                      discovery => !discovery.saved && !discovery.dismissed
                    );
                    
                    const updatedFirestoreSuggestions = unreviewed.map(discovery => ({
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
                    
                    allSuggestions = updatedFirestoreSuggestions;
                  }
                } catch (saveError) {
                  Logger.error('DISCOVERIES_SCREEN', 'Error saving new discoveries to Firestore', saveError);
                  // Continue with the suggestions even if saving fails
                  allSuggestions = [...firestoreSuggestions, ...newSuggestions];
                }
              } else {
                allSuggestions = [...firestoreSuggestions, ...newSuggestions];
              }
            } catch (apiError) {
              Logger.error('DISCOVERIES_SCREEN', 'Error in getSuggestionsForRoute', apiError);
              newSuggestions = [];
              allSuggestions = firestoreSuggestions;
            }
          } else {
            Logger.debug('DISCOVERIES_SCREEN', 'Existing journey with discoveries - skipping API calls to save performance');
            Logger.debug('DISCOVERIES_SCREEN', 'Found', journeyDiscoveries.discoveries.length, 'existing discoveries');
        
        // Log the final suggestions that will be set
        Logger.filter('DISCOVERIES_SCREEN', 'SUGGESTIONS_LOADED', 'existing', {
          totalSuggestions: allSuggestions.length,
          suggestions: allSuggestions.map(s => ({
            name: s.name,
            category: s.category,
            types: s.types
          }))
        });
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
            
                          // Save new discoveries to Firestore so they persist
              if (newSuggestions && newSuggestions.length > 0) {
                Logger.debug('DISCOVERIES_SCREEN', 'Saving new discoveries to Firestore (no existing discoveries)', {
                  count: newSuggestions.length
                });
                
                try {
                  // Save each discovery using the existing DiscoveryService
                  for (const place of newSuggestions) {
                    const discoveryData = {
                      journeyId: selectedRoute.id,
                      placeId: place.placeId,
                      placeName: place.name,
                      placeType: place.types?.[0] || 'unknown',
                      location: {
                        lat: place.latitude || place.geometry?.location?.lat,
                        lng: place.longitude || place.geometry?.location?.lng,
                      },
                      discoveredAt: new Date(),
                      dismissed: false,
                      saved: false,
                      placeData: {
                        name: place.name,
                        types: place.types || [],
                        rating: place.rating,
                        photos: place.photos || [],
                        formatted_address: place.formatted_address,
                        ...Object.fromEntries(
                          Object.entries(place).filter(([_, value]) => value !== undefined)
                        )
                      }
                    };
                    
                    await DiscoveryService.createDiscovery(user.uid, discoveryData);
                  }
                  
                  Logger.debug('DISCOVERIES_SCREEN', 'Successfully saved new discoveries to Firestore (no existing discoveries)');
                  
                  // Reload discoveries from Firestore to get the saved data
                  const updatedJourneyDiscoveries = await DiscoveryService.getJourneyDiscoveries(user.uid, selectedRoute.id);
                  if (updatedJourneyDiscoveries.success && updatedJourneyDiscoveries.discoveries) {
                    const unreviewed = updatedJourneyDiscoveries.discoveries.filter(
                      discovery => !discovery.saved && !discovery.dismissed
                    );
                    
                    const updatedFirestoreSuggestions = unreviewed.map(discovery => ({
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
                    
                    allSuggestions = updatedFirestoreSuggestions;
                  }
                } catch (saveError) {
                  Logger.error('DISCOVERIES_SCREEN', 'Error saving new discoveries to Firestore (no existing discoveries)', saveError);
                  // Continue with the suggestions even if saving fails
                  allSuggestions = newSuggestions;
                }
              } else {
                allSuggestions = newSuggestions;
              }
          } catch (apiError) {
            Logger.error('DISCOVERIES_SCREEN', 'Error in getSuggestionsForRoute (no existing discoveries)', apiError);
            newSuggestions = [];
            allSuggestions = [];
          }
        }
        
        Logger.debug('DISCOVERIES_SCREEN', 'Total suggestions:', allSuggestions.length, '(Firestore:', allSuggestions.filter(s => s.fromFirestore).length, 'API:', allSuggestions.filter(s => !s.fromFirestore).length, ')');
        
        // Log the suggestions being set
        Logger.filter('DISCOVERIES_SCREEN', 'SETTING_SUGGESTIONS', 'all', {
          totalSuggestions: allSuggestions.length,
          firestoreCount: allSuggestions.filter(s => s.fromFirestore).length,
          apiCount: allSuggestions.filter(s => !s.fromFirestore).length,
          suggestions: allSuggestions.map(s => ({
            name: s.name,
            category: s.category,
            types: s.types,
            fromFirestore: s.fromFirestore
          }))
        });
        
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



  // Define place type categories and their relationships
  const PLACE_CATEGORIES = {
    // Food & Drink - Primary category
    food_drink: {
      primary: ['restaurant', 'cafe', 'bar', 'bakery', 'meal_takeaway'],
      types: {
        restaurant: ['restaurant', 'japanese_restaurant', 'italian_restaurant', 'pizza_restaurant', 'seafood_restaurant', 'steak_house', 'mexican_restaurant', 'chinese_restaurant', 'indian_restaurant', 'thai_restaurant', 'korean_restaurant', 'vietnamese_restaurant', 'french_restaurant', 'greek_restaurant', 'mediterranean_restaurant', 'american_restaurant'],
        cafe: ['cafe', 'coffee_shop', 'tea_house', 'bubble_tea_shop'],
        bar: ['bar', 'pub', 'night_club', 'wine_bar', 'cocktail_bar', 'beer_garden'],
        bakery: ['bakery', 'donut_shop', 'patisserie', 'bread_shop'],
        meal_takeaway: ['meal_takeaway', 'fast_food_restaurant']
      }
    },
    // Shopping - Primary category
    shopping: {
      primary: ['shopping_mall', 'store', 'convenience_store'],
      types: {
        shopping_mall: ['shopping_mall', 'department_store'],
        store: ['store', 'clothing_store', 'jewelry_store', 'book_store', 'electronics_store', 'home_goods_store'],
        convenience_store: ['convenience_store']
      }
    },
    // Entertainment & Culture - Primary category
    entertainment_culture: {
      primary: ['museum', 'art_gallery', 'night_club', 'tourist_attraction', 'zoo', 'stadium', 'concert_hall', 'movie_theater'],
      types: {
        museum: ['museum'],
        art_gallery: ['art_gallery'],
        night_club: ['night_club'],
        tourist_attraction: ['tourist_attraction', 'historical_landmark', 'historical_place', 'monument', 'memorial'],
        zoo: ['zoo'],
        stadium: ['stadium'],
        concert_hall: ['concert_hall', 'theater', 'auditorium'],
        movie_theater: ['movie_theater']
      }
    },
    // Health & Wellness - Primary category
    health_wellness: {
      primary: ['gym', 'pharmacy'],
      types: {
        gym: ['gym', 'fitness_center', 'yoga_studio', 'spa', 'beauty_salon'],
        pharmacy: ['pharmacy']
      }
    },
    // Services & Utilities - Primary category
    services_utilities: {
      primary: ['bank', 'atm', 'gas_station'],
      types: {
        bank: ['bank'],
        atm: ['atm'],
        gas_station: ['gas_station']
      }
    },
    // Outdoors & Recreation - Primary category
    outdoors_recreation: {
      primary: ['park', 'lodging'],
      types: {
        park: ['park', 'plaza', 'playground', 'natural_feature', 'beach', 'mountain'],
        lodging: ['lodging', 'hotel', 'motel', 'hostel', 'resort', 'bed_and_breakfast', 'campground']
      }
    }
  };

  // Define mixed-use place categories that should be excluded from cross-category filtering
  const MIXED_USE_CATEGORIES = {
    // Multi-purpose buildings
    multi_purpose: ['shopping_mall', 'condominium_complex', 'convenience_store', 'hotel', 'airport'],
    // Cultural venues that often have food/drink
    cultural_with_food: ['museum', 'art_gallery', 'tourist_attraction', 'historical_landmark', 'historical_place'],
    // Entertainment venues that often have food/drink
    entertainment_with_food: ['stadium', 'concert_hall', 'movie_theater', 'theater', 'auditorium'],
    // Places that are primarily one category but commonly offer services from another
    hybrid_places: ['cafe', 'bar', 'night_club', 'restaurant']
  };

  // Helper function to get allowed types for a filter
  const getAllowedTypesForFilter = (filterType) => {
    // Find which category this filter belongs to
    for (const [categoryKey, category] of Object.entries(PLACE_CATEGORIES)) {
      if (category.types[filterType]) {
        return category.types[filterType];
      }
    }
    // Fallback to single type if not found in categories
    return [filterType];
  };

  // Helper function to check if a place is a mixed-use place
  const isMixedUsePlace = (placeCategory, placeTypes) => {
    // Check if it's in any mixed-use category
    for (const category of Object.values(MIXED_USE_CATEGORIES)) {
      if (category.includes(placeCategory)) {
        return true;
      }
    }
    
    // Check for cross-category contamination
    const placeCategoryGroup = getCategoryGroup(placeCategory);
    const hasCrossCategoryTypes = placeTypes.some(type => {
      const typeGroup = getCategoryGroup(type);
      return typeGroup && typeGroup !== placeCategoryGroup;
    });
    
    return hasCrossCategoryTypes;
  };

  // Helper function to get the category group for a place type
  const getCategoryGroup = (placeType) => {
    for (const [categoryKey, category] of Object.entries(PLACE_CATEGORIES)) {
      for (const [subCategory, types] of Object.entries(category.types)) {
        if (types.includes(placeType)) {
          return categoryKey;
        }
      }
    }
    return null;
  };

  // Filter suggestions based on selected type
  const filteredSuggestions = filterType && filterType !== 'all' 
    ? suggestions.filter(place => {
        // Handle both new API and legacy API place type structures
        const placeTypes = place.types || [];
        const placeCategory = place.category || place.placeType || 'unknown';
        
        // Get the specific types for this filter
        const allowedTypes = getAllowedTypesForFilter(filterType);
        
        // Check if the place's primary category matches any of the allowed types
        const primaryMatch = allowedTypes.includes(placeCategory);
        
        // Check if any of the place's types match the allowed types
        const typeMatch = placeTypes.some(type => allowedTypes.includes(type));
        
        // Check if this is a mixed-use place that should be excluded from cross-category filtering
        const isMixedUse = isMixedUsePlace(placeCategory, placeTypes);
        
        // A place matches if:
        // 1. Its primary category matches the filter, OR
        // 2. It has matching types AND is not a mixed-use place
        const matches = primaryMatch || (typeMatch && !isMixedUse);
        
        // Comprehensive debug logging for all filter types
        Logger.filter('DISCOVERIES_SCREEN', 'FILTERING_PLACE', filterType, {
          placeName: place.name,
          placeTypes,
          placeCategory,
          allowedTypes,
          primaryMatch,
          typeMatch,
          isMixedUse,
          categoryGroup: getCategoryGroup(placeCategory),
          matches
        });
        
        return matches;
      })
    : suggestions;

  // Log filter results
  Logger.filter('DISCOVERIES_SCREEN', 'FILTER_RESULTS', filterType || 'all', {
    totalSuggestions: suggestions.length,
    filteredCount: filteredSuggestions.length,
    filterType: filterType || 'all'
  });

  // Render swipe actions for left (save) and right (dismiss)
  const renderLeftActions = (place, progress, dragX) => {
    const trans = dragX.interpolate({
      inputRange: [0, 50, 100, 101],
      outputRange: [-20, 0, 0, 1],
    });
    return (
      <View style={styles.action}>
        <Animated.View style={[styles.save, { transform: [{ translateX: trans }] }]}>
          <MaterialIcons name="favorite" size={24} color={colors.background} />
          <Text style={[styles.actionText, { color: colors.background }]}>Save</Text>
        </Animated.View>
      </View>
    );
  };

  const renderRightActions = (place, progress, dragX) => {
    const trans = dragX.interpolate({
      inputRange: [-101, -100, -50, 0],
      outputRange: [1, 0, 0, 20],
    });
    return (
      <View style={styles.action}>
        <Animated.View style={[styles.dismiss, { transform: [{ translateX: trans }] }]}>
          <MaterialIcons name="close" size={24} color={colors.background} />
          <Text style={[styles.actionText, { color: colors.background }]}>Dismiss</Text>
        </Animated.View>
      </View>
    );
  };

  // Enhanced suggestion card with swipe actions and AI summaries
  const renderSuggestion = ({ item }) => (
    <Swipeable
      renderLeftActions={(progress, dragX) => renderLeftActions(item, progress, dragX)}
      renderRightActions={(progress, dragX) => renderRightActions(item, progress, dragX)}
      onSwipeableLeftOpen={() => handleSave(item)}
      onSwipeableRightOpen={() => handleDismiss(item)}
    >
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface }]}
        onPress={() => {
          const url =
            `https://www.google.com/maps/search/?api=1` +
            `&query=${encodeURIComponent(item.name)}` +
            `&query_place_id=${item.placeId}`;
          Linking.openURL(url);
        }}
      >
        {item.photos && item.photos[0] ? (
          <Image 
            source={{ 
              uri: item.photos[0].photo_reference 
                ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${item.photos[0].photo_reference}&key=${getPlacesAPIKey()}` 
                : undefined 
            }} 
            style={[styles.thumb, { backgroundColor: colors.surface }]} 
          />
        ) : (
          <View style={[styles.thumb, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="place" size={40} color={colors.textSecondary} />
          </View>
        )}
        
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
          
          {item.types && item.types.length > 0 && (
            <Text style={[styles.combinedTypes, { color: colors.primary }]}>
              {item.types.slice(0, 3).join(' • ')}
            </Text>
          )}
          
          {item.formatted_address && (
            <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
              {item.formatted_address}
            </Text>
          )}
          
          {item.rating && (
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              ⭐ {item.rating.toFixed(1)}
            </Text>
          )}

          {/* AI Summary Section */}
          {aiSummaries[item.placeId] && !aiSummaries[item.placeId].noSummary && !aiSummaries[item.placeId].error ? (
            <View style={[styles.summaryContainer, { backgroundColor: colors.primary + '10' }]}>
              <Text style={[styles.summaryTitle, { color: colors.primary }]}>AI Summary</Text>
              <Text style={[styles.summaryText, { color: colors.text }]}>
                {aiSummaries[item.placeId].historical || 
                 aiSummaries[item.placeId].cultural || 
                 aiSummaries[item.placeId].general || 
                 'Enhanced information available'}
              </Text>
              {aiSummaries[item.placeId].source && (
                <Text style={[styles.summaryTypeIndicator, { color: colors.textSecondary }]}>
                  Source: {aiSummaries[item.placeId].source}
                </Text>
              )}
            </View>
          ) : loadingSummaries[item.placeId] ? (
            <View style={styles.summaryLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.summaryLoadingText, { color: colors.textSecondary }]}>
                Loading AI summary...
              </Text>
            </View>
          ) : !aiSummaries[item.placeId] ? (
            <TouchableOpacity
              style={[styles.summaryButton, { backgroundColor: colors.primary + '10' }]}
              onPress={() => fetchAiSummary(item.placeId)}
            >
              <MaterialIcons name="auto-awesome" size={16} color={colors.primary} />
              <Text style={[styles.summaryButtonText, { color: colors.primary }]}>
                Get AI Summary
              </Text>
            </TouchableOpacity>
          ) : aiSummaries[item.placeId].error ? (
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary + '10' }]}
              onPress={() => {
                setAiSummaries(prev => ({ ...prev, [item.placeId]: undefined }));
                fetchAiSummary(item.placeId);
              }}
            >
              <Text style={[styles.retryButtonText, { color: colors.primary }]}>
                Retry AI Summary
              </Text>
            </TouchableOpacity>
          ) : null}
          
          <View style={styles.disclosureContainer}>
            <Text style={[styles.disclosureText, { color: colors.textSecondary }]}>
              Swipe left to save, right to dismiss
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Enhanced Header with Stats and Management */}
      <View style={[styles.headerRow, { backgroundColor: colors.background, borderBottomColor: colors.tabInactive + '20' }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Discoveries</Text>
          <View style={styles.headerStats}>
            <Text style={[styles.headerStatText, { color: colors.textSecondary }]}>
              {filteredSuggestions.length} to review
            </Text>
            <Text style={[styles.headerStatText, { color: colors.textSecondary }]}>
              {savedPlaces.length} saved
            </Text>
            <Text style={[styles.headerStatText, { color: colors.textSecondary }]}>
              {dismissedPlaces.length} dismissed
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {__DEV__ && (
            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: colors.primary + '10' }]}
              onPress={testAISummariesFeature}
            >
              <MaterialIcons name="science" size={16} color={colors.primary} />
              <Text style={[styles.testButtonText, { color: colors.primary }]}>
                Test AI
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.gearButton, { backgroundColor: colors.primary + '10' }]}
            onPress={() => setShowSettingsModal(true)}
          >
            <MaterialIcons name="settings" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.manageButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowManageHistory(true)}
          >
            <Text style={[styles.manageButtonText, { color: colors.background }]}>
              Manage
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Filter Controls */}
      <View style={[styles.filterContainer, { borderBottomColor: colors.tabInactive + '20' }]}>
        {/* Route Selection */}
        <View style={styles.dropdownWrapper}>
          <TouchableOpacity
            style={[styles.pickerToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setRouteDropdownVisible(!routeDropdownVisible)}
          >
            <Text style={[styles.pickerToggleText, { color: colors.text }]}>
              {selectedRoute?.name || 'Select Journey'}
            </Text>
            <MaterialIcons 
              name={routeDropdownVisible ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
              size={20} 
              color={colors.text} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Type Filter */}
        <View style={styles.dropdownWrapper}>
          <TouchableOpacity
            style={[styles.pickerToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setTypeDropdownVisible(!typeDropdownVisible)}
          >
            <Text style={[styles.pickerToggleText, { color: colors.text }]}>
              {filterType ? PLACE_TYPES.find(type => type.key === filterType)?.label || filterType : 'All Types'}
            </Text>
            <MaterialIcons 
              name={typeDropdownVisible ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
              size={20} 
              color={colors.text} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Route Selection Modal */}
      <Modal
        visible={routeDropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRouteDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setRouteDropdownVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <ScrollView style={styles.modalScrollView}>
              {savedRoutes.map((route) => (
                <TouchableOpacity
                  key={route.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedRoute(route);
                    setRouteDropdownVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, { color: colors.text }]}>
                    {route.name || `${new Date(route.date).toLocaleDateString()} ${new Date(route.date).toLocaleTimeString()}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Filter Dropdown Modal */}
      <Modal
        visible={typeDropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setTypeDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setTypeDropdownVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <ScrollView style={styles.modalScrollView}>
              {PLACE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={styles.modalItem}
                  onPress={() => {
                    setFilterType(type.key === 'all' ? null : type.key);
                    setTypeDropdownVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, { color: colors.text }]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredSuggestions}
          keyExtractor={item => item.placeId}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={() => (
            <View style={styles.center}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {filterType && filterType !== 'all' 
                  ? `No ${PLACE_TYPES.find(type => type.key === filterType)?.label?.toLowerCase()} found for this journey.`
                  : 'No discoveries found for this journey.'
                }
              </Text>
            </View>
          )}
          renderItem={renderSuggestion}
        />
      )}

      {/* Onboarding Modal */}
      <Modal
        visible={showOnboarding}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOnboarding(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.onboardingModal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.onboardingTitle, { color: colors.text }]}>
              Welcome to Discoveries! 🗺️
            </Text>
            <View style={styles.onboardingContent}>
              <View style={styles.onboardingItem}>
                <MaterialIcons name="swipe" size={24} color={colors.primary} />
                <Text style={[styles.onboardingText, { color: colors.text }]}>
                  Swipe left to save places you're interested in
                </Text>
              </View>
              <View style={styles.onboardingItem}>
                <MaterialIcons name="close" size={24} color={colors.primary} />
                <Text style={[styles.onboardingText, { color: colors.text }]}>
                  Swipe right to dismiss places you're not interested in
                </Text>
              </View>
              <View style={styles.onboardingItem}>
                <MaterialIcons name="auto-awesome" size={24} color={colors.primary} />
                <Text style={[styles.onboardingText, { color: colors.text }]}>
                  Tap "Get AI Summary" for enhanced place information
                </Text>
              </View>
              <View style={styles.onboardingItem}>
                <MaterialIcons name="history" size={24} color={colors.primary} />
                <Text style={[styles.onboardingText, { color: colors.text }]}>
                  Use "Manage" to review and restore saved or dismissed places
                </Text>
              </View>
            </View>
            <View style={styles.onboardingButtons}>
              <TouchableOpacity
                style={[styles.onboardingButton, { backgroundColor: colors.primary }]}
                onPress={completeOnboarding}
              >
                <Text style={[styles.onboardingButtonText, { color: colors.background }]}>
                  Got it!
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Dismiss Options Modal */}
      <Modal
        visible={showDismissModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDismissModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.dismissModal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.dismissModalTitle, { color: colors.text }]}>
              How long should we hide this place?
            </Text>
            <View style={styles.dismissOptions}>
              <TouchableOpacity
                style={styles.dismissOption}
                onPress={() => handleDismissModalAction('30days')}
              >
                <MaterialIcons name="schedule" size={24} color={colors.primary} />
                <Text style={[styles.dismissOptionText, { color: colors.text }]}>
                  Hide for 30 days
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dismissOption}
                onPress={() => handleDismissModalAction('forever')}
              >
                <MaterialIcons name="visibility-off" size={24} color={colors.primary} />
                <Text style={[styles.dismissOptionText, { color: colors.text }]}>
                  Hide forever
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.rememberChoiceContainer}>
              <TouchableOpacity
                style={[styles.checkbox, { borderColor: colors.primary }]}
                onPress={() => setRememberChoice(!rememberChoice)}
              >
                {rememberChoice && (
                  <MaterialIcons name="check" size={16} color={colors.primary} />
                )}
              </TouchableOpacity>
              <Text style={[styles.rememberChoiceText, { color: colors.text }]}>
                Remember my choice for future dismissals
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.settingsModal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.settingsModalTitle, { color: colors.text }]}>
              Discovery Settings
            </Text>
            <View style={styles.settingsContent}>
              <Text style={[styles.settingsSectionTitle, { color: colors.text }]}>
                Default Dismissal Behavior
              </Text>
              <TouchableOpacity
                style={[
                  styles.settingsOption,
                  dismissalPreference === 'ask' && styles.settingsOptionActive,
                  { backgroundColor: dismissalPreference === 'ask' ? colors.primary + '20' : colors.surface }
                ]}
                onPress={() => setDismissalPreference('ask')}
              >
                <MaterialIcons 
                  name={dismissalPreference === 'ask' ? 'radio-button-checked' : 'radio-button-unchecked'} 
                  size={20} 
                  color={colors.primary} 
                />
                <Text style={[styles.settingsOptionText, { color: colors.text }]}>
                  Always ask (recommended)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.settingsOption,
                  dismissalPreference === '30days' && styles.settingsOptionActive,
                  { backgroundColor: dismissalPreference === '30days' ? colors.primary + '20' : colors.surface }
                ]}
                onPress={() => setDismissalPreference('30days')}
              >
                <MaterialIcons 
                  name={dismissalPreference === '30days' ? 'radio-button-checked' : 'radio-button-unchecked'} 
                  size={20} 
                  color={colors.primary} 
                />
                <Text style={[styles.settingsOptionText, { color: colors.text }]}>
                  Hide for 30 days
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.settingsOption,
                  dismissalPreference === 'forever' && styles.settingsOptionActive,
                  { backgroundColor: dismissalPreference === 'forever' ? colors.primary + '20' : colors.surface }
                ]}
                onPress={() => setDismissalPreference('forever')}
              >
                <MaterialIcons 
                  name={dismissalPreference === 'forever' ? 'radio-button-checked' : 'radio-button-unchecked'} 
                  size={20} 
                  color={colors.primary} 
                />
                <Text style={[styles.settingsOptionText, { color: colors.text }]}>
                  Hide forever
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.settingsButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                AsyncStorage.setItem('@dismissal_preference', dismissalPreference);
                setShowSettingsModal(false);
              }}
            >
              <Text style={[styles.settingsButtonText, { color: colors.background }]}>
                Save Settings
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Manage History Modal */}
      <Modal
        visible={showManageHistory}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowManageHistory(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.manageHistoryModal, { backgroundColor: colors.surface }]}>
            <View style={[styles.manageHistoryHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.manageHistoryTitle, { color: colors.text }]}>
                Manage Discovery History
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowManageHistory(false)}
              >
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.manageHistoryContent}>
              {/* Saved Places Section */}
              <View style={[styles.manageHistorySectionHeader, { backgroundColor: colors.surface }]}>
                <Text style={[styles.manageHistorySectionTitle, { color: colors.text }]}>
                  Saved Places ({savedPlaces.length})
                </Text>
                <TouchableOpacity onPress={() => setDiscoveredSectionCollapsed(!discoveredSectionCollapsed)}>
                  <MaterialIcons 
                    name={discoveredSectionCollapsed ? 'expand-more' : 'expand-less'} 
                    size={24} 
                    color={colors.text} 
                  />
                </TouchableOpacity>
              </View>
              {!discoveredSectionCollapsed && savedPlaces.map((place, index) => (
                <View key={place.id || place.placeId || index} style={[styles.manageHistoryItem, { backgroundColor: colors.surface }]}>
                  <View style={styles.manageHistoryItemInfo}>
                    <Text style={[styles.manageHistoryItemName, { color: colors.text }]}>
                      {place.placeData?.name || place.placeName || 'Unknown Place'}
                    </Text>
                    <Text style={[styles.manageHistoryItemCategory, { color: colors.textSecondary }]}>
                      {place.placeData?.types?.[0] || place.placeType || 'Unknown type'}
                    </Text>
                    <Text style={[styles.manageHistoryItemTime, { color: colors.textSecondary }]}>
                      Saved {formatTimeAgo(place.savedAt || place.discoveredAt)}
                    </Text>
                  </View>
                  <View style={styles.manageHistoryItemActions}>
                    <TouchableOpacity
                      style={[styles.dismissButton, { backgroundColor: colors.danger }]}
                      onPress={() => handleUndoSave(place)}
                    >
                      <Text style={[styles.dismissButtonText, { color: colors.background }]}>
                        Remove
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* Dismissed Places Section */}
              <View style={[styles.manageHistorySectionHeader, { backgroundColor: colors.surface }]}>
                <Text style={[styles.manageHistorySectionTitle, { color: colors.text }]}>
                  Dismissed Places ({dismissedPlaces.length})
                </Text>
                <TouchableOpacity onPress={() => setDismissedSectionCollapsed(!dismissedSectionCollapsed)}>
                  <MaterialIcons 
                    name={dismissedSectionCollapsed ? 'expand-more' : 'expand-less'} 
                    size={24} 
                    color={colors.text} 
                  />
                </TouchableOpacity>
              </View>
              {!dismissedSectionCollapsed && dismissedPlaces.map((place, index) => (
                <View key={place.id || place.placeId || index} style={[styles.manageHistoryItem, { backgroundColor: colors.surface }]}>
                  <View style={styles.manageHistoryItemInfo}>
                    <Text style={[styles.manageHistoryItemName, { color: colors.text }]}>
                      {place.placeData?.name || place.placeName || 'Unknown Place'}
                    </Text>
                    <Text style={[styles.manageHistoryItemCategory, { color: colors.textSecondary }]}>
                      {place.placeData?.types?.[0] || place.placeType || 'Unknown type'}
                    </Text>
                    <Text style={[styles.manageHistoryItemTime, { color: colors.textSecondary }]}>
                      Dismissed {formatTimeAgo(place.dismissedAt)} • {place.dismissedForever ? 'Forever' : '30 days'}
                    </Text>
                  </View>
                  <View style={styles.manageHistoryItemActions}>
                    <TouchableOpacity
                      style={[styles.restoreButton, { backgroundColor: colors.primary }]}
                      onPress={() => handleUndoDismiss(place)}
                    >
                      <Text style={[styles.restoreButtonText, { color: colors.background }]}>
                        Restore
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Enhanced Header Styles
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.h2,
    marginBottom: Spacing.xs / 2,
  },
  headerStats: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerStatText: {
    ...Typography.caption,
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
  },
  manageButton: {
    padding: Spacing.sm,
    borderRadius: Layout.borderRadius,
  },
  manageButtonText: {
    ...Typography.body,
    fontWeight: '600',
  },
  dropdownWrapper: {
    flex: 1,
    marginHorizontal: Spacing.xs / 2,
  },
  pickerToggle: {
    padding: Spacing.sm,
    borderRadius: Layout.borderRadius,
    borderWidth: 1,
  },
  pickerToggleText: {
    ...Typography.body,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
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
  save: { 
    backgroundColor: '#4CAF50', // Green for save
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: Layout.borderRadius,
  },
  dismiss: { 
    backgroundColor: '#F44336', // Red for dismiss
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: Layout.borderRadius,
  },
  actionText: {
    ...Typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: Spacing.xs,
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

  // Filter Styles
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.tabInactive + '20',
  },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: 40,
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
