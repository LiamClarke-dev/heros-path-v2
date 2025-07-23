# Map Navigation GPS Feature Documentation

## Overview

The map-navigation-gps feature provides Google Maps integration with real-time location tracking, custom styling, and animated Link sprite integration. This tier-1-critical feature is core to the application's functionality, enabling users to navigate and interact with the map interface.

### Key Capabilities

- Real-time GPS location tracking
- Custom Zelda-themed map styling
- Animated Link sprite that represents the user's position
- Integration with points of interest and waypoints
- Smooth location transitions and updates
- Battery-efficient location tracking

### Architecture

The feature is built using the following components:

- Google Maps API integration
- React Native location services
- Custom map styling using JSON configuration
- Sprite animation system for the Link character
- Location data processing and smoothing utilities

## Installation & Setup

### Prerequisites

- Google Maps API key
- Location permissions configured in the app
- Required dependencies installed

### API Key Configuration

1. Add your Google Maps API key to the `.env` file:

```
GOOGLE_MAPS_API_KEY=your_api_key_here
```

2. Ensure the key is properly referenced in `config.js`:

```javascript
export const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
```

### Required Permissions

For Android, add the following to `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

For iOS, add the following to `Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app needs access to your location to show your position on the map.</string>
<key>NSLocationAlwaysUsageDescription</key>
<string>This app needs access to your location to track your position even when the app is in the background.</string>
```

## Core Components

### MapView Component

The `MapView` component is the main interface for displaying the map and handling user interactions.

```javascript
import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView from 'react-native-maps';
import { useLocationTracker } from '../hooks/useLocationTracker';
import { mapStyle } from '../styles/mapStyle';
import LinkSprite from '../components/LinkSprite';

const ZeldaMap = () => {
  const { location, heading } = useLocationTracker();
  
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        customMapStyle={mapStyle}
        showsUserLocation={false}
        region={{
          latitude: location?.latitude || 37.78825,
          longitude: location?.longitude || -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {location && (
          <LinkSprite
            coordinate={location}
            heading={heading}
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});

export default ZeldaMap;
```

### LocationTracker Service

The `LocationTracker` service manages real-time location updates and heading information.

```javascript
// services/locationTracker.js
import * as Location from 'expo-location';
import { useState, useEffect } from 'react';

export const useLocationTracker = () => {
  const [location, setLocation] = useState(null);
  const [heading, setHeading] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    let locationSubscription;
    let headingSubscription;

    const startLocationTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          setError('Permission to access location was denied');
          return;
        }

        // Get initial location
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });
        setLocation(currentLocation.coords);

        // Subscribe to location updates
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 1000,
            distanceInterval: 1,
          },
          (newLocation) => {
            setLocation(newLocation.coords);
          }
        );

        // Subscribe to heading updates
        headingSubscription = await Location.watchHeadingAsync((newHeading) => {
          setHeading(newHeading.magHeading);
        });
      } catch (err) {
        setError(err.message);
      }
    };

    startLocationTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
      if (headingSubscription) {
        headingSubscription.remove();
      }
    };
  }, []);

  return { location, heading, error };
};
```

### Custom Map Styling

The map styling is defined in a JSON configuration file that customizes the appearance of the Google Maps to match the Zelda theme.

```javascript
// styles/mapStyle.js
export const mapStyle = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#ebe3cd"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#523735"
      }
    ]
  },
  // Additional styling rules...
];
```

### Link Sprite Animation

The `LinkSprite` component handles the animated character that represents the user's position on the map.

```javascript
// components/LinkSprite.js
import React, { useState, useEffect } from 'react';
import { Image } from 'react-native';
import { Marker } from 'react-native-maps';

const LinkSprite = ({ coordinate, heading }) => {
  const [spriteFrame, setSpriteFrame] = useState(0);
  const spriteDirection = getDirectionFromHeading(heading);
  
  // Sprite animation frames based on direction
  const sprites = {
    north: [
      require('../assets/link_sprites/link_north_1.png'),
      require('../assets/link_sprites/link_north_2.png'),
      // Additional frames...
    ],
    south: [
      require('../assets/link_sprites/link_south_1.png'),
      require('../assets/link_sprites/link_south_2.png'),
      // Additional frames...
    ],
    // East and west sprites...
  };

  // Animation loop
  useEffect(() => {
    const animationInterval = setInterval(() => {
      setSpriteFrame((prevFrame) => 
        (prevFrame + 1) % sprites[spriteDirection].length
      );
    }, 200);

    return () => clearInterval(animationInterval);
  }, [spriteDirection]);

  return (
    <Marker coordinate={coordinate} anchor={{ x: 0.5, y: 0.5 }}>
      <Image
        source={sprites[spriteDirection][spriteFrame]}
        style={{ width: 32, height: 32 }}
      />
    </Marker>
  );
};

