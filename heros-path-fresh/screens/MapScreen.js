/*
 * MAP SCREEN (CORE APP SCREEN)
 * ============================
 * 
 * PURPOSE:
 * This is the heart of Hero's Path - the main screen where users track their walks,
 * see their progress in real-time, and interact with the core features. It displays
 * a map interface with GPS tracking, route recording, animated Link sprite,
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
 */

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
import MapView, { Marker, Polyline } from 'react-native-maps';
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
import LocateMeButton from '../components/LocateMeButton';
import JourneyService from '../services/JourneyService';
import DiscoveryService from '../services/DiscoveryService';
import BackgroundLocationService from '../services/BackgroundLocationService';
import Logger from '../utils/Logger';
import MapProviderHelper from '../utils/MapProviderHelper';
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

export default function MapScreen({ navigation, route }) {
  const { getCurrentThemeColors, getCurrentMapStyleArray, getCurrentMapStyleConfig, currentTheme } = useTheme();
  const colors = getCurrentThemeColors() || getFallbackTheme();
  const mapStyleArray = getCurrentMapStyleArray();
  const mapStyleConfig = getCurrentMapStyleConfig();
  
  // Determine map provider based on platform and style
  const mapProvider = MapProviderHelper.getMapProvider(currentTheme);
  
  // Get map properties based on provider
  const googleMapProperties = MapProviderHelper.getGoogleMapProperties(mapStyleConfig, currentTheme);
  
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
  const [showSavedRoutes, setShowSavedRoutes] = useState(true);
  const [isLoadingSavedRoutes, setIsLoadingSavedRoutes] = useState(false);
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [showSavedPlaces, setShowSavedPlaces] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(false);
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
            setLocationError(true);
          }
        }

      } catch (error) {
        Logger.error('Error initializing location service:', error);
        Alert.alert('Location Error', 'Failed to initialize location services. Please check your permissions.');
        setLocationError(true);
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

  const spriteSource = SPRITE_SOURCES[spriteState];

  const loadSavedRoutes = async () => {
    if (!user) return;
    
    try {
      setIsLoadingSavedRoutes(true);
      Logger.debug('MapScreen: Loading saved routes');
      
      const result = await JourneyService.getUserJourneys(user.uid);
      if (result.success) {
        setSavedRoutes(result.journeys);
        Logger.debug(`MapScreen: Successfully loaded ${result.journeys.length} saved routes`);
      } else {
        Logger.warn('MapScreen: Failed to load saved routes', result.error);
        Alert.alert('Error', 'Failed to load your saved routes. Please try again.');
      }
    } catch (error) {
      Logger.error('MapScreen: Error loading saved routes', error);
      Alert.alert('Error', 'Failed to load your saved routes. Please try again.');
    } finally {
      setIsLoadingSavedRoutes(false);
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
    setLocationError(false);
    
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
      setLocationError(true);
    } finally {
      setIsLocating(false);
    }
  };

  const toggleSavedPlaces = async () => {
    setShowSavedPlaces(!showSavedPlaces);
  };
  
  const toggleSavedRoutes = () => {
    const newValue = !showSavedRoutes;
    setShowSavedRoutes(newValue);
    Logger.debug('Toggled saved routes visibility:', { showSavedRoutes: newValue });
    
    // If turning on saved routes and we don't have any loaded yet, load them
    if (newValue && savedRoutes.length === 0 && user) {
      loadSavedRoutes();
    }
  };
  
  // Function to render saved routes with proper styling
  const renderSavedRoutes = () => {
    if (!showSavedRoutes || savedRoutes.length === 0) return null;
    
    return savedRoutes.map(journey => (
      <Polyline
        key={journey.id}
        coordinates={journey.route}
        strokeColor={colors.routeLine}
        strokeWidth={3}
        strokeOpacity={0.6}
        lineDashPattern={[1, 2]}
      />
    ));
  };

  const saveJourney = async (rawCoords, name) => {
    if (!user || rawCoords.length === 0) return;

    try {
      Logger.info('MAP_SCREEN', 'Saving journey...', { 
        userId: user.uid, 
        routePoints: rawCoords.length 
      });

      // Calculate distance first to check if journey is too short
      const distance = calculateTotalDistance(rawCoords);
      
      // Requirement 2.6: Warn if journey is less than 50 meters
      if (distance < 50) {
        Alert.alert(
          'Short Journey Warning',
          `Your journey is only ${Math.round(distance)}m long. This may be too short to be meaningful. Do you still want to save it?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Save Anyway', 
              onPress: () => proceedWithSave(rawCoords, name, distance)
            }
          ]
        );
        return;
      }
      
      // Proceed with normal save
      await proceedWithSave(rawCoords, name, distance);
    } catch (error) {
      Logger.error('MAP_SCREEN', 'Error saving journey', error);
      Alert.alert('Error', 'Failed to save your walk. Please try again.');
    }
  };

  const proceedWithSave = async (rawCoords, name, distance) => {
    try {
      // Create journey data
      const journeyData = {
        userId: user.uid,
        name: name || `Walk on ${new Date().toLocaleDateString()}`,
        startTime: rawCoords[0].timestamp,
        endTime: rawCoords[rawCoords.length - 1].timestamp,
        route: rawCoords.map(coord => ({
          latitude: coord.latitude,
          longitude: coord.longitude,
          timestamp: coord.timestamp,
        })),
        distance: distance,
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
            'Walk Started! 🚶‍♂️',
            'Your walk is now being tracked. You can put your phone in your pocket and the app will continue recording your route in the background.'
          );
        } else {
          throw new Error('Failed to start tracking');
        }
      } catch (error) {
        Logger.error('Error starting tracking:', error);
        Alert.alert('Error', 'Failed to start tracking. Please check your location permissions and try again.');
      }
    }
  };

  // Error boundary for MapView
  function handleMapError(e) {
    console.error('MapScreen: MapView error:', e?.nativeEvent || e);
    setMapError(e?.nativeEvent?.message || e?.message || 'Unknown map error');
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

  // Helper: region for MapView
  const region = currentPosition
    ? {
        latitude: currentPosition.latitude,
        longitude: currentPosition.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }
    : null;

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
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          customMapStyle={mapStyleArray}
          onError={handleMapError}
          showsUserLocation={false}
          showsMyLocationButton={false}
          toolbarEnabled={false}
          {...googleMapProperties}
        >
          {/* Saved routes as polylines */}
          {renderSavedRoutes()}
          {/* Preview route polyline */}
          {(previewRoadCoords.length > 0 || previewRoute.length > 0) && (
            <Polyline
              coordinates={previewRoadCoords.length > 0 ? previewRoadCoords : previewRoute}
              strokeColor={colors.routePreview}
              strokeWidth={4}
            />
          )}
          {/* Current path polyline */}
          {pathToRender.length > 0 && (
            <Polyline
              coordinates={pathToRender}
              strokeColor={colors.routeLine}
              strokeWidth={6}
            />
          )}
          {/* Current position marker (sprite) */}
          {currentPosition && (
            <Marker
              coordinate={currentPosition}
              anchor={{ x: 0.5, y: 0.9 }}
              tracksViewChanges={false}
            >
              <Image source={spriteSource} style={{ width: 16, height: 32 }} resizeMode="contain" />
            </Marker>
          )}
          {/* Saved places markers */}
          {showSavedPlaces && savedPlaces.map(place => (
            <Marker
              key={place.id}
              coordinate={{ latitude: place.latitude, longitude: place.longitude }}
              title={place.name}
              description={place.vicinity}
            >
              <View style={[styles.savedPlaceMarker, { backgroundColor: colors.primary }]}> 
                <MaterialIcons name="favorite" size={16} color={colors.buttonText} />
              </View>
            </Marker>
          ))}
        </MapView>
      ) : (
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}> 
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading your location…</Text>
        </View>
      )}
      
      {/* Ping Animation Overlay */}
      {showPingAnimation && currentPosition && (
        <PingAnimation
          isVisible={showPingAnimation}
          onAnimationComplete={() => setShowPingAnimation(false)}
          style={styles.pingAnimation}
          animationType="particle"
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
        
        {/* Locate me button */}
        <LocateMeButton 
          onPress={locateMe}
          isLocating={isLocating}
          hasError={locationError}
          style={styles.locateButton}
        />
        
        {/* Toggle saved routes button */}
        <TouchableOpacity 
          style={[
            styles.toggleButton, 
            { backgroundColor: showSavedRoutes ? colors.buttonPrimary : colors.buttonSecondary }
          ]} 
          onPress={toggleSavedRoutes}
          disabled={isLoadingSavedRoutes}
        >
          <MaterialIcons 
            name="timeline" 
            size={24} 
            color={showSavedRoutes ? colors.buttonText : colors.primary} 
          />
          {isLoadingSavedRoutes && (
            <View style={styles.loadingIndicator}>
              <ActivityIndicator size="small" color={showSavedRoutes ? colors.buttonText : colors.primary} />
            </View>
          )}
          {showSavedRoutes && savedRoutes.length > 0 && (
            <View style={[styles.routeCountBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.routeCountText, { color: colors.buttonText }]}>
                {savedRoutes.length}
              </Text>
            </View>
          )}
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
              // Animation scaffolding
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

      {/* Journey naming modal */}
      <Modal
        visible={showNamingModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelNaming}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.modalBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Name Your Journey</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Give your walk a memorable name</Text>
            
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  color: colors.inputText
                }
              ]}
              value={journeyName}
              onChangeText={setJourneyName}
              placeholder="Enter journey name"
              placeholderTextColor={colors.placeholder}
              autoFocus={true}
            />
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={handleCancelNaming}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.buttonPrimary }]}
                onPress={handleSaveJourneyWithName}
              >
                <Text style={[styles.modalButtonText, { color: colors.buttonText }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <StatusBar style="auto" />
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
  sprite: { 
    width: 16, 
    height: 32 
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
    ...Typography.body,
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
    ...Typography.caption,
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
    borderRadius: 12,
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
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Layout.borderRadius,
    ...Shadows.small,
  },
  accuracyText: {
    ...Typography.caption,
    marginLeft: 4,
  },
  accuracyStatus: {
    ...Typography.caption,
    fontWeight: '600',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '80%',
    borderRadius: Layout.borderRadius,
    padding: Spacing.lg,
    ...Shadows.large,
  },
  modalTitle: {
    ...Typography.h3,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  modalSubtitle: {
    ...Typography.caption,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: Layout.borderRadius,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    height: 44,
    borderRadius: Layout.borderRadius,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
    ...Shadows.small,
  },
  modalButtonText: {
    ...Typography.body,
    fontWeight: '600',
  },
});