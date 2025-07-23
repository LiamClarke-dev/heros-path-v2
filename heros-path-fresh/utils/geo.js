// Geo utility functions for distance and direction calculations

/**
 * Calculate distance between two coordinates in meters (Haversine formula)
 * @param {Object} coord1 - { latitude, longitude }
 * @param {Object} coord2 - { latitude, longitude }
 * @return {number} Distance in meters
 */
export function calculateDistance(coord1, coord2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = coord1.latitude * Math.PI / 180;
  const φ2 = coord2.latitude * Math.PI / 180;
  const Δφ = (coord2.latitude - coord1.latitude) * Math.PI / 180;
  const Δλ = (coord2.longitude - coord1.longitude) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

/**
 * Calculate the direction of movement based on previous and current coordinates
 * Enhanced with movement threshold to avoid jitter and better direction detection
 * @param {Array} points - Array containing [previous, current] location coordinates
 * @param {number} accuracy - Current GPS accuracy in meters
 * @return {string} The sprite state to display
 */
export function getDirection([prev, curr], accuracy = null, SPRITE_STATES, MOVEMENT_THRESHOLD = 2.0) {
  if (!prev || !curr) return SPRITE_STATES?.IDLE || 'idle';
  if (accuracy !== null) {
    if (accuracy > 50) return SPRITE_STATES?.GPS_LOST || 'gps_lost';
    if (accuracy > 15) return SPRITE_STATES?.GPS_WEAK || 'gps_weak';
  }
  const distance = calculateDistance(prev, curr);
  if (distance < MOVEMENT_THRESHOLD) {
    return SPRITE_STATES?.IDLE || 'idle';
  }
  const dx = curr.longitude - prev.longitude;
  const dy = curr.latitude - prev.latitude;
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? (SPRITE_STATES?.WALK_RIGHT || 'walk_right') : (SPRITE_STATES?.WALK_LEFT || 'walk_left');
  } else {
    return dy > 0 ? (SPRITE_STATES?.WALK_DOWN || 'walk_down') : (SPRITE_STATES?.WALK_UP || 'walk_up');
  }
}

/**
 * Calculate total distance for an array of coordinates
 * @param {Array} coords - Array of { latitude, longitude }
 * @return {number} Total distance in meters
 */
export function calculateTotalDistance(coords) {
  if (coords.length < 2) return 0;
  let totalDistance = 0;
  for (let i = 1; i < coords.length; i++) {
    totalDistance += calculateDistance(coords[i - 1], coords[i]);
  }
  return totalDistance;
} 