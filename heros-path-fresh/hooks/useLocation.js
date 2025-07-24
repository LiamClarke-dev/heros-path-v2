import { useState, useEffect } from 'react';
import { Alert, Platform, Linking, AppState } from 'react-native';
import * as Location from 'expo-location';
import BackgroundLocationService from '../services/BackgroundLocationService';
import Logger from '../utils/Logger';

export default function useLocation({
  setPathToRender,
  setLocationAccuracy,
  setCurrentPosition,
  setLocationError,
  setBackgroundPermissionWarning,
  loadSavedRoutes,
  loadSavedPlaces,
}) {
  const [backgroundPermissionWarning, setBgPermissionWarning] = useState(false);
  const [locationError, setLocError] = useState(false);
  const [currentPosition, setCurrPosition] = useState(null);
  const [locationAccuracy, setLocAccuracy] = useState(null);

  // Sync state with parent if provided
  useEffect(() => { if (setLocationError) setLocationError(locationError); }, [locationError]);
  useEffect(() => { if (setBackgroundPermissionWarning) setBackgroundPermissionWarning(backgroundPermissionWarning); }, [backgroundPermissionWarning]);
  useEffect(() => { if (setCurrentPosition) setCurrentPosition(currentPosition); }, [currentPosition]);
  useEffect(() => { if (setLocationAccuracy) setLocationAccuracy(locationAccuracy); }, [locationAccuracy]);

  const checkBackgroundPermissions = async () => {
    try {
      const { status } = await Location.getBackgroundPermissionsAsync();
      setBgPermissionWarning(status !== 'granted');
    } catch (error) {
      Logger.error('Error checking background permissions:', error);
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

  useEffect(() => {
    const initializeLocation = async () => {
      try {
        Logger.debug('useLocation: Initializing location services');
        
        // Clean up any existing service state
        await BackgroundLocationService.cleanup();
        
        // Set up the location update callback BEFORE initializing
        // This ensures the callback is registered before any location updates occur
        Logger.debug('useLocation: Setting up location update callback');
        BackgroundLocationService.setLocationUpdateCallback((coords, journey) => {
          if (!coords || !coords.latitude || !coords.longitude) {
            Logger.warn('useLocation: Received invalid coordinates in callback', coords);
            return;
          }
          
          Logger.debug('useLocation: Location update received', {
            lat: coords.latitude.toFixed(6),
            lng: coords.longitude.toFixed(6),
            accuracy: coords.accuracy,
            hasJourney: !!journey,
            journeyCoordinates: journey?.coordinates?.length || 0
          });
          
          // Update current position
          setCurrPosition({
            latitude: coords.latitude,
            longitude: coords.longitude,
            timestamp: coords.timestamp,
          });
          
          // Update accuracy
          setLocAccuracy(coords.accuracy);
          
          // Update path to render if callback provided and journey exists
          if (setPathToRender && journey && journey.coordinates) {
            setPathToRender(journey.coordinates);
          }
        });
        
        // Now initialize the service
        const initialized = await BackgroundLocationService.initialize();
        if (!initialized) {
          Logger.warn('useLocation: Location setup failed');
          Alert.alert('Location Setup Failed', 'Please enable location permissions in your device settings.');
          setLocError(true);
          return;
        }
        
        // Get initial location
        try {
          Logger.debug('useLocation: Getting initial location');
          const coords = await BackgroundLocationService.getCurrentLocation();
          
          if (coords && coords.latitude && coords.longitude) {
            const initialPosition = {
              latitude: coords.latitude,
              longitude: coords.longitude,
              timestamp: Date.now(),
            };
            setCurrPosition(initialPosition);
            setLocAccuracy(coords.accuracy);
            Logger.debug('useLocation: Initial position set', initialPosition);
          } else {
            Logger.warn('useLocation: Invalid coordinates received');
            throw new Error('Invalid coordinates');
          }
        } catch (error) {
          Logger.warn('useLocation: Error getting initial location, trying fallback', error);
          
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
                setCurrPosition(fallbackPosition);
                setLocAccuracy(fallbackLocation.coords.accuracy);
                Logger.debug('useLocation: Fallback position set', fallbackPosition);
              } else {
                throw new Error('Invalid fallback coordinates');
              }
            } else {
              throw new Error('Location permission not granted');
            }
          } catch (fallbackError) {
            Logger.error('useLocation: Fallback location failed', fallbackError);
            setLocError(true);
          }
        }
      } catch (error) {
        Logger.error('useLocation: Error initializing location services:', error);
        Alert.alert('Location Error', 'Failed to initialize location services. Please check your permissions.');
        setLocError(true);
      }
    };
    
    // Initialize location services
    initializeLocation();
    
    // Load saved routes and places if callbacks provided
    if (loadSavedRoutes) loadSavedRoutes();
    if (loadSavedPlaces) loadSavedPlaces();
    
    // Check background permissions
    checkBackgroundPermissions();
    
    // Clean up on unmount
    return () => {
      Logger.debug('useLocation: Cleaning up location services');
      BackgroundLocationService.setLocationUpdateCallback(null);
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        Logger.debug('App came to foreground, checking permissions');
        checkBackgroundPermissions();
      }
    });
    return () => subscription.remove();
  }, []);

  return {
    currentPosition,
    locationAccuracy,
    locationError,
    backgroundPermissionWarning,
    checkBackgroundPermissions,
    showBackgroundPermissionWarning,
  };
}