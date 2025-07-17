/*
 * BACKGROUND LOCATION SERVICE
 * ===========================
 * 
 * PURPOSE:
 * This service manages all GPS location tracking functionality for Hero's Path.
 * It handles requesting location permissions, tracking user movement during walks,
 * storing location data, and providing callbacks for location updates. Think of it
 * as the GPS engine that powers the app's core tracking functionality while
 * respecting user privacy and providing transparent permission management.
 * 
 * FUNCTIONALITY:
 * - Manages location permission requests with user-friendly explanations
 * - Tracks GPS location during active walks with configurable accuracy
 * - Stores location data temporarily during journeys for performance
 * - Provides callbacks for real-time location updates to UI components
 * - Handles tracking start, stop, pause, and resume operations
 * - Manages location subscription lifecycle to prevent memory leaks
 * - Provides status information about current tracking state
 * - Includes privacy-focused permission dialogs with clear explanations
 * - Filters low-accuracy GPS points to improve route quality
 * - Implements GPS warm-up mechanism for better accuracy recovery
 * - Handles app lifecycle transitions for background/foreground tracking
 * 
 * WHY IT EXISTS:
 * Location tracking is core to Hero's Path's functionality, but it's complex and
 * sensitive. This service centralizes all location logic, handles the intricacies
 * of permissions and tracking lifecycle, and provides a clean interface for other
 * components. It also ensures user privacy by being transparent about when and
 * why location is tracked.
 * 
 * KEY FEATURES:
 * - Privacy-first approach with clear permission explanations
 * - Robust error handling for permission denials and location failures
 * - Efficient location storage and retrieval during active tracking
 * - Platform-specific permission handling (iOS/Android differences)
 * - Automatic cleanup when tracking stops
 * - Integration with device settings for permission management
 * - Performance optimization to minimize battery usage
 * - Location accuracy filtering to improve route quality
 * - GPS warm-up mechanism for faster accuracy recovery
 * - App lifecycle management for seamless background/foreground tracking
 * 
 * RELATIONSHIPS:
 * - Used by MapScreen.js for real-time location tracking during walks
 * - Provides location data to journey recording and route visualization
 * - Works with JourneyService for saving completed routes
 * - Integrates with user permission workflows and settings
 * - Called by tracking start/stop workflows throughout the app
 * 
 * REFERENCED BY:
 * - MapScreen.js (primary usage for tracking during walks)
 * - Any component that needs current location or tracking status
 * - Journey completion workflows
 * - Permission management components
 * 
 * REFERENCES:
 * - expo-location (for location services and permissions)
 * - AsyncStorage (for temporary location data storage)
 * - Logger utility (for debugging and error tracking)
 * - React Native Alert and Linking (for permission dialogs)
 * - React Native AppState (for app lifecycle management)
 * 
 * IMPORTANCE TO APP:
 * CRITICAL - This service is absolutely essential for Hero's Path's core functionality.
 * Without reliable location tracking, the app cannot record walks, show routes,
 * or provide the core value proposition. The privacy and permission handling are
 * also crucial for app store compliance and user trust.
 * 
 * IMPROVEMENT SUGGESTIONS:
 * 1. Add battery optimization - adaptive tracking frequency based on battery level
 * 2. Add offline tracking - continue tracking without network connectivity
 * 3. Add location accuracy indicators - show GPS signal strength to users
 * 4. Add automatic pause detection - detect when user stops moving
 * 5. Add location smoothing - filter out GPS noise and erratic readings
 * 6. Add geofencing - detect when user enters/exits specific areas
 * 7. Add elevation tracking - record altitude changes during walks
 * 8. Add speed calculation - track walking/running speed in real-time
 * 9. Add location history - maintain a history of recent locations
 * 10. Add privacy controls - granular control over location data retention
 * 11. Add location sharing - temporary location sharing with friends/family
 * 12. Add emergency features - automatic emergency contact notification
 * 13. Add location-based reminders - contextual notifications based on location
 * 14. Add indoor positioning - enhanced tracking in buildings and underground
 * 15. Add route prediction - predict likely routes based on historical data
 * 16. Add location analytics - insights about user movement patterns
 * 17. Add location export - export location data for external analysis
 * 18. Add enhanced error recovery - better handling of GPS and permission failures
 * 19. Add location validation - detect and filter invalid or suspicious readings
 * 20. Add performance monitoring - track battery usage and location accuracy metrics
 */

