/*
 * MAP SCREEN (CORE APP SCREEN)
 * ============================
 * 
 * PURPOSE:
 * This is the heart of Hero's Path - the main screen where users track their walks,
 * see their progress in real-time, and interact with the core features. It displays
 * a Google Maps interface with GPS tracking, route recording, animated Link sprite,
 * saved places, and the ping functionality. Think of it as the "adventure interface"
 * where all the walking and discovery magic happens.
 * 
 * FUNCTIONALITY:
 * - Real-time GPS location tracking with animated Link sprite that moves and faces direction
 * - Route recording with glowing polylines that show the user's walking path
 * - Location permission management with automatic requests and background permission warnings
 * - Journey saving with distance calculation, duration tracking, and Firestore storage
 * - Ping functionality for real-time place discovery during walks
 * - Display of saved places and past journey routes on the map
 * - Theme-aware map styling with 5 different map styles (Standard, Satellite, etc.)
 * - Background location permission warnings to ensure accurate tracking
 * - Error handling for location services and map rendering issues
 * 
 * WHY IT EXISTS:
 * This is the primary interface for Hero's Path's core value proposition: gamified
 * walking with discovery. Users spend most of their time on this screen during active
 * walks. It needs to be engaging, accurate, and responsive to make walking feel like
 * an adventure rather than just exercise. The animated sprite and visual feedback
 * transform mundane walks into engaging experiences.
 * 
 * KEY FEATURES:
 * - Animated Link sprite that shows walking direction and movement
 * - Real-time route tracking with glowing polylines
 * - Ping button for discovering places during walks (with credits and cooldown)
 * - Map style switching (Adventure, Night, Satellite, etc.)
 * - Background permission warnings for accurate GPS tracking
 * - Journey completion workflow with automatic saving
 * - Display of past journeys and saved places for context
 * - Theme integration for consistent visual experience
 * 
 * RELATIONSHIPS:
 * - Uses multiple contexts: UserContext (auth), ThemeContext (styling), ExplorationContext (history)
 * - Integrates with JourneyService for saving completed walks
 * - Uses DiscoveryService for managing place discoveries
 * - Works with PingButton and PingStats components for real-time discovery
 * - Uses PingAnimation for visual feedback (currently disabled)
 * - Connects to various services for data persistence and API calls
 * 
 * REFERENCED BY:
 * - App.js (as the main screen in the Drawer navigation)
 * - Most users spend majority of their time on this screen during active use
 * - Other screens reference this as the "home" or main app experience
 * 
 * REFERENCES:
 * - ThemeContext (for map styling and UI theming)
 * - UserContext (for user authentication and data)
 * - ExplorationContext (for tracking exploration history)
 * - JourneyService (for saving completed journeys)
 * - DiscoveryService (for managing place discoveries)
 * - PingButton, PingStats, PingAnimation components
 * - Location services (expo-location)
 * - Google Maps (react-native-maps)
 * 
 * IMPORTANCE TO APP:
 * CRITICAL - This is the most important screen in the entire app. It's where users
 * spend most of their time and experience the core value proposition. If this screen
 * doesn't work well, the entire app fails. The GPS tracking, visual feedback, and
 * user experience on this screen determine whether users continue using the app.
 * 
 * IMPROVEMENT SUGGESTIONS:
 * 1. Add offline map support - download map tiles for offline use
 * 2. Add route planning - let users plan routes before walking
 * 3. Add compass mode - show traditional compass for navigation
 * 4. Add AR integration - augmented reality for enhanced discovery
 * 5. Add weather overlay - show weather conditions on the map
 * 6. Add traffic information - real-time traffic data for route planning
 * 7. Add elevation profile - show terrain elevation for hiking
 * 8. Add social features - see friends' locations and journeys
 * 9. Add guided tours - pre-planned discovery routes
 * 10. Add voice navigation - audio cues for route following
 * 11. Add fitness tracking - heart rate, calories, step counting
 * 12. Add photo integration - take and associate photos with locations
 * 13. Add landmark recognition - automatic identification of notable places
 * 14. Add route sharing - share interesting routes with other users
 * 15. Add achievement notifications - celebrate milestones during walks
 * 16. Add better error recovery - handle GPS and network failures gracefully
 * 17. Add performance optimization - reduce battery usage and improve responsiveness
 * 18. Add accessibility improvements - better support for users with disabilities
 * 19. Add customizable UI - let users customize button placement and visibility
 * 20. Add emergency features - SOS functionality and emergency contacts
 */
