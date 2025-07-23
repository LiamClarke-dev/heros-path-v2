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
import SpriteWithGpsIndicator from '../components/SpriteWithGpsIndicator';
import JourneyService from '../services/JourneyService';
import DiscoveryService from '../services/DiscoveryService';
import BackgroundLocationService from '../services/BackgroundLocationService';
import Logger from '../utils/Logger';
import MapProviderHelper from '../utils/MapProviderHelper';
import SectionHeader from '../components/ui/SectionHeader';
import AppButton from '../components/ui/AppButton';
import Constants from 'expo-constants';
import { GOOGLE_MAPS_API_KEY_IOS } from '../config';
import { calculateDistance, calculateTotalDistance, getDirection } from '../utils/geo';
import JourneyNamingModal from '../components/ui/JourneyNamingModal';
import AccuracyIndicator from '../components/ui/AccuracyIndicator';
import SavedRoutes from '../components/ui/SavedRoutes';
import SavedPlaces from '../components/ui/SavedPlaces';
import ControlButtons from '../components/ui/ControlButtons';
import PingControls from '../components/ui/PingControls';
import useJourneyTracking from '../hooks/useJourneyTracking';
import useLocation from '../hooks/useLocation';
import useSavedPlaces from '../hooks/useSavedPlaces';

const { width, height } = Dimensions.get('window');

// Sprite animation states
const SPRITE_STATES = {
  IDLE: 'idle',
  WALK_DOWN: 'walk_down',
  WALK_UP: 'walk_up',
  WALK_LEFT: 'walk_left',
  WALK_RIGHT: 'walk_right',
  GPS_WEAK: 'gps_weak',    // New state for weak GPS signal
  GPS_LOST: 'gps_lost',    // New state for lost GPS signal
};

// Sprite animation sources with fallbacks for better cross-platform compatibility
const SPRITE_SOURCES = {
  [SPRITE_STATES.IDLE]: require('../assets/link_sprites/link_idle.gif'),
  [SPRITE_STATES.WALK_DOWN]: require('../assets/link_sprites/link_walk_down.gif'),
  [SPRITE_STATES.WALK_UP]: require('../assets/link_sprites/link_walk_up.gif'),
  [SPRITE_STATES.WALK_LEFT]: require('../assets/link_sprites/link_walk_left.gif'),
  [SPRITE_STATES.WALK_RIGHT]: require('../assets/link_sprites/link_walk_right.gif'),
  // For GPS states, we'll use the idle sprite with different styling
  [SPRITE_STATES.GPS_WEAK]: require('../assets/link_sprites/link_idle.gif'),
  [SPRITE_STATES.GPS_LOST]: require('../assets/link_sprites/link_idle.gif'),
};

