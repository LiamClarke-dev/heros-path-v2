// services/NewPlacesService.js
// Google Places API (New) implementation
// Migration from Legacy API to new standardized API
// Updated to align with latest Google Places API documentation (2025-07-12)

import { GOOGLE_MAPS_API_KEY_ANDROID, GOOGLE_MAPS_API_KEY_IOS } from '../config';
import Logger from '../utils/Logger';

const NEW_BASE_URL = 'https://places.googleapis.com/v1';
const LEGACY_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

// Search for nearby places using either new or legacy API
export async function searchNearbyPlaces(latitude, longitude, radius, type, options = {}) {
  const startTime = Date.now();
  Logger.debug('NEW_PLACES_SERVICE', `Searching for ${type} near (${latitude}, ${longitude})`, { radius, options });
  
  const { maxResults = 1, useNewAPI = true } = options;
  const apiKey = GOOGLE_MAPS_API_KEY_ANDROID;

  try {
    if (useNewAPI) {
      Logger.debug('NEW_PLACES_SERVICE', `Using NEW API for ${type}`);
      const result = await searchNearbyPlacesNew(latitude, longitude, radius, type, maxResults, apiKey);
      const duration = Date.now() - startTime;
      Logger.apiCall('NEW_PLACES_SERVICE', 'places:searchNearby', 'POST', true, duration, { type, count: result.length });
      return result;
    } else {
      Logger.debug('NEW_PLACES_SERVICE', `Using LEGACY API for ${type}`);
      const result = await searchNearbyPlacesLegacy(latitude, longitude, radius, type, maxResults, apiKey);
      const duration = Date.now() - startTime;
      Logger.apiCall('NEW_PLACES_SERVICE', 'nearbysearch', 'GET', true, duration, { type, count: result.length });
      return result;
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    Logger.apiCall('NEW_PLACES_SERVICE', useNewAPI ? 'places:searchNearby' : 'nearbysearch', useNewAPI ? 'POST' : 'GET', false, duration, { type, error: error.message });
    throw error;
  }
}

/**
 * Search nearby places using the new Places API (New)
 * Updated to match latest Google Places API documentation
 */
async function searchNearbyPlacesNew(latitude, longitude, radius, type, maxResults, apiKey) {
  const {
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
    
    // Conservative field mask with only essential fields that are definitely supported
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
      'places.primaryType'
    ].join(',');
    
    Logger.apiCall('NEW_PLACES_SERVICE', 'places:searchNearby', 'POST', true, 0, { url, type, maxResults });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMask
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      Logger.apiCall('NEW_PLACES_SERVICE', 'places:searchNearby', 'POST', false, 0, { url, type, maxResults, status: response.status, statusText: response.statusText, error: errorText });
      throw new Error(`New Places API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    Logger.apiCall('NEW_PLACES_SERVICE', 'places:searchNearby', 'POST', true, 0, { url, type, maxResults, placesCount: data.places?.length || 0 });
    
    if (!data.places) {
      Logger.apiCall('NEW_PLACES_SERVICE', 'places:searchNearby', 'POST', true, 0, { url, type, maxResults, placesCount: 0 });
      return [];
    }

    // Transform the new API response to match our expected format
    // Updated to use correct field mappings from documentation
    const transformedPlaces = data.places
      .filter(place => !place.rating || place.rating >= minRating)
      .map(place => transformNewPlaceResponse(place));
    
    return transformedPlaces;

  } catch (error) {
    Logger.apiCall('NEW_PLACES_SERVICE', 'places:searchNearby', 'POST', false, 0, { url, type, maxResults, error: error.message });
    // Fallback to legacy API
    return await searchNearbyPlacesLegacy(latitude, longitude, radius, type, maxResults, apiKey);
  }
}

/**
 * Search nearby places using the legacy Places API (fallback)
 */
async function searchNearbyPlacesLegacy(latitude, longitude, radius, type, maxResults, apiKey) {
  const {
    language = 'en',
    minRating = 0,
    maxPrice = 4,
    openNow = false
  } = options;

  // Build URL parameters properly to avoid read-only string issues
  const params = new URLSearchParams({
    key: apiKey,
    location: `${latitude},${longitude}`,
    radius: radius.toString(),
    language: language,
    type: type
  });

  if (openNow) {
    params.append('opennow', 'true');
  }

  if (maxPrice < 4) {
    params.append('maxprice', maxPrice.toString());
  }

  const url = `${LEGACY_BASE_URL}/nearbysearch/json?${params.toString()}`;

  try {
    Logger.apiCall('NEW_PLACES_SERVICE', 'nearbysearch', 'GET', true, 0, { url, type, maxResults });
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      Logger.apiCall('NEW_PLACES_SERVICE', 'nearbysearch', 'GET', false, 0, { url, type, maxResults, status: data.status, error: data.statusText });
      throw new Error(`Legacy Places API request failed: ${data.status}`);
    }

    Logger.apiCall('NEW_PLACES_SERVICE', 'nearbysearch', 'GET', true, 0, { url, type, maxResults, resultsCount: data.results?.length || 0 });
    return (data.results || [])
      .filter(place => !place.rating || place.rating >= minRating)
      .slice(0, maxResults)
      .map(place => transformLegacyPlaceResponse(place));

  } catch (error) {
    Logger.apiCall('NEW_PLACES_SERVICE', 'nearbysearch', 'GET', false, 0, { url, type, maxResults, error: error.message });
    return [];
  }
}

/**
 * Get detailed information about a specific place
 * @param {string} placeId - Google Place ID
 * @param {Object} options - Additional options
 * @returns {Promise<Object|null>} Place details or null if not found
 */
export async function getPlaceDetails(placeId, language = 'en', useNewAPI = true) {
  if (useNewAPI) {
    try {
      return await getPlaceDetailsNew(placeId, language);
    } catch (error) {
      Logger.debug('NEW_PLACES_SERVICE', `New API details failed for ${placeId}`, { placeId, error: error.message });
      return await getPlaceDetailsLegacy(placeId, language);
    }
  } else {
    return await getPlaceDetailsLegacy(placeId, language);
  }
}

/**
 * Get place details using the new Places API (New)
 * Updated to match latest Google Places API documentation
 */
async function getPlaceDetailsNew(placeId, language = 'en') {
  try {
    const url = `${NEW_BASE_URL}/places/${placeId}`;
    
    // Very conservative field mask with only essential fields
    const fieldMask = [
      'id',
      'displayName',
      'types',
      'rating',
      'userRatingCount',
      'priceLevel',
      'photos',
      'location',
      'formattedAddress',
      'primaryType'
    ].join(',');
    
    Logger.apiCall('NEW_PLACES_SERVICE', 'places:getDetails', 'GET', true, 0, { url, placeId });
    
    const response = await fetch(url, {
      headers: {
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY_ANDROID,
        'X-Goog-FieldMask': fieldMask
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      Logger.apiCall('NEW_PLACES_SERVICE', 'places:getDetails', 'GET', false, 0, { url, placeId, status: response.status, statusText: response.statusText, error: errorText });
      throw new Error(`New Places API details request failed: ${response.status} ${response.statusText}`);
    }

    const place = await response.json();
    Logger.apiCall('NEW_PLACES_SERVICE', 'places:getDetails', 'GET', true, 0, { url, placeId, place: place.id });

    return {
      placeId: place.id,
      name: place.displayName?.text || 'Unknown Place',
      address: place.formattedAddress,
      shortAddress: place.shortFormattedAddress || place.formattedAddress,
      latitude: place.location?.latitude,
      longitude: place.location?.longitude,
      types: place.types || [],
      primaryType: place.primaryType || place.types?.[0] || 'point_of_interest',
      primaryTypeDisplayName: place.primaryTypeDisplayName || place.primaryType || place.types?.[0] || 'point_of_interest',
      rating: place.rating,
      userRatingsTotal: place.userRatingCount,
      priceLevel: place.priceLevel,
      website: place.websiteUri,
      phoneNumber: place.nationalPhoneNumber || place.internationalPhoneNumber || null,
      openingHours: place.regularOpeningHours?.weekdayDescriptions || [],
      currentOpeningHours: place.currentOpeningHours?.weekdayDescriptions || [],
      isOpen: place.currentOpeningHours?.openNow || place.regularOpeningHours?.openNow || false,
      photos: place.photos?.map(photo => ({
        photoReference: photo.name,
        width: photo.widthPx,
        height: photo.heightPx
      })) || [],
      reviews: place.reviews?.slice(0, 3).map(review => ({
        authorName: review.authorAttribution?.displayName,
        rating: review.rating,
        text: review.text?.text,
        time: review.publishTime,
        profilePhoto: review.authorAttribution?.photoUri
      })) || [],
      editorialSummary: place.editorialSummary?.text,
      attributions: place.attributions,
      utcOffsetMinutes: place.utcOffsetMinutes || null
    };

  } catch (error) {
    Logger.apiCall('NEW_PLACES_SERVICE', 'places:getDetails', 'GET', false, 0, { url, placeId, error: error.message });
    return await getPlaceDetailsLegacy(placeId, language);
  }
}

/**
 * Get place details using the legacy Places API (fallback)
 */
async function getPlaceDetailsLegacy(placeId, language = 'en') {
  const url = `${LEGACY_BASE_URL}/details/json` +
    `?place_id=${placeId}` +
    `&key=${GOOGLE_MAPS_API_KEY_ANDROID}` +
    `&language=${language}` +
    `&fields=place_id,name,formatted_address,geometry,types,rating,user_ratings_total,photos,opening_hours,price_level,website,formatted_phone_number,reviews`;

  try {
    Logger.apiCall('NEW_PLACES_SERVICE', 'places:getDetails', 'GET', true, 0, { url, placeId });
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      Logger.apiCall('NEW_PLACES_SERVICE', 'places:getDetails', 'GET', false, 0, { url, placeId, status: data.status, error: data.statusText });
      throw new Error(`Legacy Places API details request failed: ${data.status}`);
    }

    const place = data.result;

    return {
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address,
      latitude: place.geometry?.location?.lat,
      longitude: place.geometry?.location?.lng,
      types: place.types || [],
      primaryType: place.types?.[0] || 'point_of_interest',
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      priceLevel: place.price_level,
      website: place.website,
      phoneNumber: place.formatted_phone_number,
      openingHours: place.opening_hours?.weekday_text || [],
      isOpen: place.opening_hours?.open_now,
      photos: place.photos?.map(photo => ({
        photoReference: photo.photo_reference,
        width: photo.width,
        height: photo.height
      })) || [],
      reviews: place.reviews?.slice(0, 3).map(review => ({
        authorName: review.author_name,
        rating: review.rating,
        text: review.text,
        time: review.time,
        profilePhoto: review.profile_photo_url
      })) || []
    };

  } catch (error) {
    Logger.apiCall('NEW_PLACES_SERVICE', 'places:getDetails', 'GET', false, 0, { url, placeId, error: error.message });
    throw error;
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
    
    Logger.apiCall('NEW_PLACES_SERVICE', 'places:getSummaries', 'GET', true, 0, { detailsUrl, placeId });

    const response = await fetch(detailsUrl, {
      headers: {
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY_ANDROID,
        'X-Goog-FieldMask': fieldMask
      }
    });

    if (!response.ok) {
      Logger.apiCall('NEW_PLACES_SERVICE', 'places:getSummaries', 'GET', false, 0, { detailsUrl, placeId, status: response.status, error: response.statusText });
      throw new Error(`Place summaries request failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Check if we have any meaningful summary content
    const hasGenerativeSummary = data.generativeSummary?.overview?.text;
    const hasEditorialSummary = data.editorialSummary?.text;
    const hasReviews = data.reviews && data.reviews.length > 0;
    
    if (!hasGenerativeSummary && !hasEditorialSummary && !hasReviews) {
      Logger.apiCall('NEW_PLACES_SERVICE', 'places:getSummaries', 'GET', true, 0, { detailsUrl, placeId, hasGenerativeSummary, hasEditorialSummary, hasReviews });
      return null;
    }

    Logger.apiCall('NEW_PLACES_SERVICE', 'places:getSummaries', 'GET', true, 0, { detailsUrl, placeId, hasGenerativeSummary, hasEditorialSummary, hasReviews });
    return {
      generativeSummary: data.generativeSummary,
      editorialSummary: data.editorialSummary,
      topReview: hasReviews ? data.reviews[0] : null
    };
  } catch (error) {
    Logger.apiCall('NEW_PLACES_SERVICE', 'places:getSummaries', 'GET', false, 0, { detailsUrl, placeId, error: error.message });
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
    Logger.debug('NEW_PLACES_SERVICE', 'Place summaries test failed', { error: error.message });
    throw error;
  }
}

/**
 * Transform new API place response to standard format
 * @param {Object} place - Place data from new API
 * @returns {Object} Standardized place object
 */
function transformNewPlaceResponse(place) {
  return {
    placeId: place.id,
    name: place.displayName?.text || 'Unknown Place',
    category: place.primaryTypeDisplayName || place.primaryType || place.types?.[0] || 'point_of_interest',
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
    formatted_address: place.formattedAddress,
    attributions: place.attributions
  };
}

/**
 * Transform legacy API place response to standard format
 * @param {Object} place - Place data from legacy API
 * @returns {Object} Standardized place object
 */
function transformLegacyPlaceResponse(place) {
  return {
    placeId: place.place_id,
    name: place.name,
    category: place.types?.[0] || 'point_of_interest',
    types: place.types || [],
    description: place.vicinity || place.types?.[0]?.replace('_', ' ') || '',
    thumbnail: place.photos?.[0] ? getLegacyPlacePhotoUrl(place.photos[0].photo_reference) : null,
    rating: place.rating,
    userRatingsTotal: place.user_ratings_total,
    latitude: place.geometry?.location?.lat,
    longitude: place.geometry?.location?.lng,
    priceLevel: place.price_level,
    address: place.vicinity,
    shortAddress: place.vicinity,
    formatted_address: place.vicinity
  };
}

/**
 * Transform new API place details response to standard format
 * @param {Object} data - Place details data from new API
 * @returns {Object} Standardized place details object
 */
function transformNewPlaceDetailsResponse(data) {
  return {
    placeId: data.id,
    name: data.displayName?.text || 'Unknown Place',
    category: data.primaryTypeDisplayName || data.primaryType || data.types?.[0] || 'point_of_interest',
    types: data.types || [],
    description: data.shortFormattedAddress || data.formattedAddress || data.types?.[0]?.replace('_', ' ') || '',
    thumbnail: data.photos?.[0] ? getNewPlacePhotoUrl(data.id, data.photos[0].name) : null,
    rating: data.rating,
    userRatingsTotal: data.userRatingCount,
    latitude: data.location?.latitude,
    longitude: data.location?.longitude,
    priceLevel: data.priceLevel,
    address: data.formattedAddress,
    shortAddress: data.shortFormattedAddress || data.formattedAddress,
    formatted_address: data.formattedAddress,
    website: data.websiteUri,
    phoneNumber: data.nationalPhoneNumber,
    openingHours: data.regularOpeningHours,
    reviews: data.reviews,
    editorialSummary: data.editorialSummary,
    attributions: data.attributions
  };
}

/**
 * Transform legacy API place details response to standard format
 * @param {Object} data - Place details data from legacy API
 * @returns {Object} Standardized place details object
 */
function transformLegacyPlaceDetailsResponse(data) {
  return {
    placeId: data.place_id,
    name: data.name,
    category: data.types?.[0] || 'point_of_interest',
    types: data.types || [],
    description: data.formatted_address || data.vicinity || data.types?.[0]?.replace('_', ' ') || '',
    thumbnail: data.photos?.[0] ? getLegacyPlacePhotoUrl(data.photos[0].photo_reference) : null,
    rating: data.rating,
    userRatingsTotal: data.user_ratings_total,
    latitude: data.geometry?.location?.lat,
    longitude: data.geometry?.location?.lng,
    priceLevel: data.price_level,
    address: data.formatted_address,
    shortAddress: data.vicinity,
    formatted_address: data.formatted_address,
    website: data.website,
    phoneNumber: data.formatted_phone_number,
    openingHours: data.opening_hours,
    reviews: data.reviews
  };
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