/*
 * THEME SYSTEM (COMPLETE UI & MAP STYLING)
 * =========================================
 * 
 * PURPOSE:
 * This is the comprehensive theming system for Hero's Path that defines all colors,
 * styling, and visual appearance across the entire app. It provides three distinct
 * UI themes (Light, Dark, Adventure) and five map styles, enabling users to fully
 * customize their visual experience. Think of it as the visual DNA of the app that
 * determines how everything looks and feels.
 * 
 * FUNCTIONALITY:
 * - Defines three complete UI themes with 30+ color variables each
 * - Provides five Google Maps custom styling configurations
 * - Includes comprehensive color palettes for all UI elements
 * - Supports theme switching with consistent styling across components
 * - Provides fallback themes for error recovery
 * - Includes legacy export support for backward compatibility
 * - Defines typography, spacing, and layout constants
 * - Provides shadow and elevation styling for depth and hierarchy
 * - Includes specialized colors for features like ping animations and route lines
 * - Supports theme-aware component styling throughout the app
 * 
 * WHY IT EXISTS:
 * Modern mobile apps require consistent theming and personalization options. Users
 * expect dark mode, custom styling, and visual preferences. This system ensures
 * every component uses consistent colors while providing the flexibility for users
 * to choose their preferred visual experience. The Adventure theme gives Hero's Path
 * its unique personality that differentiates it from other walking apps.
 * 
 * KEY FEATURES:
 * - Three UI Themes:
 *   • Light: Clean, modern iOS-style interface with bright colors
 *   • Dark: Battery-efficient dark mode with high contrast
 *   • Adventure: Fantasy-inspired Zelda-like theme with warm, medieval colors
 * 
 * - Five Map Styles:
 *   • Standard: Classic Google Maps view with roads and landmarks
 *   • Satellite: Aerial view with satellite imagery and labels
 *   • Terrain: Topographic view with elevation details and natural features
 *   • Night: Dark theme optimized for low-light conditions
 *   • Adventure: Fantasy-inspired map style for explorers
 * 
 * - Complete Color System: 30+ semantic color definitions for every UI element
 * - Typography System: Font sizes, weights, and spacing for consistent text
 * - Layout System: Spacing, margins, and padding constants
 * - Shadow System: Elevation and depth styling for visual hierarchy
 * 
 * RELATIONSHIPS:
 * - Used by ThemeContext.js for theme management and switching
 * - Provides colors to all UI components (AppButton, Card, ListItem, etc.)
 * - Integrates with Google Maps for custom map styling
 * - Works with React Navigation for consistent navigation theming
 * - Used by specialized components like ZeldaButton and ZeldaToggle
 * - Provides styling constants for layouts and spacing throughout the app
 * 
 * REFERENCED BY:
 * - ThemeContext.js (for theme management and color access)
 * - All UI components that need consistent styling
 * - MapScreen.js (for custom map styles)
 * - Navigation components (for consistent navigation styling)
 * - Specialized theme components (ZeldaButton, ZeldaToggle, etc.)
 * - Any component that uses colors, spacing, or typography
 * 
 * REFERENCES:
 * - Google Maps JavaScript API (for custom map styling)
 * - React Native styling system
 * - iOS and Android design guidelines
 * - Accessibility standards for color contrast
 * 
 * IMPORTANCE TO APP:
 * CRITICAL - This is one of the most important files in the entire app. It defines
 * the visual identity and user experience of Hero's Path. Every single visual element
 * users see is influenced by this theming system. The quality of theming directly
 * impacts user perception of app quality and professionalism. The Adventure theme
 * is a key differentiator that gives Hero's Path its unique personality.
 * 
 * IMPROVEMENT SUGGESTIONS:
 * 1. Add automatic theme switching - switch themes based on time of day or location
 * 2. Add custom theme creation - let users create and save their own color schemes
 * 3. Add seasonal themes - special themes for holidays, seasons, or events
 * 4. Add accessibility themes - high contrast and color-blind friendly options
 * 5. Add theme animation - smooth transitions when switching between themes
 * 6. Add theme sharing - export and import custom themes between users
 * 7. Add adaptive themes - themes that adjust based on content or context
 * 8. Add theme analytics - track which themes are most popular
 * 9. Add theme A/B testing - test different color schemes for optimization
 * 10. Add dynamic themes - themes that change based on user activity or mood
 * 11. Add gradient themes - support for gradient backgrounds and elements
 * 12. Add texture themes - add subtle textures and patterns to themes
 * 13. Add brand themes - themes that match user's favorite brands or teams
 * 14. Add location themes - themes that match the user's current environment
 * 15. Add theme presets - quick theme switching for different activities
 * 16. Add theme inheritance - base themes with customizable overrides
 * 17. Add theme validation - ensure theme colors meet accessibility guidelines
 * 18. Add theme optimization - optimize themes for different device types
 * 19. Add theme backup - cloud backup and sync of custom themes
 * 20. Add theme AI - AI-powered theme suggestions based on user preferences
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

// Adventure Theme (Zelda-inspired)
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
  if (__DEV__) {
    console.debug('[THEME]', 'getTheme called', { themeType, availableTypes: Object.values(THEME_TYPES) });
  }
  
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
  
  if (__DEV__) {
    console.debug('[THEME]', 'getTheme result', { 
      themeType, 
      resultExists: !!result, 
      resultKeys: result ? Object.keys(result) : null 
    });
  }
  
  return result;
};

// Fallback theme for when theme context is not ready
export const getFallbackTheme = () => {
  if (__DEV__) {
    console.debug('[THEME]', 'getFallbackTheme called');
  }
  
  const fallback = {
    ...lightTheme,
    // Ensure all properties are available
    secondaryText: lightTheme.textSecondary,
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onError: '#FFFFFF'
  };
  
  if (__DEV__) {
    console.debug('[THEME]', 'getFallbackTheme result', { 
      fallbackExists: !!fallback, 
      fallbackKeys: fallback ? Object.keys(fallback) : null 
    });
  }
  
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
