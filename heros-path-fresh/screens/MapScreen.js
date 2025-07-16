/*
  MapScreen.js
  --------------
  What this page does:
  - This is the main map interface of the Hero's Path app. It displays the user's current location, tracks their journey, and shows saved routes and places on a map using Google Maps.
  - Users can start/stop journey tracking, view their path, see saved places, and interact with map markers. The screen also supports animated Link sprites and a "ping" feature for real-time discovery.

  Why this page exists & its importance:
  - This is the core experience of the app, where users interact with the map, record their journeys, and discover new places. It ties together location tracking, journey management, and visual feedback.
  - It is central to the app's value proposition and is referenced by other screens (e.g., journey history, discoveries).

  References & dependencies:
  - Uses the theme system via useTheme() for dynamic styling.
  - Relies on JourneyService and DiscoveryService for data.
  - Uses components like PingButton, PingStats, PingAnimation, SectionHeader, AppButton.
  - References user and exploration context providers.
  - Uses Google Maps API and Expo Location for map and geolocation features.

  Suggestions for improvement:
  - Consider breaking up the file: it's large and handles many responsibilities (map logic, UI, state, permissions). Move map logic, journey management, and UI components into separate hooks or components.
  - Add more comments explaining complex logic, especially around journey tracking and sprite animation.
  - Ensure all color and style values use the theme system (avoid hardcoded values).
  - Improve error handling for location and map errors.
  - Consider accessibility improvements for map controls and markers.
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
import JourneyService from '../services/JourneyService';
import DiscoveryService from '../services/DiscoveryService';
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
  const { getCurrentThemeColors, getCurrentMapStyleArray } = useTheme();
  const colors = getCurrentThemeColors() || getFallbackTheme();
  const mapStyleArray = getCurrentMapStyleArray();
  
  const { user } = useUser();
  const { setCurrentJourney } = useExploration();
  
  const mapRef = useRef(null);
  const locationSubscription = useRef(null);
  
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
  const [showMinDistanceModal, setShowMinDistanceModal] = useState(false);
  const [pendingEndWalk, setPendingEndWalk] = useState(false);
  const [pendingCoords, setPendingCoords] = useState([]);

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

  // Load saved routes and places on mount
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required to use the map.');
          return;
        }
        const location = await Location.getCurrentPositionAsync({});
        setCurrentPosition({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: location.timestamp,
        });
      } catch (error) {
        console.error('Error fetching location:', error);
      }
    };

    fetchLocation();
    loadSavedRoutes();
    loadSavedPlaces();
    checkBackgroundPermissions();
  }, []);

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
      setSpriteState(direction);
    } else {
      setSpriteState(SPRITE_STATES.IDLE);
    }
  }, [pathToRender]);

  const spriteSource = SPRITE_SOURCES[spriteState];

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
    if (!currentPosition) return;
    
    setIsLocating(true);
    try {
      mapRef.current?.animateToRegion({
        latitude: currentPosition.latitude,
        longitude: currentPosition.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 1000);
    } catch (error) {
      console.error('Error locating user:', error);
    } finally {
      setIsLocating(false);
    }
  };

  const toggleSavedPlaces = async () => {
    setShowSavedPlaces(!showSavedPlaces);
  };

  const saveJourney = async (rawCoords) => {
    if (!user || rawCoords.length === 0) return;

    try {
      Logger.info('MAP_SCREEN', 'Saving journey...', { 
        userId: user.uid, 
        routePoints: rawCoords.length 
      });

      // Create journey data
      const journeyData = {
        userId: user.uid,
        name: `Walk on ${new Date().toLocaleDateString()}`,
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

  const handleEndWalk = (coords) => {
    if (coords.length < MIN_ROUTE_POINTS) {
      setPendingCoords(coords);
      setShowMinDistanceModal(true);
      Logger.info('MAP_SCREEN', 'handleEndWalk: walk has too few points', { coordsLength: coords.length });
      return false;
    }
    if (calculateTotalDistance(coords) < MIN_ROUTE_DISTANCE) {
      setPendingCoords(coords);
      setShowMinDistanceModal(true);
      Logger.info('MAP_SCREEN', 'handleEndWalk: walk too short', { distance: calculateTotalDistance(coords) });
      return false;
    }
    return true;
  };

  const refundPings = async () => {
    if (pingUsed > 0 && user) {
      try {
        // Call PingService to refund credits
        // (Assume PingService.refundCredits exists or implement it)
        await JourneyService.refundPingCredits(user.uid, pingUsed);
        setPingUsed(0);
      } catch (error) {
        Logger.error('MAP_SCREEN', 'Failed to refund ping credits', error);
      }
    }
  };

  const toggleTracking = async () => {
    if (tracking) {
      // Stop tracking
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
      setTracking(false);
      // Always check for minimum walk requirement, even if 0 or 1 points
      if (currentJourneyId) {
        if (!handleEndWalk(pathToRender)) {
          setPendingEndWalk(true);
          Logger.info('MAP_SCREEN', 'Showing minimum distance modal', { pathToRenderLength: pathToRender.length });
          // Do NOT clear state here; wait for user to choose in modal
          return;
        }
        // Only save if valid
        if (pathToRender.length >= MIN_ROUTE_POINTS && calculateTotalDistance(pathToRender) >= MIN_ROUTE_DISTANCE) {
          await saveJourney(pathToRender);
        }
      }
    } else {
      // Start tracking
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required to track your walks.');
          return;
        }

        // Request background permissions
        const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus.status !== 'granted') {
          Alert.alert(
            'Background Permission Required',
            'Please grant "Always" location access to track your walks in the background.'
          );
          return;
        }

        // Create new journey
        const journeyId = Date.now().toString();
        setCurrentJourneyId(journeyId);
        setPathToRender([]);
        setPreviewRoute([]);
        setPreviewRoadCoords([]);
        setPingUsed(0);

        // Start location tracking
        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000,
            distanceInterval: 5,
            showsBackgroundLocationIndicator: true,
          },
          (location) => {
            const newCoord = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              timestamp: location.timestamp,
            };

            setCurrentPosition(newCoord);
            setPathToRender(prev => [...prev, newCoord]);
          }
        );

        setTracking(true);
        Logger.info('MAP_SCREEN', 'Started tracking', { journeyId });
      } catch (error) {
        Logger.error('MAP_SCREEN', 'Error starting tracking', error);
        Alert.alert('Error', 'Failed to start tracking. Please try again.');
      }
    }
  };

  const handleDiscardWalk = async () => {
    Logger.info('MAP_SCREEN', 'User chose to discard walk, refunding pings and clearing state');
    setShowMinDistanceModal(false);
    setPendingEndWalk(false);
    setPendingCoords([]);
    await refundPings();
    setCurrentJourneyId(null);
    setPathToRender([]);
    setPreviewRoute([]);
    setPreviewRoadCoords([]);
    Alert.alert('Walk Discarded', 'Your walk was too short to be saved. Any used pings have been refunded.');
  };
  const handleContinueWalk = () => {
    setShowMinDistanceModal(false);
    setPendingEndWalk(false);
    setPendingCoords([]);
  };

  const renderSavedRoutes = () =>
    savedRoutes.map(journey => (
      <Polyline
        key={journey.id}
        coordinates={journey.route}
        strokeColor={colors.primary}
        strokeWidth={3}
        opacity={0.6}
      />
    ));

  const renderSavedPlaces = () => {
    if (!showSavedPlaces) return null;
    
    return savedPlaces.map(place => (
      <Marker
        key={place.id}
        coordinate={{
          latitude: place.latitude,
          longitude: place.longitude,
        }}
        title={place.name}
        description={place.vicinity}
      >
        <View style={[styles.savedPlaceMarker, { backgroundColor: colors.primary }]}>
          <MaterialIcons name="favorite" size={16} color={colors.buttonText} />
        </View>
      </Marker>
    ));
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

      {region ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          customMapStyle={mapStyleArray}
          onError={handleMapError}
          showsUserLocation={false}
          showsMyLocationButton={false}
          toolbarEnabled={false}
        >
          {/* Saved routes as polylines */}
          {savedRoutes.map(journey => (
            <Polyline
              key={journey.id}
              coordinates={journey.route}
              strokeColor={colors.primary}
              strokeWidth={3}
            />
          ))}
          {/* Preview route polyline */}
          {(previewRoadCoords.length > 0 || previewRoute.length > 0) && (
            <Polyline
              coordinates={previewRoadCoords.length > 0 ? previewRoadCoords : previewRoute}
              strokeColor={colors.accent}
              strokeWidth={4}
            />
          )}
          {/* Current path polyline */}
          {pathToRender.length > 0 && (
            <Polyline
              coordinates={pathToRender}
              strokeColor={colors.primary}
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

      {showMinDistanceModal && (
        <Modal
          visible={showMinDistanceModal}
          transparent
          animationType="fade"
          onRequestClose={handleContinueWalk}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={{ backgroundColor: colors.card, padding: 24, borderRadius: 16, alignItems: 'center', maxWidth: 320 }}>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Hey, listen!</Text>
              <Text style={{ color: colors.text, fontSize: 16, marginBottom: 16, textAlign: 'center' }}>
                It seems like your walk has fewer than three points or is less than 50 meters. If you end now, your progress won't be saved. (Any used pings on this walk will be refunded.)
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                <TouchableOpacity
                  style={{ flex: 1, marginRight: 8, backgroundColor: colors.buttonSecondary, padding: 12, borderRadius: 8 }}
                  onPress={handleContinueWalk}
                >
                  <Text style={{ color: colors.primary, textAlign: 'center', fontWeight: 'bold' }}>Go Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, marginLeft: 8, backgroundColor: colors.error, padding: 12, borderRadius: 8 }}
                  onPress={handleDiscardWalk}
                >
                  <Text style={{ color: colors.buttonText, textAlign: 'center', fontWeight: 'bold' }}>Discard Walk</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

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
    borderRadius: 8, // beveled/rounded corners
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
});
