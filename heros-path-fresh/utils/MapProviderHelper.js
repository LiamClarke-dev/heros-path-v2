/*
 * MAP PROVIDER HELPER
 * ==================
 * 
 * PURPOSE:
 * This utility provides helper functions for selecting and configuring the appropriate
 * map provider based on platform (iOS/Android) and the user's selected map style.
 * It centralizes map provider selection logic to ensure consistent behavior across
 * the app and proper handling of platform-specific map implementations.
 * 
 * FUNCTIONALITY:
 * - Determines the appropriate map provider (Google Maps or Apple Maps) based on platform
 * - Configures map properties based on the selected map style
 * - Provides helper functions for map styling and configuration
 * - Handles platform-specific map implementation details
 * 
 * WHY IT EXISTS:
 * Different platforms have different map capabilities and optimal providers. iOS can use
 * Apple Maps for better integration, while Android requires Google Maps. Additionally,
 * certain map styles require specific providers for proper rendering. This utility
 * centralizes that decision-making logic for consistent implementation across the app.
 */

import { Platform } from 'react-native';
import { MAP_STYLES } from '../styles/theme';

/**
 * Determines the appropriate map provider based on platform and map style
 * 
 * @param {string} mapStyle - The selected map style from MAP_STYLES
 * @returns {string} - 'google' or 'apple' indicating the provider to use
 */
export const getMapProvider = (mapStyle) => {
  // Some map styles require Google Maps for proper styling
  const requiresGoogleMaps = [
    MAP_STYLES.NIGHT,
    MAP_STYLES.ADVENTURE
  ];
  
  // If the style requires Google Maps, use it regardless of platform
  if (requiresGoogleMaps.includes(mapStyle)) {
    return 'google';
  }
  
  // Otherwise, use platform-specific defaults
  return Platform.OS === 'ios' ? 'apple' : 'google';
};

/**
 * Get map properties for Google Maps based on map style
 * 
 * @param {Object} mapStyleConfig - The map style configuration object
 * @param {string} currentTheme - The current UI theme
 * @returns {Object} - Google Maps properties
 */
export const getGoogleMapProperties = (mapStyleConfig, currentTheme) => {
  if (!mapStyleConfig) return {};
  
  const properties = {
    mapType: 'standard', // Default
    isTrafficEnabled: false,
    selectionEnabled: true,
  };
  
  // Map theme styles to Google Maps mapType
  switch(mapStyleConfig.name) {
    case 'Satellite':
      properties.mapType = 'satellite';
      break;
    case 'Terrain':
      properties.mapType = 'terrain';
      break;
    case 'Night':
    case 'Adventure':
      // Custom styles handled via customMapStyle prop
      properties.mapType = 'standard';
      break;
    default:
      properties.mapType = 'standard';
  }
  
  return properties;
};

/**
 * Get map properties for Apple Maps based on map style
 * 
 * @param {Object} mapStyleConfig - The map style configuration object
 * @param {string} currentTheme - The current UI theme
 * @returns {Object} - Apple Maps properties
 */
export const getAppleMapProperties = (mapStyleConfig, currentTheme) => {
  if (!mapStyleConfig) return {};
  
  const properties = {
    mapType: 'standard', // Default
    isTrafficEnabled: false,
    selectionEnabled: true,
  };
  
  // Map theme styles to Apple Maps mapType
  switch(mapStyleConfig.name) {
    case 'Satellite':
      properties.mapType = 'satellite';
      break;
    case 'Terrain':
      // Apple Maps doesn't have terrain, fallback to standard
      properties.mapType = 'standard';
      break;
    case 'Night':
    case 'Adventure':
      // Apple Maps doesn't support custom styling, use hybrid for more detail
      properties.mapType = 'hybrid';
      break;
    default:
      properties.mapType = 'standard';
  }
  
  return properties;
};

/**
 * Get color scheme for map based on map style and theme
 * 
 * @param {Object} mapStyleConfig - The map style configuration object
 * @param {string} currentTheme - The current UI theme
 * @returns {string} - Color scheme ('light', 'dark', or 'auto')
 */
export const getMapColorScheme = (mapStyleConfig, currentTheme) => {
  if (!mapStyleConfig) return 'auto';
  
  // Map theme styles to color scheme
  switch(mapStyleConfig.name) {
    case 'Night':
      return 'dark';
    case 'Adventure':
      return 'light'; // Adventure theme uses warm colors, closer to light
    default:
      return 'auto'; // Follow system
  }
};

/**
 * Build polylines for map display
 * 
 * @param {Object} options - Options containing route data and colors
 * @returns {Array} - Array of polyline objects for the map
 */
export const buildPolylines = ({ savedRoutes, previewRoadCoords, previewRoute, pathToRender, colors }) => {
  const polylines = [];
  
  // Saved routes
  if (savedRoutes && savedRoutes.length > 0) {
    for (const journey of savedRoutes) {
      polylines.push({
        id: journey.id,
        coordinates: journey.route,
        color: colors.routeLine,
        width: 3,
        opacity: 0.6,
      });
    }
  }
  
  // Preview route
  if ((previewRoadCoords && previewRoadCoords.length > 0) || (previewRoute && previewRoute.length > 0)) {
    polylines.push({
      id: 'preview',
      coordinates: previewRoadCoords.length > 0 ? previewRoadCoords : previewRoute,
      color: colors.routePreview,
      width: 4,
    });
  }
  
  // Current path
  if (pathToRender && pathToRender.length > 0) {
    polylines.push({
      id: 'current',
      coordinates: pathToRender,
      color: colors.routeLine,
      width: 6,
    });
  }
  
  return polylines;
};

/**
 * Build markers for map display
 * 
 * @param {Object} options - Options containing marker data
 * @returns {Array} - Array of marker objects for the map
 */
export const buildMarkers = ({ currentPosition, spriteColor, showSavedPlaces, savedPlaces, colors }) => {
  const markers = [];
  
  // Saved places markers
  if (showSavedPlaces && savedPlaces && savedPlaces.length > 0) {
    for (const place of savedPlaces) {
      markers.push({
        id: place.id,
        coordinates: { latitude: place.latitude, longitude: place.longitude },
        title: place.name,
        description: place.vicinity,
      });
    }
  }
  
  return markers;
};

export default {
  getMapProvider,
  getGoogleMapProperties,
  getAppleMapProperties,
  getMapColorScheme,
  buildPolylines,
  buildMarkers
};