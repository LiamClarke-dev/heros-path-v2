# Proposed Fixes for Production Issues

## Issue #1: Google Maps White Screen - CRITICAL

### IMMEDIATE FIX: Add Android API Key to app.json

Current app.json only has iOS config:
```json
"ios": {
  "config": {
    "googleMapsApiKey": "${GOOGLE_MAPS_API_KEY_IOS}"
  }
}
```

ADD this to android section:
```json
"android": {
  "config": {
    "googleMapsApiKey": "${GOOGLE_MAPS_API_KEY_ANDROID}"
  }
}
```

### RECOMMENDED FIX: Switch to expo-maps consistently

1. Update MapScreen.js imports:
```javascript
// Change from:
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

// To:
import MapView, { Marker, Polyline } from 'expo-maps';
```

2. Remove provider prop from MapView (expo-maps handles this automatically)

3. Remove react-native-maps dependency:
```bash
npm uninstall react-native-maps
```

## Issue #2: Sprite Animation Enhancement

### Current Status
- GIF files exist but React Native has inconsistent GIF support
- Code already uses colored rectangles as workaround
- Comment in code: "Keep the old SPRITE_SOURCES for reference but don't use them"

### RECOMMENDED: Implement Sprite Sheets
- Convert GIFs to sprite sheet format (documented in SPRITE_ANIMATION_GUIDE.md)
- Use Animated API for smooth frame transitions
- Better performance than GIFs

### QUICK FIX: Enhance current colored sprites
- Add pulsing animations
- Use emoji for better visual feedback
- Add rotation based on movement direction

## Implementation Order

1. CRITICAL: Add Android API key (5 minutes)
2. HIGH: Test maps on Android (30 minutes)  
3. MEDIUM: Switch to expo-maps (2 hours)
4. LOW: Implement sprite sheets (1-2 days)

