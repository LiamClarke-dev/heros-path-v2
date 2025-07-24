/*
 * MAP STYLE PREVIEWS UTILITY
 * ==========================
 * 
 * PURPOSE:
 * This utility manages map style preview images and provides fallback
 * representations when actual preview images are not available. It handles
 * the generation of preview data and provides consistent preview styling.
 * 
 * FUNCTIONALITY:
 * - Manages preview image paths and fallbacks
 * - Provides preview colors and styling data
 * - Handles preview image loading and error states
 * - Generates preview representations for each map style
 */

import { MAP_STYLES } from '../styles/theme';

// Preview image paths (these would be actual screenshots in production)
export const PREVIEW_IMAGE_PATHS = {
  [MAP_STYLES.STANDARD]: null, // Would be: require('../assets/map-style-previews/standard.png')
  [MAP_STYLES.SATELLITE]: null, // Would be: require('../assets/map-style-previews/satellite.png')
  [MAP_STYLES.TERRAIN]: null, // Would be: require('../assets/map-style-previews/terrain.png')
  [MAP_STYLES.NIGHT]: null, // Would be: require('../assets/map-style-previews/night.png')
  [MAP_STYLES.ADVENTURE]: null, // Would be: require('../assets/map-style-previews/adventure.png')
};

// Preview colors for fallback representations
export const PREVIEW_COLORS = {
  [MAP_STYLES.STANDARD]: {
    primary: '#E8F4FD',
    secondary: '#B3D9F7',
    accent: '#4A90E2',
    text: '#2C3E50',
    gradient: ['#E8F4FD', '#B3D9F7', '#4A90E2'],
  },
  [MAP_STYLES.SATELLITE]: {
    primary: '#8FBC8F',
    secondary: '#98FB98',
    accent: '#228B22',
    text: '#006400',
    gradient: ['#8FBC8F', '#98FB98', '#228B22'],
  },
  [MAP_STYLES.TERRAIN]: {
    primary: '#DEB887',
    secondary: '#F4A460',
    accent: '#CD853F',
    text: '#8B4513',
    gradient: ['#DEB887', '#F4A460', '#CD853F'],
  },
  [MAP_STYLES.NIGHT]: {
    primary: '#2F4F4F',
    secondary: '#708090',
    accent: '#4682B4',
    text: '#F0F8FF',
    gradient: ['#2F4F4F', '#708090', '#4682B4'],
  },
  [MAP_STYLES.ADVENTURE]: {
    primary: '#4A90E2',
    secondary: '#F6AF3C',
    accent: '#739E82',
    text: '#2C5530',
    gradient: ['#4A90E2', '#F6AF3C', '#739E82'],
  },
};

// Preview patterns for visual representation
export const PREVIEW_PATTERNS = {
  [MAP_STYLES.STANDARD]: {
    pattern: 'grid',
    elements: ['roads', 'buildings', 'parks'],
  },
  [MAP_STYLES.SATELLITE]: {
    pattern: 'organic',
    elements: ['terrain', 'water', 'vegetation'],
  },
  [MAP_STYLES.TERRAIN]: {
    pattern: 'contour',
    elements: ['elevation', 'trails', 'landmarks'],
  },
  [MAP_STYLES.NIGHT]: {
    pattern: 'minimal',
    elements: ['roads', 'lights', 'water'],
  },
  [MAP_STYLES.ADVENTURE]: {
    pattern: 'fantasy',
    elements: ['paths', 'landmarks', 'mystical'],
  },
};

/**
 * Get preview image for a map style
 * @param {string} styleKey - The map style key
 * @returns {object|null} - Preview image source or null
 */
export const getPreviewImage = (styleKey) => {
  return PREVIEW_IMAGE_PATHS[styleKey] || null;
};

/**
 * Get preview colors for a map style
 * @param {string} styleKey - The map style key
 * @returns {object} - Preview color scheme
 */
export const getPreviewColors = (styleKey) => {
  return PREVIEW_COLORS[styleKey] || PREVIEW_COLORS[MAP_STYLES.STANDARD];
};

/**
 * Get preview pattern data for a map style
 * @param {string} styleKey - The map style key
 * @returns {object} - Preview pattern configuration
 */
export const getPreviewPattern = (styleKey) => {
  return PREVIEW_PATTERNS[styleKey] || PREVIEW_PATTERNS[MAP_STYLES.STANDARD];
};

/**
 * Check if preview image is available for a style
 * @param {string} styleKey - The map style key
 * @returns {boolean} - Whether preview image is available
 */
export const hasPreviewImage = (styleKey) => {
  return PREVIEW_IMAGE_PATHS[styleKey] !== null;
};

/**
 * Generate preview data for all map styles
 * @returns {object} - Complete preview data for all styles
 */
export const generateAllPreviews = () => {
  const previews = {};
  
  Object.values(MAP_STYLES).forEach(styleKey => {
    previews[styleKey] = {
      image: getPreviewImage(styleKey),
      colors: getPreviewColors(styleKey),
      pattern: getPreviewPattern(styleKey),
      hasImage: hasPreviewImage(styleKey),
    };
  });
  
  return previews;
};

export default {
  getPreviewImage,
  getPreviewColors,
  getPreviewPattern,
  hasPreviewImage,
  generateAllPreviews,
  PREVIEW_IMAGE_PATHS,
  PREVIEW_COLORS,
  PREVIEW_PATTERNS,
};