// Minimum movement threshold in meters to consider actual movement (not GPS jitter)
const MOVEMENT_THRESHOLD = 2.0;

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
  
  const [pathToRender, setPathToRender] = useState([]);
  const [previewRoute, setPreviewRoute] = useState([]);
  const [previewRoadCoords, setPreviewRoadCoords] = useState([]);
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [showSavedRoutes, setShowSavedRoutes] = useState(true);
  const [isLoadingSavedRoutes, setIsLoadingSavedRoutes] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [pingUsed, setPingUsed] = useState(0);
  const [showPingAnimation, setShowPingAnimation] = useState(false);
  const [spriteState, setSpriteState] = useState(SPRITE_STATES.IDLE);
  const [appState, setAppState] = useState(AppState.currentState);
  
  // Replace journey tracking state and handlers with useJourneyTracking
  const journeyTracking = useJourneyTracking({
    user,
    loadSavedRoutes,
    setPathToRender,
    setPreviewRoute,
    setPreviewRoadCoords,
    setCurrentJourneyId,
  });
  const {
    tracking,
    setTracking,
    showNamingModal,
    setShowNamingModal,
    journeyName,
    setJourneyName,
    originalDefaultName,
    setOriginalDefaultName,
    pendingJourneyData,
    setPendingJourneyData,
    saveJourney,
    handleSaveJourneyWithName,
    handleCancelNaming,
  } = journeyTracking;

  // Replace location state and handlers with useLocation
  const location = useLocation({
    setPathToRender,
    setLocationAccuracy,
    setCurrentPosition,
    setLocationError,
    setBackgroundPermissionWarning,
    loadSavedRoutes,
    loadSavedPlaces,
  });
  const {
    currentPosition,
    locationAccuracy,
    locationError,
    backgroundPermissionWarning,
    checkBackgroundPermissions,
    showBackgroundPermissionWarning,
  } = location;

  // Replace saved places state and handlers with useSavedPlaces
  const savedPlacesHook = useSavedPlaces({ user, setSavedPlaces });
  const {
    savedPlaces,
    setSavedPlaces: setSavedPlacesHook,
    showSavedPlaces,
    setShowSavedPlaces: setShowSavedPlacesHook,
    loadSavedPlaces,
    toggleSavedPlaces,
  } = savedPlacesHook;

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

  // Update sprite state based on movement and GPS accuracy
  useEffect(() => {
    try {
      if (pathToRender.length >= 2) {
        // Pass the location accuracy to getDirection to determine GPS-based states
        const direction = getDirection(pathToRender.slice(-2), locationAccuracy);
        Logger.debug('Sprite direction calculated:', { 
          pathLength: pathToRender.length, 
          direction, 
          lastTwoPoints: pathToRender.slice(-2).map(p => ({ lat: p.latitude, lng: p.longitude })),
          accuracy: locationAccuracy,
          platform: Platform.OS
        });
        setSpriteState(direction);
      } else {
        // If no path data but we have accuracy info, we can still show GPS state
        if (locationAccuracy !== null) {
          if (locationAccuracy > 50) {
            Logger.debug('Setting sprite to GPS_LOST state - poor accuracy', { 
              accuracy: locationAccuracy,
              platform: Platform.OS
            });
            setSpriteState(SPRITE_STATES.GPS_LOST);
          } else if (locationAccuracy > 15) {
            Logger.debug('Setting sprite to GPS_WEAK state - mediocre accuracy', { 
              accuracy: locationAccuracy,
              platform: Platform.OS
            });
            setSpriteState(SPRITE_STATES.GPS_WEAK);
          } else {
            Logger.debug('Setting sprite to idle state - no path data but good accuracy', { 
              accuracy: locationAccuracy,
              platform: Platform.OS
            });
            setSpriteState(SPRITE_STATES.IDLE);
          }
        } else {
          Logger.debug('Setting sprite to idle state - no path data');
          setSpriteState(SPRITE_STATES.IDLE);
        }
      }
    } catch (error) {
      // Fallback to IDLE state if there's any error in sprite state calculation
      Logger.error('Error calculating sprite state:', error);
      setSpriteState(SPRITE_STATES.IDLE);
    }
  }, [pathToRender, locationAccuracy]);

  // Get sprite source and determine if we need to apply special styling for GPS states
  const spriteSource = SPRITE_SOURCES[spriteState];
  const isGpsWeakState = spriteState === SPRITE_STATES.GPS_WEAK;
  const isGpsLostState = spriteState === SPRITE_STATES.GPS_LOST;

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
        <AccuracyIndicator tracking={tracking} locationAccuracy={locationAccuracy} colors={colors} />
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
          <SavedRoutes showSavedRoutes={showSavedRoutes} savedRoutes={savedRoutes} colors={colors} />
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
          {/* Current position marker (sprite) with GPS indicator */}
          {currentPosition && (
            <Marker
              coordinate={currentPosition}
              anchor={{ x: 0.5, y: 0.9 }}
              tracksViewChanges={Platform.OS === 'ios'} // Set to false on Android, true on iOS for better performance
            >
              <SpriteWithGpsIndicator 
                spriteSource={spriteSource}
                gpsAccuracy={locationAccuracy}
                isMoving={spriteState !== SPRITE_STATES.IDLE && 
                         spriteState !== SPRITE_STATES.GPS_WEAK && 
                         spriteState !== SPRITE_STATES.GPS_LOST}
                size={32}
              />
            </Marker>
          )}
          {/* Saved places markers */}
          <SavedPlaces showSavedPlaces={showSavedPlaces} savedPlaces={savedPlaces} colors={colors} />
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
      <ControlButtons
        colors={colors}
        navigation={navigation}
        locateMe={locateMe}
        isLocating={isLocating}
        locationError={locationError}
        showSavedRoutes={showSavedRoutes}
        toggleSavedRoutes={toggleSavedRoutes}
        isLoadingSavedRoutes={isLoadingSavedRoutes}
        savedRoutes={savedRoutes}
        showSavedPlaces={showSavedPlaces}
        toggleSavedPlaces={toggleSavedPlaces}
      />

      {/* Ping components - only show when tracking */}
      <PingControls
        tracking={tracking}
        currentPosition={currentPosition}
        currentJourneyId={journeyTracking.currentJourneyId}
        pingUsed={pingUsed}
        setPingUsed={setPingUsed}
        style={styles.pingContainer}
      />
      
      <View style={styles.trackButtonContainer}>
        <TouchableOpacity
          style={[
            styles.trackButton, 
            { backgroundColor: tracking ? colors.error : colors.buttonPrimary }
          ]}
          onPress={journeyTracking.toggleTracking}
        >
          <Text style={[styles.trackButtonText, { color: colors.buttonText }]}> {tracking ? 'Stop & Save Walk' : 'Start Walk'} </Text>
        </TouchableOpacity>
      </View>

      {/* Journey naming modal */}
      <JourneyNamingModal
        visible={showNamingModal}
        journeyName={journeyName}
        setJourneyName={setJourneyName}
        onSave={handleSaveJourneyWithName}
        onCancel={handleCancelNaming}
        colors={colors}
        originalDefaultName={originalDefaultName}
      />

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  spriteContainer: {
    position: 'relative',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spriteImage: {
    width: 16,
    height: 32,
    resizeMode: 'contain',
  },
  spriteImageGpsWeak: {
    opacity: 0.7,
    tintColor: '#FFA500', // Orange tint for weak GPS
  },
  spriteImageGpsLost: {
    opacity: 0.5,
    tintColor: '#FF0000', // Red tint for lost GPS
  },
  gpsIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
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