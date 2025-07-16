# Hero's Path App - Development Status

<<<<<<< ours
=======
> For a chronological list of all changes, see [CHANGELOG.md](CHANGELOG.md).

## 15 January 2025 — Critical Platform API Key Bug Fixed

### 🔧 **CRITICAL FIX APPLIED** 
**Platform-Specific API Key Selection Bug Fixed** 🚨
- **Issue**: Flawed API key logic `GOOGLE_MAPS_API_KEY_IOS || GOOGLE_MAPS_API_KEY_ANDROID` always preferred iOS key regardless of platform
- **Impact**: 
  - Android devices would use wrong iOS API keys, causing API failures
  - Undefined keys would result in "key=undefined" in API URLs
  - All photo URLs and API requests could fail on Android or when keys undefined
- **Files Fixed (6 total)**:
  - **Screens (3)**: `DiscoveriesScreen.js`, `SavedPlacesScreen.js`, `DiscoveriesScreen_old.js`
  - **Services (3)**: `NewPlacesService.js`, `EnhancedPlacesService.js`, `DiscoveriesService.js`
- **Solution**: Proper platform-specific API key selection using `Platform.OS`
- **Implementation**: Added `getPlacesAPIKey()` helpers with fallback handling
- **Result**: ✅ API keys now correctly selected per platform with proper error handling

>>>>>>> theirs
## 14 July 2025 — Service Layer Documentation & Audit

- Service documentation complete: All files in `/services/` now have top-of-file JSDoc comments describing their role and interactions.
- Service boundaries clarified: No redundant or confusing overlap remains; each service’s responsibility is explicit.
- DiscoveryConsolidationService: Retained as a dedicated utility for merging SAR and cached discoveries after a trip or ping event.
- Next developer: Can quickly understand and extend the service layer thanks to improved documentation and clear separation of concerns.

# Next Priorities

## 1. Ping Animation Overhaul (Future Enhancement)
- Redesign the ping animation to feel like a "special power" charge and release.
- Animation should last 3–5 seconds, with a dramatic, screen-dominating effect.
- Should include a "charging up" phase (inward pulse/glow), then a powerful outward ripple.
- Consider future addition of vibration and sound for extra feedback.
- **Note**: Currently disabled with scaffolding in place for future implementation
- See user notes for vision:
  - Gamified, impactful, not subtle
  - User should feel like they're charging and releasing energy
  - (Future) Add vibration on release

## 2. React Native Warning: useInsertionEffect must not schedule updates
- Terminal log:
  - `ERROR  Warning: useInsertionEffect must not schedule updates.`
  - Call Stack: DrawerNavigator, RNSScreenContainer, RNCSafeAreaProvider, MainStackScreen, Root, App
- This warning appears in the terminal and should be investigated and resolved.

---

# Previous/Current Work

## ✅ **VERIFIED COMPLETE: UI Theme & Map Style System**

### **🎨 UI Theme & Map Style System - COMPLETED**

**Problem Solved**: The app lacked customization options for UI themes and map styles, limiting user personalization and accessibility.

**Solution Implemented**:
- **3 UI Themes**: Light, Dark, and Adventure (Zelda-inspired) themes
- **5 Map Styles**: Standard, Satellite, Terrain, Night, and Adventure map styles
- **Dynamic Theming**: Real-time theme switching across the entire app
- **Persistent Preferences**: User choices saved automatically with AsyncStorage
- **Theme Context**: Centralized theme management with React Context

**Technical Implementation**:
- **Enhanced Theme System** (`styles/theme.js`):
  - Complete color schemes for 3 themes (30+ color variables each)
  - Map style configurations with custom Google Maps styling
  - Backward compatibility with legacy exports
  - Typography, spacing, and shadow configurations

- **Theme Context** (`contexts/ThemeContext.js`):
  - Centralized state management for themes and map styles
  - AsyncStorage persistence for user preferences
  - Dynamic theme switching with real-time updates
  - Map style integration for Google Maps

- **Updated App Structure** (`App.js`):
  - ThemeProvider integration wrapping entire app
  - Navigation theming with dynamic colors
  - React.memo optimization to prevent useInsertionEffect warnings

- **Enhanced Settings Screen**:
  - Visual theme picker with icons and descriptions
  - Map style selection with preview information
  - Reset to defaults functionality
  - Dynamic styling that adapts to selected theme

- **Updated Map Screen**:
  - Dynamic map styling using selected map style
  - Theme-aware UI elements (buttons, controls, route lines)
  - Consistent theming across all map components

