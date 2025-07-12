# Google Places API Migration Guide

## Overview

This document outlines the migration from Google Places API (Legacy) to Google Places API (New) for the Hero's Path app. The migration has been implemented with a hybrid approach that automatically falls back to the legacy API if the new API is not available.

## Migration Status

- ✅ **New API Service Created**: `services/NewPlacesService.js`
- ✅ **Backward Compatibility**: Automatic fallback to legacy API
- ✅ **Testing Interface**: Added to Settings screen
- ✅ **Response Standardization**: Consistent data structure across APIs
- 🔄 **API Key Verification**: Ensure keys have access to new API
- 🔄 **Production Testing**: Validate in development builds

## Key Changes

### 1. New Service Architecture

**File**: `services/NewPlacesService.js`

The new service provides:
- **Unified Interface**: Same function signatures for both APIs
- **Automatic Fallback**: Seamless transition between APIs
- **Field Masking**: Optimized requests using new API features
- **OAuth Headers**: Proper authentication for new API
- **Response Transformation**: Consistent data structure

### 2. Updated Core Services

**File**: `services/DiscoveriesService.js`
- Updated `fetchPlacesByType()` to use new API service
- Updated `getPlaceDetailsWithSummaries()` to use new API service
- Added `testPlacesAPIMigration()` for connectivity testing

**File**: `services/EnhancedPlacesService.js`
- Updated `getEnhancedPlaceDetails()` to use new API service
- Maintains AI summaries functionality

### 3. Testing Interface

**File**: `screens/SettingsScreen.js`
- Added "API Migration Status" section
- Real-time testing of both APIs
- Visual status indicators
- Error reporting and recommendations

## API Differences

### Legacy API (Current)
```
Base URL: https://maps.googleapis.com/maps/api/place
Authentication: API key in URL parameters
Response: Inconsistent structure between endpoints
Deduplication: Manual handling required
```

### New API (Target)
```
Base URL: https://places.googleapis.com/v1
Authentication: OAuth headers with API key
Response: Standardized structure across all endpoints
Deduplication: Primary place types eliminate duplicates
```

## Migration Benefits

1. **Consistent Data**: Standardized response structure
2. **Better Performance**: Field masking reduces data transfer
3. **Enhanced Features**: AI summaries, dynamic data
4. **Future-Proof**: Google's recommended approach
5. **Simplified Logic**: Primary place types reduce deduplication complexity

## Testing the Migration

### 1. Development Testing
```bash
# Start the app in development mode
npx expo start --dev-client

# Navigate to Settings > API Migration Status
# Tap "Test API Migration" to check connectivity
```

### 2. API Connectivity Test
The test checks:
- New API connectivity and response format
- Legacy API fallback functionality
- Error handling and reporting
- Migration status and recommendations

### 3. Expected Results

**Scenario 1: New API Available**
```
✅ New API: Working
✅ Legacy API: Working
Status: READY
Recommendation: New Places API is working. You can safely migrate to use it exclusively.
```

**Scenario 2: New API Not Available**
```
❌ New API: Failed
✅ Legacy API: Working
Status: FALLBACK
Recommendation: New Places API is not available, but legacy API is working. Continue using hybrid approach.
```

**Scenario 3: Both APIs Failing**
```
❌ New API: Failed
❌ Legacy API: Failed
Status: ERROR
Recommendation: Both APIs are failing. Check API key configuration and network connectivity.
```

## API Key Requirements

### Current Setup
- **API Key**: `GOOGLE_MAPS_API_KEY_ANDROID`
- **Services**: Places API (Legacy), Roads API
- **Permissions**: Nearby Search, Place Details, Photos

### New API Requirements
- **Same API Key**: Should work with new API
- **Additional Services**: Places API (New)
- **Permissions**: Same as legacy, plus AI summaries

### Verification Steps
1. Check Google Cloud Console
2. Ensure Places API (New) is enabled
3. Verify API key has necessary permissions
4. Test with the migration testing interface

## Implementation Details

### 1. Search Nearby Places
```javascript
// Old approach
const url = `${BASE_URL}/nearbysearch/json?key=${apiKey}&location=${lat},${lng}&radius=${radius}&type=${type}`;

// New approach
const requestBody = {
  locationRestriction: {
    circle: {
      center: { latitude: lat, longitude: lng },
      radius: radius
    }
  },
  maxResultCount: maxResults,
  languageCode: language
};

const response = await fetch(`${NEW_BASE_URL}/places:searchNearby`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': apiKey,
    'X-Goog-FieldMask': 'places.displayName,places.id,places.types,places.rating,places.userRatingCount,places.photos,places.location,places.formattedAddress,places.primaryType'
  },
  body: JSON.stringify(requestBody)
});
```

