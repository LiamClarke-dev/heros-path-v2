// services/EnhancedPlacesService.js
import { GOOGLE_MAPS_API_KEY_ANDROID } from '../config';
import { 
  getPlaceDetails, 
  getPlaceSummaries as getNewPlaceSummaries,
  searchNearbyPlaces as searchNearbyPlacesNew
} from './NewPlacesService';

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
    return await getPlaceDetails(placeId, { language, useNewAPI: false });
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
        const results = await searchNearbyPlacesNew(latitude, longitude, radius, type, {
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
    const results = await searchNearbyPlacesNew(latitude, longitude, radius, 'point_of_interest', {
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
 * Generate a photo URL for a place
 * Updated to handle both new and legacy photo references
 */
export function getPlacePhotoUrl(photoReference, maxWidth = 400) {
  if (!photoReference) return null;
  
  // Check if it's a new API photo reference (contains 'places/')
  if (photoReference.includes('places/')) {
    return `https://places.googleapis.com/v1/${photoReference}/media?maxWidthPx=${maxWidth}&key=${GOOGLE_MAPS_API_KEY_ANDROID}`;
  }
  
  // Legacy photo reference
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${GOOGLE_MAPS_API_KEY_ANDROID}`;
}

/**
 * Get place types that are supported by the API
 * Based on the latest Google Places API documentation
 * Updated to only include types that are actually supported
 */
export const SUPPORTED_PLACE_TYPES = [
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