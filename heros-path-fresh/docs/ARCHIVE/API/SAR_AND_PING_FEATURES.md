# Search Along Route (SAR) & Ping Features

## Overview

Hero's Path now includes two powerful discovery features that work together to provide comprehensive place discovery during walks:

1. **Search Along Route (SAR)** - Automatically discovers places along your entire route when you finish walking
2. **Ping Feature** - Allows on-demand discovery during active walks with cooldown and credit management

## Search Along Route (SAR)

### How It Works

SAR replaces the previous center-point discovery algorithm with Google Places API's `searchAlongRouteParameters`. Instead of searching from a single center point, SAR:

- Encodes your entire route as a polyline
- Searches for places along the entire path
- Works perfectly for straight lines, long routes, and complex paths
- Triggers automatically when you end your journey

### Implementation Details

**File:** `services/DiscoveriesService.js`

- **`searchAlongRoute()`** - Main SAR function using Google Places API
- **`encodePolyline()`** - Converts GPS coordinates to Google's polyline format
- **`buildSearchQuery()`** - Creates search query from user preferences
- **`getSuggestionsForRouteFallback()`** - Fallback to center-point method if SAR fails

### API Integration

```javascript
// SAR API call to Google Places API
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
    languageCode: language
  })
});
```

### Benefits

- ✅ **Accurate for all route types** - Works with straight lines, curves, long distances
- ✅ **Comprehensive coverage** - Searches entire route, not just center
- ✅ **Automatic** - No user interaction required
- ✅ **Fallback support** - Gracefully falls back to center-point if SAR fails
- ✅ **Performance optimized** - Single API call per journey

## Ping Feature

### How It Works

The Ping feature allows users to discover nearby places during active walks:

- **On-demand discovery** - Tap to find places around your current location
- **Cooldown system** - 10-second cooldown between pings
- **Credit system** - 50 credits per month, resets monthly
- **Temporary storage** - Results stored until journey ends
- **Consolidation** - Merged with SAR results when journey completes

### Implementation Details

**File:** `services/PingService.js`

- **`pingNearbyPlaces()`** - Main ping function
- **`checkPingEligibility()`** - Validates cooldown and credits
- **`getUserPingData()`** - Manages user ping statistics
- **`storePingResults()`** - Stores ping results temporarily
- **`archivePingResults()`** - Cleans up after journey completion

### Credit System

```javascript
class PingService {
  constructor() {
    this.cooldownTime = 10000; // 10 seconds
    this.maxCreditsPerMonth = 50;
    this.searchRadius = 500; // 500m
    this.maxResultsPerPing = 10;
  }
}
```

### Benefits

- ✅ **Real-time discovery** - Find places when you want them
- ✅ **Resource management** - Cooldown and credit limits prevent abuse
- ✅ **User control** - Users decide when to discover
- ✅ **Efficient** - Small search radius, limited results
- ✅ **Integrated** - Works seamlessly with SAR

## Data Consolidation

### How It Works

When a journey ends, the system consolidates SAR and ping results:

1. **SAR Results** - Places found along the entire route
2. **Ping Results** - Places found during active pings
3. **Deduplication** - Removes duplicate places based on placeId
4. **Merging** - Combines data from multiple sources
5. **Storage** - Saves consolidated discoveries to Firestore

### Implementation Details

**File:** `services/DiscoveryConsolidationService.js`

- **`consolidateJourneyDiscoveries()`** - Main consolidation function
- **`deduplicateAndMergePlaces()`** - Removes duplicates and merges data
- **`mergePlaceGroup()`** - Merges places with same placeId
- **`saveConsolidatedDiscoveries()`** - Saves to Firestore

### Consolidation Logic

```javascript
// Source priority (SAR first, then ping)
const sourcePriority = { sar: 1, ping: 2 };

// Merge strategy
- Use best rating from all sources
- Use highest user rating count
- Combine all place types
- Use most complete address
- Track source metadata
```

### Benefits

- ✅ **No duplicates** - Intelligent deduplication
- ✅ **Best data** - Uses highest quality information from all sources
- ✅ **Source tracking** - Knows where each discovery came from
- ✅ **Efficient storage** - Single record per unique place
- ✅ **Clean data** - Removes temporary ping data after consolidation

## UI Components

### PingButton

**File:** `components/PingButton.js`

- **Visual feedback** - Shows cooldown timer and credit status
- **Animations** - Pulse animation when credits are low
- **Error handling** - Clear error messages for different scenarios
- **Accessibility** - Proper disabled states and feedback

### PingStats

**File:** `components/PingStats.js`

- **Credit display** - Shows remaining credits with color coding
- **Statistics modal** - Detailed information about ping usage
- **Help text** - Explains how ping works
- **Refresh functionality** - Updates stats in real-time

### Integration

**File:** `screens/MapScreen.js`

- **Conditional display** - Only shows when tracking is active
- **Position tracking** - Uses current location for pings
- **Journey integration** - Links pings to current journey
- **Consolidation trigger** - Calls consolidation when journey ends

