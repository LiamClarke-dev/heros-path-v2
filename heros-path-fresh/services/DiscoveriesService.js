// services/DiscoveriesService.js
import { GOOGLE_MAPS_API_KEY_ANDROID, GOOGLE_MAPS_API_KEY_IOS, GOOGLE_ROADS_API_KEY } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PLACE_TYPES } from '../constants/PlaceTypes';
import { getEnhancedPlaceDetails } from './EnhancedPlacesService';
import { searchNearbyPlaces, getPlaceDetails, getPlaceSummaries, testAPIConnectivity } from './NewPlacesService';
import { 
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import Logger from '../utils/Logger';

const BASE_URL = 'https://maps.googleapis.com/maps/api/place';
const NEW_BASE_URL = 'https://places.googleapis.com/v1';
const DISCOVERY_PREFERENCES_KEY = '@discovery_preferences';

/**
 * Encode GPS coordinates to Google's polyline format
 * @param {Array} coordinates - Array of {latitude, longitude} objects
 * @returns {string} Encoded polyline string
 */
function encodePolyline(coordinates) {
  if (!coordinates || coordinates.length === 0) {
    return '';
  }

  let polyline = '';
  let prevLat = 0;
  let prevLng = 0;

  coordinates.forEach(coord => {
    const lat = Math.round(coord.latitude * 1e5);
    const lng = Math.round(coord.longitude * 1e5);
    
    const dLat = lat - prevLat;
    const dLng = lng - prevLng;
    
    polyline += encodeNumber(dLat);
    polyline += encodeNumber(dLng);
    
    prevLat = lat;
    prevLng = lng;
  });

  return polyline;
}

/**
 * Encode a number for polyline format
 * @param {number} num - Number to encode
 * @returns {string} Encoded string
 */
function encodeNumber(num) {
  let encoded = '';
  let value = num < 0 ? ~(num << 1) : (num << 1);
  
  while (value >= 0x20) {
    encoded += String.fromCharCode(((value & 0x1f) | 0x20) + 63);
    value >>= 5;
  }
  
  encoded += String.fromCharCode(value + 63);
  return encoded;
}

/**
 * Build search query from user preferences
 * @param {Object} preferences - User discovery preferences
 * @returns {string} Search query string
 */
function buildSearchQuery(preferences) {
  const enabledTypes = Object.keys(preferences).filter(type => preferences[type]);
  const typeNames = enabledTypes.map(type => {
    // Convert place type keys to readable names
    const typeMap = {
      restaurant: 'restaurant',
      cafe: 'cafe',
      bar: 'bar',
      park: 'park',
      museum: 'museum',
      library: 'library',
      store: 'store',
      shopping_mall: 'shopping mall',
      tourist_attraction: 'tourist attraction',
      art_gallery: 'art gallery',
      movie_theater: 'movie theater',
      gym: 'gym',
      hospital: 'hospital',
      bank: 'bank',
      post_office: 'post office',
      gas_station: 'gas station',
      pharmacy: 'pharmacy',
      school: 'school',
      university: 'university',
      church: 'church',
      mosque: 'mosque',
      temple: 'temple',
      synagogue: 'synagogue'
    };
    return typeMap[type] || type;
  });
  return typeNames.join(' ');
}

/**
 * Search Along Route using Google Places API
 * @param {Array} routeCoords - Array of coordinate objects
 * @param {Object} preferences - User discovery preferences
 * @param {string} language - Language code
 * @returns {Promise<Array>} Array of suggested places
 */
async function searchAlongRoute(routeCoords, preferences, language = 'en') {
  const startTime = Date.now();
  Logger.debug('DISCOVERIES_SERVICE', `Starting SAR for route with ${routeCoords?.length || 0} coordinates`, { 
    enabledTypesCount: Object.keys(preferences).filter(type => preferences[type]).length,
    language
  });

  if (!routeCoords || routeCoords.length === 0) {
    Logger.debug('DISCOVERIES_SERVICE', 'No route coordinates provided for SAR');
    return [];
  }

  try {
    // Encode route coordinates to polyline
    const encodedPolyline = encodePolyline(routeCoords);
    if (!encodedPolyline) {
      Logger.warn('DISCOVERIES_SERVICE', 'Failed to encode polyline for SAR');
      return [];
    }

    // Build search query from preferences
    const searchQuery = buildSearchQuery(preferences);
    if (!searchQuery.trim()) {
      Logger.debug('DISCOVERIES_SERVICE', 'No enabled place types for SAR');
      return [];
    }

    // Get API key (use Android key as fallback)
    const apiKey = GOOGLE_MAPS_API_KEY_IOS || GOOGLE_MAPS_API_KEY_ANDROID;
    if (!apiKey) {
      Logger.error('DISCOVERIES_SERVICE', 'No Google Places API key available for SAR');
      return [];
    }

    // Make SAR API call
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

    if (!response.ok) {
      const errorText = await response.text();
      Logger.error('DISCOVERIES_SERVICE', `SAR API call failed: ${response.status}`, { error: errorText });
      
      // Fallback to center-point method
      Logger.warn('DISCOVERIES_SERVICE', 'Falling back to center-point method');
      return await getSuggestionsForRouteFallback(routeCoords, preferences, language);
    }

    const data = await response.json();
    const places = data.places || [];

    Logger.debug('DISCOVERIES_SERVICE', `SAR returned ${places.length} places`);

    // Transform places to match our expected format
    const transformedPlaces = places.map(place => ({
      placeId: place.id,
      name: place.displayName?.text || 'Unknown Place',
      types: place.types || [],
      primaryType: place.primaryType || place.types?.[0] || 'unknown',
      rating: place.rating || null,
      userRatingsTotal: place.userRatingCount || 0,
      location: {
        lat: place.location?.latitude || 0,
        lng: place.location?.longitude || 0
      },
      formatted_address: place.formattedAddress || '',
      photos: place.photos || [],
      source: 'sar'
    }));

    // Apply additional filtering and deduplication
    const filteredPlaces = filterPlacesByPreferences(transformedPlaces, preferences);
    const deduplicatedPlaces = deduplicatePlaces(filteredPlaces);

    const duration = Date.now() - startTime;
    Logger.performance('DISCOVERIES_SERVICE', 'searchAlongRoute', duration, { 
      routeCoordsCount: routeCoords.length,
      placesFound: places.length,
      placesAfterFiltering: filteredPlaces.length,
      placesAfterDeduplication: deduplicatedPlaces.length
    });

    return deduplicatedPlaces;

  } catch (error) {
    Logger.error('DISCOVERIES_SERVICE', 'SAR failed, falling back to center-point method', error);
    
    // Fallback to center-point method
    return await getSuggestionsForRouteFallback(routeCoords, preferences, language);
  }
}

/**
 * Fallback to center-point method if SAR fails
 * @param {Array} routeCoords - Array of coordinate objects
 * @param {Object} preferences - User discovery preferences
 * @param {string} language - Language code
 * @returns {Promise<Array>} Array of suggested places
 */
async function getSuggestionsForRouteFallback(routeCoords, preferences, language = 'en') {
  Logger.debug('DISCOVERIES_SERVICE', 'Using fallback center-point method');
  
  if (!routeCoords || routeCoords.length === 0) {
    return [];
  }

  try {
    // Get enabled place types from preferences
    const enabledTypes = Object.keys(preferences).filter(type => preferences[type]);
    
    if (enabledTypes.length === 0) {
      return [];
    }

    // Calculate route center (original method)
    const center = calculateRouteCenter(routeCoords);
    const radius = 500; // 500m radius
    
    Logger.debug('DISCOVERIES_SERVICE', 'Fallback center-point calculation', {
      center,
      routeCoordsCount: routeCoords.length,
      enabledTypes
    });
    
    // Validate center coordinates
    if (!center.latitude || !center.longitude || 
        center.latitude === 0 || center.longitude === 0 ||
        Math.abs(center.latitude) > 90 || Math.abs(center.longitude) > 180) {
      Logger.error('DISCOVERIES_SERVICE', 'Invalid center coordinates in fallback', { center });
      return [];
    }

    // Fetch places for each enabled type
    const allPlaces = [];
    for (const type of enabledTypes) {
      Logger.debug('DISCOVERIES_SERVICE', `Fetching places for type: ${type}`, { center, radius });
      const places = await fetchPlacesByType(type, center, radius);
      Logger.debug('DISCOVERIES_SERVICE', `Got ${places.length} places for type: ${type}`, {
        samplePlace: places[0] ? {
          name: places[0].name,
          placeId: places[0].placeId,
          location: places[0].location
        } : null
      });
      allPlaces.push(...places);
    }

    // Apply filtering and deduplication
    const filteredPlaces = filterPlacesByPreferences(allPlaces, preferences);
    const deduplicatedPlaces = deduplicatePlaces(filteredPlaces);

    return deduplicatedPlaces;
  } catch (error) {
    Logger.error('DISCOVERIES_SERVICE', 'Fallback center-point method also failed', error);
    return [];
  }
}

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
 * Calculate the center point of a route
 * @param {Array} coords - Array of coordinate objects with latitude/longitude
 * @returns {Object} Center point with latitude and longitude
 */
function calculateRouteCenter(coords) {
  if (!coords || coords.length === 0) {
    return { latitude: 0, longitude: 0 };
  }
  
  if (coords.length === 1) {
    return { latitude: coords[0].latitude, longitude: coords[0].longitude };
  }
  
  // Calculate the average of all coordinates
  const totalLat = coords.reduce((sum, coord) => sum + coord.latitude, 0);
  const totalLng = coords.reduce((sum, coord) => sum + coord.longitude, 0);
  
  return {
    latitude: totalLat / coords.length,
    longitude: totalLng / coords.length
  };
}

/**
 * Calculate route center
 * @param {Array} routeCoords - Array of route coordinates
 * @returns {Object} Center point with latitude and longitude
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
 * Get place suggestions for a route using user preferences
 * @param {Array} routeCoords - Array of coordinate objects
 * @param {Object} preferences - User discovery preferences
 * @param {string} language - Language code
 * @returns {Promise<Array>} Array of suggested places
 */
export async function getSuggestionsForRoute(routeCoords, preferences, language = 'en', userId = null) {
  const startTime = Date.now();
  Logger.debug('DISCOVERIES_SERVICE', `Getting suggestions for route with ${routeCoords?.length || 0} coordinates`, { 
    userId, 
    enabledTypesCount: Object.keys(preferences).filter(type => preferences[type]).length,
    preferencesKeys: Object.keys(preferences),
    language
  });
  
  if (!routeCoords || routeCoords.length === 0) {
    Logger.debug('DISCOVERIES_SERVICE', 'No route coordinates provided, returning empty array');
    return [];
  }

  // Check if route has enough distance for meaningful discoveries
  if (routeCoords.length < 3) {
    Logger.debug('DISCOVERIES_SERVICE', 'Route has less than 3 points, checking distance');
    
    if (routeCoords.length === 2) {
      const distance = calculateDistance(
        routeCoords[0].latitude, routeCoords[0].longitude,
        routeCoords[1].latitude, routeCoords[1].longitude
      );
      
      if (distance < 50) { // Less than 50 meters
        Logger.debug('DISCOVERIES_SERVICE', 'Route distance too small for discoveries', { distance });
        return [];
      }
    } else {
      Logger.debug('DISCOVERIES_SERVICE', 'Single point route, no discoveries possible');
      return [];
    }
  }

  try {
    // Get enabled place types from preferences
    const enabledTypes = Object.keys(preferences).filter(type => preferences[type]);
    
    if (enabledTypes.length === 0) {
      Logger.debug('DISCOVERIES_SERVICE', 'No enabled place types, returning empty array');
      return [];
    }

    // Use SAR if available, otherwise fallback to center-point
    const suggestions = await searchAlongRoute(routeCoords, preferences, language);

    Logger.debug('DISCOVERIES_SERVICE', `Total places before deduplication: ${suggestions.length}`);

    // Deduplicate and filter results
    const deduplicated = deduplicatePlaces(suggestions);
    Logger.debug('DISCOVERIES_SERVICE', `Places after deduplication: ${deduplicated.length}`);
    
    const filtered = filterPlacesByPreferences(deduplicated, preferences);
    Logger.debug('DISCOVERIES_SERVICE', `Places after filtering: ${filtered.length}`);
    
    // Filter out places that have already been reviewed (saved or dismissed)
    let finalPlaces = filtered;
    if (userId) {
      try {
        Logger.debug('DISCOVERIES_SERVICE', `Filtering out already reviewed places for user: ${userId}`);
        // Get user's reviewed places
        const [savedResult, dismissedResult] = await Promise.all([
          getSavedPlaces(userId),
          getDismissedPlaces(userId)
        ]);
        
        const savedPlaceIds = new Set(savedResult.discoveries?.map(p => p.placeId) || []);
        const dismissedPlaceIds = new Set(dismissedResult.dismissedPlaces?.map(p => p.placeId) || []);
        
        finalPlaces = filtered.filter(place => 
          !savedPlaceIds.has(place.placeId) && !dismissedPlaceIds.has(place.placeId)
        );
        
        Logger.debug('DISCOVERIES_SERVICE', `Places after filtering reviewed: ${finalPlaces.length}`);
      } catch (error) {
        Logger.warn('DISCOVERIES_SERVICE', 'Failed to filter reviewed places, using all places', { error: error.message });
      }
    }

    const duration = Date.now() - startTime;
    Logger.performance('DISCOVERIES_SERVICE', 'getSuggestionsForRoute', duration, { 
      routeCoordsCount: routeCoords.length, 
      enabledTypesCount: enabledTypes.length, 
      finalPlacesCount: finalPlaces.length 
    });

    return finalPlaces;
  } catch (error) {
    Logger.error('DISCOVERIES_SERVICE', 'Error getting suggestions for route', error);
    return [];
  }
}

/**
 * Filter places based on user preferences
 * @param {Array} places - Array of places to filter
 * @param {Object} preferences - User preferences object
 * @returns {Array} Filtered places
 */
function filterPlacesByPreferences(places, preferences = {}) {
  if (!places || places.length === 0) return places;
  
  return places.filter(place => {
    // Filter by minimum rating if specified
    if (preferences.minRating && place.rating) {
      if (place.rating < preferences.minRating) return false;
    }
    
    // Filter by minimum review count if specified
    if (preferences.minReviews && place.userRatingsTotal) {
      if (place.userRatingsTotal < preferences.minReviews) return false;
    }
    
    // Filter by place type if specified
    if (preferences.type && place.category) {
      if (place.category !== preferences.type) return false;
    }
    
    return true;
  });
}

/**
 * Fetch places for a specific type
 * @param {string} type - Place type
 * @param {Object} location - Location object with latitude and longitude
 * @param {number} radius - Search radius in meters
 * @returns {Promise<Array>} Array of places
 */
async function fetchPlacesByType(type, location, radius = 500) {
  Logger.debug('DISCOVERIES_SERVICE', `Fetching places for type: ${type}`, { 
    location, 
    radius,
    locationType: typeof location,
    hasLatitude: !!location?.latitude,
    hasLongitude: !!location?.longitude
  });
  
  try {
    Logger.debug('DISCOVERIES_SERVICE', `Making API call for type: ${type}`, {
      latitude: location.latitude,
      longitude: location.longitude,
      radius,
      type
    });
    
    const options = {
      maxResults: 1,
      useNewAPI: true
    };
    
    Logger.debug('DISCOVERIES_SERVICE', `Calling searchNearbyPlaces with options:`, options);
    
    const places = await searchNearbyPlaces(location.latitude, location.longitude, radius, type, options);
    
    Logger.debug('DISCOVERIES_SERVICE', `API returned ${places.length} places for type: ${type}`, {
      placesCount: places.length,
      firstPlace: places[0] ? { name: places[0].name, placeId: places[0].placeId } : null
    });
    return places;
  } catch (error) {
    Logger.error('DISCOVERIES_SERVICE', `Error fetching places for type: ${type}`, error);
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
 * Get saved places for a user
 */
async function getSavedPlaces(userId) {
  try {
    const discoveriesRef = collection(db, 'journeys', userId, 'discoveries');
    const q = query(discoveriesRef, where('saved', '==', true));
    const querySnapshot = await getDocs(q);
    
    const savedPlaces = [];
    querySnapshot.forEach((doc) => {
      savedPlaces.push(doc.data());
    });
    
    return { success: true, discoveries: savedPlaces };
  } catch (error) {
    console.error('Error getting saved places:', error);
    return { success: false, discoveries: [] };
  }
}

/**
 * Get dismissed places for a user
 */
async function getDismissedPlaces(userId) {
  try {
    const dismissedRef = collection(db, 'journeys', userId, 'dismissed');
    const q = query(dismissedRef);
    const querySnapshot = await getDocs(q);
    
    const dismissedPlaces = [];
    querySnapshot.forEach((doc) => {
      dismissedPlaces.push(doc.data());
    });
    
    return { success: true, dismissedPlaces };
  } catch (error) {
    console.error('Error getting dismissed places:', error);
    return { success: false, dismissedPlaces: [] };
  }
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
    Logger.log(`[snapToRoads] batch ${idx + 1}/${batches.length}, length=${batch.length}`);

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
 * Now uses the new Places API with automatic fallback
 */
export async function getPlaceDetailsWithSummaries(placeId, language = 'en') {
  try {
    // First try the new API service
    const placeDetails = await getPlaceDetails(placeId, language, true);
    
    // Get AI summaries separately
    const summaries = await getPlaceSummaries(placeId, language);
    
    // Combine place details with summaries
    if (placeDetails) {
      return {
        ...placeDetails,
        summaries: summaries
      };
    }
    
    // Fallback to enhanced place details from the old service
    const enhancedDetails = await getEnhancedPlaceDetails(placeId, language);
    return {
      ...enhancedDetails,
      summaries: summaries
    };
  } catch (error) {
    console.warn('Failed to get place details with summaries:', error);
    // Return basic details if enhanced details fail
    return null;
  }
}

// alias
export { getSuggestionsForRoute as getPassingPlaces };
export { searchAlongRoute, getSuggestionsForRouteFallback };

/**
 * Test API connectivity and provide migration status
 * This helps determine which API is working and provides migration guidance
 */
export async function testPlacesAPIMigration() {
  Logger.log('🔍 Testing Google Places API migration status...');
  
  try {
    const connectivity = await testAPIConnectivity();
    
    const status = {
      timestamp: new Date().toISOString(),
      newAPI: connectivity.newAPI,
      legacyAPI: connectivity.legacyAPI,
      newAPIError: connectivity.newAPIError,
      legacyAPIError: connectivity.legacyAPIError,
      recommendation: '',
      migrationStatus: ''
    };
    
    if (connectivity.newAPI) {
      status.migrationStatus = 'READY';
      status.recommendation = 'New Places API is working. You can safely migrate to use it exclusively.';
    } else if (connectivity.legacyAPI) {
      status.migrationStatus = 'FALLBACK';
      status.recommendation = 'New Places API is not available, but legacy API is working. Continue using hybrid approach.';
    } else {
      status.migrationStatus = 'ERROR';
      status.recommendation = 'Both APIs are failing. Check API key configuration and network connectivity.';
    }
    
    Logger.log('📊 Migration Status:', status);
    return status;
    
  } catch (error) {
    console.error('❌ Failed to test API migration:', error);
    return {
      timestamp: new Date().toISOString(),
      newAPI: false,
      legacyAPI: false,
      newAPIError: error.message,
      legacyAPIError: 'Test failed',
      recommendation: 'API testing failed. Check configuration and try again.',
      migrationStatus: 'ERROR'
    };
  }
}
