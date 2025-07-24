# Background Location Service Documentation

## Overview

The BackgroundLocationService is a critical component of Hero's Path that enables continuous GPS tracking when the app is minimized or the screen is locked. This service handles location permissions, GPS tracking, data quality optimization, and app lifecycle management to ensure accurate journey recording while respecting user privacy and device resources.

## Architecture

### Core Components

```
services/
└── BackgroundLocationService.js (Singleton service)

Dependencies:
├── expo-location (Location services and permissions)
├── @react-native-async-storage/async-storage (Temporary data storage)
├── react-native (Alert, AppState, Linking, Platform)
└── utils/Logger.js (Logging utility)
```

### Service Design Pattern

The BackgroundLocationService follows a singleton pattern, providing a single instance that manages all location tracking functionality across the application.

```javascript
// Singleton export
export default new BackgroundLocationService();
```

## Key Features

### 1. Location Permission Management

**Purpose**: Handle complex permission flows for both foreground and background location access.

**Implementation**:

- Platform-specific permission request workflows
- Clear privacy explanations in permission dialogs
- Automatic device settings integration
- Permission status checking and validation

**Key Methods**:

- `checkPermissions()`: Verify current permission status
- `showPermissionDeniedAlert()`: Display privacy-focused permission dialog
- `openDeviceSettings()`: Platform-specific settings navigation
- `startPermissionMonitoring()`: Monitor permissions during active tracking
- `handlePermissionRevocation()`: Handle permission revocation with user notification
- `attemptTrackingRecovery()`: Recover tracking after permission restoration
- `startGPSSignalMonitoring()`: Monitor GPS signal availability during tracking
- `handleGPSSignalLoss()`: Handle GPS signal loss with automatic recovery
- `attemptGPSRecovery()`: Attempt to recover GPS signal with multiple retries

### 2. GPS Tracking and Data Quality

**Purpose**: Provide accurate location tracking with noise reduction and quality filtering.

**Implementation**:

- GPS accuracy filtering with configurable thresholds
- Location smoothing algorithm using weighted averaging
- GPS warm-up mechanism for better initial accuracy
- Coordinate validation to prevent invalid data points

**Key Constants**:

```javascript
const ACCURACY_THRESHOLDS = {
	EXCELLENT: 5, // < 5m - Use immediately
	GOOD: 15, // < 15m - Use for tracking
	POOR: 50, // < 50m - Use only if no better option
	REJECT: 100, // > 100m - Reject completely
};

const WARMUP_CONFIG = {
	DURATION: 10000, // 10 seconds warm-up period
	REQUIRED_POINTS: 3, // Need 3 good points before considering warmed up
	MAX_ATTEMPTS: 10, // Maximum attempts during warm-up
};

const PERMISSION_MONITOR_CONFIG = {
	CHECK_INTERVAL: 120000, // Check permissions every 2 minutes during tracking
	INITIAL_DELAY: 60000, // Wait 1 minute before first check
	MAX_RETRIES: 3, // Maximum retries before showing error
	RETRY_DELAY: 5000, // Delay between retries
};

const LOCATION_SERVICE_MONITOR_CONFIG = {
	GPS_TIMEOUT: 30000, // Consider GPS signal lost after 30 seconds without updates
	RECOVERY_ATTEMPTS: 5, // Maximum recovery attempts
	RECOVERY_DELAY: 10000, // Delay between recovery attempts
};
```

### 3. Background Tracking Support

**Purpose**: Maintain location tracking when the app is not in the foreground.

**Implementation**:

- Foreground service notifications for Android
- iOS background location indicators
- Platform-specific optimizations
- App lifecycle monitoring and management

**Configuration**:

```javascript
const trackingConfig = {
	accuracy: Location.Accuracy.BestForNavigation,
	timeInterval: 1000, // 1 second updates
	distanceInterval: 2, // 2 meter minimum distance

	// Background service configuration
	foregroundService: {
		notificationTitle: "Hero's Path - Adventure in Progress",
		notificationBody: "Recording your journey. Tap to open app.",
		killServiceOnDestroy: false,
	},

	// Platform-specific settings
	activityType: Location.ActivityType.Fitness, // iOS
	showsBackgroundLocationIndicator: true, // iOS
	android: {
		enableHighAccuracy: true,
		sticky: true,
		foregroundServiceType: ["location"],
	},
};
```

### 4. App Lifecycle Management

**Purpose**: Handle seamless tracking continuation during app state transitions.

**Implementation**:

- App state monitoring with event listeners
- Background/foreground transition handling
- GPS warm-up restart after background periods
- Tracking state preservation

**Key Methods**:

- `initializeAppStateMonitoring()`: Set up app state listeners
- `handleAppStateChange()`: Process app state transitions
- `handleAppForeground()`: Manage foreground transition
- `handleAppBackground()`: Manage background transition

### 5. Data Storage and Management

