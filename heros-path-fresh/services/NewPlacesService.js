// services/NewPlacesService.js
// Google Places API (New) implementation
// Migration from Legacy API to new standardized API
// Updated to align with latest Google Places API documentation (2025-07-12)

import { GOOGLE_MAPS_API_KEY_ANDROID } from '../config';

const NEW_BASE_URL = 'https://places.googleapis.com/v1';
const LEGACY_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

/**
 * Search for nearby places using the new Places API with automatic fallback
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radius - Search radius in meters
 * @param {string} type - Place type
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of places
 */
export async function searchNearbyPlaces(lat, lng, radius, type, options = {}) {
  const { useNewAPI = true, maxResults = 20, language = 'en' } = options;
  
  if (useNewAPI) {
    try {
      const url = `${NEW_BASE_URL}/places:searchNearby`;
      
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

      if (type && type !== 'all') {
        requestBody.includedTypes = [type];
      }

      const fieldMask = 'places.id,places.displayName,places.types,places.rating,places.userRatingCount,places.priceLevel,places.photos,places.location,places.formattedAddress,places.primaryType,places.websiteUri,places.regularOpeningHours,places.reviews,places.editorialSummary,places.attributions';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY_ANDROID,
          'X-Goog-FieldMask': fieldMask
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`New API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.places && data.places.length > 0) {
        return data.places.map(place => transformNewPlaceResponse(place));
      }
      
      return [];
    } catch (error) {
      console.warn('New API failed, falling back to legacy API:', error.message);
      // Fall back to legacy API
    }
  }

  // Legacy API fallback
  try {
    const url = `${LEGACY_BASE_URL}/nearbysearch/json?key=${GOOGLE_MAPS_API_KEY_ANDROID}&location=${lat},${lng}&radius=${radius}&maxResults=${maxResults}&language=${language}`;
    
    if (type && type !== 'all') {
      url += `&type=${type}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results) {
      return data.results.map(place => transformLegacyPlaceResponse(place));
    }
    
    return [];
  } catch (error) {
    console.error('Legacy API also failed:', error);
    return [];
  }
}

/**
 * Search nearby places using the new Places API (New)
 * Updated to match latest Google Places API documentation
 */
