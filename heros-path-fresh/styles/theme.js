/*
 * BRAND GUIDELINES INTEGRATION
 * ============================
 *
 * The color palette, typography, and spacing variables in this file are mapped directly to the updated brand guidelines:
 *   See docs/BRAND_GUIDELINES.md
 *
 * For color palette and semantic color tokens, consult:
 *   → Visual Identity System > Color Palette (docs/BRAND_GUIDELINES.md)
 * For typography scale and font usage, consult:
 *   → Visual Identity System > Typography System (docs/BRAND_GUIDELINES.md)
 * For spacing and layout, consult:
 *   → UI Style Patterns > Spacing System (docs/BRAND_GUIDELINES.md)
 *
 * When updating or adding theme variables, always reference the appropriate section of the brand guidelines for rationale and consistency.
 */
// styles/theme.js
// Enhanced theme system with multiple UI themes and map styles

// Theme Types
export const THEME_TYPES = {
  LIGHT: 'light',
  DARK: 'dark',
  ADVENTURE: 'adventure'
};

// Map Style Types
export const MAP_STYLES = {
  STANDARD: 'standard',
  SATELLITE: 'satellite',
  TERRAIN: 'terrain',
  NIGHT: 'night',
  ADVENTURE: 'adventure'
};

// Light Theme
// Color palette and semantic tokens below are mapped to 'Visual Identity System > Color Palette' in docs/BRAND_GUIDELINES.md
const lightTheme = {
  primary: '#007AFF',
  secondary: '#5856D6',
  background: '#FFFFFF',
  surface: '#F2F2F7',
  text: '#000000',
  textSecondary: '#8E8E93',
  secondaryText: '#8E8E93', // Alias for textSecondary
  border: '#C6C6C8',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#007AFF',
  swipeSave: '#4CAF50',
  swipeDismiss: '#F44336',
  tabActive: '#007AFF',
  tabInactive: '#8E8E93',
  card: '#FFFFFF',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.5)',
  pingGlow: '#007AFF',
  routeLine: 'rgba(0, 122, 255, 0.8)',
  routePreview: '#5856D6',
  spriteShadow: 'rgba(0, 0, 0, 0.3)',
  buttonPrimary: '#007AFF',
  buttonSecondary: '#F2F2F7',
  buttonText: '#FFFFFF',
  buttonTextSecondary: '#007AFF',
  inputBackground: '#F2F2F7',
  inputBorder: '#C6C6C8',
  inputText: '#000000',
  placeholder: '#8E8E93',
  switchTrack: '#E5E5EA',
  switchThumb: '#FFFFFF',
  switchActive: '#34C759',
  modalBackground: '#FFFFFF',
  modalOverlay: 'rgba(0, 0, 0, 0.5)',
  divider: '#C6C6C8',
  highlight: '#007AFF20',
  critical: '#FF3B30',
  danger: '#FF3B30',
  warning: '#FF9500',
  success: '#34C759',
  info: '#007AFF',
  onPrimary: '#FFFFFF',
  onSecondary: '#FFFFFF',
  onError: '#FFFFFF',
  
  // Legacy color mappings for backward compatibility
  routeLine: 'rgba(0, 122, 255, 0.8)',
  routePreview: '#5856D6',
  pingGlow: '#007AFF',
  spriteShadow: 'rgba(0, 0, 0, 0.3)',
  critical: '#FF3B30' // maps to error
};