**Purpose**: Efficiently store and manage location data during tracking sessions.

**Implementation**:

- Temporary storage using AsyncStorage
- Memory optimization with point limits
- Automatic cleanup mechanisms
- Journey data structure management

**Data Models**:

```javascript
// Journey data structure
const journeyData = {
	id: string,
	startTime: number,
	endTime: number,
	coordinates: [
		{
			latitude: number,
			longitude: number,
			timestamp: number,
			accuracy: number,
		},
	],
	isActive: boolean,
	duration: number,
};
```

## Public API

### Core Tracking Methods

```javascript
// Initialize the service
await BackgroundLocationService.initialize();

// Start tracking a journey
const success = await BackgroundLocationService.startTracking(
	journeyId,
	options
);

// Stop tracking and get journey data
const journeyData = await BackgroundLocationService.stopTracking();

// Get current location once
const coords = await BackgroundLocationService.getCurrentLocation(options);

// Check permission status
const permissions = await BackgroundLocationService.checkPermissions();

// Get current service status
const status = BackgroundLocationService.getStatus();
```

### Callback System

```javascript
// Set location update callback for UI updates
BackgroundLocationService.setLocationUpdateCallback((coords, journey) => {
	// Update UI with new location
});

// Set journey completion callback
BackgroundLocationService.setJourneyCompleteCallback((journeyData) => {
	// Handle completed journey
});
```

### Utility Methods

```javascript
// Clean up resources
BackgroundLocationService.cleanup();

// Platform-specific settings access
await BackgroundLocationService.openDeviceSettings();
```

## Integration with MapScreen

The service integrates with MapScreen through a callback-based system:

```javascript
// MapScreen integration example
useEffect(() => {
	const initializeLocation = async () => {
		await BackgroundLocationService.initialize();

		BackgroundLocationService.setLocationUpdateCallback((coords, journey) => {
			// Update map with new coordinates
			setCurrentLocation(coords);
			setCurrentPath(journey.coordinates);
		});
	};

	initializeLocation();
}, []);

const toggleTracking = async () => {
	if (tracking) {
		const journeyData = await BackgroundLocationService.stopTracking();
		// Handle journey completion
	} else {
		const journeyId = Date.now().toString();
		const success = await BackgroundLocationService.startTracking(journeyId);
		// Handle tracking start
	}
};
```

## Privacy and Security

### Privacy-First Design

The service implements a privacy-first approach:

- Clear explanations of data collection practices
- Transparent permission dialogs with privacy promises
- Local data storage until explicit user action
- No real-time location monitoring outside of active walks

### Security Measures

- Input validation for all location data
- Coordinate validation to prevent invalid data injection
- Secure storage practices with AsyncStorage
- Error handling that doesn't expose sensitive information

## Performance Optimizations

### Battery Efficiency

- Optimized location request intervals
- Distance-based filtering to reduce unnecessary updates
- GPS warm-up mechanism for faster accuracy recovery
- Automatic cleanup of resources when tracking stops

### Memory Management

- Limited storage of recent locations (5 points for smoothing)
- Automatic cleanup of stored location data
- Proper subscription management to prevent memory leaks
- Efficient data structures for frequent operations

## Error Handling and Recovery

### Robust Error Handling

- Graceful handling of permission denials
- Recovery mechanisms for temporary GPS issues
- Fallback strategies for location service failures
- User-friendly error messages with recovery instructions

### Logging and Debugging

- Comprehensive logging for debugging and monitoring
- Different log levels for development and production
- Error tracking for location service failures
- Performance monitoring for tracking efficiency

## Known Limitations

### Current Limitations

1. **Pause/Resume Functionality**: Implemented but not exposed to users
2. **Background Segments**: Detailed tracking not required by user stories
3. **Journey Complete Callback**: Implemented but never called
4. **Battery Optimization**: Could be more adaptive based on device state

### Future Improvements

1. **Enhanced Battery Optimization**: Adaptive tracking based on battery level and movement patterns
2. **Offline Support**: Enhanced tracking without network connectivity
3. **Advanced Filtering**: More sophisticated algorithms for route quality
4. **Performance Monitoring**: Real-time metrics for tracking efficiency

## Testing Strategy

### Unit Testing

- Location filtering and validation functions
- Distance calculation algorithms
- Coordinate validation logic
- Permission checking methods

### Integration Testing

- App lifecycle transition handling
- Permission flow testing
- Background tracking scenarios
- Error recovery mechanisms

### Platform Testing

- iOS-specific background tracking behavior
- Android foreground service functionality
- Platform-specific permission flows
- Cross-platform compatibility

## Conclusion

The BackgroundLocationService provides a robust foundation for location tracking in Hero's Path, with comprehensive permission management, data quality optimization, and privacy-focused design. While some features may be over-engineered for current requirements, the core functionality effectively supports the app's location tracking needs with proper error handling and performance optimization.