async function searchNearbyPlacesNew(latitude, longitude, radius, type, options = {}) {
  const {
    maxResults = 20,
    language = 'en',
    minRating = 0,
    maxPrice = 4,
    openNow = false
  } = options;

  try {
    // Build the request body for the new API
    const requestBody = {
      locationRestriction: {
        circle: {
          center: {
            latitude: latitude,
            longitude: longitude
          },
          radius: radius
        }
      },
      maxResultCount: maxResults,
      languageCode: language
    };

    // Add type filter if specified
    if (type && type !== 'all' && type !== 'point_of_interest') {
      requestBody.includedTypes = [type];
    }

    // Add price filter if specified (new API uses PRICE_LEVEL_X format)
    if (maxPrice < 4) {
      requestBody.priceLevel = `PRICE_LEVEL_${maxPrice}`;
    }

    // Add open now filter if specified
    if (openNow) {
      requestBody.openNow = true;
    }

    const url = `${NEW_BASE_URL}/places:searchNearby`;
    
    // Conservative field mask with only essential fields that are definitely available
    const fieldMask = [
      'places.id',
      'places.displayName',
      'places.types',
      'places.rating',
      'places.userRatingCount',
      'places.priceLevel',
      'places.photos',
      'places.location',
      'places.formattedAddress',
      'places.primaryType',
      'places.websiteUri',
      'places.regularOpeningHours',
      'places.reviews',
      'places.editorialSummary',
      'places.attributions'
    ].join(',');
    
    console.log('New API request:', {
      url,
      requestBody,
      fieldMask
    });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY_ANDROID,
        'X-Goog-FieldMask': fieldMask
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`New Places API request failed: ${response.status} ${response.statusText}`);
      console.warn('Error response:', errorText);
      throw new Error(`New Places API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('New API response:', data);
    
    if (!data.places) {
      return [];
    }

    // Transform the new API response to match our expected format
    // Updated to use correct field mappings from documentation
    return data.places
      .filter(place => !place.rating || place.rating >= minRating)
      .map(place => ({
        placeId: place.id,
        name: place.displayName?.text || 'Unknown Place',
        category: place.primaryTypeDisplayName || place.primaryType || place.types?.[0] || type,
        types: place.types || [],
        description: place.shortFormattedAddress || place.formattedAddress || place.types?.[0]?.replace('_', ' ') || '',
        thumbnail: place.photos?.[0] ? getNewPlacePhotoUrl(place.id, place.photos[0].name) : null,
        rating: place.rating,
        userRatingsTotal: place.userRatingCount,
        latitude: place.location?.latitude,
        longitude: place.location?.longitude,
        priceLevel: place.priceLevel,
        address: place.formattedAddress,
        shortAddress: place.shortFormattedAddress || place.formattedAddress,
        attributions: place.attributions
      }));

  } catch (error) {
    console.warn('New Places API search failed, falling back to legacy:', error);
    // Fallback to legacy API
    return await searchNearbyPlacesLegacy(latitude, longitude, radius, type, options);
  }
}

/**
 * Search nearby places using the legacy Places API (fallback)
 */
async function searchNearbyPlacesLegacy(latitude, longitude, radius, type, options = {}) {
  const {
    maxResults = 20,
    language = 'en',
    minRating = 0,
    maxPrice = 4,
    openNow = false
  } = options;

  let url = `${LEGACY_BASE_URL}/nearbysearch/json` +
    `?key=${GOOGLE_MAPS_API_KEY_ANDROID}` +
    `&location=${latitude},${longitude}` +
    `&radius=${radius}` +
    `&language=${language}` +
    `&type=${encodeURIComponent(type)}`;

  if (openNow) {
    url += '&opennow=true';
  }

  if (maxPrice < 4) {
    url += `&maxprice=${maxPrice}`;
  }

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Legacy Places API request failed: ${data.status}`);
    }

    return (data.results || [])
      .filter(place => !place.rating || place.rating >= minRating)
      .slice(0, maxResults)
      .map(place => ({
        placeId: place.place_id,
        name: place.name,
        category: place.types?.[0] || type,
        types: place.types || [],
        description: place.vicinity || place.types?.[0]?.replace('_', ' ') || '',
        thumbnail: place.photos?.[0] ? getLegacyPlacePhotoUrl(place.photos[0].photo_reference) : null,
        rating: place.rating,
        userRatingsTotal: place.user_ratings_total,
        latitude: place.geometry?.location?.lat,
        longitude: place.geometry?.location?.lng,
        priceLevel: place.price_level,
        address: place.vicinity
      }));

  } catch (error) {
    console.warn('Legacy Places API search failed:', error);
    return [];
  }
}

/**
 * Get detailed information about a specific place
 * @param {string} placeId - Google Place ID
 * @param {Object} options - Additional options
 * @returns {Promise<Object|null>} Place details or null if not found
 */
export async function getPlaceDetails(placeId, options = {}) {
  const { useNewAPI = true, language = 'en' } = options;
  
  if (useNewAPI) {
    try {
      const url = `${NEW_BASE_URL}/places/${placeId}`;
      const fieldMask = 'id,displayName,types,rating,userRatingCount,priceLevel,photos,location,formattedAddress,primaryType,websiteUri,phoneNumbers,regularOpeningHours,reviews,editorialSummary,attributions';
      
      const response = await fetch(url, {
        headers: {
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY_ANDROID,
          'X-Goog-FieldMask': fieldMask
        }
      });

      if (!response.ok) {
        throw new Error(`New API details request failed: ${response.status}`);
      }

      const data = await response.json();
      return transformNewPlaceDetailsResponse(data);
    } catch (error) {
      console.warn('New API details failed, falling back to legacy API:', error.message);
      // Fall back to legacy API
    }
  }

  // Legacy API fallback
  try {
    const url = `${LEGACY_BASE_URL}/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY_ANDROID}&fields=place_id,name,formatted_address,geometry,types,rating,user_ratings_total,photos,opening_hours,price_level,website,formatted_phone_number,reviews&language=${language}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.result) {
      return transformLegacyPlaceDetailsResponse(data.result);
    }
    
    return null;
  } catch (error) {
    console.error('Legacy API details also failed:', error);
    return null;
  }
}

/**
 * Get place summaries using the new Places API
 * Uses generativeSummary field which is available for US-based places
 * @param {string} placeId - Google Place ID
 * @param {string} language - Language code
 * @returns {Promise<Object|null>} Summaries or null if not available
 */
export async function getPlaceSummaries(placeId, language = 'en') {
  try {
    // Get generative summary from place details (US-based places only)
    const detailsUrl = `${NEW_BASE_URL}/places/${placeId}`;
    const fieldMask = 'generativeSummary,editorialSummary,reviews';
    
    const response = await fetch(detailsUrl, {
      headers: {
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY_ANDROID,
        'X-Goog-FieldMask': fieldMask
      }
    });

    if (!response.ok) {
      throw new Error(`Place summaries request failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Check if we have any meaningful summary content
    const hasGenerativeSummary = data.generativeSummary?.overview?.text;
    const hasEditorialSummary = data.editorialSummary?.text;
    const hasReviews = data.reviews && data.reviews.length > 0;
    
    if (!hasGenerativeSummary && !hasEditorialSummary && !hasReviews) {
      return null;
    }

    return {
      generativeSummary: data.generativeSummary,
      editorialSummary: data.editorialSummary,
      topReview: hasReviews ? data.reviews[0] : null
    };
  } catch (error) {
    console.warn('Failed to get place summaries:', error.message);
    return null;
  }
}

