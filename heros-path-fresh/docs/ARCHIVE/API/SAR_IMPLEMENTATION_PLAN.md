# Search Along Route (SAR) Implementation Plan

**Last Updated:** 12 July 2025  
**Status:** Planning Phase  
**Priority:** High - Critical for core app value proposition

## 🎯 **Overview**

This document outlines the implementation plan for replacing the current center-point route discovery algorithm with Google Places API's **Search Along Route (SAR)** feature, along with an optional real-time "Ping" feature for enhanced user engagement.

## 🚨 **Problem Statement**

### **Current Limitation**
The route discovery algorithm in `services/DiscoveriesService.js` uses `calculateRouteCenter()` which:
1. Takes all GPS coordinates from the user's walk
2. Averages them to find a single center point
3. Searches for places within a radius around that center point

### **Why This Breaks the App's Core Value**
This approach fundamentally fails for the most common walking scenarios:

**❌ Straight Line Routes** (e.g., walking to work)
- User walks 2km in a straight line
- Algorithm finds center point at 1km mark
- **Result**: Misses all interesting places at the start and end of the walk

**❌ Long Routes** (e.g., exploring a new neighborhood)
- User walks 5km exploring different areas
- Algorithm averages all coordinates
- **Result**: Only finds places in the middle section, misses discoveries at route extremities

**❌ L-Shaped Routes** (e.g., walking around a city block)
- User walks north, then east
- Algorithm finds center point in the middle of the L
- **Result**: Misses places along the north and east legs

## 🎯 **Solution: Search Along Route (SAR)**

### **Phase 1: End-of-Trip "Search Along Route" (High Priority)**

#### **When It Triggers**
- User taps "End Walk" button
- Full GPS trace is available
- User preferences are loaded

#### **Backend Process**
1. **Receive GPS Trace**: Get full route coordinates from journey
2. **Convert to Polyline**: Encode GPS coordinates to Google's polyline format
3. **Single API Call**: Use `places:searchText` with `searchAlongRouteParameters`
4. **Filter & Dedupe**: Apply user preferences and remove duplicates
5. **Persist Results**: Store in Firestore under `trips/{tripId}.discoveries`

#### **API Call Structure**
```javascript
{
  "textQuery": "restaurant cafe park museum library",
  "searchAlongRouteParameters": {
    "polyline": { 
      "encodedPolyline": "..." // Google's encoded polyline format
    }
  },
  "maxResultCount": 50,
  "languageCode": "en"
}
```

#### **Technical Implementation**
```javascript
// services/DiscoveriesService.js
async function getSuggestionsForRoute(routeCoordinates, preferences) {
  try {
    // 1. Convert GPS coordinates to encoded polyline
    const encodedPolyline = encodePolyline(routeCoordinates);
    
    // 2. Build search query from user preferences
    const searchQuery = buildSearchQuery(preferences);
    
    // 3. Single API call with searchAlongRouteParameters
    const response = await fetch(`${NEW_BASE_URL}/places:searchText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.types,places.rating,places.userRatingCount,places.photos,places.location,places.formattedAddress,places.primaryType'
      },
      body: JSON.stringify({
        textQuery: searchQuery,
        searchAlongRouteParameters: {
          polyline: { encodedPolyline }
        },
        maxResultCount: 50,
        languageCode: 'en'
      })
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 4. Process and filter results
    return processAndFilterResults(data.places, preferences);
    
  } catch (error) {
    Logger.error('DISCOVERIES_SERVICE', 'SAR API call failed', error);
    // Fallback to current center-point method
    return getSuggestionsForRouteFallback(routeCoordinates, preferences);
  }
}

// Helper function to build search query from preferences
function buildSearchQuery(preferences) {
  const enabledTypes = preferences.placeTypes.filter(type => type.enabled);
  const typeNames = enabledTypes.map(type => type.name.toLowerCase());
  return typeNames.join(' ');
}