// Dark Theme
// Color palette and semantic tokens below are mapped to 'Visual Identity System > Color Palette' in docs/BRAND_GUIDELINES.md
const darkTheme = {
  primary: '#0A84FF',
  secondary: '#5E5CE6',
  background: '#000000',
  surface: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  secondaryText: '#8E8E93', // Alias for textSecondary
  border: '#38383A',
  success: '#30D158',
  warning: '#FF9F0A',
  error: '#FF453A',
  info: '#0A84FF',
  swipeSave: '#30D158',
  swipeDismiss: '#FF453A',
  tabActive: '#0A84FF',
  tabInactive: '#8E8E93',
  card: '#1C1C1E',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.7)',
  pingGlow: '#0A84FF',
  routeLine: 'rgba(10, 132, 255, 0.8)',
  routePreview: '#5E5CE6',
  spriteShadow: 'rgba(0, 0, 0, 0.5)',
  buttonPrimary: '#0A84FF',
  buttonSecondary: '#1C1C1E',
  buttonText: '#FFFFFF',
  buttonTextSecondary: '#0A84FF',
  inputBackground: '#1C1C1E',
  inputBorder: '#38383A',
  inputText: '#FFFFFF',
  placeholder: '#8E8E93',
  switchTrack: '#38383A',
  switchThumb: '#FFFFFF',
  switchActive: '#30D158',
  modalBackground: '#1C1C1E',
  modalOverlay: 'rgba(0, 0, 0, 0.7)',
  divider: '#38383A',
  highlight: '#0A84FF20',
  critical: '#FF453A',
  danger: '#FF453A',
  warning: '#FF9F0A',
  success: '#30D158',
  info: '#0A84FF',
  onPrimary: '#FFFFFF',
  onSecondary: '#FFFFFF',
  onError: '#FFFFFF',
  
  // Legacy color mappings for backward compatibility  
  routeLine: 'rgba(10, 132, 255, 0.8)',
  routePreview: '#5E5CE6',
  pingGlow: '#0A84FF',
  spriteShadow: 'rgba(0, 0, 0, 0.5)',
  critical: '#FF453A' // maps to error
};

// Adventure Theme
// Color palette and semantic tokens below are mapped to 'Visual Identity System > Color Palette' in docs/BRAND_GUIDELINES.md
const adventureTheme = {
  // Brand tokens
  primary: '#4A90E2', // --color-trail-blue
  accent: '#F6AF3C', // --color-sunset-gold
  background: '#FFF7EA', // --color-paper-cream
  surface: '#F5E9D6', // Slightly darker cream for better container contrast
  progress: '#739E82', // --color-moss-sage
  navBar: '#2C5530', // --color-forest-deep
  border: '#7F8C8D', // --color-stone-gray
  overlay: 'rgba(0,0,0,0.4)', // --color-shadow-overlay
  glow: 'rgba(74,144,226,0.25)', // --color-glow-accent

  // Semantic tokens
  text: '#2C5530', // Use forest-deep for high contrast text
  textSecondary: '#739E82', // Use moss-sage for secondary text
  secondaryText: '#739E82', // Alias for textSecondary
  card: '#F5E9D6', // Slightly darker cream for better contrast
  shadow: 'rgba(0, 0, 0, 0.66)', // Slightly stronger shadow for better definition
  buttonPrimary: '#4A90E2', // --color-trail-blue
  buttonSecondary: 'rgba(245, 233, 214, 0.9)', // Semi-transparent cream background for visibility
  buttonText: '#FFFFFF', // White text for primary
  buttonTextSecondary: '#4A90E2', // Trail-blue for secondary
  disabled: '#7F8C8D', // --color-stone-gray
  disabledText: 'rgba(255,255,255,0.6)', // As per guidelines
  inputBackground: '#F5E9D6', // Darker cream for inputs
  inputBorder: '#7F8C8D', // --color-stone-gray
  inputText: '#2C5530', // forest-deep
  placeholder: '#7F8C8D', // stone-gray
  switchTrack: '#739E82', // moss-sage
  switchThumb: '#FFFFFF', // white
  switchActive: '#739E82', // moss-sage
  modalBackground: '#F5E9D6', // Darker cream for modals
  modalOverlay: 'rgba(0,0,0,0.4)', // --color-shadow-overlay
  divider: '#7F8C8D', // --color-stone-gray
  highlight: 'rgba(74,144,226,0.08)', // subtle blue highlight
  onPrimary: '#FFFFFF',
  onSecondary: '#4A90E2',
  onError: '#FFFFFF',
  // Additional tokens for map, icons, etc. can be added as needed
  
  // Backward compatibility mappings for legacy color keys
  tabActive: '#4A90E2', // maps to primary
  tabInactive: '#7F8C8D', // maps to border
  routeLine: '#4A90E2', // maps to primary
  routePreview: '#F6AF3C', // maps to accent
  success: '#739E82', // maps to progress
  info: '#4A90E2', // maps to primary
  critical: '#FF453A', // maps to error (but we should use error directly)
  pingGlow: '#4A90E2', // maps to primary
  spriteShadow: 'rgba(0,0,0,0.3)', // generic shadow
};

