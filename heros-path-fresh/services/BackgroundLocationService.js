import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_DATA_KEY = '@background_location_data';

class BackgroundLocationService {
  constructor() {
    this.isTracking = false;
    this.currentJourney = null;
    this.locationSubscriber = null;
    this.onLocationUpdate = null;
    this.onJourneyComplete = null;
  }

  // Initialize the service (simplified for Expo Go compatibility)
  async initialize() {
    try {
      // Check permissions
      const permissions = await this.checkPermissions();
      if (!permissions.foreground) {
        throw new Error('Location permission not granted');
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
      console.warn('Location tracking already active');
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
      console.log('Location tracking started');
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

      console.log('Location tracking stopped');
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