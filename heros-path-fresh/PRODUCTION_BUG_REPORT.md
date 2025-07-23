# Production Bug Investigation Report

## Summary
Two critical production issues identified:

1. **Google Maps White Screen**: Configuration conflict between expo-maps and react-native-maps
2. **Sprite Animation**: GIF rendering issues in React Native

## Issue #1: Google Maps White Screen

### Root Cause
- app.json uses expo-maps plugin but code uses react-native-maps imports
- Missing Android googleMapsApiKey configuration in app.json
- Provider conflicts between the two map libraries

### Evidence
- app.json only has iOS config: "googleMapsApiKey": "${GOOGLE_MAPS_API_KEY_IOS}"
- Missing android.config.googleMapsApiKey
- Both expo-maps and react-native-maps installed in package.json

### Fix Required
Choose one map library consistently:
**Option A (Recommended)**: Use expo-maps exclusively
- Update MapScreen.js imports from react-native-maps to expo-maps
- Add Android API key to app.json
- Remove react-native-maps dependency

**Option B**: Use react-native-maps exclusively  
- Remove expo-maps plugin from app.json
- Requires ejecting from Expo managed workflow

## Issue #2: Sprite Animation

### Root Cause  
- React Native Image component has inconsistent GIF support
- Code already switched to colored rectangles as workaround
- Comment in MapScreen.js: "Keep the old SPRITE_SOURCES for reference but don't use them"

### Evidence
- SPRITE_ANIMATION_GUIDE.md documents known GIF issues
- GIF files exist but code uses SPRITE_COLORS instead
- PingAnimation.js has Lottie fallback due to compatibility issues

### Solutions
**Option A (Best)**: Convert to sprite sheets (documented in SPRITE_ANIMATION_GUIDE.md)
**Option B**: Use Lottie animations (lottie-react-native already installed)  
**Option C**: Enhance current colored rectangles with better animations

## Priority
1. **CRITICAL**: Fix Google Maps immediately (2-4 hours)
2. **MEDIUM**: Implement sprite sheets for better UX (1-2 days)

## Testing Required
- Maps: Test iOS/Android in dev and production builds
- Sprites: Test animation performance and memory usage