// Map Style Configurations
export const MAP_STYLE_CONFIGS = {
  [MAP_STYLES.STANDARD]: {
    name: 'Standard',
    description: 'Classic map view with roads and landmarks',
    icon: 'map',
    style: null // Uses default Google Maps style
  },
  [MAP_STYLES.SATELLITE]: {
    name: 'Satellite',
    description: 'Aerial view with satellite imagery',
    icon: 'satellite',
    style: [
      {
        featureType: 'all',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#7c93a3' }, { lightness: -10 }]
      },
      {
        featureType: 'all',
        elementType: 'labels.text.stroke',
        stylers: [{ color: '#ffffff' }, { lightness: 16 }]
      },
      {
        featureType: 'all',
        elementType: 'labels.icon',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'administrative',
        elementType: 'geometry.fill',
        stylers: [{ color: '#fefefe' }, { lightness: 20 }]
      },
      {
        featureType: 'administrative',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#fefefe' }, { lightness: 17 }, { weight: 1.2 }]
      },
      {
        featureType: 'landscape',
        elementType: 'geometry',
        stylers: [{ color: '#f5f5f2' }, { lightness: 20 }]
      },
      {
        featureType: 'landscape.man_made',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#f5f5f2' }, { lightness: 14 }]
      },
      {
        featureType: 'poi',
        elementType: 'geometry',
        stylers: [{ color: '#f5f5f2' }, { lightness: 21 }]
      },
      {
        featureType: 'poi.park',
        elementType: 'geometry',
        stylers: [{ color: '#dedede' }, { lightness: 21 }]
      },
      {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#ffffff' }, { lightness: 18 }]
      },
      {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [{ color: '#ffffff' }, { lightness: 17 }]
      },
      {
        featureType: 'road.highway',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#ffffff' }, { lightness: 29 }, { weight: 0.2 }]
      },
      {
        featureType: 'road.arterial',
        elementType: 'geometry',
        stylers: [{ color: '#ffffff' }, { lightness: 18 }]
      },
      {
        featureType: 'road.arterial',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#ffffff' }, { lightness: 29 }, { weight: 0.2 }]
      },
      {
        featureType: 'road.local',
        elementType: 'geometry',
        stylers: [{ color: '#ffffff' }, { lightness: 16 }]
      },
      {
        featureType: 'road.local',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#ffffff' }, { lightness: 29 }, { weight: 0.2 }]
      },
      {
        featureType: 'transit',
        elementType: 'geometry',
        stylers: [{ color: '#f2f2f2' }, { lightness: 19 }]
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#a2daf2' }, { lightness: 17 }]
      }
    ]
  },
  [MAP_STYLES.TERRAIN]: {
    name: 'Terrain',
    description: 'Topographic view with elevation details',
    icon: 'terrain',
    style: [
      {
        featureType: 'all',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#7c93a3' }, { lightness: -10 }]
      },
      {
        featureType: 'all',
        elementType: 'labels.text.stroke',
        stylers: [{ color: '#ffffff' }, { lightness: 16 }]
      },
      {
        featureType: 'all',
        elementType: 'labels.icon',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'administrative',
        elementType: 'geometry.fill',
        stylers: [{ color: '#fefefe' }, { lightness: 20 }]
      },
      {
        featureType: 'administrative',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#fefefe' }, { lightness: 17 }, { weight: 1.2 }]
      },
      {
        featureType: 'landscape',
        elementType: 'geometry',
        stylers: [{ color: '#f5f5f2' }, { lightness: 20 }]
      },
      {
        featureType: 'landscape.man_made',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#f5f5f2' }, { lightness: 14 }]
      },
      {
        featureType: 'poi',
        elementType: 'geometry',
        stylers: [{ color: '#f5f5f2' }, { lightness: 21 }]
      },
      {
        featureType: 'poi.park',
        elementType: 'geometry',
        stylers: [{ color: '#dedede' }, { lightness: 21 }]
      },
      {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#ffffff' }, { lightness: 18 }]
      },
      {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [{ color: '#ffffff' }, { lightness: 17 }]
      },
      {
        featureType: 'road.highway',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#ffffff' }, { lightness: 29 }, { weight: 0.2 }]
      },
      {
        featureType: 'road.arterial',
        elementType: 'geometry',
        stylers: [{ color: '#ffffff' }, { lightness: 18 }]
      },
      {
        featureType: 'road.arterial',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#ffffff' }, { lightness: 29 }, { weight: 0.2 }]
      },
      {
        featureType: 'road.local',
        elementType: 'geometry',
        stylers: [{ color: '#ffffff' }, { lightness: 16 }]
      },
      {
        featureType: 'road.local',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#ffffff' }, { lightness: 29 }, { weight: 0.2 }]
      },
      {
        featureType: 'transit',
        elementType: 'geometry',
        stylers: [{ color: '#f2f2f2' }, { lightness: 19 }]
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#a2daf2' }, { lightness: 17 }]
      }
    ]
  },
  [MAP_STYLES.NIGHT]: {
    name: 'Night',
    description: 'Dark theme optimized for low-light conditions',
    icon: 'nightlight',
    style: [
      {
        elementType: 'geometry',
        stylers: [{ color: '#242f3e' }]
      },
      {
        elementType: 'labels.text.fill',
        stylers: [{ color: '#746855' }]
      },
      {
        elementType: 'labels.text.stroke',
        stylers: [{ color: '#242f3e' }]
      },
      {
        featureType: 'administrative.locality',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#d59563' }]
      },
      {
        featureType: 'poi',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#d59563' }]
      },
      {
        featureType: 'poi.park',
        elementType: 'geometry',
        stylers: [{ color: '#263c3f' }]
      },
      {
        featureType: 'poi.park',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#6b9a76' }]
      },
      {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#38414e' }]
      },
      {
        featureType: 'road',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#212a37' }]
      },
      {
        featureType: 'road',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#9ca5b3' }]
      },
      {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [{ color: '#746855' }]
      },
      {
        featureType: 'road.highway',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#1f2835' }]
      },
      {
        featureType: 'road.highway',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#f3d19c' }]
      },
      {
        featureType: 'transit',
        elementType: 'geometry',
        stylers: [{ color: '#2f3948' }]
      },
      {
        featureType: 'transit.station',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#d59563' }]
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#17263c' }]
      },
      {
        featureType: 'water',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#515c6d' }]
      },
      {
        featureType: 'water',
        elementType: 'labels.text.stroke',
        stylers: [{ color: '#17263c' }]
      }
    ]
  },
  [MAP_STYLES.ADVENTURE]: {
    name: 'Adventure',
    description: 'Fantasy-inspired map style for explorers',
    icon: 'explore',
    style: [
      {
        elementType: 'geometry',
        stylers: [{ color: '#2c3e50' }]
      },
      {
        elementType: 'labels.text.fill',
        stylers: [{ color: '#ecf0f1' }]
      },
      {
        elementType: 'labels.text.stroke',
        stylers: [{ color: '#2c3e50' }]
      },
      {
        featureType: 'administrative.locality',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#f5a623' }]
      },
      {
        featureType: 'poi',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#f5a623' }]
      },
      {
        featureType: 'poi.park',
        elementType: 'geometry',
        stylers: [{ color: '#27ae60' }]
      },
      {
        featureType: 'poi.park',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#2c3e50' }]
      },
      {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#34495e' }]
      },
      {
        featureType: 'road',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#2c3e50' }]
      },
      {
        featureType: 'road',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#ecf0f1' }]
      },
      {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [{ color: '#4a90e2' }]
      },
      {
        featureType: 'road.highway',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#2c3e50' }]
      },
      {
        featureType: 'road.highway',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#ecf0f1' }]
      },
      {
        featureType: 'transit',
        elementType: 'geometry',
        stylers: [{ color: '#34495e' }]
      },
      {
        featureType: 'transit.station',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#f5a623' }]
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#3498db' }]
      },
      {
        featureType: 'water',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#ecf0f1' }]
      },
      {
        featureType: 'water',
        elementType: 'labels.text.stroke',
        stylers: [{ color: '#2c3e50' }]
      }
    ]
  }
};

