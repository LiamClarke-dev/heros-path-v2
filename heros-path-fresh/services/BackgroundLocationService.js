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
import { Alert } from 'react-native';
import Logger from '../utils/Logger';

const LOCATION_DATA_KEY = '@background_location_data';

class BackgroundLocationService {
  constructor() {
    this.isTracking = false;
    this.currentJourney = null;
    this.locationSubscriber = null;
    this.onLocationUpdate = null;
    this.onJourneyComplete = null;
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
      return true;
    } catch (error) {
      console.error('Failed to initialize background location service:', error);
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
        throw new Error('Foreground location permission denied');
      }
      
      if (backgroundStatus.status !== 'granted') {
        throw new Error('Background location permission denied');
      }

      // Initialize current journey
      this.currentJourney = {
        id: journeyId,
        startTime: Date.now(),
        coordinates: [],
        isActive: true
      };

      // Start location tracking with optimized settings
      this.locationSubscriber = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000, // Reduced from 1000ms for better battery life
          distanceInterval: 5, // Increased from 1m for better battery life
          // Background task configuration
          foregroundService: {
            notificationTitle: "Hero's Path",
            notificationBody: "Tracking your journey...",
            notificationColor: "#1E1E1E"
          },
          // iOS-specific optimizations
          activityType: Location.ActivityType.Fitness,
          showsBackgroundLocationIndicator: true,
          // Android-specific optimizations
          android: {
            notificationTitle: "Hero's Path",
            notificationBody: "Tracking your journey...",
            notificationColor: "#1E1E1E"
          }
        },
        (location) => {
          this.handleLocationUpdate(location);
        }
      );

      this.isTracking = true;
      Logger.debug('Location tracking started');
      return true;

    } catch (error) {
      console.error('Failed to start location tracking:', error);
      this.currentJourney = null;
      return false;
    }
  }

  // Handle location updates
  handleLocationUpdate(location) {
    if (!this.currentJourney || !this.currentJourney.isActive) {
      return;
    }

    const coords = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: location.timestamp,
      accuracy: location.coords.accuracy
    };

    // Add to current journey
    this.currentJourney.coordinates.push(coords);

    // Store for background processing
    this.storeLocationData(coords);

    // Call callback if available
    if (this.onLocationUpdate) {
      this.onLocationUpdate(coords, this.currentJourney);
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

      // Mark journey as complete
      if (this.currentJourney) {
        this.currentJourney.isActive = false;
        this.currentJourney.endTime = Date.now();
        this.currentJourney.duration = this.currentJourney.endTime - this.currentJourney.startTime;
      }

      this.isTracking = false;
      
      // Get final journey data
      const journeyData = this.currentJourney;
      this.currentJourney = null;

      // Clear stored background data
      await this.clearStoredLocationData();

      Logger.debug('Location tracking stopped');
      return journeyData;

    } catch (error) {
      console.error('Failed to stop location tracking:', error);
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
      this.locationSubscriber = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000,
          distanceInterval: 5,
          foregroundService: {
            notificationTitle: "Hero's Path",
            notificationBody: "Tracking your journey...",
            notificationColor: "#1E1E1E"
          }
        },
        (location) => {
          this.handleLocationUpdate(location);
        }
      );

      this.currentJourney.isPaused = false;
      return true;

    } catch (error) {
      console.error('Failed to resume location tracking:', error);
      return false;
    }
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