// Helper function to encode GPS coordinates to polyline
function encodePolyline(coordinates) {
  // Use Google's polyline encoding algorithm
  // This will be implemented using a polyline encoding library
  return polylineEncode(coordinates);
}
```

### **Phase 2: Real-Time "Ping" Feature (Medium Priority)**

#### **When It Triggers**
- User taps "Ping" button during active walk
- Cooldown period has elapsed
- User has remaining credits

#### **Rules & Limitations**
- **Cooldown**: 10 seconds between pings per user
- **Credit Limit**: Monthly credit allowance (e.g., 50 pings/month)
- **Search Radius**: 500m around current location
- **Result Limit**: Top 10 places per ping

#### **Implementation**
```javascript
// services/PingService.js
async function pingNearbyPlaces(currentLocation, preferences, userId) {
  try {
    // 1. Check cooldown and credits
    const eligibility = await checkPingEligibility(userId);
    if (!eligibility.canPing) {
      return { 
        error: eligibility.reason,
        cooldownRemaining: eligibility.cooldownRemaining,
        creditsRemaining: eligibility.creditsRemaining
      };
    }
    
    // 2. Single nearby search
    const places = await searchNearby(currentLocation, 500, preferences, 10);
    
    // 3. Store in subcollection
    await storePingResults(tripId, places, userId);
    
    // 4. Decrement credits and update timestamp
    await updatePingUsage(userId);
    
    return { places, creditsRemaining: eligibility.creditsRemaining - 1 };
    
  } catch (error) {
    Logger.error('PING_SERVICE', 'Ping failed', error);
    return { error: 'ping_failed' };
  }
}