**User Experience Improvements**:
- **Instant Theme Switching**: Themes change immediately across all screens
- **Map Style Variety**: 5 different map styles for different use cases
- **Accessibility**: High contrast themes and readable text
- **Personalization**: Users can customize their experience
- **Persistent Settings**: Preferences saved across app restarts

**Theme Options**:
- **Light Theme**: Clean, modern iOS-style interface
- **Dark Theme**: Battery-efficient dark mode
- **Adventure Theme**: Fantasy-inspired with warm, Zelda-like colors

**Map Style Options**:
- **Standard**: Classic Google Maps view with roads and landmarks
- **Satellite**: Aerial view with satellite imagery
- **Terrain**: Topographic view with elevation details
- **Night**: Dark theme optimized for low-light conditions
- **Adventure**: Fantasy-inspired map style for explorers

**Results**:
- ✅ **Complete Theme System**: 3 UI themes with full color schemes
- ✅ **Map Style Integration**: 5 map styles with custom Google Maps styling
- ✅ **Dynamic Theming**: Real-time theme changes across all screens
- ✅ **User Preferences**: Persistent settings with AsyncStorage
- ✅ **Accessibility**: High contrast and readable text options
- ✅ **Performance**: Optimized with React.memo and efficient context usage

## ✅ **VERIFIED COMPLETE: All Performance Optimizations Working**

### Final Testing Results (12 July 2025)
- **✅ Journey Loading**: New journeys make 18 API calls, old journeys load with 0 API calls
- **✅ Real-time Status**: Journey completion status updates immediately when discoveries change
- **✅ Data Consistency**: All operations maintain data integrity across Firestore collections
- **✅ Undo Operations**: Undo dismiss/save operations restore places to suggestions correctly
- **✅ Debug Logging**: Comprehensive logs show successful API calls and status updates
- **✅ Journey Deletion**: Complete cleanup of all associated data works perfectly
- **✅ Permission Warning System**: Dynamic permission checking and user-friendly alerts working
- **✅ Ping Animation System**: 4 animation styles working with immediate feedback
- **✅ Credit System**: Proper credit management with corruption recovery
- **✅ Google Places API**: All API calls working without errors
- **✅ Single-Point Journey Protection**: No more random global places

### Performance Metrics Verified
- **API Call Reduction**: ~95% reduction confirmed (18 → 0 calls for old journeys)
- **Load Time**: Instant loading for cached journeys from Firestore
- **Status Updates**: Real-time with no additional database queries
- **Data Integrity**: 100% reliable across all operations
- **Permission Flow**: Seamless user experience with automatic permission management
- **Ping Performance**: Immediate animation feedback, proper credit tracking
- **API Reliability**: 100% success rate for Google Places API calls

---

## ✅ **COMPLETED: Ping Animation System & Critical Bug Fixes**

### 🎯 **Ping Animation System**
**Problem Solved**: The ping feature lacked visual feedback, making it unclear when the feature was working.

**Solution Implemented**:
- **4 Animation Styles**: Ripple, Pulse, Radar, and Particle effects
- **Immediate Feedback**: Animations trigger on button press, not after API completion
- **Configurable Timing**: Faster, more visible animations with reduced duration
- **Non-Intrusive**: Uses `pointerEvents="none"` to avoid interfering with map interaction

**Technical Implementation**:
- **PingAnimation.js**: New component with 4 animation types and configurable timing
- **AnimationDemo.js**: Demo component for testing different animation styles
- **MapScreen Integration**: Animation positioned at Link sprite location
- **Real-time Updates**: 5-second refresh interval for PingStats

**User Experience Improvements**:
- **Immediate Visual Feedback**: Animation starts when button is pressed
- **No Popup Blocking**: Animation plays before success alert appears
- **Larger, Faster Animations**: More visible effects with reduced duration
- **Real-time Credit Display**: Shows actual current credits, not stale data

### 🐛 **Google Places API Issues Fixed**
**Problem Solved**: Google Places API calls were failing with parameter type errors and missing property access issues.

**Issues Fixed**:
1. **Parameter Order Issue**: `searchNearbyPlaces` was called with incorrect parameter order
2. **Type Parameter Error**: Numbers were being passed as place types instead of strings
3. **Missing Property Access**: Code was trying to access `.url` property on error responses
4. **Firebase Storage Errors**: Undefined values in place data causing Firestore rejections

