import { useState, useEffect } from 'react';
import { Alert, Platform, Linking, AppState } from 'react-native';
import * as Location from 'expo-location';
import BackgroundLocationService from '../services/BackgroundLocationService';

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
      // Optionally handle error
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
        await BackgroundLocationService.cleanup();
        const initialized = await BackgroundLocationService.initialize();
        if (!initialized) {
          Alert.alert('Location Setup Failed', 'Please enable location permissions in your device settings.');
          return;
        }
        BackgroundLocationService.setLocationUpdateCallback((coords, journey) => {
          setCurrPosition({
            latitude: coords.latitude,
            longitude: coords.longitude,
            timestamp: coords.timestamp,
          });
          setLocAccuracy(coords.accuracy);
          if (setPathToRender) setPathToRender(journey.coordinates);
        });
        try {
          const coords = await BackgroundLocationService.getCurrentLocation();
          if (coords && coords.latitude && coords.longitude) {
            setCurrPosition({
              latitude: coords.latitude,
              longitude: coords.longitude,
              timestamp: Date.now(),
            });
            setLocAccuracy(coords.accuracy);
          } else {
            throw new Error('Invalid coordinates');
          }
        } catch (error) {
          try {
            const { status } = await Location.getForegroundPermissionsAsync();
            if (status === 'granted') {
              const fallbackLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
                maximumAge: 10000,
              });
              if (fallbackLocation?.coords) {
                setCurrPosition({
                  latitude: fallbackLocation.coords.latitude,
                  longitude: fallbackLocation.coords.longitude,
                  timestamp: Date.now(),
                });
                setLocAccuracy(fallbackLocation.coords.accuracy);
              }
            }
          } catch (fallbackError) {
            setLocError(true);
          }
        }
      } catch (error) {
        Alert.alert('Location Error', 'Failed to initialize location services. Please check your permissions.');
        setLocError(true);
      }
    };
    initializeLocation();
    if (loadSavedRoutes) loadSavedRoutes();
    if (loadSavedPlaces) loadSavedPlaces();
    checkBackgroundPermissions();
    return () => {
      BackgroundLocationService.setLocationUpdateCallback(null);
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
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