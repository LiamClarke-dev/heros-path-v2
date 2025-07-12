// services/NewPlacesService.js
// Google Places API (New) implementation
// Migration from Legacy API to new standardized API
// Updated to align with latest Google Places API documentation (2025-07-12)

import { GOOGLE_MAPS_API_KEY_ANDROID } from '../config';

const NEW_BASE_URL = 'https://places.googleapis.com/v1';
const LEGACY_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

/**
 * Search for nearby places using the new Places API
 * @param {number} latitude - Center latitude
 * @param {number} longitude - Center longitude
 * @param {number} radius - Search radius in meters
 * @param {string} type - Place type filter
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of place objects
 */
export async function searchNearbyPlaces(latitude, longitude, radius, type, options = {}) {
  const {
    maxResults = 20,
    language = 'en',
    minRating = 0,
    maxPrice = 4,
    openNow = false,
    useNewAPI = true // Default to new API for migration
  } = options;

  if (useNewAPI) {
    try {
      return await searchNearbyPlacesNew(latitude, longitude, radius, type, {
        maxResults,
        language,
        minRating,
        maxPrice,
        openNow
      });
    } catch (error) {
      console.warn('New API failed, falling back to legacy:', error);
      return await searchNearbyPlacesLegacy(latitude, longitude, radius, type, {
        maxResults,
        language,
        minRating,
        maxPrice,
        openNow
      });
    }
  } else {
    return await searchNearbyPlacesLegacy(latitude, longitude, radius, type, {
      maxResults,
      language,
      minRating,
      maxPrice,
      openNow
    });
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
 * Get place details using the new Places API
 * @param {string} placeId - Google Place ID
 * @param {string} language - Language code
 * @param {boolean} useNewAPI - Whether to use new API or fallback to legacy
 * @returns {Promise<Object>} Place details object
 */
export async function getPlaceDetails(placeId, language = 'en', useNewAPI = true) {
  if (useNewAPI) {
    try {
      return await getPlaceDetailsNew(placeId, language);
    } catch (error) {
      console.warn('New API details failed, falling back to legacy:', error);
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
    
    // Conservative field mask with only essential fields that are definitely available
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
      'primaryType',
      'websiteUri',
      'regularOpeningHours',
      'reviews',
      'editorialSummary',
      'attributions'
    ].join(',');
    
    console.log('New API details request:', {
      url,
      placeId,
      fieldMask
    });
    
    const response = await fetch(url, {
      headers: {
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY_ANDROID,
        'X-Goog-FieldMask': fieldMask
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`New Places API details request failed: ${response.status} ${response.statusText}`);
      console.warn('Error response:', errorText);
      throw new Error(`New Places API details request failed: ${response.status} ${response.statusText}`);
    }

    const place = await response.json();
    console.log('New API details response:', place);

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
    console.warn('New Places API details failed, falling back to legacy:', error);
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
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
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
    console.warn('Legacy Places API details failed:', error);
    throw error;
  }
}

/**
 * Get AI-powered place summaries using the new Places API
 * @param {string} placeId - Google Place ID
 * @param {string} language - Language code
 * @returns {Promise<Object|null>} AI summaries or null if not available
 */
export async function getPlaceSummaries(placeId, language = 'en') {
  try {
    const url = `${NEW_BASE_URL}/places/${placeId}`;
    
    const response = await fetch(url, {
      headers: {
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY_ANDROID,
        'X-Goog-FieldMask': 'summaries,editorialSummary'
      }
    });

    if (!response.ok) {
      console.warn(`AI summaries request failed: ${response.status} ${response.statusText}`);
      // Try to get response text for debugging
      const errorText = await response.text();
      console.warn('Error response:', errorText);
      return null;
    }

    const data = await response.json();
    console.log('AI summaries response:', data);
    
    // Return both summaries and editorial summary if available
    return {
      summaries: data.summaries || null,
      editorialSummary: data.editorialSummary || null
    };

  } catch (error) {
    console.warn('Failed to get AI summaries:', error);
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
 * Get supported place types for the new API
 * Based on the latest Google Places API documentation
 */
export const NEW_API_PLACE_TYPES = [
  // Food & Drink
  'restaurant', 'cafe', 'bar', 'bakery', 'meal_takeaway', 'food',
  
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