// Helper function to convert heading to direction
const getDirectionFromHeading = (heading) => {
  if (heading >= 315 || heading < 45) return 'north';
  if (heading >= 45 && heading < 135) return 'east';
  if (heading >= 135 && heading < 225) return 'south';
  return 'west';
};

export default LinkSprite;
```

## API Reference

### MapView Props

| Prop | Type | Description |
|------|------|-------------|
| `customMapStyle` | Array | JSON style array for customizing map appearance |
| `showsUserLocation` | Boolean | Whether to show the default user location marker |
| `region` | Object | The map region to display |
| `onRegionChange` | Function | Callback when map region changes |
| `onPress` | Function | Callback when map is pressed |

### LocationTracker API

| Method/Property | Type | Description |
|----------------|------|-------------|
| `location` | Object | Current location coordinates (latitude, longitude) |
| `heading` | Number | Current heading in degrees (0-359) |
| `error` | String | Error message if location services fail |

### LinkSprite Props

| Prop | Type | Description |
|------|------|-------------|
| `coordinate` | Object | Position coordinates (latitude, longitude) |
| `heading` | Number | Direction the sprite should face (0-359 degrees) |

## Usage Examples

### Basic Map Implementation

```javascript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import ZeldaMap from '../components/ZeldaMap';

const MapScreen = () => {
  return (
    <View style={styles.container}>
      <ZeldaMap />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default MapScreen;
```

### Custom Map Controls

```javascript
import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import ZeldaMap from '../components/ZeldaMap';
import { Ionicons } from '@expo/vector-icons';

const MapWithControls = () => {
  const mapRef = useRef(null);

  const centerOnUser = () => {
    // Center map on user's current location
    if (mapRef.current && location) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    }
  };

  return (
    <View style={styles.container}>
      <ZeldaMap ref={mapRef} />
      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={centerOnUser}>
          <Ionicons name="locate" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  button: {
    backgroundColor: '#2c6e49',
    padding: 12,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
});

export default MapWithControls;
```

## Performance Optimization

### Battery Usage

- Adjust location update frequency based on app state (foreground/background)
- Use `distanceFilter` to only update when the user has moved a significant distance
- Implement a power-saving mode that reduces update frequency

```javascript
// Example of adjusting location tracking based on app state
import { AppState } from 'react-native';

// In your component
useEffect(() => {
  const subscription = AppState.addEventListener('change', nextAppState => {
    if (nextAppState === 'active') {
      // App is in foreground, use high accuracy
      startHighAccuracyTracking();
    } else {
      // App is in background, use lower accuracy to save battery
      startLowAccuracyTracking();
    }
  });

  return () => {
    subscription.remove();
  };
}, []);
```

### Memory Management

- Properly unsubscribe from location services when component unmounts
- Use appropriate image sizes for the Link sprite to avoid excessive memory usage
- Implement sprite sheet optimization instead of individual image files

### Render Optimization

- Use `React.memo` for components that don't need frequent re-renders
- Implement shouldComponentUpdate or React.memo for the LinkSprite component
- Use PureComponent for map markers that don't change frequently

## Troubleshooting

### Common Issues

1. **Location permissions denied**
   - Ensure permissions are properly requested at app startup
   - Guide users through enabling location in device settings

2. **Map not displaying**
   - Verify Google Maps API key is valid and has the correct restrictions
   - Check internet connectivity
   - Ensure the map style JSON is properly formatted

3. **Link sprite not animating**
   - Verify all sprite assets are correctly imported
   - Check that the animation interval is running
   - Ensure the sprite component is receiving location updates

4. **Location updates too slow or inaccurate**
   - Adjust accuracy settings in the location tracker
   - Check for physical obstructions or poor GPS signal
   - Implement location smoothing algorithms

### Debugging Tips

- Use console.log to track location updates and heading changes
- Implement visual debugging overlays to show raw GPS data
- Add error boundaries around map components to catch and report rendering issues

### Platform-Specific Considerations

#### Android
- Ensure background location permissions are properly requested for Android 10+
- Implement a foreground service for continuous location tracking

#### iOS
- Handle location permission changes in iOS 14+
- Implement "Precise Location" permission handling
- Use background modes capability for location updates when app is in background