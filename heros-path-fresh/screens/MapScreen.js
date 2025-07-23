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
  Dimensions,
  Platform,
  AppState,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getFallbackTheme } from '../styles/theme';
import { useUser } from '../contexts/UserContext';
import { useExploration } from '../contexts/ExplorationContext';
import { Spacing, Typography, Layout, Shadows } from '../styles/theme';
import PingAnimation from '../components/PingAnimation';
import SpriteWithGpsIndicator from '../components/SpriteWithGpsIndicator';
import Logger from '../utils/Logger';
import MapProviderHelper from '../utils/MapProviderHelper';
import { getDirection } from '../utils/geo';

// Import UI components
import JourneyNamingModal from '../components/ui/JourneyNamingModal';
import AccuracyIndicator from '../components/ui/AccuracyIndicator';
import SavedRoutes from '../components/ui/SavedRoutes';
import SavedPlaces from '../components/ui/SavedPlaces';
import ControlButtons from '../components/ui/ControlButtons';
import PingControls from '../components/ui/PingControls';

// Import custom hooks
import useJourneyTracking from '../hooks/useJourneyTracking';
import useLocation from '../hooks/useLocation';
import useSavedPlaces from '../hooks/useSavedPlaces';

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
  
  // State declarations
  const [mapError, setMapError] = useState(null);
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
  const [currentJourneyId, setCurrentJourneyId] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [locationError, setLocationError] = useState(false);
  const [backgroundPermissionWarning, setBackgroundPermissionWarning] = useState(false);
  const [savedPlaces, setSavedPlaces] = useState([]);
  
  // Load saved routes function
  const loadSavedRoutes = async () => {
    if (!user) return;
    
    try {
      setIsLoadingSavedRoutes(true);
      Logger.debug('MapScreen: Loading saved routes');
      
      const JourneyService = require('../services/JourneyService').default;
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
  
  // Toggle saved routes function
  const toggleSavedRoutes = () => setShowSavedRoutes((prev) => !prev);

  // Use journey tracking hook
  const journeyTracking = useJourneyTracking({
    user,
    loadSavedRoutes,
    setPathToRender,
    setPreviewRoute,
    setPreviewRoadCoords,
    setCurrentJourneyId,
    pathToRender,
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
    toggleTracking,
    devMode,
    toggleDevMode,
    isSaving,
  } = journeyTracking;

  // Use location hook
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
    checkBackgroundPermissions,
    showBackgroundPermissionWarning,
  } = location;

  // Use saved places hook
  const savedPlacesHook = useSavedPlaces({ 
    user, 
    setSavedPlaces 
  });
  
  const {
    showSavedPlaces,
    setShowSavedPlaces,
    loadSavedPlaces,
    toggleSavedPlaces,
  } = savedPlacesHook;

  // Update sprite state based on movement and GPS accuracy
  useEffect(() => {
    try {
      if (pathToRender.length >= 2) {
        // Pass the location accuracy to getDirection to determine GPS-based states
        const direction = getDirection(
          pathToRender.slice(-2), 
          locationAccuracy,
          SPRITE_STATES,
          MOVEMENT_THRESHOLD
        );
        
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

  // Get sprite source
  const spriteSource = SPRITE_SOURCES[spriteState];

  // Locate me function
  const locateMe = async () => {
    setIsLocating(true);
    setLocationError(false);
    
    try {
      // Get fresh location from the service
      const BackgroundLocationService = require('../services/BackgroundLocationService').default;
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

  // Monitor app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      setAppState(nextAppState);
      if (nextAppState === 'active') {
        checkBackgroundPermissions();
      }
    });
    return () => subscription.remove();
  }, []);

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
      <AccuracyIndicator 
        tracking={tracking} 
        locationAccuracy={locationAccuracy} 
        colors={colors} 
      />

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
          <SavedRoutes 
            showSavedRoutes={showSavedRoutes} 
            savedRoutes={savedRoutes} 
            colors={colors} 
          />
          
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
          <SavedPlaces 
            showSavedPlaces={showSavedPlaces} 
            savedPlaces={savedPlaces} 
            colors={colors} 
          />
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
        currentJourneyId={currentJourneyId}
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
          onPress={toggleTracking}
        >
          <Text style={[styles.trackButtonText, { color: colors.buttonText }]}> {tracking ? 'Stop & Save Walk' : 'Start Walk'} </Text>
        </TouchableOpacity>
        
        {/* Hidden developer mode toggle - triple tap to activate */}
        <TouchableOpacity
          style={styles.devModeButton}
          onPress={toggleDevMode}
        >
          <Text style={[styles.devModeText, { color: devMode ? colors.success : 'transparent' }]}>
            {devMode ? 'DEV MODE ON' : '.'}
          </Text>
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
        isSaving={isSaving}
      />

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
  devModeButton: {
    position: 'absolute',
    bottom: -20,
    alignSelf: 'center',
    padding: 5,
  },
  devModeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  pingContainer: {
    position: 'absolute',
    left: Spacing.md,
    bottom: 120,
    alignItems: 'center',
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
});