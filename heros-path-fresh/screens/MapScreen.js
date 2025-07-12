// screens/MapScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  StatusBar,
} from 'react-native';
import MapView, { Polyline, Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../styles/theme';
import { snapToRoads } from '../services/DiscoveriesService';
import { useUser } from '../contexts/UserContext';
import JourneyService from '../services/JourneyService';
import DiscoveryService from '../services/DiscoveryService';

const ROUTES_STORAGE_KEY = '@saved_routes';
const SAVED_PLACES_KEY = 'savedPlaces';
const SHOW_SAVED_PLACES_KEY = '@show_saved_places';

// Link sprites
const SPRITES = {
  idle: require('../assets/link_sprites/link_idle.gif'),
  up: require('../assets/link_sprites/link_walk_up.gif'),
  down: require('../assets/link_sprites/link_walk_down.gif'),
  left: require('../assets/link_sprites/link_walk_left.gif'),
  right: require('../assets/link_sprites/link_walk_right.gif'),
};

function getDirection([prev, curr]) {
  const dx = curr.longitude - prev.longitude;
  const dy = curr.latitude - prev.latitude;
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  
  if (angle >= -45 && angle < 45) return 'right';
  if (angle >= 45 && angle < 135) return 'up';
  if (angle >= 135 || angle < -135) return 'left';
  return 'down';
}

export default function MapScreen({ navigation, route }) {
  const { user } = useUser();
  const [tracking, setTracking] = useState(false);
  const [previewRoadCoords, setPreviewRoadCoords] = useState([]);
  const [rawCoords, setRawCoords] = useState([]);
  const [roadCoords, setRoadCoords] = useState([]);
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [previewRoute, setPreviewRoute] = useState(null);
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [showSavedPlaces, setShowSavedPlaces] = useState(true);

  const locationSubscriber = useRef(null);
  const mapRef = useRef(null);
  const isFocused = useIsFocused();

   useEffect(() => {
     if (isFocused && user) {
       // Load journeys from Firestore
       JourneyService.getUserJourneys(user.uid)
         .then(result => {
           if (result.success) {
             const journeys = result.journeys.map(journey => ({
               id: journey.id,
               coords: journey.route || [],
               date: journey.createdAt?.toDate?.() || new Date(journey.createdAt) || new Date(),
               name: journey.name,
               distance: journey.distance,
               duration: journey.duration,
             }));
             setSavedRoutes(journeys);
           } else {
             setSavedRoutes([]);
           }
         })
         .catch(err => {
           console.error('Failed to load journeys from Firestore', err);
           setSavedRoutes([]);
         });
       
       // Load saved places from Firestore
       DiscoveryService.getSavedPlaces(user.uid)
         .then(result => {
           if (result.success) {
             const places = result.discoveries.map(discovery => ({
               placeId: discovery.placeId,
               name: discovery.placeName || discovery.placeData?.name,
               latitude: discovery.location?.lat,
               longitude: discovery.location?.lng,
               rating: discovery.placeData?.rating,
               types: discovery.placeData?.types || [],
               formatted_address: discovery.placeData?.formatted_address,
               // Preserve original place data for compatibility
               ...discovery.placeData
             }));
             setSavedPlaces(places);
           } else {
             setSavedPlaces([]);
           }
         })
         .catch(err => {
           console.error('Failed to load saved places from Firestore', err);
           setSavedPlaces([]);
         });
       
       // Load show saved places preference
       AsyncStorage.getItem(SHOW_SAVED_PLACES_KEY)
         .then(stored => {
           setShowSavedPlaces(stored !== 'false'); // Default to true
         })
         .catch(() => setShowSavedPlaces(true));
     } else if (isFocused && !user) {
       // Fallback to AsyncStorage for non-authenticated users
       AsyncStorage.getItem(ROUTES_STORAGE_KEY)
         .then(stored => {
           const raw = stored ? JSON.parse(stored) : [];
           setSavedRoutes(raw);
         })
         .catch(err => console.error('Failed to load journeys', err));
       
       AsyncStorage.getItem(SAVED_PLACES_KEY)
         .then(stored => {
           const places = stored ? JSON.parse(stored) : [];
           setSavedPlaces(places);
         })
         .catch(err => console.error('Failed to load saved places', err));
       
       AsyncStorage.getItem(SHOW_SAVED_PLACES_KEY)
         .then(stored => {
           setShowSavedPlaces(stored !== 'false');
         })
         .catch(() => setShowSavedPlaces(true));
     }
   }, [isFocused, user]);

   useEffect(() => {
     const journey = route.params?.routeToDisplay;
     setPreviewRoadCoords([]);
     setPreviewRoute(null);  
     if (journey?.coords) {
       setPreviewRoute(journey.coords);
       mapRef.current?.animateToRegion({
         ...journey.coords[0],
         latitudeDelta: 0.02,
         longitudeDelta: 0.02,
       });
       navigation.setParams({ routeToDisplay: null });  
       snapToRoads(journey.coords)
         .then(snapped => setPreviewRoadCoords(snapped))
         .catch(() => {});
     }
   }, [route.params?.routeToDisplay, navigation]);

  // Fetch user location on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Location access is needed.');
        return;
      }
      try {
        const { coords } = await Location.getCurrentPositionAsync();
        if (isMounted) setCurrentPosition(coords);
      } catch {
        Alert.alert('Error', 'Unable to fetch location.');
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const locateMe = async () => {
    try {
      const { coords } = await Location.getCurrentPositionAsync();
      setCurrentPosition(coords);
      mapRef.current?.animateToRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    } catch {
      Alert.alert('Error', 'Unable to fetch location.');
    }
  };

  const toggleSavedPlaces = async () => {
    const newValue = !showSavedPlaces;
    setShowSavedPlaces(newValue);
    await AsyncStorage.setItem(SHOW_SAVED_PLACES_KEY, newValue.toString());
  };

  const toggleTracking = async () => {
    if (!tracking) {
      setPreviewRoute(null);
      setRawCoords([]);
      setRoadCoords([]);
      locationSubscriber.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Highest, timeInterval: 2000, distanceInterval: 5 },
        ({ coords }) => {
          const pos = { latitude: coords.latitude, longitude: coords.longitude };
          setRawCoords(prev => [...prev, pos]);
          setCurrentPosition(pos);
        }
      );
      setTracking(true);
    } else {
      locationSubscriber.current?.remove();
      setTracking(false);

      // Save journey
      try {
        if (user) {
          // Save to Firestore
          const journeyData = {
            name: `Journey ${new Date().toLocaleDateString()}`,
            route: rawCoords,
            distance: 0, // Calculate distance if needed
            duration: 0, // Calculate duration if needed
            startLocation: rawCoords[0] || null,
            endLocation: rawCoords[rawCoords.length - 1] || null,
          };
          
          const result = await JourneyService.createJourney(user.uid, journeyData);
          if (result.success) {
            // Reload journeys to get updated list
            const journeysResult = await JourneyService.getUserJourneys(user.uid);
            if (journeysResult.success) {
              const journeys = journeysResult.journeys.map(journey => ({
                id: journey.id,
                coords: journey.route || [],
                date: journey.createdAt?.toDate?.() || new Date(journey.createdAt) || new Date(),
                name: journey.name,
                distance: journey.distance,
                duration: journey.duration,
              }));
              setSavedRoutes(journeys);
            }
          }
        } else {
          // Fallback to AsyncStorage for non-authenticated users
          const stored = await AsyncStorage.getItem(ROUTES_STORAGE_KEY);
          const base = stored ? JSON.parse(stored) : [];
          const normalized = base.map(e =>
            Array.isArray(e)
              ? { id: String(Date.now()), coords: e, date: new Date().toISOString() }
              : e
          );

          const newEntry = { id: Date.now().toString(), coords: rawCoords, date: new Date().toISOString() };
          const newSaved = [...normalized, newEntry];
          await AsyncStorage.setItem(ROUTES_STORAGE_KEY, JSON.stringify(newSaved));
          setSavedRoutes(newSaved);
        }
        
        await AsyncStorage.setItem('lastRoute', JSON.stringify({ coords: rawCoords, date: new Date().toISOString() }));

        // Snap to roads for the live path and hide raw coords
        try {
          const snapped = await snapToRoads(rawCoords);
          setRoadCoords(snapped);
          setRawCoords([]); // Hide raw polyline after completion
        } catch (e) {
          console.warn('Road snapping failed:', e);
        }

        Alert.alert('Saved', `Route with ${rawCoords.length} points saved.`);
      } catch (err) {
        console.error('Error saving journey', err);
        Alert.alert('Save failed', err.message || 'Unknown error');
      }
    }
  };

  const renderSavedRoutes = () =>
    savedRoutes.map(journey => (
      <Polyline key={journey.id} coordinates={journey.coords} strokeColor="rgba(0,0,255,0.3)" strokeWidth={4} />
    ));

  const renderSavedPlaces = () => {
    if (!showSavedPlaces || savedPlaces.length === 0) return null;
    
    // Remove duplicates based on placeId
    const uniquePlaces = savedPlaces.filter((place, index, self) => 
      index === self.findIndex(p => p.placeId === place.placeId)
    );
    
    return uniquePlaces
      .filter(place => place.latitude && place.longitude)
      .map(place => (
        <Marker
          key={`saved-${place.placeId}`}
          coordinate={{
            latitude: place.latitude,
            longitude: place.longitude,
          }}
          pinColor={Colors.primary}
          tracksViewChanges={false}
        >
          <Callout>
            <View style={styles.calloutContainer}>
              <Text style={styles.calloutTitle}>{place.name}</Text>
              {place.category && (
                <Text style={styles.calloutCategory}>
                  {place.category.replace('_', ' ')}
                  {place.combinedTypes && place.combinedTypes.length > 1 && (
                    <Text style={styles.calloutCombinedTypes}>
                      {' • ' + place.combinedTypes.slice(1).map(type => type.replace('_', ' ')).join(', ')}
                    </Text>
                  )}
                </Text>
              )}
              {place.rating && (
                <Text style={styles.calloutRating}>
                  ★ {place.rating} ({place.userRatingsTotal || 0} reviews)
                </Text>
              )}
              {place.description && (
                <Text style={styles.calloutDescription}>{place.description}</Text>
              )}
            </View>
          </Callout>
        </Marker>
      ));
  };

  // Sprite logic
  let spriteSource = SPRITES.idle;
  if (tracking && rawCoords.length >= 2) {
    const len = rawCoords.length;
    spriteSource = SPRITES[getDirection([rawCoords[len - 2], rawCoords[len - 1]])];
  } else if (tracking) {
    spriteSource = SPRITES.down;
  }

  // Only show raw coords while tracking, otherwise show road coords
  const pathToRender = tracking ? rawCoords : roadCoords;

  return (
    <View style={styles.container}>
      {currentPosition ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: currentPosition.latitude,
            longitude: currentPosition.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
        >
          {renderSavedRoutes()}
          {/* ─── show snapped preview if ready, else raw */}
          {(previewRoadCoords.length > 0 || previewRoute) && (
            <Polyline
              coordinates={previewRoadCoords.length > 0 ? previewRoadCoords : previewRoute}
              strokeColor="purple"
              strokeWidth={4}
            />
          )}
          {pathToRender.length > 0 && <Polyline coordinates={pathToRender} strokeColor="rgba(0,122,255,0.8)" strokeWidth={6} />}
          <Marker coordinate={currentPosition} anchor={{ x: 0.5, y: 0.9 }}>
            <Image source={spriteSource} style={styles.sprite} />
          </Marker>
          {renderSavedPlaces()}
        </MapView>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading your location…</Text>
        </View>
      )}
      
      {/* Control buttons */}
      <View style={styles.buttonContainer}>
        {/* Discovery preferences button */}
        <TouchableOpacity style={styles.preferencesButton} onPress={() => navigation.navigate('DiscoveryPreferences')}>
          <MaterialIcons name="tune" size={24} color={Colors.primary} />
        </TouchableOpacity>
        
        {/* Locate button */}
        <TouchableOpacity style={styles.locateButton} onPress={locateMe}>
          <MaterialIcons name="my-location" size={28} color={Colors.primary} />
        </TouchableOpacity>
        
        {/* Toggle saved places button */}
        <TouchableOpacity 
          style={[styles.toggleButton, showSavedPlaces && styles.toggleButtonActive]} 
          onPress={toggleSavedPlaces}
        >
          <MaterialIcons 
            name={showSavedPlaces ? "place" : "place-outline"} 
            size={24} 
            color={showSavedPlaces ? Colors.background : Colors.primary} 
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.trackButtonContainer}>
        <TouchableOpacity
          style={[styles.trackButton, tracking ? styles.trackButtonActive : styles.trackButtonInactive]}
          onPress={toggleTracking}
        >
          <Text style={styles.trackButtonText}>{tracking ? 'Stop & Save Walk' : 'Start Walk'}</Text>
        </TouchableOpacity>
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  sprite: { width: 16, height: 32 },
  buttonContainer: {
    position: 'absolute',
    right: Spacing.md,
    bottom: 120,
    alignItems: 'center',
  },
  preferencesButton: {
    backgroundColor: Colors.background,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: Spacing.sm,
  },
  locateButton: {
    backgroundColor: Colors.background,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: Spacing.sm,
  },
  toggleButton: {
    backgroundColor: Colors.background,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary,
  },
  trackButtonContainer: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
  },
  trackButton: {
    padding: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  trackButtonActive: {
    backgroundColor: '#FF3B30',
  },
  trackButtonInactive: {
    backgroundColor: Colors.primary,
  },
  trackButtonText: {
    ...Typography.h3,
    color: Colors.background,
    fontWeight: '600',
  },
  calloutContainer: {
    width: 200,
    padding: Spacing.sm,
  },
  calloutTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  calloutCategory: {
    ...Typography.body,
    color: Colors.primary,
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  calloutCombinedTypes: {
    ...Typography.body,
    color: Colors.primary,
    fontSize: 10,
    fontStyle: 'italic',
  },
  calloutRating: {
    ...Typography.body,
    color: Colors.text + '80',
    fontSize: 12,
    marginBottom: 4,
  },
  calloutDescription: {
    ...Typography.body,
    color: Colors.text + '80',
    fontSize: 12,
  },
});