// Theme selector function
export const getTheme = (themeType = THEME_TYPES.LIGHT) => {
  let result;
  switch (themeType) {
    case THEME_TYPES.DARK:
      result = darkTheme;
      break;
    case THEME_TYPES.ADVENTURE:
      result = adventureTheme;
      break;
    case THEME_TYPES.LIGHT:
    default:
      result = lightTheme;
      break;
  }
  
  return result;
};

// Fallback theme for when theme context is not ready
export const getFallbackTheme = () => {
  const fallback = {
    ...lightTheme,
    // Ensure all properties are available
    secondaryText: lightTheme.textSecondary,
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onError: '#FFFFFF'
  };
  
  return fallback;
};

// Legacy exports for backward compatibility
export const Colors = {
  ...lightTheme,
  // Ensure all properties are available for backward compatibility
  secondaryText: lightTheme.textSecondary,
  onPrimary: '#FFFFFF',
  onSecondary: '#FFFFFF',
  onError: '#FFFFFF'
};
export const Spacing = {
  xs: 4, // --space-xs
  sm: 8, // --space-sm
  md: 16, // --space-md
  lg: 24, // --space-lg
  xl: 32, // --space-xl
  cardPadding: 16, // Card padding
  headerMargin: 24, // Header margin from top
  buttonHeight: 44, // Button height
};

