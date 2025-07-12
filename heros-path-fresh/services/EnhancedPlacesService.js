// services/EnhancedPlacesService.js
import { GOOGLE_MAPS_API_KEY_ANDROID } from '../config';
import { getPlaceDetails, getPlaceSummaries as getNewPlaceSummaries } from './NewPlacesService';

const BASE_URL = 'https://maps.googleapis.com/maps/api/place';

/**
 * Get enhanced place details including AI summaries
 * Uses the new Google Places API with AI-powered features
 */
export async function getEnhancedPlaceDetails(placeId, language = 'en') {
  try {
    // Use the new Places API service with automatic fallback
    const basicDetails = await getPlaceDetails(placeId, language, true);
    
    // Then get AI summaries if available
    const summaries = await getNewPlaceSummaries(placeId, language);
    
    return {
      ...basicDetails,
      summaries
    };
  } catch (error) {
    console.warn('Failed to get enhanced place details:', error);
    // Fallback to basic details only
    return await getPlaceDetails(placeId, language, false);
  }
}





/**
 * Get nearby places with enhanced filtering and sorting
 * Uses the new Places API features for better results
 */
export async function getNearbyPlacesEnhanced(latitude, longitude, radius, options = {}) {
  const {
    types = [],
    minRating = 0,
    maxPrice = 4,
    openNow = false,
    language = 'en',
    maxResults = 20
  } = options;
  
  let allResults = [];
  
  // If specific types are provided, search for each type
  if (types.length > 0) {
    for (const type of types) {
      try {
        const results = await searchNearbyByType(latitude, longitude, radius, type, {
          minRating,
          maxPrice,
          openNow,
          language,
          maxResults: Math.ceil(maxResults / types.length)
        });
        allResults = [...allResults, ...results];
      } catch (error) {
        console.warn(`Failed to search for type ${type}:`, error);
      }
    }
  } else {
    // Search for general points of interest
    const results = await searchNearbyByType(latitude, longitude, radius, 'point_of_interest', {
      minRating,
      maxPrice,
      openNow,
      language,
      maxResults
    });
    allResults = results;
  }
  
  // Filter and sort results
  allResults = allResults
    .filter(place => !place.rating || place.rating >= minRating)
    .filter(place => !place.priceLevel || place.priceLevel <= maxPrice)
    .sort((a, b) => {
      // Sort by rating (descending), then by distance
      if (a.rating && b.rating && a.rating !== b.rating) {
        return b.rating - a.rating;
      }
      return 0;
    })
    .slice(0, maxResults);
  
  return allResults;
}

/**
 * Search for nearby places of a specific type
 */
async function searchNearbyByType(latitude, longitude, radius, type, options = {}) {
  const {
    minRating = 0,
    maxPrice = 4,
    openNow = false,
    language = 'en',
    maxResults = 20
  } = options;
  
  let url = `${BASE_URL}/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&key=${GOOGLE_MAPS_API_KEY_ANDROID}&language=${language}`;
  
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
      throw new Error(`Nearby search failed: ${data.status}`);
    }
    
    return (data.results || []).slice(0, maxResults).map(place => ({
      placeId: place.place_id,
      name: place.name,
      category: place.types?.[0] || type,
      description: place.vicinity || place.types?.[0]?.replace('_', ' ') || '',
      latitude: place.geometry?.location?.lat,
      longitude: place.geometry?.location?.lng,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      priceLevel: place.price_level,
      isOpen: place.opening_hours?.open_now,
      photos: place.photos?.map(photo => ({
        photoReference: photo.photo_reference,
        width: photo.width,
        height: photo.height
      })) || [],
      types: place.types || []
    }));
  } catch (error) {
    console.warn(`Failed to search nearby for type ${type}:`, error);
    return [];
  }
}

/**
 * Generate a photo URL for a place
 */
export function getPlacePhotoUrl(photoReference, maxWidth = 400) {
  if (!photoReference) return null;
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${GOOGLE_MAPS_API_KEY_ANDROID}`;
}

/**
 * Get place types that are supported by the API
 * Based on the latest Google Places API documentation
 */
export const SUPPORTED_PLACE_TYPES = [
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
  
  // General
  'point_of_interest', 'establishment'
]; 