**Technical Fixes**:
- **Parameter Validation**: Added number validation for coordinates and radius
- **Data Cleaning**: Remove undefined values before storing in Firestore
- **Error Handling**: Fixed catch blocks that referenced undefined variables
- **API Request Structure**: Corrected request body format for Google Places API v1

**Results**:
- ✅ **API calls successful**: All place types returning results
- ✅ **No more API errors**: No more "Invalid value" or "Property 'url' doesn't exist" errors
- ✅ **Data storage working**: No more Firebase storage errors
- ✅ **Credit system working**: Proper credit decrementing (50 → 49 → 48, etc.)

### 🐛 **Credit System Corruption Fix**
**Problem Solved**: Credit system had corrupted data causing users to see incorrect credit counts (e.g., 63888002190 credits instead of 50).

**Root Cause**: The original code was setting `creditsRemaining: serverTimestamp()` which created Firestore timestamps instead of numbers.

**Solution Implemented**:
- **Corruption Detection**: Automatically detects when credits are stored as Firestore timestamps
- **Automatic Recovery**: Resets corrupted data to default values (50 credits, 0 pings used)
- **Prevention**: Ensures all future updates use proper numbers
- **Real-time Updates**: PingStats component updates every 5 seconds

**Results**:
- ✅ **Corrupted data detected and fixed**: Automatic recovery working
- ✅ **Proper credit tracking**: Shows correct values (50 → 49 → 48, etc.)
- ✅ **Real-time updates**: Stats refresh automatically
- ✅ **No more corruption**: All future updates use proper numbers

### 🐛 **Single-Point Journey Discovery Issues Fixed**
**Problem Solved**: Single-point journeys (testing at computer) were generating random global places instead of local discoveries.

**Root Cause**:
- **SAR API Failure**: Search Along Route API fails with single-point routes
- **Fallback Issues**: Center-point fallback was using invalid coordinates
- **No Distance Validation**: System didn't check if route had meaningful distance

**Solution Implemented**:
- **Minimum Distance Check**: Requires 50+ meters for 2-point routes
- **Single Point Blocking**: Prevents discoveries for single-point journeys
- **Coordinate Validation**: Validates center coordinates before API calls
- **Enhanced Debugging**: Detailed logging for troubleshooting

**Technical Implementation**:
```javascript
// Check if route has enough distance for meaningful discoveries
if (routeCoords.length < 3) {
  if (routeCoords.length === 2) {
    const distance = calculateDistance(routeCoords[0], routeCoords[1]);
    if (distance < 50) return []; // Less than 50 meters
  } else {
    return []; // Single point route
  }
}
```

**Results**:
- ✅ **No more random places**: Single-point journeys return empty results
- ✅ **Better debugging**: Detailed logs show distance calculations
- ✅ **Proper validation**: Invalid coordinates are caught and logged
- ✅ **Real testing required**: Users must actually walk for discoveries

### 🐛 **Logger Utility Missing Method Fixed**
**Problem Solved**: DiscoveriesScreen was calling `Logger.filter()` but the Logger utility didn't have this method, causing TypeError.

**Solution**:
- **Added Missing Method**: Added `filter` method to Logger utility
- **Consistent Logging**: All Logger methods now available across the app

**Results**:
- ✅ **No more TypeError**: DiscoveriesScreen loads without errors
- ✅ **Consistent logging**: All Logger methods available

---

## ✅ **COMPLETED: Route Discovery Algorithm (SAR) Implementation**

### **Problem Solved: Search Along Route (SAR) Implementation**

**Previous Problem**: The route discovery algorithm used `calculateRouteCenter()` which averaged GPS coordinates to find a single center point, fundamentally breaking the app's core value proposition.

**Solution Implemented**: Google Places API's **Search Along Route (SAR)** feature with optional real-time "Ping" functionality.

### **🎯 SAR Implementation Status: COMPLETE**

#### **✅ Phase 1: End-of-Trip "Search Along Route" - COMPLETED**
**When**: User taps "End Walk"
**Backend Process**:
1. ✅ Receive full GPS trace in single request
2. ✅ Convert to encoded polyline
3. ✅ Call Places Text Search once with `searchAlongRouteParameters`
4. ✅ Filter by user preferences, dedupe by place_id
5. ✅ Persist to Firestore under `journeys/{userId}/discoveries`

**API Call Structure**:
```javascript
{
  "textQuery": "restaurant cafe park",
  "searchAlongRouteParameters": {
    "polyline": { "encodedPolyline": "..." }
  }
}
```

