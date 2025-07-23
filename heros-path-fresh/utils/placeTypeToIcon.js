/*
 * PLACE TYPE TO ICON MAPPING
 * =========================
 * 
 * PURPOSE:
 * This utility provides a mapping between Google Places API place types and
 * appropriate Material Icons to represent them on the map. It ensures consistent
 * visual representation of different place types across the app.
 * 
 * FUNCTIONALITY:
 * - Maps Google Places API types to Material Icons names
 * - Provides fallback icons for unknown place types
 * - Organizes place types into logical categories
 * - Supports theme-aware icon selection
 */

import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

// Main mapping of place types to Material Icons
export const PLACE_TYPE_TO_ICON = {
  // Food & Drink
  'restaurant': { 
    name: 'restaurant', 
    type: 'material',
    color: '#FF5252' // Red
  },
  'cafe': { 
    name: 'local-cafe', 
    type: 'material',
    color: '#795548' // Brown
  },
  'bar': { 
    name: 'local-bar', 
    type: 'material',
    color: '#9C27B0' // Purple
  },
  'bakery': { 
    name: 'bakery-dining', 
    type: 'material',
    color: '#FF9800' // Orange
  },
  'meal_takeaway': { 
    name: 'takeout-dining', 
    type: 'material',
    color: '#FF5252' // Red
  },
  
  // Shopping
  'shopping_mall': { 
    name: 'local-mall', 
    type: 'material',
    color: '#3F51B5' // Indigo
  },
  'store': { 
    name: 'store', 
    type: 'material',
    color: '#3F51B5' // Indigo
  },
  'convenience_store': { 
    name: 'storefront', 
    type: 'material',
    color: '#3F51B5' // Indigo
  },
  
  // Entertainment & Culture
  'museum': { 
    name: 'museum', 
    type: 'material',
    color: '#009688' // Teal
  },
  'art_gallery': { 
    name: 'palette', 
    type: 'material',
    color: '#E91E63' // Pink
  },
  'night_club': { 
    name: 'nightlife', 
    type: 'material',
    color: '#673AB7' // Deep Purple
  },
  'tourist_attraction': { 
    name: 'photo-camera', 
    type: 'material',
    color: '#2196F3' // Blue
  },
  'zoo': { 
    name: 'pets', 
    type: 'material',
    color: '#4CAF50' // Green
  },
  'stadium': { 
    name: 'stadium', 
    type: 'material',
    color: '#FF9800' // Orange
  },
  'concert_hall': { 
    name: 'music-note', 
    type: 'material',
    color: '#9C27B0' // Purple
  },
  'movie_theater': { 
    name: 'movie', 
    type: 'material',
    color: '#673AB7' // Deep Purple
  },
  
  // Health & Wellness
  'gym': { 
    name: 'fitness-center', 
    type: 'material',
    color: '#F44336' // Red
  },
  'pharmacy': { 
    name: 'local-pharmacy', 
    type: 'material',
    color: '#4CAF50' // Green
  },
  
  // Services & Utilities
  'bank': { 
    name: 'account-balance', 
    type: 'material',
    color: '#607D8B' // Blue Grey
  },
  'atm': { 
    name: 'local-atm', 
    type: 'material',
    color: '#607D8B' // Blue Grey
  },
  'gas_station': { 
    name: 'local-gas-station', 
    type: 'material',
    color: '#FF5722' // Deep Orange
  },
  
  // Outdoors & Recreation
  'park': { 
    name: 'park', 
    type: 'material',
    color: '#4CAF50' // Green
  },
  'lodging': { 
    name: 'hotel', 
    type: 'material',
    color: '#2196F3' // Blue
  },
  
  // Additional common types
  'airport': { 
    name: 'local-airport', 
    type: 'material',
    color: '#607D8B' // Blue Grey
  },
  'train_station': { 
    name: 'train', 
    type: 'material',
    color: '#F44336' // Red
  },
  'bus_station': { 
    name: 'directions-bus', 
    type: 'material',
    color: '#2196F3' // Blue
  },
  'subway_station': { 
    name: 'subway', 
    type: 'material',
    color: '#4CAF50' // Green
  },
  'library': { 
    name: 'local-library', 
    type: 'material',
    color: '#795548' // Brown
  },
  'church': { 
    name: 'church', 
    type: 'material-community',
    color: '#9E9E9E' // Grey
  },
  'mosque': { 
    name: 'mosque', 
    type: 'material-community',
    color: '#9E9E9E' // Grey
  },
  'hindu_temple': { 
    name: 'temple-hindu', 
    type: 'material-community',
    color: '#9E9E9E' // Grey
  },
  'synagogue': { 
    name: 'synagogue', 
    type: 'material-community',
    color: '#9E9E9E' // Grey
  },
  'school': { 
    name: 'school', 
    type: 'material',
    color: '#FFC107' // Amber
  },
  'university': { 
    name: 'school', 
    type: 'material',
    color: '#FFC107' // Amber
  },
  'post_office': { 
    name: 'local-post-office', 
    type: 'material',
    color: '#607D8B' // Blue Grey
  },
  'police': { 
    name: 'local-police', 
    type: 'material',
    color: '#3F51B5' // Indigo
  },
  'fire_station': { 
    name: 'local-fire-department', 
    type: 'material',
    color: '#F44336' // Red
  },
  'hospital': { 
    name: 'local-hospital', 
    type: 'material',
    color: '#F44336' // Red
  },
  'doctor': { 
    name: 'medical-services', 
    type: 'material',
    color: '#F44336' // Red
  },
  'dentist': { 
    name: 'dentistry', 
    type: 'material-community',
    color: '#F44336' // Red
  },
};

/**
 * Get the appropriate icon for a place type
 * @param {string} placeType - The Google Places API place type
 * @param {object} colors - Theme colors object
 * @returns {object} Icon configuration with name, component, and color
 */
export function getIconForPlaceType(placeType, colors) {
  // If we have a direct match in our mapping
  if (PLACE_TYPE_TO_ICON[placeType]) {
    const iconConfig = PLACE_TYPE_TO_ICON[placeType];
    return {
      name: iconConfig.name,
      Component: iconConfig.type === 'material' ? MaterialIcons : MaterialCommunityIcons,
      color: colors?.placeIcons?.[placeType] || iconConfig.color,
    };
  }
  
  // For types with multiple categories, check the first one
  if (Array.isArray(placeType) && placeType.length > 0) {
    return getIconForPlaceType(placeType[0], colors);
  }
  
  // Default fallback icon
  return {
    name: 'place',
    Component: MaterialIcons,
    color: colors?.primary || '#2196F3', // Default to blue
  };
}

/**
 * Get marker color for a place type (for clustering)
 * @param {string} placeType - The Google Places API place type
 * @returns {string} Hex color code
 */
export function getMarkerColorForPlaceType(placeType) {
  if (PLACE_TYPE_TO_ICON[placeType]) {
    return PLACE_TYPE_TO_ICON[placeType].color;
  }
  
  // Default color
  return '#2196F3'; // Blue
}