import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, AppState } from 'react-native';
import Logger from '../utils/Logger';

const LOCATION_DATA_KEY = '@background_location_data';

// GPS accuracy thresholds for filtering
const ACCURACY_THRESHOLDS = {
  EXCELLENT: 5,    // < 5m - Use immediately
  GOOD: 15,        // < 15m - Use for tracking
  POOR: 50,        // < 50m - Use only if no better option
  REJECT: 100      // > 100m - Reject completely
};

// GPS warm-up configuration
const WARMUP_CONFIG = {
  DURATION: 10000,     // 10 seconds warm-up period
  REQUIRED_POINTS: 3,  // Need 3 good points before considering warmed up
  MAX_ATTEMPTS: 10     // Maximum attempts during warm-up
};

class BackgroundLocationService {
  constructor() {
    this.isTracking = false;
    this.isWarmingUp = false;
    this.currentJourney = null;
    this.locationSubscriber = null;
    this.warmupSubscriber = null;
    this.onLocationUpdate = null;
    this.onJourneyComplete = null;
    this.lastKnownLocation = null;
    this.recentLocations = []; // For filtering and smoothing
    this.appState = AppState.currentState;
    this.backgroundStartTime = null;
    this.appStateSubscription = null;
    this.isInitialized = false;
    
    // Initialize app state monitoring
    this.initializeAppStateMonitoring();
  }

  // Initialize app state monitoring with proper subscription handling
  initializeAppStateMonitoring() {
    if (this.appStateSubscription) {
      // Already initialized, don't create duplicate subscription
      return;
    }
    
    // Bind app state change handler and set up modern subscription
    this.handleAppStateChange = this.handleAppStateChange.bind(this);
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    
    Logger.debug('App state monitoring initialized');
  }

  // Handle app state changes for background/foreground transitions
  handleAppStateChange(nextAppState) {
    Logger.debug('App state changed from', this.appState, 'to', nextAppState);
    
    if (this.appState.match(/inactive|background/) && nextAppState === 'active') {
      // App came to foreground
      this.handleAppForeground();
    } else if (this.appState === 'active' && nextAppState.match(/inactive|background/)) {
      // App went to background
      this.handleAppBackground();
    }
    
    this.appState = nextAppState;
  }

  // Handle app coming to foreground
  handleAppForeground() {
    Logger.info('App foregrounded - checking location tracking state');
    
    if (this.isTracking) {
      // Restart GPS warm-up to get accurate location quickly
      this.startGPSWarmup();
    }
  }

  // Handle app going to background
  handleAppBackground() {
    Logger.info('App backgrounded - maintaining location tracking');
    this.backgroundStartTime = Date.now();
  }