// NOTE: This screen now uses react-native-maps. Make sure to install it with:
//   npx expo install react-native-maps
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  Image,
  Dimensions,
  Platform,
  Linking,
  AppState,
  Modal,
  TextInput,
} from 'react-native';
import { AppleMaps, GoogleMaps } from 'expo-maps';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getFallbackTheme } from '../styles/theme';
import { useUser } from '../contexts/UserContext';
import { useExploration } from '../contexts/ExplorationContext';
import { Spacing, Typography, Layout, Shadows } from '../styles/theme';
import PingButton from '../components/PingButton';
import PingStats from '../components/PingStats';
import PingAnimation from '../components/PingAnimation';
import JourneyService from '../services/JourneyService';
import DiscoveryService from '../services/DiscoveryService';
import BackgroundLocationService from '../services/BackgroundLocationService';
import Logger from '../utils/Logger';
import SectionHeader from '../components/ui/SectionHeader';
import AppButton from '../components/ui/AppButton';
import Constants from 'expo-constants';
import { GOOGLE_MAPS_API_KEY_IOS } from '../config';

const { width, height } = Dimensions.get('window');

// Sprite animation states
const SPRITE_STATES = {
  IDLE: 'idle',
  WALK_DOWN: 'walk_down',
  WALK_UP: 'walk_up',
  WALK_LEFT: 'walk_left',
  WALK_RIGHT: 'walk_right',
};

// Simple sprite colors instead of GIF files
const SPRITE_COLORS = {
  [SPRITE_STATES.IDLE]: '#4A90E2',      // Blue
  [SPRITE_STATES.WALK_DOWN]: '#50C878', // Green
  [SPRITE_STATES.WALK_UP]: '#FF6B6B',   // Red
  [SPRITE_STATES.WALK_LEFT]: '#FFD93D', // Yellow
  [SPRITE_STATES.WALK_RIGHT]: '#9B59B6', // Purple
};

// Keep the old SPRITE_SOURCES for reference but don't use them
const SPRITE_SOURCES = {
  [SPRITE_STATES.IDLE]: require('../assets/link_sprites/link_idle.gif'),
  [SPRITE_STATES.WALK_DOWN]: require('../assets/link_sprites/link_walk_down.gif'),
  [SPRITE_STATES.WALK_UP]: require('../assets/link_sprites/link_walk_up.gif'),
  [SPRITE_STATES.WALK_LEFT]: require('../assets/link_sprites/link_walk_left.gif'),
  [SPRITE_STATES.WALK_RIGHT]: require('../assets/link_sprites/link_walk_right.gif'),
};

function getDirection([prev, curr]) {
  if (!prev || !curr) return SPRITE_STATES.IDLE;
  
  const dx = curr.longitude - prev.longitude;
  const dy = curr.latitude - prev.latitude;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? SPRITE_STATES.WALK_RIGHT : SPRITE_STATES.WALK_LEFT;
  } else {
    return dy > 0 ? SPRITE_STATES.WALK_DOWN : SPRITE_STATES.WALK_UP;
  }
}

// Helper to build polylines for expo-maps API
function buildPolylines({ savedRoutes, previewRoadCoords, previewRoute, pathToRender, colors }) {
  const polylines = [];
  
  // Saved routes
  if (savedRoutes && savedRoutes.length > 0) {
    for (const journey of savedRoutes) {
      polylines.push({
        id: journey.id,
        coordinates: journey.route,
        color: colors.routeLine,
        width: 3,
        opacity: 0.6,
      });
    }
  }
  
  // Preview route
  if ((previewRoadCoords && previewRoadCoords.length > 0) || (previewRoute && previewRoute.length > 0)) {
    polylines.push({
      id: 'preview',
      coordinates: previewRoadCoords.length > 0 ? previewRoadCoords : previewRoute,
      color: colors.routePreview,
      width: 4,
    });
  }
  
  // Current path
  if (pathToRender && pathToRender.length > 0) {
    polylines.push({
      id: 'current',
      coordinates: pathToRender,
      color: colors.routeLine,
      width: 6,
    });
  }
  
  return polylines;
}

// Helper to build markers for expo-maps API
function buildMarkers({ currentPosition, spriteColor, showSavedPlaces, savedPlaces, colors }) {
  const markers = [];
  
  // Saved places markers only (Link sprite will be handled as overlay)
  if (showSavedPlaces && savedPlaces && savedPlaces.length > 0) {
    for (const place of savedPlaces) {
      markers.push({
        id: place.id,
        coordinates: { latitude: place.latitude, longitude: place.longitude },
        title: place.name,
        description: place.vicinity,
      });
    }
  }
  
  return markers;
}

