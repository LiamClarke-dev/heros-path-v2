// services/DiscoveriesService.js
import { GOOGLE_MAPS_API_KEY_ANDROID, GOOGLE_MAPS_API_KEY_IOS, GOOGLE_ROADS_API_KEY } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PLACE_TYPES } from '../constants/PlaceTypes';
import { getEnhancedPlaceDetails } from './EnhancedPlacesService';

const BASE_URL = 'https://maps.googleapis.com/maps/api/place';
const DISCOVERY_PREFERENCES_KEY = '@discovery_preferences';

/**
 * Sync user preferences with available place types
 */
async function syncPreferencesWithPlaceTypes(existingPrefs) {
  const allPlaceTypes = PLACE_TYPES.filter(type => type.key !== 'all').map(type => type.key);
  const syncedPrefs = { ...existingPrefs };
  
  // Add any new place types that aren't in existing preferences
  allPlaceTypes.forEach(placeType => {
    if (!(placeType in syncedPrefs)) {
      syncedPrefs[placeType] = true; // Default to enabled for new types
    }
  });
  
  // Remove any place types that are no longer in our list
  Object.keys(syncedPrefs).forEach(placeType => {
    if (!allPlaceTypes.includes(placeType)) {
      delete syncedPrefs[placeType];
    }
  });
  
  return syncedPrefs;
}

/**
 * Reset discovery preferences to defaults (all enabled)
 */
export async function resetDiscoveryPreferences() {
  try {
    const defaultPrefs = {};
    PLACE_TYPES.forEach(type => {
      if (type.key !== 'all') {
        defaultPrefs[type.key] = true;
      }
    });
    await AsyncStorage.setItem(DISCOVERY_PREFERENCES_KEY, JSON.stringify(defaultPrefs));
    return defaultPrefs;
  } catch (error) {
    console.warn('Failed to reset discovery preferences:', error);
    return {};
  }
}

/**
 * Get user's discovery preferences from AsyncStorage
 */
export async function getUserDiscoveryPreferences() {
  try {
    const prefs = await AsyncStorage.getItem(DISCOVERY_PREFERENCES_KEY);
    if (prefs) {
      const existingPrefs = JSON.parse(prefs);
      // Sync with current place types and save updated preferences
      const syncedPrefs = await syncPreferencesWithPlaceTypes(existingPrefs);
      await AsyncStorage.setItem(DISCOVERY_PREFERENCES_KEY, JSON.stringify(syncedPrefs));
      return syncedPrefs;
    }
    // Return default preferences (all enabled) - matches all types in PlaceTypes.js
    const defaultPrefs = {};
    PLACE_TYPES.forEach(type => {
      if (type.key !== 'all') {
        defaultPrefs[type.key] = true;
      }
    });
    return defaultPrefs;
  } catch (error) {
    console.warn('Failed to load discovery preferences:', error);
    return {};
  }
}

/**
 * Get user's minimum rating preference
 */
export async function getMinRatingPreference() {
  try {
    const rating = await AsyncStorage.getItem('@discovery_min_rating');
    return rating ? parseFloat(rating) : 3.0; // Default to 3.0
  } catch (error) {
    console.warn('Failed to load min rating preference:', error);
    return 3.0;
  }
}

/**
 * Given an array of { latitude, longitude } coords, compute
 * a center point & radius (meters) covering the whole route.
 */