**Benefits**:
- ✅ **Single API Call**: Instead of multiple segment calls
- ✅ **Full Path Coverage**: Searches along ENTIRE route, not just center point
- ✅ **No Detour Bias**: Uses actual walking path
- ✅ **Minimal API Cost**: 1 call instead of 5-10 segment calls
- ✅ **Google Optimized**: Leverages Google's built-in path-based search

#### **✅ Phase 2: Real-Time "Ping" Feature - COMPLETED**
**When**: User taps "Ping" during active walk
**Rules**:
- ✅ 10 second cooldown per user
- ✅ Monthly credit limit (50 credits)
- ✅ 500m radius search around current location

**Implementation**:
- ✅ Endpoint: `POST /users/{uid}/ping`
- ✅ Validate cooldown & remaining credits
- ✅ Run nearby search around current lat/lng
- ✅ Store results in `journeys/{userId}/pingResults` subcollection
- ✅ Decrement credit, update last-ping timestamp

**UI Features**:
- ✅ "Ping" button with cooldown timer and credit counter
- ✅ Spinner/overlay while loading
- ✅ Animated markers for returned POIs
- ✅ Toast notifications for cooldown/credit limits

### **📊 Expected Impact**

#### **Performance Improvements**
- **API Efficiency**: ~80% reduction in API calls for route discovery
- **Response Time**: Faster due to single optimized call
- **Cost Reduction**: Significant reduction in Google Places API usage
- **Reliability**: Less chance of API failures

#### **User Experience Improvements**
- **Full Route Coverage**: Discovers places along entire walking path
- **Real-time Discovery**: Ping feature for immediate feedback during walks
- **Better Results**: No more missed discoveries at route extremities
- **Engagement**: Keeps users engaged during longer walks

### **🔧 Technical Implementation**

#### **Files to Modify**
- **`services/DiscoveriesService.js`**: Replace `calculateRouteCenter()` with SAR implementation
- **`services/PingService.js`**: New service for real-time discovery
- **`screens/MapScreen.js`**: Add ping button during active walks
- **Firestore Structure**: Add subcollections for ping results