// Typography system below is mapped to 'Visual Identity System > Typography System' in docs/BRAND_GUIDELINES.md
export const Typography = {
  heroHeader: { fontSize: 32, fontWeight: '700', fontFamily: 'HyliaSerifBeta-Regular' }, // --text-hero-header
  sectionTitle: { fontSize: 24, fontWeight: '600', fontFamily: 'Roboto' }, // --text-section-title
  cardTitle: { fontSize: 18, fontWeight: '600', fontFamily: 'Roboto' }, // --text-card-title
  body: { fontSize: 16, fontWeight: '400', fontFamily: 'Roboto' }, // --text-body
  caption: { fontSize: 14, fontWeight: '400', fontFamily: 'Roboto' }, // --text-caption
};

// Spacing system below is mapped to 'UI Style Patterns > Spacing System' in docs/BRAND_GUIDELINES.md
export const Layout = {
  borderRadius: 8,
  borderRadiusLarge: 12,
  borderRadiusSmall: 4,
  buttonHeight: 44,
  buttonHeightSmall: 36,
  cardPadding: 16,
  screenPadding: 16,
  headerHeight: 56,
  tabBarHeight: 49,
};

// Animation configurations
export const Animation = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

// Shadow configurations
export const Shadows = {
  small: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  large: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
};
