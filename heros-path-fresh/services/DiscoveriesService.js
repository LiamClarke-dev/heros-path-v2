// services/DiscoveriesService.js
import { GOOGLE_MAPS_API_KEY_ANDROID, GOOGLE_MAPS_API_KEY_IOS, GOOGLE_ROADS_API_KEY } from '../config';
const BASE_URL = 'https://maps.googleapis.com/maps/api/place';

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
 * Fetch “point_of_interest” around the bounding circle of your route.
 */
// services/DiscoveriesService.js
export async function getSuggestionsForRoute(
  routeCoords,
  { type, maxResults = 20, language = 'en' } = {}
) {
  if (!routeCoords?.length) return [];

  const { centerLat, centerLng, radius } = coordsToBoundingCircle(routeCoords);
   // Use Android key by default; you can enhance this to detect platform if needed
   const apiKey = GOOGLE_MAPS_API_KEY_ANDROID;
   const lang   = encodeURIComponent(language);
   const loc    = `${centerLat},${centerLng}`;
   let url =
    `${BASE_URL}/nearbysearch/json` +
    `?key=${apiKey}` +
    `&location=${centerLat},${centerLng}` +
    `&radius=${radius}` +
    `&language=${lang}`;

   if (type) {
     url += `&type=${encodeURIComponent(type)}`;
   }

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
        category: place.types?.[0] || 'point_of_interest',
        description: place.vicinity || place.types?.[0]?.replace('_', ' ') || '',
        thumbnail: photoUrl,
        rating: place.rating,
        userRatingsTotal: place.user_ratings_total,
      };
    });
  } catch (err) {
    console.warn('getSuggestionsForRoute failed:', err);
    return [];
  }
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