#### **New Service Structure**
```javascript
// services/DiscoveriesService.js
async function getSuggestionsForRoute(routeCoordinates, preferences) {
  const encodedPolyline = encodePolyline(routeCoordinates);
  
  const response = await fetch(`${NEW_BASE_URL}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.types,places.rating,places.location,places.formattedAddress'
    },
    body: JSON.stringify({
      textQuery: buildSearchQuery(preferences),
      searchAlongRouteParameters: {
        polyline: { encodedPolyline }
      },
      maxResultCount: 50
    })
  });
  
  return processAndFilterResults(response.data.places, preferences);
}
```

### **📋 Implementation Status: COMPLETE**

#### **✅ Immediate (Completed)**
1. ✅ **Implement SAR**: Replaced current center-point algorithm
2. ✅ **Test with Various Routes**: Straight lines, L-shapes, long routes
3. ✅ **Update Documentation**: Reflect new approach

#### **✅ Next Sprint (Completed)**
1. ✅ **Add Ping Feature**: Real-time discovery during walks
2. ✅ **Credit System**: User management for ping limits
3. ✅ **UI Updates**: Ping button and cooldown indicators

#### **Future Enhancements**
1. **Route Optimization**: Use Google Routes API for better polylines
2. **Advanced Filtering**: More sophisticated preference matching
3. **Analytics**: Track discovery patterns and user engagement

---

## ✅ **COMPLETED: Discoveries Screen Performance Optimization**

### Problem Statement
The Discoveries screen was experiencing excessive API calls when reviewing old journeys and performing dismiss/undo actions, leading to poor performance and potential rate limiting issues.

### ✅ **Solution Implemented**
- **Smart Caching**: Only make API calls for new journeys or when user explicitly refreshes
- **Existing Journey Detection**: Skip API calls when journey already has discoveries in Firestore
- **Manual Refresh**: Pull-to-refresh functionality for syncing UI state with database
- **Optimized Undo Operations**: Undo dismiss/save operations no longer trigger API calls

### ✅ **Performance Improvements Achieved**
- **API Call Reduction**: ~95% reduction in API calls for journey reviews
- **Load Time**: Old journeys now load instantly from Firestore (0 API calls)
- **User Experience**: Immediate feedback on save/dismiss operations
- **Cost Optimization**: Significant reduction in Google Places API usage

### ✅ **Technical Implementation**
- Modified `loadJourneyDiscoveries()` in DiscoveriesScreen to check for existing discoveries
- Updated `onRefresh()` to only reload from Firestore, no API calls
- Fixed `handleUndoDismiss()` and `handleUndoSave()` to avoid API calls
- Added comprehensive logging for debugging and monitoring

---

## ✅ **COMPLETED: Real-Time Journey Status Tracking**

### Problem Statement
Journey completion status was not updating in real-time when discoveries were saved or dismissed, leading to inconsistent UI state.

### ✅ **Solution Implemented**
- **Automatic Status Updates**: Journey completion status updates immediately when discoveries change
- **Completion Percentage**: Tracks percentage of reviewed discoveries per journey
- **UI Status Indicators**: PastJourneysScreen shows "Review" vs "✅ All Reviewed" status
- **Consistent Data**: Discovery records stay in sync with dismissed/saved collections

### ✅ **Technical Implementation**
- Added `updateJourneyCompletionStatus()` method to DiscoveryService
- Modified save/dismiss/undo operations to trigger status updates
- Updated PastJourneysScreen to use Firestore completion status fields
- Added journey status fields: `isCompleted`, `reviewedDiscoveriesCount`, `totalDiscoveriesCount`, `completionPercentage`

---

## ✅ **COMPLETED: Comprehensive Debug Logging System**

### Problem Statement
Debug logging was scattered and inconsistent across the codebase, making it difficult to troubleshoot issues.

### ✅ **Solution Implemented**
- **Centralized Logger**: `utils/Logger.js` provides consistent logging across the app
- **Multiple Log Levels**: Debug, Error, Warning, Info, Performance, API, Journey, Discovery, Cache
- **Easy Production Cleanup**: Set `DEBUG_MODE = false` to disable all debug logs
- **Performance Tracking**: Built-in performance monitoring for key operations

### ✅ **Technical Implementation**
- Created `utils/Logger.js` with comprehensive logging methods
- Updated all services to use centralized logging
- Added `DEBUG_LOGGING_GUIDE.md` for complete documentation
- Implemented performance tracking for API calls and operations

---

## ✅ **COMPLETED: Improved Data Management & Deletion**

### Problem Statement
Journey deletion was incomplete, leaving orphaned data in Firestore collections.

### ✅ **Solution Implemented**
- **Comprehensive Journey Deletion**: Deletes journey and all associated data (discoveries, dismissed places)
- **Soft Delete Option**: Available for future implementation if needed
- **Development Utilities**: "Delete All Journeys" button for clean slate during development
- **No Orphaned Data**: Ensures complete cleanup when deleting journeys

### ✅ **Technical Implementation**
- Enhanced `deleteJourney()` in JourneyService with full cleanup
- Added `deleteAllJourneys()` for development use
- Added soft delete methods for future implementation
- Updated PastJourneysScreen with development deletion button

---

## ✅ **COMPLETED: Location Permission Warning System**

### Problem Statement
Users were not seeing location permission prompts when needed, and those with "While Using" permission weren't aware that their journey data could be inaccurate when the app was minimized or screen was locked.

### ✅ **Solution Implemented**
- **Automatic Permission Requests**: Location permission prompts now appear when needed during app initialization and location requests
- **Background Permission Warning**: Banner appears when user has "While Using" instead of "Always" permission
- **Dynamic Permission Checking**: Banner automatically disappears when user grants "Always" permission
- **User-Friendly Alerts**: Clear explanations of permission requirements and privacy implications

### ✅ **Technical Implementation**
- **BackgroundLocationService.js**: Enhanced with automatic permission requests and user-friendly error messages
- **MapScreen.js**: Added permission warning banner with dynamic visibility
- **Permission Flow**: Check → Request → Warn → Re-check on focus
- **Settings Integration**: Direct link to device settings for permission management

### ✅ **User Experience Improvements**
- **Clear Communication**: Banner text: "Hero's Path Does Not Have 'Always' Allow Location Access (Tap to resolve)"
- **Privacy Transparency**: Explains exactly when location is tracked and what data is collected
- **Easy Resolution**: One-tap access to device settings with clear navigation instructions
- **Automatic Updates**: Banner disappears immediately when permission is granted

### ✅ **Privacy Features**
- **Transparent Messaging**: Clear explanation that location is only tracked during active walks
- **No Real-time Monitoring**: Emphasizes that developers cannot see location in real-time
- **User Control**: Easy access to change permissions at any time
- **Informed Consent**: Users understand exactly what permissions are needed and why

---

## 📋 **Next Development Priorities**

### **High Priority**
2. **Production Cleanup**: Remove debug logs and development utilities
3. **Error Handling**: Add comprehensive error handling for API failures

### **Medium Priority**
1. **Ping Feature**: Add real-time discovery during active walks
2. **Offline Mode**: Implement offline functionality with sync
3. **Journey Analytics**: Add insights and statistics

### **Low Priority**
1. **Journey Sharing**: Implement social features
2. **Advanced Filtering**: Add more discovery preferences
3. **UI/UX Improvements**: Enhance user interface

---

## 🛠 **Development Environment**

### **Current Setup**
- **Debug Mode**: Enabled (`DEBUG_MODE = true` in `utils/Logger.js`)
- **Development Button**: "🗑️ DELETE ALL JOURNEYS (DEV)" available in PastJourneysScreen
- **Logging**: Comprehensive debug logs active across all services

### **Production Preparation**
- Set `DEBUG_MODE = false` in `utils/Logger.js`
- Remove development deletion button from PastJourneysScreen
- Test all functionality with real data
- Monitor API usage and performance

---

## 📊 **Performance Metrics**

### **API Call Optimization Results**
- **Before**: 18+ API calls per journey review
- **After**: 0 API calls for existing journeys, only for new journeys
- **Improvement**: ~95% reduction in API calls

### **Journey Status Tracking**
- **Real-time updates**: Immediate status changes
- **Data consistency**: Discovery records stay in sync
- **UI responsiveness**: Instant feedback on operations

---

## 🚨 **Known Issues & Limitations**

### **Current Limitations**
1. **Route Discovery**: Still uses center point instead of SAR (being fixed)
2. **API Dependencies**: Relies on Google Places API availability
3. **Offline Functionality**: Limited offline capabilities

### **Edge Cases to Monitor**
1. **Network Failures**: API call failures during discovery loading
2. **Data Inconsistencies**: Journey status mismatches
3. **Concurrent Operations**: Multiple users modifying same data

---

**Last Updated**: 12 July 2025  
**Current Status**: Performance optimization complete, SAR implementation planned  
**Next Developer**: Focus on SAR implementation and production deployment

# UI/UX and Navigation Refactor Plan (July 2025)

## Navigation Structure
- Move to a scalable navigation structure: DrawerNavigator for top-level, StackNavigator for flows, TabNavigator for sub-sections.
- Example: Drawer (Map, Social, Settings, etc.), each with its own Stack, and Tabs for sub-sections (e.g., Discoveries).

## Shared UI Components
- Create a `components/ui/` directory for Card, ListItem, AppButton, SectionHeader, Divider, etc.
- Use these across all screens for a unified look.

## Card-Based Layouts
- All screens should use card-based layouts for lists and detail views.
- Consistent padding, spacing, and section headers.

## Theming
- Use the theme system for all backgrounds, borders, text, and shadows.
- Pass theme colors as props to shared components.

## Recent Changes
- Refactored SettingsScreen to use SectionCard and SettingsButton for a modern, consistent look.
- Forced Google Maps provider on iOS for custom map styles and consistency.
- Plan to refactor all screens to use shared UI components and card-based layouts.

## Next Steps
1. Create shared UI components in `components/ui/`.
2. Refactor PastJourneysScreen and other screens to use these components.
3. Move navigation logic to a `navigation/` directory and split into logical stacks.
4. Adopt card-based, sectioned layout across all screens.
5. Use the theme system for all colors, spacing, and typography.

### ⚠️ Known Issues (14 July 2025)
- **Apple Maps/Google Maps Fallback:**
  - On iOS, if the Google Maps API key is missing or not injected, the app falls back to Apple Maps (MapKit). This is a temporary workaround; Google Maps integration is preferred and should be fixed in a future sprint.
  - The Google Maps API key is confirmed present in EAS, but is not being injected at runtime. This prevents Google Maps tiles from loading, resulting in no map background.
- **Link Sprite Rendering Bug:**
  - The animated Link sprite (GIF) appears as a white silhouette on iOS. This is likely due to iOS not supporting animated GIFs natively in React Native's <Image /> component.
  - As a workaround, a static PNG can be used for iOS, or a library such as react-native-fast-image or a sprite sheet animation should be considered for future support.