  // Start GPS warm-up for better accuracy recovery
  async startGPSWarmup() {
    if (this.isWarmingUp) {
      Logger.debug('GPS warm-up already in progress');
      return;
    }

    Logger.info('Starting GPS warm-up for accuracy recovery');
    this.isWarmingUp = true;
    
    let attempts = 0;
    let goodPoints = 0;
    const warmupStartTime = Date.now();

    try {
      this.warmupSubscriber = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 500, // Very frequent updates during warm-up
          distanceInterval: 1,
        },
        (location) => {
          attempts++;
          const accuracy = location.coords.accuracy;
          
          Logger.debug(`GPS warm-up attempt ${attempts}: accuracy ${accuracy}m`);
          
          if (accuracy <= ACCURACY_THRESHOLDS.GOOD) {
            goodPoints++;
            Logger.debug(`Good GPS point ${goodPoints}/${WARMUP_CONFIG.REQUIRED_POINTS}`);
          }
          
          // Check if warm-up is complete
          const elapsed = Date.now() - warmupStartTime;
          if (
            goodPoints >= WARMUP_CONFIG.REQUIRED_POINTS || 
            elapsed >= WARMUP_CONFIG.DURATION ||
            attempts >= WARMUP_CONFIG.MAX_ATTEMPTS
          ) {
            this.completeGPSWarmup();
          }
        }
      );
    } catch (error) {
      Logger.error('Failed to start GPS warm-up:', error);
      this.completeGPSWarmup();
    }
  }

  // Complete GPS warm-up and return to normal tracking
  completeGPSWarmup() {
    Logger.info('GPS warm-up completed');
    this.isWarmingUp = false;
    
    if (this.warmupSubscriber) {
      this.warmupSubscriber.remove();
      this.warmupSubscriber = null;
    }
  }

  // Filter location based on accuracy
  isLocationAccurate(location) {
    const accuracy = location.coords.accuracy;
    
    if (accuracy > ACCURACY_THRESHOLDS.REJECT) {
      Logger.debug(`Rejecting location with poor accuracy: ${accuracy}m`);
      return false;
    }
    
    return true;
  }

  // Smooth location using recent points to reduce GPS noise
  smoothLocation(newLocation) {
    // Create a safe copy of the new location to avoid mutation issues
    let locationToReturn = {
      ...newLocation,
      coords: {
        ...newLocation.coords
      }
    };
    
    // If we have enough points for smoothing, check if new location is an outlier
    if (this.recentLocations.length >= 2) {
      // Calculate average of EXISTING locations (excluding the new one)
      const avgLat = this.recentLocations.reduce((sum, loc) => sum + loc.coords.latitude, 0) / this.recentLocations.length;
      const avgLng = this.recentLocations.reduce((sum, loc) => sum + loc.coords.longitude, 0) / this.recentLocations.length;
      
      const distance = this.calculateDistance(
        newLocation.coords.latitude,
        newLocation.coords.longitude,
        avgLat,
        avgLng
      );
      
      // If the new point is very far from the average (> 20m) AND has poor accuracy, smooth it
      if (distance > 20 && newLocation.coords.accuracy > ACCURACY_THRESHOLDS.EXCELLENT) {
        Logger.debug(`Smoothing location - distance from average: ${distance}m, accuracy: ${newLocation.coords.accuracy}m`);
        
        // Use weighted smoothing: blend the new location with the average based on accuracy
        const accuracyWeight = Math.max(0.1, Math.min(0.9, ACCURACY_THRESHOLDS.EXCELLENT / newLocation.coords.accuracy));
        
        // Create completely new object instead of modifying existing ones
        locationToReturn = {
          ...newLocation,
          coords: {
            ...newLocation.coords,
            latitude: (newLocation.coords.latitude * accuracyWeight) + (avgLat * (1 - accuracyWeight)),
            longitude: (newLocation.coords.longitude * accuracyWeight) + (avgLng * (1 - accuracyWeight))
          }
        };
        
        Logger.debug(`Applied weighted smoothing with accuracy weight: ${accuracyWeight.toFixed(2)}`);
      }
    }
    
    // Use immutable array operations instead of push/shift to avoid mutation errors
    this.recentLocations = [...this.recentLocations, locationToReturn];
    
    // Keep only last 5 points for smoothing using immutable operations
    if (this.recentLocations.length > 5) {
      this.recentLocations = this.recentLocations.slice(-5);
    }
    
    return locationToReturn;
  }

  // Calculate distance between two points
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  // Show permission denied alert with privacy information
  showPermissionDeniedAlert() {
    Alert.alert(
      'Location Permission Required',
      'Hero\'s Path needs location access to track your walks and show your route on the map.\n\n' +
      '🔒 Privacy Promise:\n' +
      '• Location tracking only during active walks\n' +
      '• Tracking stops immediately when walk ends\n' +
      '• Route data stored locally until walk completion\n' +
      '• No real-time location monitoring\n\n' +
      'To enable: Settings > Privacy & Security > Location Services > Hero\'s Path > "While Using App"',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => this.openDeviceSettings() }
      ]
    );
  }

  // Open device settings (platform-specific)
  async openDeviceSettings() {
    try {
      // For iOS, we can use Linking to open settings
      const { Linking } = require('react-native');
      await Linking.openSettings();
    } catch (error) {
      console.error('Failed to open device settings:', error);
      // Fallback: just show instructions
      Alert.alert(
        'Open Settings',
        'Please go to Settings > Privacy & Security > Location Services > Hero\'s Path and select "While Using App".'
      );
    }
  }

  // Initialize the service (simplified for Expo Go compatibility)
  async initialize() {
    try {
      // Ensure app state monitoring is set up
      this.initializeAppStateMonitoring();
      
      // Check permissions
      let permissions = await this.checkPermissions();
      if (!permissions.foreground) {
        // Request permissions if not already granted
        const foregroundStatus = await Location.requestForegroundPermissionsAsync();
        if (foregroundStatus.status !== 'granted') {
          this.showPermissionDeniedAlert();
          throw new Error('Location permission not granted. Please enable location permissions in your device settings.');
        }
        // Re-check permissions after requesting
        permissions = await this.checkPermissions();
      }
      
      this.isInitialized = true;
      Logger.info('BackgroundLocationService initialized successfully');
      return true;
    } catch (error) {
      Logger.error('Failed to initialize background location service:', error);
      return false;
    }
  }

  // Store location data for background processing
  async storeLocationData(coords) {
    try {
      const existingData = await AsyncStorage.getItem(LOCATION_DATA_KEY);
      const locationData = existingData ? JSON.parse(existingData) : [];
      
      locationData.push({
        ...coords,
        timestamp: Date.now()
      });

      // Keep only last 1000 points to prevent memory issues
      if (locationData.length > 1000) {
        locationData.splice(0, locationData.length - 1000);
      }

      await AsyncStorage.setItem(LOCATION_DATA_KEY, JSON.stringify(locationData));
    } catch (error) {
      console.error('Failed to store location data:', error);
    }
  }

  // Get stored location data
  async getStoredLocationData() {
    try {
      const data = await AsyncStorage.getItem(LOCATION_DATA_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get stored location data:', error);
      return [];
    }
  }

  // Clear stored location data
  async clearStoredLocationData() {
    try {
      await AsyncStorage.removeItem(LOCATION_DATA_KEY);
    } catch (error) {
      console.error('Failed to clear stored location data:', error);
    }
  }

  // Start tracking with optimized settings
  async startTracking(journeyId, options = {}) {
    if (this.isTracking) {
      Logger.warn('Location tracking already active');
      return false;
    }

    try {
      // Request permissions
      const foregroundStatus = await Location.requestForegroundPermissionsAsync();
      const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
      
      if (foregroundStatus.status !== 'granted') {
        this.showPermissionDeniedAlert();
        throw new Error('Foreground location permission denied');
      }
      
      if (backgroundStatus.status !== 'granted') {
        Alert.alert(
          'Background Permission Required',
          'Hero\'s Path needs "Always" location access to track your walks even when the screen is locked. Please grant this permission in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => this.openDeviceSettings() }
          ]
        );
        throw new Error('Background location permission denied');
      }

      // Initialize current journey
      this.currentJourney = {
        id: journeyId,
        startTime: Date.now(),
        coordinates: [],
        isActive: true
      };

      // Reset recent locations for smoothing
      this.recentLocations = [];

      // Start GPS warm-up first for better initial accuracy
      await this.startGPSWarmup();

      // Start location tracking with optimized settings
      this.locationSubscriber = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000, // Faster updates for better accuracy
          distanceInterval: 2, // Smaller distance for more precise tracking
          // Background task configuration for foreground service
          foregroundService: {
            notificationTitle: "Hero's Path - Adventure in Progress",
            notificationBody: "Recording your journey. Tap to open app.",
            notificationColor: "#007AFF", // Using primary theme color
            killServiceOnDestroy: false, // Keep service alive
          },
          // iOS-specific optimizations
          activityType: Location.ActivityType.Fitness,
          showsBackgroundLocationIndicator: true,
          pausesLocationUpdatesAutomatically: false, // Keep tracking even when stationary
          // Android-specific optimizations
          android: {
            notificationTitle: "Hero's Path - Adventure in Progress",
            notificationBody: "Recording your journey. Tap to open app.",
            notificationColor: "#007AFF", // Using primary theme color
            notificationIcon: null, // Use app icon
            enableHighAccuracy: true,
          }
        },
        (location) => {
          this.handleLocationUpdate(location);
        }
      );

      this.isTracking = true;
      this.lastKnownLocation = null; // Reset for new tracking session
      
      Logger.info('Location tracking started with enhanced accuracy and background support', {
        journeyId,
        permissions: { foreground: foregroundStatus.status, background: backgroundStatus.status }
      });
      
      return true;

    } catch (error) {
      Logger.error('Failed to start location tracking:', error);
      this.currentJourney = null;
      this.isTracking = false;
      
      // Clean up any partial initialization
      if (this.locationSubscriber) {
        this.locationSubscriber.remove();
        this.locationSubscriber = null;
      }
      this.completeGPSWarmup();
      
      return false;
    }
  }

  // Handle location updates
  handleLocationUpdate(location) {
    if (!this.currentJourney || !this.currentJourney.isActive) {
      return;
    }

    // Filter and smooth the location
    const processedLocation = this.smoothLocation(location);

    // Only add if it's accurate and not rejected
    if (this.isLocationAccurate(processedLocation)) {
      const coords = {
        latitude: processedLocation.coords.latitude,
        longitude: processedLocation.coords.longitude,
        timestamp: processedLocation.timestamp,
        accuracy: processedLocation.coords.accuracy
      };

      // Add to current journey
      this.currentJourney.coordinates.push(coords);

      // Store for background processing
      this.storeLocationData(coords);

      // Call callback if available
      if (this.onLocationUpdate) {
        this.onLocationUpdate(coords, this.currentJourney);
      }
    } else {
      Logger.debug('Skipping inaccurate location update:', processedLocation);
    }
  }

  // Stop tracking
  async stopTracking() {
    if (!this.isTracking) {
      return null;
    }

    try {
      // Stop location subscriber
      if (this.locationSubscriber) {
        this.locationSubscriber.remove();
        this.locationSubscriber = null;
      }

      // Stop GPS warm-up if still running
      this.completeGPSWarmup();

      // Mark journey as complete
      if (this.currentJourney) {
        this.currentJourney.isActive = false;
        this.currentJourney.endTime = Date.now();
        // Convert duration from milliseconds to seconds for consistent display
        this.currentJourney.duration = (this.currentJourney.endTime - this.currentJourney.startTime) / 1000;
      }

      this.isTracking = false;
      
      // Get final journey data
      const journeyData = this.currentJourney;
      
      // Reset all state
      this.currentJourney = null;
      this.lastKnownLocation = null;
      this.recentLocations = [];
      this.backgroundStartTime = null;

      // Clear stored background data
      await this.clearStoredLocationData();

      Logger.info('Location tracking stopped successfully', {
        journeyId: journeyData?.id,
        coordinates: journeyData?.coordinates?.length || 0,
        duration: journeyData?.duration || 0
      });
      
      return journeyData;

    } catch (error) {
      Logger.error('Failed to stop location tracking:', error);
      return null;
    }
  }

  // Pause tracking (for battery optimization)
  async pauseTracking() {
    if (this.locationSubscriber) {
      this.locationSubscriber.remove();
      this.locationSubscriber = null;
    }
    
    // Keep journey data but mark as paused
    if (this.currentJourney) {
      this.currentJourney.isPaused = true;
    }
  }

  // Resume tracking
  async resumeTracking() {
    if (!this.currentJourney || !this.currentJourney.isPaused) {
      return false;
    }

    try {
      // Start GPS warm-up for better accuracy after pause
      await this.startGPSWarmup();

      this.locationSubscriber = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 2,
          foregroundService: {
            notificationTitle: "Hero's Path - Adventure in Progress",
            notificationBody: "Recording your journey. Tap to open app.",
            notificationColor: "#007AFF", // Using primary theme color
            killServiceOnDestroy: false,
          },
          activityType: Location.ActivityType.Fitness,
          showsBackgroundLocationIndicator: true,
          pausesLocationUpdatesAutomatically: false,
          android: {
            notificationTitle: "Hero's Path - Adventure in Progress",
            notificationBody: "Recording your journey. Tap to open app.",
            notificationColor: "#007AFF", // Using primary theme color
            notificationIcon: null,
            enableHighAccuracy: true,
          }
        },
        (location) => {
          this.handleLocationUpdate(location);
        }
      );

      this.currentJourney.isPaused = false;
      Logger.info('Location tracking resumed with GPS warm-up');
      return true;

    } catch (error) {
      Logger.error('Failed to resume location tracking:', error);
      return false;
    }
  }

  // Clean up resources and event listeners
  cleanup() {
    // Remove app state listener using subscription object
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    
    // Stop any active tracking
    if (this.isTracking) {
      this.stopTracking();
    }
    
    // Clean up warm-up
    this.completeGPSWarmup();
    
    // Reset all state
    this.currentJourney = null;
    this.lastKnownLocation = null;
    this.recentLocations = [];
    this.backgroundStartTime = null;
    this.onLocationUpdate = null;
    this.onJourneyComplete = null;
    this.isInitialized = false;
    
    Logger.info('BackgroundLocationService cleaned up');
  }

  // Set callbacks
  setLocationUpdateCallback(callback) {
    this.onLocationUpdate = callback;
  }

  setJourneyCompleteCallback(callback) {
    this.onJourneyComplete = callback;
  }

  // Get current status
  getStatus() {
    return {
      isTracking: this.isTracking,
      currentJourney: this.currentJourney,
      hasPermissions: this.checkPermissions()
    };
  }

  // Check permissions
  async checkPermissions() {
    try {
      const foregroundStatus = await Location.getForegroundPermissionsAsync();
      const backgroundStatus = await Location.getBackgroundPermissionsAsync();
      
      return {
        foreground: foregroundStatus.status === 'granted',
        background: backgroundStatus.status === 'granted'
      };
    } catch (error) {
      console.error('Failed to check permissions:', error);
      return { foreground: false, background: false };
    }
  }

  // Get battery-optimized location (for one-time requests)
  async getCurrentLocation(options = {}) {
    try {
      // Check and request permissions if needed
      let permissions = await this.checkPermissions();
      if (!permissions.foreground) {
        const foregroundStatus = await Location.requestForegroundPermissionsAsync();
        if (foregroundStatus.status !== 'granted') {
          this.showPermissionDeniedAlert();
          throw new Error('Location permission not granted. Please enable location permissions in your device settings.');
        }
        permissions = await this.checkPermissions();
      }
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: options.accuracy || Location.Accuracy.Balanced,
        timeInterval: options.timeInterval || 5000,
        distanceInterval: options.distanceInterval || 10
      });
      return coords;
    } catch (error) {
      console.error('Failed to get current location:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new BackgroundLocationService(); 