// Check if user can ping
async function checkPingEligibility(userId) {
  const userData = await getUserPingData(userId);
  const now = Date.now();
  
  // Check cooldown
  if (userData.lastPingTime && (now - userData.lastPingTime) < 10000) {
    return {
      canPing: false,
      reason: 'cooldown',
      cooldownRemaining: Math.ceil((10000 - (now - userData.lastPingTime)) / 1000)
    };
  }
  
  // Check credits
  if (userData.creditsRemaining <= 0) {
    return {
      canPing: false,
      reason: 'no_credits',
      creditsRemaining: 0
    };
  }
  
  return {
    canPing: true,
    creditsRemaining: userData.creditsRemaining
  };
}
```

#### **UI Implementation**
```javascript
// screens/MapScreen.js
function PingButton({ onPing, isActive, cooldownRemaining, creditsRemaining }) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handlePing = async () => {
    if (!isActive || isLoading) return;
    
    setIsLoading(true);
    const result = await onPing();
    setIsLoading(false);
    
    if (result.error) {
      // Show appropriate toast message
      showToast(result.error, result.cooldownRemaining, result.creditsRemaining);
    } else {
      // Show ping results with animated markers
      showPingResults(result.places);
    }
  };
  
  return (
    <TouchableOpacity
      style={[styles.pingButton, !isActive && styles.pingButtonDisabled]}
      onPress={handlePing}
      disabled={!isActive || isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <>
          <Text style={styles.pingButtonText}>📍 Ping</Text>
          <Text style={styles.pingButtonSubtext}>
            {creditsRemaining} credits • {cooldownRemaining > 0 ? `${cooldownRemaining}s` : 'Ready'}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
```

## 📊 **Data Storage Strategy**

### **Firestore Structure**
```
trips/{tripId}/
├── discoveries (array)           # Final consolidated discoveries from SAR
├── pingResults/                  # Subcollection for ping results
│   ├── {pingId1}/
│   │   ├── places (array)
│   │   ├── timestamp
│   │   └── location
│   └── {pingId2}/
└── metadata
    ├── startTime
    ├── endTime
    ├── routeCoordinates
    └── discoveryCount
```

### **Consolidation Process**
```javascript
// On trip end, consolidate ping results with SAR results
async function consolidateDiscoveries(tripId) {
  // 1. Get SAR results
  const sarResults = await getSARResults(tripId);
  
  // 2. Get all ping results
  const pingResults = await getAllPingResults(tripId);
  
  // 3. Merge and dedupe by place_id
  const allPlaces = [...sarResults, ...pingResults.flat()];
  const uniquePlaces = dedupeByPlaceId(allPlaces);
  
  // 4. Apply final preference filters
  const filteredPlaces = applyPreferences(uniquePlaces, userPreferences);
  
  // 5. Store consolidated results
  await updateTripDiscoveries(tripId, filteredPlaces);
  
  // 6. Optionally archive ping results
  await archivePingResults(tripId);
}
```

## 🔧 **Implementation Timeline**

### **Week 1: SAR Core Implementation**
- [ ] Implement polyline encoding function
- [ ] Update `DiscoveriesService.js` with SAR implementation
- [ ] Add fallback to current center-point method
- [ ] Test with various route types (straight, L-shaped, long)

### **Week 2: Testing & Refinement**
- [ ] Comprehensive testing with real GPS data
- [ ] Performance optimization
- [ ] Error handling improvements
- [ ] Update documentation

### **Week 3: Ping Feature (Optional)**
- [ ] Implement `PingService.js`
- [ ] Add ping button to MapScreen
- [ ] Implement credit system
- [ ] Add UI for cooldown and credit display

### **Week 4: Integration & Polish**
- [ ] Integrate ping results with SAR results
- [ ] Add animated markers for ping results
- [ ] Implement toast notifications
- [ ] Final testing and bug fixes

## 📈 **Expected Benefits**

### **Performance Improvements**
- **API Efficiency**: ~80% reduction in API calls for route discovery
- **Response Time**: Faster due to single optimized call
- **Cost Reduction**: Significant reduction in Google Places API usage
- **Reliability**: Less chance of API failures

### **User Experience Improvements**
- **Full Route Coverage**: Discovers places along entire walking path
- **Real-time Discovery**: Ping feature for immediate feedback during walks
- **Better Results**: No more missed discoveries at route extremities
- **Engagement**: Keeps users engaged during longer walks

### **Technical Benefits**
- **Google Optimized**: Leverages Google's built-in path-based search
- **Scalable**: Handles routes of any length and complexity
- **Maintainable**: Simpler code than custom segmentation logic
- **Future-proof**: Uses Google's latest API features

## 🚨 **Risk Mitigation**

### **API Limitations**
- **Fallback Strategy**: Keep current center-point method as fallback
- **Error Handling**: Comprehensive error handling for API failures
- **Rate Limiting**: Monitor API usage and implement rate limiting if needed

### **Performance Considerations**
- **Polyline Encoding**: Ensure efficient encoding of GPS coordinates
- **Result Processing**: Optimize filtering and deduplication logic
- **Caching**: Consider caching SAR results for repeated routes

### **User Experience**
- **Loading States**: Clear loading indicators during SAR processing
- **Error Messages**: User-friendly error messages for API failures
- **Progressive Enhancement**: Graceful degradation if SAR fails

## 📋 **Success Criteria**

### **Functional Requirements**
- [ ] SAR discovers places along entire route, not just center
- [ ] Works with straight line routes (2km+)
- [ ] Works with L-shaped routes
- [ ] Works with long routes (5km+)
- [ ] Maintains current performance for circular routes
- [ ] Fallback to center-point method if SAR fails

### **Performance Requirements**
- [ ] SAR API call completes within 3 seconds
- [ ] No more than 1 API call per route discovery
- [ ] Ping feature responds within 2 seconds
- [ ] Credit system prevents abuse

### **User Experience Requirements**
- [ ] Users discover places at route extremities
- [ ] Ping feature provides immediate value during walks
- [ ] Clear feedback for cooldown and credit limits
- [ ] Smooth integration with existing discovery flow

---

**This implementation plan addresses the core value proposition of Hero's Path by ensuring users discover places along their entire walking route, not just the center point. The SAR approach is more efficient, more accurate, and provides a better user experience than the current center-point method.** 