// Helper to convert theme map styles to expo-maps properties
function getMapProperties(mapStyleConfig, currentTheme) {
  if (!mapStyleConfig) return {};
  
  // For GoogleMaps (Android)
  const googleMapsProperties = {
    mapType: 'NORMAL', // Default
    isTrafficEnabled: false,
    selectionEnabled: true,
  };
  
  // For AppleMaps (iOS)  
  const appleMapsProperties = {
    mapType: 'STANDARD', // Default
    isTrafficEnabled: false,
    selectionEnabled: true,
  };
  
  // Map theme styles to expo-maps mapType
  switch(mapStyleConfig.name) {
    case 'Satellite':
      googleMapsProperties.mapType = 'SATELLITE';
      appleMapsProperties.mapType = 'IMAGERY';
      break;
    case 'Terrain':
      googleMapsProperties.mapType = 'TERRAIN';
      appleMapsProperties.mapType = 'STANDARD'; // iOS doesn't have terrain, fallback to standard
      break;
    case 'Night':
    case 'Adventure':
      // Custom styles not supported in expo-maps, use standard with appropriate color scheme
      googleMapsProperties.mapType = 'NORMAL';
      appleMapsProperties.mapType = 'STANDARD';
      break;
    default:
      // Standard and other styles
      googleMapsProperties.mapType = 'NORMAL';
      appleMapsProperties.mapType = 'STANDARD';
  }
  
  return {
    googleMaps: googleMapsProperties,
    appleMaps: appleMapsProperties,
  };
}

// Helper to get color scheme for expo-maps
function getColorScheme(mapStyleConfig, currentTheme) {
  if (!mapStyleConfig) return 'FOLLOW_SYSTEM';
  
  // Map theme styles to color scheme (GoogleMaps only)
  switch(mapStyleConfig.name) {
    case 'Night':
      return 'DARK';
    case 'Adventure':
      return 'LIGHT'; // Adventure theme uses warm colors, closer to light
    default:
      return 'FOLLOW_SYSTEM';
  }
}