/**
 * Generate photo URL for new Places API
 * Updated to use correct photo URL format
 */
function getNewPlacePhotoUrl(placeId, photoName, maxWidth = 400) {
  if (!photoName) return null;
  return `${NEW_BASE_URL}/${photoName}/media?maxWidthPx=${maxWidth}&key=${GOOGLE_MAPS_API_KEY_ANDROID}`;
}

/**
 * Generate photo URL for legacy Places API
 */
function getLegacyPlacePhotoUrl(photoReference, maxWidth = 400) {
  if (!photoReference) return null;
  return `${LEGACY_BASE_URL}/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${GOOGLE_MAPS_API_KEY_ANDROID}`;
}

/**
 * Test API connectivity and determine which API to use
 * @returns {Promise<Object>} API status information
 */
export async function testAPIConnectivity() {
  const testPlaceId = 'ChIJN1t_tDeuEmsRUsoyG83frY4'; // Google Sydney office
  
  const results = {
    newAPI: false,
    legacyAPI: false,
    newAPIError: null,
    legacyAPIError: null
  };

  // Test new API
  try {
    await getPlaceDetailsNew(testPlaceId, 'en');
    results.newAPI = true;
  } catch (error) {
    results.newAPIError = error.message;
  }

  // Test legacy API
  try {
    await getPlaceDetailsLegacy(testPlaceId, 'en');
    results.legacyAPI = true;
  } catch (error) {
    results.legacyAPIError = error.message;
  }

  return results;
}

/**
 * Test place summaries with a well-known place
 * This helps determine if the feature is working or if it's a data availability issue
 */
export async function testAISummaries() {
  // Test with a real place that should have summaries (US-based)
  const testPlaceId = 'ChIJ1eOF7HLTD4gRry3xPjk8DkU'; // Sushi Nova - Lincoln Park (Chicago)
  const testPlaceId2 = 'ChIJURDKN2eAhYARN0AMzUEaiKo'; // User's suggested place
  
  try {
    // Test with Sushi Nova (Chicago)
    const chicagoSummary = await getPlaceSummaries(testPlaceId, 'en');
    
    // Test with user's suggested place
    const userPlaceSummary = await getPlaceSummaries(testPlaceId2, 'en');
    
    return {
      chicago: chicagoSummary,
      userPlace: userPlaceSummary,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Place summaries test failed:', error);
    throw error;
  }
}

/**
 * Get supported place types for the new API
 * Based on the latest Google Places API documentation
 * Updated to only include types that are actually supported
 */
export const NEW_API_PLACE_TYPES = [
  // Food & Drink
  'restaurant', 'cafe', 'bar', 'bakery', 'meal_takeaway',
  
  // Shopping
  'shopping_mall', 'store', 'convenience_store', 'department_store',
  
  // Entertainment & Culture
  'museum', 'art_gallery', 'night_club', 'tourist_attraction', 'zoo',
  'stadium', 'concert_hall', 'movie_theater', 'amusement_park',
  
  // Health & Wellness
  'gym', 'pharmacy', 'hospital', 'dentist', 'doctor',
  
  // Services & Utilities
  'bank', 'atm', 'gas_station', 'car_wash', 'car_repair',
  
  // Outdoors & Recreation
  'park', 'lodging', 'campground', 'natural_feature',
  
  // Transportation
  'subway_station', 'train_station', 'bus_station', 'airport',
  
  // Education
  'school', 'university', 'library',
  
  // Religious
  'church', 'mosque', 'synagogue', 'hindu_temple',
  
  // General
  'point_of_interest', 'establishment'
]; 