### 2. Get Place Details
```javascript
// Old approach
const url = `${BASE_URL}/details/json?place_id=${placeId}&key=${apiKey}&fields=place_id,name,formatted_address,geometry,types,rating,user_ratings_total,photos,opening_hours,price_level,website,formatted_phone_number,reviews`;

// New approach
const response = await fetch(`${NEW_BASE_URL}/places/${placeId}`, {
  headers: {
    'X-Goog-Api-Key': apiKey,
    'X-Goog-FieldMask': 'id,displayName,types,rating,userRatingCount,priceLevel,photos,location,formattedAddress,primaryType,websiteUri,phoneNumbers,openingHours,reviews,editorialSummary'
  }
});
```

### 3. Photo URLs
```javascript
// Old approach
const photoUrl = `${BASE_URL}/photo?maxwidth=${maxWidth}&photoreference=${photoRef}&key=${apiKey}`;

// New approach
const photoUrl = `${NEW_BASE_URL}/${photoName}/media?maxWidthPx=${maxWidth}&key=${apiKey}`;
```

## Response Transformation

The new service transforms responses to maintain compatibility:

### Legacy Response
```javascript
{
  place_id: "ChIJ...",
  name: "Place Name",
  types: ["restaurant", "food", "establishment"],
  vicinity: "123 Main St",
  geometry: { location: { lat: 40.7128, lng: -74.0060 } },
  rating: 4.5,
  user_ratings_total: 100,
  photos: [{ photo_reference: "ref123", width: 400, height: 300 }]
}
```

### New Response (Transformed)
```javascript
{
  placeId: "ChIJ...",
  name: "Place Name",
  types: ["restaurant", "food", "establishment"],
  description: "123 Main St",
  latitude: 40.7128,
  longitude: -74.0060,
  rating: 4.5,
  userRatingsTotal: 100,
  thumbnail: "https://places.googleapis.com/v1/places/ChIJ.../media?maxWidthPx=400&key=...",
  category: "restaurant",
  address: "123 Main St"
}
```

## Rollback Strategy

### Safe Rollback Point
```bash
git checkout legacy-stable-before-places-migration
```

### Hybrid Approach Benefits
- **No Breaking Changes**: Legacy API remains functional
- **Gradual Migration**: Can be enabled/disabled per request
- **Testing Safety**: New API can be tested without affecting production
- **Automatic Fallback**: Seamless degradation if new API fails

## Next Steps

### Phase 1: Validation (Current)
1. ✅ Implement hybrid service
2. ✅ Add testing interface
3. 🔄 Test in development builds
4. 🔄 Verify API key permissions

### Phase 2: Production Migration
1. Test with real API keys
2. Monitor performance and reliability
3. Gradually increase new API usage
4. Remove legacy fallback when stable

### Phase 3: Optimization
1. Implement field masking optimization
2. Add AI summaries integration
3. Optimize photo loading
4. Enhance error handling

## Troubleshooting

### Common Issues

**1. New API Returns 403 Forbidden**
- Check API key permissions in Google Cloud Console
- Ensure Places API (New) is enabled
- Verify billing is set up

**2. Legacy API Still Working, New API Failing**
- Continue using hybrid approach
- Monitor Google's API availability
- Check for regional restrictions

**3. Both APIs Failing**
- Check network connectivity
- Verify API key configuration
- Review Google Cloud Console quotas

### Debug Information
The migration testing interface provides detailed error information:
- HTTP status codes
- Error messages from both APIs
- Connectivity status
- Recommendations for resolution

## Support

For issues with the migration:
1. Check the migration testing interface in Settings
2. Review this documentation
3. Test with the provided debugging tools
4. Consult Google Places API documentation

## References

- [Google Places API (New) Documentation](https://developers.google.com/maps/documentation/places/web-service)
- [Migration Guide](https://developers.google.com/maps/documentation/places/web-service/legacy/migrate-overview)
- [Field Masking Guide](https://developers.google.com/maps/documentation/places/web-service/requests#field-masking)
- [Authentication Guide](https://developers.google.com/maps/documentation/places/web-service/authentication) 