## Firestore Data Structure

### Ping Data

```
users/{userId}/pingData/current
{
  lastPingTime: timestamp,
  creditsRemaining: number,
  lastCreditReset: timestamp,
  totalPingsUsed: number
}
```

### Ping Results (Temporary)

```
journeys/{userId}/pingResults/{journeyId}/pings/{pingId}
{
  id: string,
  journeyId: string,
  places: array,
  location: object,
  timestamp: timestamp,
  placesCount: number
}
```

### Consolidated Discoveries

```
journeys/{userId}/discoveries/{discoveryId}
{
  placeId: string,
  placeName: string,
  placeType: string,
  placeData: object,
  location: object,
  journeyId: string,
  source: string, // 'sar', 'ping', or 'consolidated'
  allSources: array,
  pingCount: number,
  sarCount: number,
  saved: boolean,
  dismissed: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Usage Flow

### Complete User Journey

1. **Start Walk** - User begins tracking
2. **Ping Discovery** - User can ping for nearby places (optional)
3. **End Walk** - User stops tracking
4. **SAR Discovery** - System automatically searches along route
5. **Consolidation** - SAR and ping results are merged
6. **Storage** - Consolidated discoveries saved to Firestore
7. **Cleanup** - Temporary ping data archived

### Example Timeline

```
10:00 AM - Start walk
10:05 AM - Ping for nearby places (finds 3 cafes)
10:15 AM - Ping again (finds 2 restaurants)
10:30 AM - End walk
10:31 AM - SAR runs (finds 15 places along route)
10:32 AM - Consolidation merges all 20 places
10:33 AM - 18 unique places saved (2 duplicates removed)
```

## Error Handling

### SAR Failures

- **API errors** - Falls back to center-point method
- **No coordinates** - Returns empty results
- **No preferences** - Uses default preferences
- **Network issues** - Retries with exponential backoff

### Ping Failures

- **No credits** - Clear error message
- **Cooldown active** - Shows remaining time
- **Network errors** - Retry mechanism
- **Invalid location** - Uses last known location

### Consolidation Failures

- **Partial failures** - Continues with successful items
- **Database errors** - Logs errors, retries
- **Invalid data** - Filters out invalid entries
- **Timeout handling** - Graceful degradation

## Performance Considerations

### SAR Optimization

- **Single API call** - One request per journey
- **Efficient encoding** - Optimized polyline encoding
- **Result limiting** - Max 50 results per search
- **Caching** - Results cached during consolidation

### Ping Optimization

- **Small radius** - 500m search radius
- **Limited results** - Max 10 results per ping
- **Cooldown** - Prevents excessive API calls
- **Credit limits** - Monthly usage limits

### Consolidation Optimization

- **Batch operations** - Efficient Firestore writes
- **Deduplication** - Reduces storage requirements
- **Cleanup** - Removes temporary data
- **Error isolation** - Individual place failures don't stop process

## Testing

### Manual Testing

1. **Start a walk** and verify ping button appears
2. **Ping for places** and check cooldown/credits
3. **End walk** and verify SAR runs
4. **Check discoveries** for consolidated results
5. **Verify deduplication** works correctly

### Automated Testing

- Unit tests for SAR encoding
- Integration tests for ping service
- End-to-end tests for consolidation
- Performance tests for API calls

## Future Enhancements

### Potential Improvements

- **Smart pinging** - Suggest when to ping based on location
- **Route optimization** - Optimize SAR for complex routes
- **Advanced filtering** - More sophisticated place filtering
- **Offline support** - Cache results for offline viewing
- **Analytics** - Track discovery patterns and success rates

### API Enhancements

- **Batch SAR** - Multiple route segments
- **Advanced queries** - More complex search parameters
- **Real-time updates** - Live discovery updates
- **Custom filters** - User-defined discovery criteria

## Troubleshooting

### Common Issues

1. **SAR not working** - Check API key and route coordinates
2. **Ping failing** - Verify credits and cooldown status
3. **No consolidations** - Check journey completion flow
4. **Duplicate places** - Verify deduplication logic
5. **Performance issues** - Monitor API call frequency

### Debug Logging

All services include comprehensive logging:

```javascript
Logger.debug('SAR_START', 'Starting SAR for route', { coordsCount: routeCoords.length });
Logger.performance('PING_SERVICE', 'pingNearbyPlaces', duration, { placesFound: places.length });
Logger.error('CONSOLIDATION_SERVICE', 'Consolidation failed', error);
```

## Conclusion

The SAR and Ping features provide a comprehensive discovery system that:

- **Works for all route types** - From straight lines to complex paths
- **Gives users control** - On-demand discovery during walks
- **Manages resources** - Efficient API usage with limits
- **Provides quality data** - Intelligent consolidation and deduplication
- **Scales well** - Optimized for performance and reliability

This implementation transforms Hero's Path from a simple route tracker into a powerful discovery platform that helps users find interesting places along their journeys. 