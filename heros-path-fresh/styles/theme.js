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
  onError: '#FFFFFF'
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
  onError: '#FFFFFF'
};

// Adventure Theme
// Color palette and semantic tokens below are mapped to 'Visual Identity System > Color Palette' in docs/BRAND_GUIDELINES.md
const adventureTheme = {
  primary: '#4A90E2',
  secondary: '#F5A623',
  background: '#2C3E50',
  surface: '#34495E',
  text: '#ECF0F1',
  textSecondary: '#BDC3C7',
  secondaryText: '#BDC3C7', // Alias for textSecondary
  border: '#7F8C8D',
  success: '#27AE60',
  warning: '#F39C12',
  error: '#E74C3C',
  info: '#3498DB',
  swipeSave: '#27AE60',
  swipeDismiss: '#E74C3C',
  tabActive: '#4A90E2',
  tabInactive: '#BDC3C7',
  card: '#34495E',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.6)',
  pingGlow: '#F5A623',
  routeLine: 'rgba(74, 144, 226, 0.8)',
  routePreview: '#F5A623',
  spriteShadow: 'rgba(0, 0, 0, 0.4)',
  buttonPrimary: '#4A90E2',
  buttonSecondary: '#34495E',
  buttonText: '#ECF0F1',
  buttonTextSecondary: '#4A90E2',
  inputBackground: '#34495E',
  inputBorder: '#7F8C8D',
  inputText: '#ECF0F1',
  placeholder: '#BDC3C7',
  switchTrack: '#7F8C8D',
  switchThumb: '#ECF0F1',
  switchActive: '#27AE60',
  modalBackground: '#34495E',
  modalOverlay: 'rgba(0, 0, 0, 0.6)',
  divider: '#7F8C8D',
  highlight: '#4A90E220',
  critical: '#E74C3C',
  danger: '#E74C3C',
  warning: '#F39C12',
  success: '#27AE60',
  info: '#3498DB',
  onPrimary: '#FFFFFF',
  onSecondary: '#FFFFFF',
  onError: '#FFFFFF'
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
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Typography system below is mapped to 'Visual Identity System > Typography System' in docs/BRAND_GUIDELINES.md
export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' },
  h2: { fontSize: 24, fontWeight: '600' },
  h3: { fontSize: 20, fontWeight: '600' },
  h4: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400' },
  bodySmall: { fontSize: 14, fontWeight: '400' },
  caption: { fontSize: 12, fontWeight: '400' },
  button: { fontSize: 16, fontWeight: '600' },
  bold: { fontWeight: 'bold' }, // Added for compatibility
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

// ---------------------------------------------------------------------------
// GLOBAL FALLBACK
// Ensure `global.colors` always exists (Hermes will crash if any file references
// `colors` at module scope before ThemeContext is ready). We attach a fallback
// *once* when this theme file is first imported.
// ---------------------------------------------------------------------------
if (typeof globalThis !== 'undefined' && !globalThis.colors) {
  // Provide the light theme as a safe default — components will still override
  // it with ThemeContext once they mount.
  // eslint-disable-next-line no-undef
  globalThis.colors = getFallbackTheme();
}