export default function MapScreen({ navigation, route }) {
  const { getCurrentThemeColors, getCurrentMapStyleArray, getCurrentMapStyleConfig, currentTheme } = useTheme();
  const colors = getCurrentThemeColors() || getFallbackTheme();
  const mapStyleArray = getCurrentMapStyleArray();
  const mapStyleConfig = getCurrentMapStyleConfig();
  
  // Get expo-maps compatible properties
  const mapProperties = getMapProperties(mapStyleConfig, currentTheme);
  const colorScheme = getColorScheme(mapStyleConfig, currentTheme);
  
  const { user } = useUser();
  const { setCurrentJourney } = useExploration();
  
  const mapRef = useRef(null);
  
  const [currentPosition, setCurrentPosition] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [currentJourneyId, setCurrentJourneyId] = useState(null);
  const [pathToRender, setPathToRender] = useState([]);
  const [previewRoute, setPreviewRoute] = useState([]);
  const [previewRoadCoords, setPreviewRoadCoords] = useState([]);
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [showSavedPlaces, setShowSavedPlaces] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [pingUsed, setPingUsed] = useState(0);
  const [showPingAnimation, setShowPingAnimation] = useState(false);
  const [spriteState, setSpriteState] = useState(SPRITE_STATES.IDLE);
  const [backgroundPermissionWarning, setBackgroundPermissionWarning] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [appState, setAppState] = useState(AppState.currentState);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  
  // Journey naming modal state
  const [showNamingModal, setShowNamingModal] = useState(false);
  const [journeyName, setJourneyName] = useState('');
  const [originalDefaultName, setOriginalDefaultName] = useState('');
  const [pendingJourneyData, setPendingJourneyData] = useState(null);

  // Check background location permissions
  const checkBackgroundPermissions = async () => {
    try {
      const { status } = await Location.getBackgroundPermissionsAsync();
      if (status !== 'granted') {
        setBackgroundPermissionWarning(true);
      } else {
        setBackgroundPermissionWarning(false);
      }
    } catch (error) {
      console.error('Error checking background permissions:', error);
    }
  };

  const showBackgroundPermissionWarning = () => {
    Alert.alert(
      'Background Location Permission Required',
      'Hero\'s Path needs "Always" location access to track your walks even when the app is in the background. This allows you to record your complete journey.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            } else {
              Linking.openSettings();
            }
          }
        }
      ]
    );
  };

  // Initialize BackgroundLocationService and load data on mount
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        // HOTFIX: Reset any stuck tracking state from previous app sessions
        // This prevents the service from being stuck in tracking mode after app reload
        await BackgroundLocationService.cleanup();
        Logger.info('MapScreen: Reset location service state on initialization');
        
        // Initialize the background location service
        const initialized = await BackgroundLocationService.initialize();
        if (!initialized) {
          Alert.alert('Location Setup Failed', 'Please enable location permissions in your device settings.');
          return;
        }

        // Set up location update callback
        BackgroundLocationService.setLocationUpdateCallback((coords, journey) => {
          // Update current position
          setCurrentPosition({
            latitude: coords.latitude,
            longitude: coords.longitude,
            timestamp: coords.timestamp,
          });
          
          // Update location accuracy indicator
          setLocationAccuracy(coords.accuracy);
          
          // Update path for rendering
          setPathToRender(journey.coordinates);
          
          Logger.debug('Location updated:', {
            lat: coords.latitude.toFixed(6),
            lng: coords.longitude.toFixed(6),
            accuracy: coords.accuracy,
            points: journey.coordinates.length
          });
        });

        // Get initial location with enhanced error handling and fallback
        try {
          Logger.debug('MapScreen: Attempting to get initial location for sprite');
          const coords = await BackgroundLocationService.getCurrentLocation();
          
          if (coords && coords.latitude && coords.longitude) {
            const initialPosition = {
              latitude: coords.latitude,
              longitude: coords.longitude,
              timestamp: Date.now(),
            };
            setCurrentPosition(initialPosition);
            setLocationAccuracy(coords.accuracy);
            Logger.debug('MapScreen: Initial position set for Link sprite', initialPosition);
          } else {
            Logger.warn('MapScreen: Invalid coordinates received from getCurrentLocation');
            throw new Error('Invalid coordinates');
          }
        } catch (error) {
          Logger.warn('MapScreen: Could not get initial location, trying fallback', error);
          
          // HOTFIX: Try to get location using Expo Location as fallback
          try {
            const { status } = await Location.getForegroundPermissionsAsync();
            if (status === 'granted') {
              const fallbackLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
                maximumAge: 10000,
              });
              
              if (fallbackLocation?.coords) {
                const fallbackPosition = {
                  latitude: fallbackLocation.coords.latitude,
                  longitude: fallbackLocation.coords.longitude,
                  timestamp: Date.now(),
                };
                setCurrentPosition(fallbackPosition);
                setLocationAccuracy(fallbackLocation.coords.accuracy);
                Logger.info('MapScreen: Fallback position set for Link sprite', fallbackPosition);
              }
            }
          } catch (fallbackError) {
            Logger.error('MapScreen: Both initial location and fallback failed', fallbackError);
          }
        }

      } catch (error) {
        Logger.error('Error initializing location service:', error);
        Alert.alert('Location Error', 'Failed to initialize location services. Please check your permissions.');
      }
    };

    initializeLocation();
    loadSavedRoutes();
    loadSavedPlaces();
    checkBackgroundPermissions();

    // Cleanup on unmount
    return () => {
      BackgroundLocationService.setLocationUpdateCallback(null);
    };
  }, []);

  // Debug useEffect to monitor Link sprite position state
  useEffect(() => {
    if (currentPosition) {
      Logger.debug('MapScreen: Link sprite position updated:', {
        lat: currentPosition.latitude,
        lng: currentPosition.longitude,
        timestamp: currentPosition.timestamp
      });
    } else {
      Logger.debug('MapScreen: Link sprite position is null - sprite will not render');
    }
  }, [currentPosition]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        checkBackgroundPermissions();
      }
      setAppState(nextAppState);
    });
    return () => subscription.remove();
  }, [appState]);

  // Update sprite state based on movement
  useEffect(() => {
    if (pathToRender.length >= 2) {
      const direction = getDirection(pathToRender.slice(-2));
      Logger.debug('Sprite direction calculated:', { 
        pathLength: pathToRender.length, 
        direction, 
        lastTwoPoints: pathToRender.slice(-2).map(p => ({ lat: p.latitude, lng: p.longitude }))
      });
      setSpriteState(direction);
    } else {
      Logger.debug('Setting sprite to idle state - no path data');
      setSpriteState(SPRITE_STATES.IDLE);
    }
  }, [pathToRender]);

  const spriteColor = SPRITE_COLORS[spriteState];

  
  // Debug sprite state
  useEffect(() => {
    Logger.debug('Sprite state updated:', { 
      spriteState, 
      spriteColor,
      currentPosition: currentPosition ? 'set' : 'null',
      spriteColors: Object.keys(SPRITE_COLORS)
    });
  }, [spriteState, spriteColor, currentPosition]);

  const loadSavedRoutes = async () => {
    if (!user) return;
    
    try {
      const result = await JourneyService.getUserJourneys(user.uid);
      if (result.success) {
        setSavedRoutes(result.journeys);
      }
    } catch (error) {
      console.error('Error loading saved routes:', error);
    }
  };

  const loadSavedPlaces = async () => {
    if (!user) return;
    
    try {
      const result = await DiscoveryService.getSavedPlaces(user.uid);
      const places = result.success ? result.discoveries : [];
      setSavedPlaces(places);
    } catch (error) {
      console.error('Error loading saved places:', error);
    }
  };

  const locateMe = async () => {
    setIsLocating(true);
    try {
      // Get fresh location from the service
      const coords = await BackgroundLocationService.getCurrentLocation();
      
      const newPosition = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        timestamp: Date.now(),
      };
      
      setCurrentPosition(newPosition);
      setLocationAccuracy(coords.accuracy);
      
      // Animate to the location
      mapRef.current?.animateToRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
      
      Logger.debug('Located user:', {
        lat: coords.latitude.toFixed(6),
        lng: coords.longitude.toFixed(6),
        accuracy: coords.accuracy
      });
      
    } catch (error) {
      Logger.error('Error locating user:', error);
      Alert.alert('Location Error', 'Could not get your current location. Please check your location settings.');
    } finally {
      setIsLocating(false);
    }
  };

  const toggleSavedPlaces = async () => {
    setShowSavedPlaces(!showSavedPlaces);
  };

  const saveJourney = async (rawCoords, name) => {
    if (!user || rawCoords.length === 0) return;

    try {
      Logger.info('MAP_SCREEN', 'Saving journey...', { 
        userId: user.uid, 
        routePoints: rawCoords.length 
      });

      // Create journey data
      const journeyData = {
        userId: user.uid,
        name: name,
        startTime: rawCoords[0].timestamp,
        endTime: rawCoords[rawCoords.length - 1].timestamp,
        route: rawCoords.map(coord => ({
          latitude: coord.latitude,
          longitude: coord.longitude,
          timestamp: coord.timestamp,
        })),
        distance: calculateTotalDistance(rawCoords),
        duration: rawCoords[rawCoords.length - 1].timestamp - rawCoords[0].timestamp,
        status: 'completed',
      };

      // Save journey
      const result = await JourneyService.createJourney(user.uid, journeyData);
      
      if (result.success) {
        Logger.info('MAP_SCREEN', 'Journey saved successfully', { 
          journeyId: result.journey.id 
        });

        // Trigger discovery process
        try {
          await JourneyService.consolidateJourneyDiscoveries(
            user.uid, 
            result.journey.id, 
            journeyData.route
          );
          Logger.info('MAP_SCREEN', 'Discovery process completed');
        } catch (discoveryError) {
          Logger.error('MAP_SCREEN', 'Discovery process failed', discoveryError);
        }

        // Update local state
        setCurrentJourneyId(null);
        setPathToRender([]);
        setPreviewRoute([]);
        setPreviewRoadCoords([]);
        
        // Reload saved routes
        await loadSavedRoutes();
        
        Alert.alert(
          'Walk Saved! 🎉',
          `Your ${Math.round(journeyData.distance)}m walk has been saved. Check your discoveries for new places found along your route!`
        );
      } else {
        throw new Error(result.error || 'Failed to save journey');
      }
    } catch (error) {
      Logger.error('MAP_SCREEN', 'Error saving journey', error);
      Alert.alert('Error', 'Failed to save your walk. Please try again.');
    }
  };

  // Journey naming modal handlers
  const handleSaveJourneyWithName = async () => {
    if (!pendingJourneyData) return;
    
    try {
      setShowNamingModal(false);
      
      // Save the journey with the custom name
      const finalName = journeyName.trim() || originalDefaultName;
      await saveJourney(pendingJourneyData.coordinates, finalName);
      
      // Clear modal state
      setPendingJourneyData(null);
      setJourneyName('');
      setOriginalDefaultName('');
      
      Alert.alert('Journey Saved! 🎉', `Your walk "${finalName}" has been saved successfully.`);
    } catch (error) {
      Logger.error('Error saving named journey:', error);
      Alert.alert('Error', 'Failed to save your journey. Please try again.');
    }
  };

  const handleCancelNaming = () => {
    // Still save the journey with default name
    Alert.alert(
      'Save Journey?',
      'Do you want to save this journey with the default name?',
      [
        { 
          text: 'Don\'t Save', 
          style: 'destructive',
          onPress: () => {
            setShowNamingModal(false);
            setPendingJourneyData(null);
            setJourneyName('');
            setOriginalDefaultName('');
          }
        },
        { 
          text: 'Save with Default Name', 
          onPress: async () => {
            try {
              setShowNamingModal(false);
              await saveJourney(pendingJourneyData.coordinates, originalDefaultName);
              setPendingJourneyData(null);
              setJourneyName('');
              setOriginalDefaultName('');
              Alert.alert('Journey Saved!', `Your walk "${originalDefaultName}" has been saved with the default name.`);
            } catch (error) {
              Logger.error('Error saving journey with default name:', error);
              Alert.alert('Error', 'Failed to save your journey.');
            }
          }
        }
      ]
    );
  };

  const calculateTotalDistance = (coords) => {
    if (coords.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1];
      const curr = coords[i];
      
      const R = 6371e3; // Earth's radius in meters
      const φ1 = prev.latitude * Math.PI / 180;
      const φ2 = curr.latitude * Math.PI / 180;
      const Δφ = (curr.latitude - prev.latitude) * Math.PI / 180;
      const Δλ = (curr.longitude - prev.longitude) * Math.PI / 180;

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

      totalDistance += R * c;
    }
    
    return totalDistance;
  };

  const toggleTracking = async () => {
    if (tracking) {
      // Stop tracking using BackgroundLocationService
      try {
        const journeyData = await BackgroundLocationService.stopTracking();
        setTracking(false);
        
        // Save the journey if we have data - show naming modal first
        if (journeyData && journeyData.coordinates.length > 0) {
          // Generate default name with date and starting location
          const date = new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: '2-digit'
          }).replace(',', '');
          const time = new Date().toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
          
          // Try to get starting location name for better default
          let defaultName = `Walk - ${date} ${time}`;
          if (journeyData.startLocation) {
            defaultName = `Walk - ${date} ${time}`;
          }
          
          setJourneyName(defaultName);
          setOriginalDefaultName(defaultName); // Store the original default name
          setPendingJourneyData(journeyData);
          setShowNamingModal(true);
        } else {
          Logger.warn('No journey data to save');
          Alert.alert('No Data', 'No route data was recorded. Make sure location permissions are enabled.');
        }
        
        // Reset UI state
        setCurrentJourneyId(null);
        setPathToRender([]);
        setPreviewRoute([]);
        setPreviewRoadCoords([]);
        
      } catch (error) {
        Logger.error('Error stopping tracking:', error);
        Alert.alert('Error', 'Failed to stop tracking. Your data may not have been saved.');
        setTracking(false);
      }
    } else {
      // Start tracking using BackgroundLocationService
      try {
        // Create new journey ID
        const journeyId = Date.now().toString();
        
        // Reset UI state
        setCurrentJourneyId(journeyId);
        setPathToRender([]);
        setPreviewRoute([]);
        setPreviewRoadCoords([]);
        setPingUsed(0);

        // Start tracking with the enhanced service
        const success = await BackgroundLocationService.startTracking(journeyId);
        
        if (success) {
          setTracking(true);
          Logger.info('Started enhanced GPS tracking with background support', { journeyId });
          
          // Show success message
          Alert.alert(
            'Journey Started! 🗺️',
            'Your adventure is now being tracked with enhanced GPS accuracy. The app will continue tracking even when your screen is locked.',
            [{ text: 'Got it!', style: 'default' }]
          );
        } else {
          throw new Error('Failed to start background location service');
        }
        
      } catch (error) {
        Logger.error('Error starting tracking:', error);
        setTracking(false);
        
        if (error.message.includes('permission')) {
          Alert.alert(
            'Permission Required',
            'Location permissions are required to track your walks. Please enable both "While Using App" and "Always" location access in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Open Settings', 
                onPress: () => {
                  if (Platform.OS === 'ios') {
                    Linking.openURL('app-settings:');
                  } else {
                    Linking.openSettings();
                  }
                }
              }
            ]
          );
        } else {
          Alert.alert('Error', 'Failed to start tracking. Please try again or check your location settings.');
        }
      }
    }
  };



  // Error boundary for MapView
  function handleMapError(e) {
    console.error('MapScreen: MapView error:', e?.nativeEvent || e);
    const errorCode = e?.nativeEvent?.code || 'Unknown error';
    const errorMessage = e?.nativeEvent?.message || e?.message || 'Unknown map error';
    setMapError(`${errorCode}: ${errorMessage}`);
    
    // Log additional debugging info
    Logger.debug('Map error details:', {
      errorCode,
      errorMessage,
      mapStyleConfig: mapStyleConfig?.name || 'default',
      mapProperties: Platform.OS === 'ios' ? mapProperties.appleMaps : mapProperties.googleMaps,
      colorScheme: Platform.OS === 'android' ? colorScheme : 'N/A (iOS)',
      platform: Platform.OS,
      hasApiKey: !!GOOGLE_MAPS_API_KEY_IOS,
      usingExpoMaps: true
    });
  }

  if (mapError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ color: colors.text, fontSize: 18, marginBottom: 12 }}>Unable to load map</Text>
        <Text style={{ color: colors.text, fontSize: 14, marginBottom: 8 }}>{mapError}</Text>
        <Text style={{ color: colors.text, fontSize: 12, opacity: 0.7 }}>Check your Google Maps API key and permissions.</Text>
      </View>
    );
  }



  return (
    <View style={styles.container}>
      {backgroundPermissionWarning && (
        <TouchableOpacity 
          style={[styles.permissionWarning, { backgroundColor: colors.warning }]} 
          onPress={showBackgroundPermissionWarning}
        >
          <MaterialIcons name="warning" size={20} color={colors.buttonText} />
          <Text style={[styles.permissionWarningText, { color: colors.buttonText }]}>Hero's Path Does Not Have 'Always' Allow Location Access (Tap to resolve)</Text>
          <MaterialIcons name="chevron-right" size={20} color={colors.buttonText} />
        </TouchableOpacity>
      )}

      {/* GPS Accuracy Indicator */}
      {tracking && locationAccuracy && (
        <View style={[styles.accuracyIndicator, { backgroundColor: colors.cardBackground }]}>
          <MaterialIcons 
            name="gps-fixed" 
            size={16} 
            color={
              locationAccuracy <= 5 ? colors.success :
              locationAccuracy <= 15 ? colors.warning :
              colors.error
            } 
          />
          <Text style={[styles.accuracyText, { color: colors.textSecondary }]}>
            GPS: {Math.round(locationAccuracy)}m
          </Text>
          <Text style={[styles.accuracyStatus, { 
            color: locationAccuracy <= 5 ? colors.success :
                   locationAccuracy <= 15 ? colors.warning :
                   colors.error
          }]}>
            {locationAccuracy <= 5 ? 'Excellent' :
             locationAccuracy <= 15 ? 'Good' :
             locationAccuracy <= 50 ? 'Fair' : 'Poor'}
          </Text>
        </View>
      )}

      {currentPosition ? (
        Platform.OS === 'ios' ? (
          <AppleMaps
            ref={mapRef}
            style={styles.map}
            cameraPosition={{
              coordinates: currentPosition,
              zoom: 15,
            }}
            markers={buildMarkers({ currentPosition, spriteColor, showSavedPlaces, savedPlaces, colors })}
            polylines={buildPolylines({ savedRoutes, previewRoadCoords, previewRoute, pathToRender, colors })}
            properties={mapProperties.appleMaps}
            onError={handleMapError}
          />
        ) : (
          <GoogleMaps
            ref={mapRef}
            style={styles.map}
            cameraPosition={{
              coordinates: currentPosition,
              zoom: 15,
            }}
            markers={buildMarkers({ currentPosition, spriteColor, showSavedPlaces, savedPlaces, colors })}
            polylines={buildPolylines({ savedRoutes, previewRoadCoords, previewRoute, pathToRender, colors })}
            properties={mapProperties.googleMaps}
            colorScheme={colorScheme}
            onError={handleMapError}
          />
        )
      ) : (
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}> 
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading your location…</Text>
        </View>
      )}

      {/* Custom Link Sprite Overlay */}
      {currentPosition && (
        <View style={[styles.spriteOverlay, {
          position: 'absolute',
          left: '50%',
          top: '50%',
          marginLeft: -24,
          marginTop: -32,
          zIndex: 1000,
        }]}>
          <View style={styles.spriteContainer}>
            {/* Main Link sprite - colored rectangle */}
            <View style={[styles.linkSprite, { backgroundColor: spriteColor }]} />
            
            {/* Sprite status indicator */}
            <View style={[styles.spriteStatusIndicator, { backgroundColor: colors.success }]} />
            
            <Text style={[styles.spriteDebugText, { color: colors.buttonText }]}>
              Link
            </Text>
          </View>
        </View>
      )}
      
      {/* Ping Animation Overlay */}
      {showPingAnimation && currentPosition && (
        <PingAnimation
          isVisible={showPingAnimation}
          onAnimationComplete={() => setShowPingAnimation(false)}
          style={styles.pingAnimation}
          animationType="lottie"
        />
      )}
      
      {/* Control buttons */}
      <View style={styles.buttonContainer}>
        {/* Discovery preferences button */}
        <TouchableOpacity 
          style={[styles.preferencesButton, { backgroundColor: colors.buttonSecondary }]} 
          onPress={() => navigation.navigate('DiscoveryPreferences')}
        >
          <MaterialIcons name="tune" size={24} color={colors.primary} />
        </TouchableOpacity>
        
        {/* Locate button */}
        <TouchableOpacity 
          style={[
            styles.locateButton, 
            { backgroundColor: colors.buttonSecondary },
            isLocating && { opacity: 0.7 }
          ]} 
          onPress={locateMe}
          disabled={isLocating}
        >
          <MaterialIcons 
            name={isLocating ? "hourglass-empty" : "my-location"} 
            size={28} 
            color={isLocating ? colors.textSecondary : colors.primary} 
          />
        </TouchableOpacity>
        
        {/* Toggle saved places button */}
        <TouchableOpacity 
          style={[
            styles.toggleButton, 
            { backgroundColor: showSavedPlaces ? colors.buttonPrimary : colors.buttonSecondary }
          ]} 
          onPress={toggleSavedPlaces}
        >
          <MaterialIcons 
            name="place" 
            size={24} 
            color={showSavedPlaces ? colors.buttonText : colors.primary} 
          />
        </TouchableOpacity>
      </View>

      {/* Ping components - only show when tracking */}
      {tracking && currentPosition && currentJourneyId && (
        <View style={styles.pingContainer}>
          <PingStats 
            style={styles.pingStats} 
            onPingUsed={pingUsed}
          />
          <PingButton
            currentLocation={currentPosition}
            journeyId={currentJourneyId}
            onPingStart={() => {
              // Trigger the Lottie ping animation
              setShowPingAnimation(true);
            }}
            onPingSuccess={(result) => {
              Logger.debug('Ping successful:', result);
              setPingUsed(prev => prev + 1);
            }}
            onPingError={(error) => {
              Logger.error('Ping error:', error);
            }}
            style={styles.pingButton}
            disabled={!tracking}
          />
        </View>
      )}
      
      <View style={styles.trackButtonContainer}>
        <TouchableOpacity
          style={[
            styles.trackButton, 
            { backgroundColor: tracking ? colors.error : colors.buttonPrimary }
          ]}
          onPress={toggleTracking}
        >
          <Text style={[styles.trackButtonText, { color: colors.buttonText }]}> {tracking ? 'Stop & Save Walk' : 'Start Walk'} </Text>
        </TouchableOpacity>
      </View>

      <StatusBar style="auto" />
      
      {/* Journey Naming Modal */}
      <Modal
        visible={showNamingModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelNaming}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.modalBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              🎉 Walk Completed!
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Give your journey a memorable name:
            </Text>
            
            <TextInput
              style={[styles.nameInput, { 
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.inputText
              }]}
              value={journeyName}
              onChangeText={setJourneyName}
              placeholder="Enter journey name..."
              placeholderTextColor={colors.placeholder}
              maxLength={50}
              selectTextOnFocus
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={handleCancelNaming}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.buttonPrimary }]}
                onPress={handleSaveJourneyWithName}
              >
                <Text style={[styles.saveButtonText, { color: colors.buttonText }]}>
                  Save Journey
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  map: { 
    flex: 1 
  },
  linkSprite: { 
    width: 48, 
    height: 64,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonContainer: {
    position: 'absolute',
    right: Spacing.md,
    bottom: 120,
    alignItems: 'center',
  },
  preferencesButton: {
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
    marginBottom: Spacing.sm,
  },
  locateButton: {
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
    marginBottom: Spacing.sm,
  },
  toggleButton: {
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
  },
  trackButtonContainer: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
  },
  trackButton: {
    padding: Spacing.lg,
    borderRadius: Layout.borderRadiusLarge,
    alignItems: 'center',
    ...Shadows.large,
  },
  trackButtonText: {
    ...Typography.button,
    fontWeight: '600',
  },
  pingContainer: {
    position: 'absolute',
    left: Spacing.md,
    bottom: 120,
    alignItems: 'center',
  },
  pingStats: {
    marginBottom: Spacing.sm,
  },
  pingButton: {
    ...Shadows.medium,
  },
  pingAnimation: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
  permissionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    margin: Spacing.md,
    borderRadius: Layout.borderRadius,
    ...Shadows.small,
  },
  permissionWarningText: {
    ...Typography.bodySmall,
    flex: 1,
    marginHorizontal: Spacing.sm,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.md,
  },
  savedPlaceMarker: {
    width: 24,
    height: 24,
    borderRadius: 8, // beveled/rounded corners
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  accuracyIndicator: {
    position: 'absolute',
    top: 60,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: Layout.borderRadius,
    ...Shadows.small,
  },
  accuracyText: {
    ...Typography.bodySmall,
    marginLeft: Spacing.xs,
    marginRight: Spacing.xs,
  },
  accuracyStatus: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '80%',
    padding: Spacing.lg,
    borderRadius: Layout.borderRadiusLarge,
    alignItems: 'center',
    ...Shadows.large,
  },
  modalTitle: {
    ...Typography.h4,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  modalSubtitle: {
    ...Typography.body,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  nameInput: {
    width: '100%',
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: Layout.borderRadiusSmall,
    marginBottom: Spacing.md,
    ...Typography.body,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Layout.borderRadiusSmall,
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    ...Typography.button,
  },
  saveButton: {
    // backgroundColor will be set dynamically
  },
  saveButtonText: {
    ...Typography.button,
    fontWeight: '600',
  },
  spriteContainer: {
    width: 48,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spriteDebugText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -15 }, { translateY: -8 }],
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  spriteStatusIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
});