function coordsToBoundingCircle(coords) {
  const lats = coords.map(c => c.latitude);
  const lngs = coords.map(c => c.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  // approximate meters per degree
  const latMeters = (maxLat - minLat) * 111_139;
  const lngMeters =
    (maxLng - minLng) * 111_139 * Math.cos((centerLat * Math.PI) / 180);

  // half the diagonal, clamped [50m, 50km]
  const radius = Math.min(
    Math.max(Math.ceil(Math.hypot(latMeters, lngMeters) / 2), 50),
    50_000
  );

  return { centerLat, centerLng, radius };
}

/**
 * Fetch places of specified types around the bounding circle of your route.
 */
export async function getSuggestionsForRoute(
  routeCoords,
  { type, maxResults = 20, language = 'en', usePreferences = true } = {}
) {
  if (!routeCoords?.length) return [];

  const { centerLat, centerLng, radius } = coordsToBoundingCircle(routeCoords);
  const apiKey = GOOGLE_MAPS_API_KEY_ANDROID;
  const lang = encodeURIComponent(language);
  const loc = `${centerLat},${centerLng}`;
  
  let allResults = [];
  
  // If a specific type is requested, use that
  if (type && type !== 'all') {
    const results = await fetchPlacesByType(centerLat, centerLng, radius, type, apiKey, lang, maxResults);
    allResults = results;
  } else if (usePreferences) {
    // Get user preferences and fetch places for enabled types
    const preferences = await getUserDiscoveryPreferences();
    const enabledTypes = Object.keys(preferences).filter(key => preferences[key]);
    
    console.log('🔍 Discovery Preferences:', preferences);
    console.log('✅ Enabled Types:', enabledTypes);
    
    if (enabledTypes.length === 0) {
      console.log('⚠️ No place types enabled, returning empty results');
      return [];
    }
    
    // Fetch places for each enabled type
    const resultsPerType = Math.max(1, Math.floor(maxResults / enabledTypes.length));
    
    for (const placeType of enabledTypes) {
      try {
        const results = await fetchPlacesByType(centerLat, centerLng, radius, placeType, apiKey, lang, resultsPerType);
        console.log(`📍 Fetched ${results.length} ${placeType} places`);
        allResults = [...allResults, ...results];
      } catch (error) {
        console.warn(`Failed to fetch ${placeType} places:`, error);
      }
    }
    
    // Deduplicate places before filtering
    allResults = deduplicatePlaces(allResults);
    console.log(`🔗 Deduplicated results: ${allResults.length}`);
    
    // Filter by minimum rating
    const minRating = await getMinRatingPreference();
    allResults = allResults.filter(place => !place.rating || place.rating >= minRating);
    console.log(`⭐ Filtered by rating (${minRating}+): ${allResults.length}`);
    
    // Shuffle and limit results
    allResults = shuffleArray(allResults).slice(0, maxResults);
    console.log(`🎯 Total results after filtering: ${allResults.length}`);
  } else {
    // Fallback: fetch general points of interest
    const results = await fetchPlacesByType(centerLat, centerLng, radius, 'point_of_interest', apiKey, lang, maxResults);
    allResults = results;
  }

  return allResults;
}

/**
 * Fetch places of a specific type from Google Places API
 */
async function fetchPlacesByType(centerLat, centerLng, radius, type, apiKey, lang, maxResults) {
  let url =
    `${BASE_URL}/nearbysearch/json` +
    `?key=${apiKey}` +
    `&location=${centerLat},${centerLng}` +
    `&radius=${radius}` +
    `&language=${lang}` +
    `&type=${encodeURIComponent(type)}`;

  try {
    const res = await fetch(url);
    const json = await res.json();
    if (json.status !== 'OK') return [];

    return (json.results || []).slice(0, maxResults).map(place => {
      // build photo URL if available
      const photoRef = place.photos?.[0]?.photo_reference;
      const photoUrl = photoRef
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=200&photoreference=${photoRef}&key=${apiKey}`
        : null;

      return {
        placeId: place.place_id,
        name: place.name,
        category: place.types?.[0] || type,
        description: place.vicinity || place.types?.[0]?.replace('_', ' ') || '',
        thumbnail: photoUrl,
        rating: place.rating,
        userRatingsTotal: place.user_ratings_total,
        latitude: place.geometry?.location?.lat,
        longitude: place.geometry?.location?.lng,
      };
    });
  } catch (err) {
    console.warn(`fetchPlacesByType failed for ${type}:`, err);
    return [];
  }
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Deduplicate places using place_id as primary method, with fallback to location/name matching
 * This prevents false positives by prioritizing Google's unique place identifiers
 */
function deduplicatePlaces(places, proximityThreshold = 20) {
  if (places.length <= 1) return places;
  
  // First, deduplicate by place_id (most reliable method)
  const placeIdMap = new Map();
  const noPlaceIdPlaces = [];
  
  places.forEach(place => {
    if (place.placeId) {
      if (!placeIdMap.has(place.placeId)) {
        placeIdMap.set(place.placeId, place);
      } else {
        // If we have multiple places with same place_id, combine them
        const existing = placeIdMap.get(place.placeId);
        placeIdMap.set(place.placeId, combinePlaces([existing, place]));
      }
    } else {
      noPlaceIdPlaces.push(place);
    }
  });
  
  let deduplicated = Array.from(placeIdMap.values());
  
  // For places without place_id, use location/name matching as fallback
  if (noPlaceIdPlaces.length > 0) {
    const locationDeduplicated = deduplicateByLocation(noPlaceIdPlaces, proximityThreshold);
    deduplicated = [...deduplicated, ...locationDeduplicated];
  }
  
  return deduplicated;
}

/**
 * Fallback deduplication method for places without place_id
 * Uses stricter proximity threshold and more conservative name matching
 */
function deduplicateByLocation(places, proximityThreshold = 20) {
  if (places.length <= 1) return places;
  
  const deduplicated = [];
  const processed = new Set();
  
  for (let i = 0; i < places.length; i++) {
    if (processed.has(i)) continue;
    
    const currentPlace = places[i];
    const similarPlaces = [currentPlace];
    processed.add(i);
    
    // Find similar places
    for (let j = i + 1; j < places.length; j++) {
      if (processed.has(j)) continue;
      
      const otherPlace = places[j];
      
      // Check if places are close and have similar names
      if (arePlacesSimilar(currentPlace, otherPlace, proximityThreshold)) {
        similarPlaces.push(otherPlace);
        processed.add(j);
      }
    }
    
    // Combine similar places into one
    if (similarPlaces.length === 1) {
      deduplicated.push(currentPlace);
    } else {
      const combinedPlace = combinePlaces(similarPlaces);
      deduplicated.push(combinedPlace);
    }
  }
  
  return deduplicated;
}

/**
 * Check if two places are similar (close location and similar name)
 * More conservative matching to prevent false positives
 */
function arePlacesSimilar(place1, place2, proximityThreshold) {
  // Calculate distance between places
  const distance = calculateDistance(
    place1.latitude, place1.longitude,
    place2.latitude, place2.longitude
  );
  
  // Check if places are close enough
  if (distance > proximityThreshold) return false;
  
  // Check name similarity (case-insensitive)
  const name1 = place1.name.toLowerCase().trim();
  const name2 = place2.name.toLowerCase().trim();
  
  // Exact match
  if (name1 === name2) return true;
  
  // Check for common variations (e.g., "McDonald's" vs "McDonalds")
  const normalized1 = name1.replace(/[^a-z0-9]/g, '');
  const normalized2 = name2.replace(/[^a-z0-9]/g, '');
  
  if (normalized1 === normalized2) return true;
  
  // Only allow partial matches if they're very close (within 10m)
  if (distance <= 10) {
    // Check if one name contains the other (for partial matches)
    if (name1.includes(name2) || name2.includes(name1)) return true;
  }
  
  return false;
}

/**
 * Calculate distance between two points in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Combine multiple places into one, merging their properties
 */
function combinePlaces(places) {
  if (places.length === 1) return places[0];
  
  // Use the first place as the base
  const basePlace = places[0];
  
  // Combine all place types
  const allCategories = places.map(p => p.category).filter(Boolean);
  const uniqueCategories = [...new Set(allCategories)];
  
  // Use the most specific category (longest name) or the first one
  const primaryCategory = uniqueCategories.reduce((best, current) => 
    current.length > best.length ? current : best, uniqueCategories[0] || basePlace.category);
  
  // Combine descriptions
  const descriptions = places.map(p => p.description).filter(Boolean);
  const combinedDescription = descriptions.length > 0 ? descriptions.join(', ') : basePlace.description;
  
  // Use the best rating and photo
  const bestPlace = places.reduce((best, current) => {
    if (!best.rating && current.rating) return current;
    if (best.rating && current.rating && current.rating > best.rating) return current;
    if (!best.thumbnail && current.thumbnail) return current;
    return best;
  }, basePlace);
  
  return {
    ...basePlace,
    category: primaryCategory,
    description: combinedDescription,
    rating: bestPlace.rating,
    userRatingsTotal: bestPlace.userRatingsTotal,
    thumbnail: bestPlace.thumbnail,
    // Add a note about combined types
    combinedTypes: uniqueCategories.length > 1 ? uniqueCategories : undefined,
  };
}

// Snap a raw GPS path to the nearest roads via Google Roads API
export async function snapToRoads(rawCoords) {
  if (!rawCoords?.length) return [];

  const maxBatch = 100;
  const batches = [];
  for (let i = 0; i < rawCoords.length; i += maxBatch) {
    batches.push(rawCoords.slice(i, i + maxBatch));
  }

  const snapped = [];

  for (let idx = 0; idx < batches.length; idx++) {
    const batch = batches[idx];
    console.log(`[snapToRoads] batch ${idx + 1}/${batches.length}, length=${batch.length}`);

    const pathParam = batch.map(p => `${p.latitude},${p.longitude}`).join('|');
    const url =
      `https://roads.googleapis.com/v1/snapToRoads` +
      `?interpolate=true` +
      `&key=${encodeURIComponent(GOOGLE_ROADS_API_KEY)}` +
      `&path=${encodeURIComponent(pathParam)}`;


     const resp = await fetch(url);

     const json = await resp.json();


     if (!resp.ok) continue;


    (json.snappedPoints || []).forEach(pt => {
      snapped.push({
        latitude: pt.location.latitude,
        longitude: pt.location.longitude,
      });
    });
  }

  return snapped;
}

/**
 * Get enhanced details for a specific place including AI summaries
 */
export async function getPlaceDetailsWithSummaries(placeId, language = 'en') {
  try {
    const enhancedDetails = await getEnhancedPlaceDetails(placeId, language);
    return enhancedDetails;
  } catch (error) {
    console.warn('Failed to get enhanced place details:', error);
    // Return basic details if enhanced details fail
    return null;
  }
}

// alias
export { getSuggestionsForRoute as getPassingPlaces };
