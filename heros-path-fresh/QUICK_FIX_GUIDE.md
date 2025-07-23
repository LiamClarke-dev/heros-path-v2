# 🔧 Quick Fix Guide - Maps White Screen

## IMMEDIATE SOLUTION (30 minutes)

### The Problem
`MapScreen.js` uses `react-native-maps` API but app is configured for `expo-maps`

### The Fix
Copy working implementation from `MapScreen_expo-maps.js`

### Key Changes Needed:

1. **Change Import** (Line 126):
```javascript
// FROM:
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

// TO:
import { AppleMaps, GoogleMaps } from 'expo-maps';
```

2. **Replace MapView Component** (Lines 810-825):
```javascript
// FROM:
<MapView
  provider={getMapProvider()}
  initialRegion={region}
>
  <Marker>...</Marker>
  <Polyline>...</Polyline>
</MapView>

// TO:
Platform.OS === 'ios' ? (
  <AppleMaps
    cameraPosition={{ coordinates: currentPosition, zoom: 15 }}
    markers={markers}
    polylines={polylines}
  />
) : (
  <GoogleMaps
    cameraPosition={{ coordinates: currentPosition, zoom: 15 }}
    markers={markers}
    polylines={polylines}
  />
)
```

3. **Add Helper Functions** (see MapScreen_expo-maps.js lines 85-135):
- `buildPolylines()` - converts route data to expo-maps format
- `buildMarkers()` - converts marker data to expo-maps format

4. **Remove Provider Logic**:
- Delete `getMapProvider()` function
- Remove `PROVIDER_GOOGLE` references

## Test Command:
```bash
expo start --clear
```

## Reference File:
`screens/MapScreen_expo-maps.js` contains complete working implementation
