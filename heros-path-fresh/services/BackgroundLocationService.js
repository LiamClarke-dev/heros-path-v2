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

// Permission monitoring configuration
const PERMISSION_MONITOR_CONFIG = {
  CHECK_INTERVAL: 120000, // Check permissions every 2 minutes during tracking (less frequent)
  INITIAL_DELAY: 60000,   // Wait 1 minute before first check (let user settle in)
  MAX_RETRIES: 3,         // Maximum retries before showing error
  RETRY_DELAY: 5000       // Delay between retries
};

// Location service monitoring configuration
const LOCATION_SERVICE_MONITOR_CONFIG = {
  GPS_TIMEOUT: 30000,     // Consider GPS signal lost after 30 seconds without updates
  RECOVERY_ATTEMPTS: 5,   // Maximum recovery attempts
  RECOVERY_DELAY: 10000   // Delay between recovery attempts
};

class BackgroundLocationService {
  constructor() {
    this.isTracking = false;
    this.isWarmingUp = false;
    this.currentJourney = null;
    this.locationSubscriber = null;
    this.warmupSubscriber = null;
    this.permissionMonitorInterval = null;
    this.gpsTimeoutTimer = null;
    this.lastLocationTime = null;
    this.recoveryAttempts = 0;
    this.isRecovering = false;
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
      // Calculate time spent in background
      const backgroundDuration = this.backgroundStartTime ? Date.now() - this.backgroundStartTime : 0;
      Logger.debug(`App was in background for ${backgroundDuration / 1000} seconds`);
      
      // Add a foreground transition marker to the journey if tracking
      if (this.currentJourney && this.currentJourney.isActive) {
        // Initialize backgroundSegments array if it doesn't exist
        if (!this.currentJourney.backgroundSegments) {
          this.currentJourney.backgroundSegments = [];
        }
        
        // Add transition marker with duration
        if (this.backgroundStartTime) {
          this.currentJourney.backgroundSegments.push({
            timestamp: Date.now(),
            duration: backgroundDuration,
            type: 'foreground_transition'
          });
        }
      }
      
      // Reset background start time
      this.backgroundStartTime = null;
      
      // Restart GPS warm-up to get accurate location quickly after background
      this.startGPSWarmup();
    }
  }

  // Handle app going to background
  handleAppBackground() {
    Logger.info('App backgrounded - maintaining location tracking');
    
    // Record when the app went to background
    this.backgroundStartTime = Date.now();
    
    // Add a background transition marker to the journey if tracking
    if (this.isTracking && this.currentJourney && this.currentJourney.isActive) {
      // Initialize backgroundSegments array if it doesn't exist
      if (!this.currentJourney.backgroundSegments) {
        this.currentJourney.backgroundSegments = [];
      }
      
      // Add transition marker
      this.currentJourney.backgroundSegments.push({
        timestamp: Date.now(),
        type: 'background_transition'
      });
      
      Logger.debug('Added background transition marker to journey');
    }
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

  // Start monitoring permissions during active tracking
  startPermissionMonitoring() {
    if (this.permissionMonitorInterval) {
      Logger.debug('Permission monitoring already active');
      return;
    }

    Logger.info('Starting permission monitoring during tracking (2-minute intervals after 1-minute delay)');
    
    // Start monitoring after initial delay to let user settle into tracking
    setTimeout(() => {
      if (!this.isTracking) {
        Logger.debug('Tracking stopped before permission monitoring started');
        return;
      }
      
      this.permissionMonitorInterval = setInterval(async () => {
        try {
          const permissions = await this.checkPermissions();
          
          // Check if permissions have been revoked during tracking
          if (this.isTracking && (!permissions.foreground || !permissions.background)) {
            Logger.warn('Permissions revoked during tracking', permissions);
            await this.handlePermissionRevocation(permissions);
          }
        } catch (error) {
          Logger.error('Error checking permissions during monitoring:', error);
        }
      }, PERMISSION_MONITOR_CONFIG.CHECK_INTERVAL);
    }, PERMISSION_MONITOR_CONFIG.INITIAL_DELAY);
  }

  // Stop permission monitoring
  stopPermissionMonitoring() {
    if (this.permissionMonitorInterval) {
      clearInterval(this.permissionMonitorInterval);
      this.permissionMonitorInterval = null;
      Logger.info('Permission monitoring stopped');
    }
  }

  // Handle permission revocation during active tracking
  async handlePermissionRevocation(permissions) {
    Logger.error('Permissions revoked during tracking', permissions);
    
    // Stop tracking immediately to prevent errors
    if (this.locationSubscriber) {
      this.locationSubscriber.remove();
      this.locationSubscriber = null;
    }

    // Stop permission monitoring
    this.stopPermissionMonitoring();

    // Determine which permissions were revoked
    const revokedPermissions = [];
    if (!permissions.foreground) revokedPermissions.push('foreground location');
    if (!permissions.background) revokedPermissions.push('background location');

    const { Platform } = require('react-native');
    const permissionText = revokedPermissions.join(' and ');
    
    const platformInstructions = Platform.OS === 'ios'
      ? 'Go to Settings > Privacy & Security > Location Services > Hero\'s Path and re-enable location access.'
      : 'Go to Settings > Apps > Hero\'s Path > Permissions > Location and re-enable location access.';

    // Show user notification with recovery instructions
    Alert.alert(
      'Location Permission Revoked',
      `Your ${permissionText} permission has been revoked during tracking. Your journey has been paused to prevent data loss.\n\n` +
      '🔧 To continue tracking:\n' +
      `• ${platformInstructions}\n` +
      '• Return to the app and start tracking again\n\n' +
      '📍 Your journey data up to this point has been preserved.',
      [
        { 
          text: 'Open Settings', 
          onPress: () => this.openDeviceSettings(),
          style: 'default'
        },
        { 
          text: 'OK', 
          style: 'cancel' 
        }
      ]
    );

    // Mark journey as paused due to permission revocation
    if (this.currentJourney) {
      this.currentJourney.isPaused = true;
      this.currentJourney.pauseReason = 'permission_revoked';
      this.currentJourney.pauseTime = Date.now();
    }

    // Set tracking to false but preserve journey data for potential recovery
    this.isTracking = false;
    
    // Notify UI through callback if available
    if (this.onLocationUpdate) {
      this.onLocationUpdate(null, { 
        ...this.currentJourney, 
        error: 'permission_revoked',
        message: 'Location permissions were revoked during tracking'
      });
    }
  }

  // Attempt to recover tracking after permission revocation
  async attemptTrackingRecovery() {
    if (!this.currentJourney || !this.currentJourney.isPaused || this.currentJourney.pauseReason !== 'permission_revoked') {
      Logger.warn('No paused journey due to permission revocation found');
      return false;
    }

    try {
      // Check if permissions have been restored
      const permissions = await this.checkPermissions();
      
      if (!permissions.foreground || !permissions.background) {
        Logger.warn('Permissions still not granted, cannot recover tracking');
        return false;
      }

      Logger.info('Attempting to recover tracking after permission restoration');

      // Resume the existing journey
      this.currentJourney.isPaused = false;
      this.currentJourney.pauseReason = null;
      this.currentJourney.resumeTime = Date.now();
      
      // Add a recovery marker to the journey
      if (!this.currentJourney.recoveryEvents) {
        this.currentJourney.recoveryEvents = [];
      }
      
      this.currentJourney.recoveryEvents.push({
        type: 'permission_recovery',
        timestamp: Date.now(),
        pauseDuration: Date.now() - this.currentJourney.pauseTime
      });

      // Restart GPS warm-up for better accuracy after recovery
      await this.startGPSWarmup();

      // Restart location tracking with the same configuration
      const notificationConfig = {
        notificationTitle: "Hero's Path - Adventure in Progress",
        notificationBody: "Recording your journey. Tap to open app.",
        notificationColor: "#007AFF",
      };

      this.locationSubscriber = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 2,
          
          foregroundService: {
            ...notificationConfig,
            killServiceOnDestroy: false,
          },
          
          activityType: Location.ActivityType.Fitness,
          showsBackgroundLocationIndicator: true,
          pausesLocationUpdatesAutomatically: false,
          
          android: {
            ...notificationConfig,
            notificationIcon: null,
            enableHighAccuracy: true,
            sticky: true,
            foregroundServiceType: ['location'],
          }
        },
        (location) => {
          const isBackgroundUpdate = this.appState.match(/inactive|background/);
          if (isBackgroundUpdate && this.backgroundStartTime) {
            location.isBackgroundUpdate = true;
            location.backgroundDuration = Date.now() - this.backgroundStartTime;
            
            if (!this.currentJourney.backgroundSegments) {
              this.currentJourney.backgroundSegments = [];
            }
            
            this.currentJourney.backgroundSegments.push({
              timestamp: Date.now(),
              duration: location.backgroundDuration
            });
          }
          
          this.handleLocationUpdate(location);
        }
      );

      this.isTracking = true;
      
      // Restart permission monitoring
      this.startPermissionMonitoring();

      Logger.info('Tracking recovery successful after permission restoration');
      return true;

    } catch (error) {
      Logger.error('Failed to recover tracking after permission restoration:', error);
      return false;
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

  // CRITICAL FIX: Validate coordinates to prevent smoothing towards origin (0,0)
  // This prevents GPS errors from invalid coordinate fallbacks
  isValidLocationCoordinates(location) {
    return location.coords && 
      typeof location.coords.latitude === 'number' && 
      typeof location.coords.longitude === 'number' &&
      !isNaN(location.coords.latitude) && 
      !isNaN(location.coords.longitude) &&
      Math.abs(location.coords.latitude) <= 90 &&
      Math.abs(location.coords.longitude) <= 180;
  }

  // Smooth location using recent points to reduce GPS noise
  smoothLocation(newLocation) {
    try {
      // Create a completely new deep copy of the location to avoid any mutation issues
      let locationToReturn = {
        timestamp: newLocation.timestamp || Date.now(),
        coords: {
          latitude: newLocation.coords.latitude,
          longitude: newLocation.coords.longitude,
          altitude: newLocation.coords.altitude,
          accuracy: newLocation.coords.accuracy,
          speed: newLocation.coords.speed,
          heading: newLocation.coords.heading
        }
      };
      
      // If we have enough points for smoothing, check if new location is an outlier
      if (this.recentLocations.length >= 2) {
        // CRITICAL FIX: Filter out invalid locations before calculating average
        // Using || 0 would skew towards origin (0,0) causing massive GPS errors
        const validLocations = this.recentLocations.filter(loc => this.isValidLocationCoordinates(loc));
        
        // Only proceed with smoothing if we have enough valid locations
        if (validLocations.length >= 2) {
          // Calculate average of VALID existing locations only (excluding the new one)
          const avgLat = validLocations.reduce((sum, loc) => sum + loc.coords.latitude, 0) / validLocations.length;
          const avgLng = validLocations.reduce((sum, loc) => sum + loc.coords.longitude, 0) / validLocations.length;
        
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
          
          // Create completely new object with smoothed coordinates
          locationToReturn = {
            timestamp: newLocation.timestamp || Date.now(),
            coords: {
              latitude: (newLocation.coords.latitude * accuracyWeight) + (avgLat * (1 - accuracyWeight)),
              longitude: (newLocation.coords.longitude * accuracyWeight) + (avgLng * (1 - accuracyWeight)),
              altitude: newLocation.coords.altitude,
              accuracy: newLocation.coords.accuracy,
              speed: newLocation.coords.speed,
              heading: newLocation.coords.heading
            }
          };
          
          Logger.debug(`Applied weighted smoothing with accuracy weight: ${accuracyWeight.toFixed(2)}`);
        }
        } else {
          Logger.debug('BackgroundLocationService: Not enough valid locations for smoothing', {
            totalLocations: this.recentLocations.length,
            validLocations: validLocations?.length || 0
          });
        }
      }
      
      // Use completely immutable array operations to prevent Hermes engine errors
      // CRITICAL FIX: Validate location before adding to recent locations array
      // This prevents accumulation of invalid coordinates that would skew future smoothing
      if (this.isValidLocationCoordinates(locationToReturn)) {
        // Create new array with spread operator, never mutate existing arrays
        const newRecentLocations = [...this.recentLocations, locationToReturn];
        
        // Keep only last 5 points for smoothing using slice (immutable)
        this.recentLocations = newRecentLocations.length > 5 
          ? newRecentLocations.slice(-5) 
          : newRecentLocations;
      } else {
        Logger.warn('BackgroundLocationService: Skipping invalid location for recent locations', {
          lat: locationToReturn.coords?.latitude,
          lng: locationToReturn.coords?.longitude
        });
      }
      
      return locationToReturn;
      
    } catch (error) {
      Logger.error('BackgroundLocationService', 'Error in smoothLocation', { error: error.message });
      
      // Return a safe fallback copy if smoothing fails
      return {
        timestamp: newLocation.timestamp || Date.now(),
        coords: {
          latitude: newLocation.coords.latitude,
          longitude: newLocation.coords.longitude,
          altitude: newLocation.coords.altitude,
          accuracy: newLocation.coords.accuracy,
          speed: newLocation.coords.speed,
          heading: newLocation.coords.heading
        }
      };
    }
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
      const { Linking, Platform } = require('react-native');
      
      if (Platform.OS === 'ios') {
        // For iOS, open app-specific settings
        await Linking.openSettings();
      } else if (Platform.OS === 'android') {
        // For Android, open app-specific settings
        await Linking.openSettings();
      } else {
        throw new Error('Platform not supported');
      }
    } catch (error) {
      console.error('Failed to open device settings:', error);
      
      // Platform-specific fallback instructions
      const { Platform } = require('react-native');
      const instructions = Platform.OS === 'ios' 
        ? 'Please go to Settings > Privacy & Security > Location Services > Hero\'s Path and select "While Using App".'
        : 'Please go to Settings > Apps > Hero\'s Path > Permissions > Location and enable location access.';
      
      Alert.alert('Open Settings', instructions);
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
      // Platform-specific permission request workflow
      const { Platform } = require('react-native');
      
      // Request foreground permissions first (required on both platforms)
      const foregroundStatus = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus.status !== 'granted') {
        this.showPermissionDeniedAlert();
        throw new Error('Foreground location permission denied');
      }
      
      // Request background permissions with platform-specific handling
      const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
      
      if (backgroundStatus.status !== 'granted') {
        const platformMessage = Platform.OS === 'ios' 
          ? 'Hero\'s Path needs "Always" location access to track your walks even when the screen is locked or the app is in the background.'
          : 'Hero\'s Path needs location access "All the time" to track your walks even when the app is in the background.';
          
        const platformInstructions = Platform.OS === 'ios'
          ? 'Go to Settings > Privacy & Security > Location Services > Hero\'s Path > "Always"'
          : 'Go to Settings > Apps > Hero\'s Path > Permissions > Location > "Allow all the time"';
        
        Alert.alert(
          'Background Permission Required',
          `${platformMessage} This ensures your journey is recorded accurately.\n\n` +
          '🔒 Privacy Promise:\n' +
          '• Location tracking only during active walks\n' +
          '• Tracking stops immediately when walk ends\n' +
          '• Your location is never shared without your consent\n\n' +
          `To enable: ${platformInstructions}`,
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
        isActive: true,
        backgroundSegments: [] // Track segments recorded in background
      };

      // Reset recent locations for smoothing
      this.recentLocations = [];

      // Start GPS warm-up first for better initial accuracy
      await this.startGPSWarmup();

      // Configure background notification settings
      const notificationConfig = {
        // Common notification settings
        notificationTitle: "Hero's Path - Adventure in Progress",
        notificationBody: "Recording your journey. Tap to open app.",
        notificationColor: "#007AFF", // Using primary theme color
      };

      // Start location tracking with optimized settings
      this.locationSubscriber = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000, // Faster updates for better accuracy
          distanceInterval: 2, // Smaller distance for more precise tracking
          
          // Background task configuration for foreground service
          foregroundService: {
            ...notificationConfig,
            killServiceOnDestroy: false, // Keep service alive when app is killed
          },
          
          // iOS-specific optimizations
          activityType: Location.ActivityType.Fitness,
          showsBackgroundLocationIndicator: true, // Show indicator in status bar
          pausesLocationUpdatesAutomatically: false, // Keep tracking even when stationary
          
          // Android-specific optimizations
          android: {
            ...notificationConfig,
            notificationIcon: null, // Use app icon
            enableHighAccuracy: true,
            sticky: true, // Keep the service running in background
            // Ensure service stays alive in background
            foregroundServiceType: ['location'],
          }
        },
        (location) => {
          // Track if this update happened in background
          const isBackgroundUpdate = this.appState.match(/inactive|background/);
          if (isBackgroundUpdate && this.backgroundStartTime) {
            // Add metadata about background state
            location.isBackgroundUpdate = true;
            location.backgroundDuration = Date.now() - this.backgroundStartTime;
            
            // Track this segment for analytics
            this.currentJourney.backgroundSegments.push({
              timestamp: Date.now(),
              duration: location.backgroundDuration
            });
          }
          
          this.handleLocationUpdate(location);
        }
      );

      this.isTracking = true;
      this.lastKnownLocation = null; // Reset for new tracking session
      
      // Start monitoring permissions during tracking
      this.startPermissionMonitoring();
      
      // Start GPS signal monitoring
      this.startGPSSignalMonitoring();
      
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
      this.stopPermissionMonitoring();
      
      return false;
    }
  }

  // Handle location updates
  handleLocationUpdate(location) {
    if (!this.currentJourney || !this.currentJourney.isActive) {
      return;
    }

    // Update GPS signal monitoring - we received a location update
    this.startGPSSignalMonitoring();
    
    // If we were recovering from GPS loss, mark as recovered
    if (this.isRecovering) {
      Logger.info('GPS signal recovered during location update');
      this.isRecovering = false;
      this.recoveryAttempts = 0;
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

      // Stop permission monitoring
      this.stopPermissionMonitoring();

      // Stop GPS signal monitoring
      this.stopGPSSignalMonitoring();

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

      // Configure background notification settings
      const notificationConfig = {
        // Common notification settings
        notificationTitle: "Hero's Path - Adventure in Progress",
        notificationBody: "Recording your journey. Tap to open app.",
        notificationColor: "#007AFF", // Using primary theme color
      };

      this.locationSubscriber = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 2,
          
          // Background task configuration for foreground service
          foregroundService: {
            ...notificationConfig,
            killServiceOnDestroy: false, // Keep service alive when app is killed
          },
          
          // iOS-specific optimizations
          activityType: Location.ActivityType.Fitness,
          showsBackgroundLocationIndicator: true, // Show indicator in status bar
          pausesLocationUpdatesAutomatically: false, // Keep tracking even when stationary
          
          // Android-specific optimizations
          android: {
            ...notificationConfig,
            notificationIcon: null, // Use app icon
            enableHighAccuracy: true,
            sticky: true, // Keep the service running in background
            // Ensure service stays alive in background
            foregroundServiceType: ['location'],
          }
        },
        (location) => {
          // Track if this update happened in background
          const isBackgroundUpdate = this.appState.match(/inactive|background/);
          if (isBackgroundUpdate && this.backgroundStartTime) {
            // Add metadata about background state
            location.isBackgroundUpdate = true;
            location.backgroundDuration = Date.now() - this.backgroundStartTime;
            
            // Track this segment for analytics
            if (!this.currentJourney.backgroundSegments) {
              this.currentJourney.backgroundSegments = [];
            }
            
            this.currentJourney.backgroundSegments.push({
              timestamp: Date.now(),
              duration: location.backgroundDuration
            });
          }
          
          this.handleLocationUpdate(location);
        }
      );

      this.currentJourney.isPaused = false;
      Logger.info('Location tracking resumed with GPS warm-up and background support');
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
    
    // Stop permission monitoring
    this.stopPermissionMonitoring();
    
    // Stop GPS signal monitoring
    this.stopGPSSignalMonitoring();
    
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

  // Start GPS signal monitoring
  startGPSSignalMonitoring() {
    if (this.gpsTimeoutTimer) {
      clearTimeout(this.gpsTimeoutTimer);
    }

    this.lastLocationTime = Date.now();
    
    // Set timeout to detect GPS signal loss
    this.gpsTimeoutTimer = setTimeout(() => {
      if (this.isTracking && !this.isRecovering) {
        Logger.warn('GPS signal timeout detected');
        this.handleGPSSignalLoss();
      }
    }, LOCATION_SERVICE_MONITOR_CONFIG.GPS_TIMEOUT);
  }

  // Stop GPS signal monitoring
  stopGPSSignalMonitoring() {
    if (this.gpsTimeoutTimer) {
      clearTimeout(this.gpsTimeoutTimer);
      this.gpsTimeoutTimer = null;
    }
    this.lastLocationTime = null;
    this.recoveryAttempts = 0;
    this.isRecovering = false;
  }

  // Handle GPS signal loss
  async handleGPSSignalLoss() {
    if (this.isRecovering) {
      Logger.debug('Already attempting GPS recovery');
      return;
    }

    Logger.warn('GPS signal lost, attempting recovery');
    this.isRecovering = true;
    this.recoveryAttempts = 0;

    // Notify user about GPS signal loss
    Alert.alert(
      'GPS Signal Lost',
      'GPS signal has been temporarily lost. The app is attempting to recover the signal automatically.\n\n' +
      '📍 Tips to improve GPS signal:\n' +
      '• Move to an area with clear sky view\n' +
      '• Avoid areas with tall buildings or dense trees\n' +
      '• Ensure location services are enabled\n\n' +
      'Your journey will continue once the signal is restored.',
      [{ text: 'OK', style: 'default' }]
    );

    // Attempt to recover GPS signal
    await this.attemptGPSRecovery();
  }

  // Attempt to recover GPS signal
  async attemptGPSRecovery() {
    if (this.recoveryAttempts >= LOCATION_SERVICE_MONITOR_CONFIG.RECOVERY_ATTEMPTS) {
      Logger.error('GPS recovery failed after maximum attempts');
      await this.handleGPSRecoveryFailure();
      return;
    }

    this.recoveryAttempts++;
    Logger.info(`GPS recovery attempt ${this.recoveryAttempts}/${LOCATION_SERVICE_MONITOR_CONFIG.RECOVERY_ATTEMPTS}`);

    try {
      // Check if location services are still available
      const serviceStatus = await Location.hasServicesEnabledAsync();
      if (!serviceStatus) {
        Logger.error('Location services are disabled');
        await this.handleLocationServicesDisabled();
        return;
      }

      // Try to get a fresh location to test GPS
      const testLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10
      });

      if (testLocation && this.isValidLocationCoordinates(testLocation)) {
        Logger.info('GPS signal recovered successfully');
        this.isRecovering = false;
        this.recoveryAttempts = 0;
        
        // Restart GPS signal monitoring
        this.startGPSSignalMonitoring();
        
        // Restart GPS warm-up for better accuracy
        await this.startGPSWarmup();
        
        // Notify user of recovery
        Alert.alert(
          'GPS Signal Restored',
          'GPS signal has been restored. Your journey tracking will continue normally.',
          [{ text: 'OK', style: 'default' }]
        );
        
        return;
      }
    } catch (error) {
      Logger.error(`GPS recovery attempt ${this.recoveryAttempts} failed:`, error);
    }

    // Schedule next recovery attempt
    setTimeout(() => {
      if (this.isTracking && this.isRecovering) {
        this.attemptGPSRecovery();
      }
    }, LOCATION_SERVICE_MONITOR_CONFIG.RECOVERY_DELAY);
  }

  // Handle location services being disabled
  async handleLocationServicesDisabled() {
    Logger.error('Location services are disabled');
    this.isRecovering = false;

    Alert.alert(
      'Location Services Disabled',
      'Location services have been disabled on your device. Please enable them to continue tracking your journey.\n\n' +
      '⚙️ To enable location services:\n' +
      '• Go to your device Settings\n' +
      '• Find Location or Privacy settings\n' +
      '• Enable Location Services\n' +
      '• Return to Hero\'s Path to continue',
      [
        { text: 'Open Settings', onPress: () => this.openDeviceSettings() },
        { text: 'OK', style: 'cancel' }
      ]
    );

    // Pause tracking but preserve journey data
    if (this.currentJourney) {
      this.currentJourney.isPaused = true;
      this.currentJourney.pauseReason = 'location_services_disabled';
      this.currentJourney.pauseTime = Date.now();
    }

    // Stop location subscriber but keep journey data
    if (this.locationSubscriber) {
      this.locationSubscriber.remove();
      this.locationSubscriber = null;
    }

    this.isTracking = false;
  }

  // Handle GPS recovery failure
  async handleGPSRecoveryFailure() {
    Logger.error('GPS recovery failed after all attempts');
    this.isRecovering = false;

    Alert.alert(
      'GPS Recovery Failed',
      'Unable to restore GPS signal after multiple attempts. Your journey has been paused to prevent data loss.\n\n' +
      '🔧 Troubleshooting steps:\n' +
      '• Move to an open area with clear sky view\n' +
      '• Restart the app\n' +
      '• Check device location settings\n' +
      '• Restart your device if needed\n\n' +
      'Your journey data has been preserved and you can resume tracking when GPS is available.',
      [
        { text: 'Restart Tracking', onPress: () => this.attemptTrackingRestart() },
        { text: 'OK', style: 'cancel' }
      ]
    );

    // Pause tracking but preserve journey data
    if (this.currentJourney) {
      this.currentJourney.isPaused = true;
      this.currentJourney.pauseReason = 'gps_recovery_failed';
      this.currentJourney.pauseTime = Date.now();
    }

    this.isTracking = false;
  }

  // Attempt to restart tracking after GPS failure
  async attemptTrackingRestart() {
    Logger.info('Attempting to restart tracking after GPS failure');
    
    try {
      // Check location services availability
      const serviceStatus = await Location.hasServicesEnabledAsync();
      if (!serviceStatus) {
        await this.handleLocationServicesDisabled();
        return;
      }

      // Check permissions
      const permissions = await this.checkPermissions();
      if (!permissions.foreground || !permissions.background) {
        await this.handlePermissionRevocation(permissions);
        return;
      }

      // Try to get a test location
      const testLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10
      });

      if (!testLocation || !this.isValidLocationCoordinates(testLocation)) {
        throw new Error('Unable to get valid location');
      }

      // If we have a paused journey, attempt recovery
      if (this.currentJourney && this.currentJourney.isPaused) {
        const recovered = await this.attemptTrackingRecovery();
        if (recovered) {
          Alert.alert(
            'Tracking Restarted',
            'GPS signal is working again. Your journey tracking has been resumed.',
            [{ text: 'OK', style: 'default' }]
          );
        }
      }

    } catch (error) {
      Logger.error('Failed to restart tracking:', error);
      Alert.alert(
        'Restart Failed',
        'Unable to restart tracking. Please check your location settings and try again.',
        [{ text: 'OK', style: 'cancel' }]
      );
    }
  }
}

// Export singleton instance
export default new BackgroundLocationService(); 