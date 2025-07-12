// services/DiscoveriesService.js
import { GOOGLE_MAPS_API_KEY_ANDROID, GOOGLE_MAPS_API_KEY_IOS, GOOGLE_ROADS_API_KEY } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://maps.googleapis.com/maps/api/place';
const DISCOVERY_PREFERENCES_KEY = '@discovery_preferences';

/**
 * Get user's discovery preferences from AsyncStorage
 */
export async function getUserDiscoveryPreferences() {
  try {
    const prefs = await AsyncStorage.getItem(DISCOVERY_PREFERENCES_KEY);
    if (prefs) {
      return JSON.parse(prefs);
    }
    // Return default preferences (all enabled)
    return {
      restaurant: true,
      cafe: true,
      bar: true,
      bakery: true,
      park: true,
      museum: true,
      art_gallery: true,
      night_club: true,
      tourist_attraction: true,
      zoo: true,
      shopping_mall: true,
      stadium: true,
      concert_hall: true,
      movie_theater: true,
    };
  } catch (error) {
    console.warn('Failed to load discovery preferences:', error);
    return {};
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
    Math.max(Math.ceil(Math.hypot(latMeters, lngMeters) / 2), 25),
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
    
    // Fetch places for each enabled type
    const resultsPerType = Math.max(1, Math.floor(maxResults / enabledTypes.length));
    
    for (const placeType of enabledTypes) {
      try {
        const results = await fetchPlacesByType(centerLat, centerLng, radius, placeType, apiKey, lang, resultsPerType);
        allResults = [...allResults, ...results];
      } catch (error) {
        console.warn(`Failed to fetch ${placeType} places:`, error);
      }
    }
    
    // Shuffle and limit results
    allResults = shuffleArray(allResults).slice(0, maxResults);
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

// alias
export { getSuggestionsForRoute as getPassingPlaces };
