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
        Logger.debug('Initializing location services');
        await BackgroundLocationService.cleanup();
        const initialized = await BackgroundLocationService.initialize();
        if (!initialized) {
          Logger.warn('Location setup failed');
          Alert.alert('Location Setup Failed', 'Please enable location permissions in your device settings.');
          return;
        }
        
        Logger.debug('Setting up location update callback');
        BackgroundLocationService.setLocationUpdateCallback((coords, journey) => {
          Logger.debug('Location update received', {
            lat: coords.latitude.toFixed(6),
            lng: coords.longitude.toFixed(6),
            accuracy: coords.accuracy
          });
          
          setCurrPosition({
            latitude: coords.latitude,
            longitude: coords.longitude,
            timestamp: coords.timestamp,
          });
          setLocAccuracy(coords.accuracy);
          if (setPathToRender) setPathToRender(journey.coordinates);
        });
        
        try {
          Logger.debug('Getting initial location');
          const coords = await BackgroundLocationService.getCurrentLocation();
          if (coords && coords.latitude && coords.longitude) {
            const initialPosition = {
              latitude: coords.latitude,
              longitude: coords.longitude,
              timestamp: Date.now(),
            };
            setCurrPosition(initialPosition);
            setLocAccuracy(coords.accuracy);
            Logger.debug('Initial position set', initialPosition);
          } else {
            Logger.warn('Invalid coordinates received');
            throw new Error('Invalid coordinates');
          }
        } catch (error) {
          Logger.warn('Error getting initial location, trying fallback', error);
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
                Logger.debug('Fallback position set', fallbackPosition);
              }
            }
          } catch (fallbackError) {
            Logger.error('Fallback location failed', fallbackError);
            setLocError(true);
          }
        }
      } catch (error) {
        Logger.error('Error initializing location services:', error);
        Alert.alert('Location Error', 'Failed to initialize location services. Please check your permissions.');
        setLocError(true);
      }
    };
    
    initializeLocation();
    if (loadSavedRoutes) loadSavedRoutes();
    if (loadSavedPlaces) loadSavedPlaces();
    checkBackgroundPermissions();
    
    return () => {
      Logger.debug('Cleaning up location services');
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