/*
 * THEME CONTEXT
 * =============
 * 
 * PURPOSE:
 * This React Context manages the entire theming system for Hero's Path, including
 * both UI themes (Light, Dark, Adventure) and map styles (Standard, Satellite, Terrain,
 * Night, Adventure). It provides centralized theme management, persistent user preferences,
 * and seamless theme switching throughout the app. Think of it as the style engine
 * that makes the app look consistent and allows users to personalize their experience.
 * 
 * FUNCTIONALITY:
 * - Manages three UI themes: Light (iOS-style), Dark (battery-friendly), Adventure (Zelda-inspired)
 * - Manages five map styles: Standard, Satellite, Terrain, Night, and Adventure
 * - Persists user preferences to AsyncStorage for consistent experience across sessions
 * - Provides theme-aware color palettes with 30+ color variables per theme
 * - Supplies Google Maps styling configurations for custom map appearances
 * - Offers React Navigation theme integration for consistent navigation styling
 * - Handles theme loading states and fallback mechanisms for error recovery
 * - Provides reset functionality to return to default settings
 * 
 * WHY IT EXISTS:
 * Modern mobile apps need consistent theming and personalization options. Users expect
 * dark mode, map customization, and visual preferences. This context ensures every
 * component uses the same color scheme and provides a unified way to change themes
 * throughout the app. It also enables the unique Adventure theme that gives Hero's
 * Path its distinctive personality.
 * 
 * RELATIONSHIPS:
 * - Used by virtually every UI component in the app for consistent styling
 * - Provides colors and styling to all shared UI primitives (AppButton, Card, etc.)
 * - Integrates with Google Maps for custom map styling
 * - Works with React Navigation for consistent navigation theming
 * - Connected to SettingsScreen for user preference management
 * - Used by specialized components like ZeldaButton and ZeldaToggle for Adventure theme
 * 
 * REFERENCED BY:
 * - All UI components (AppButton, Card, ListItem, SectionHeader, Divider, etc.)
 * - All screen components (MapScreen, SettingsScreen, DiscoveriesScreen, etc.)
 * - Specialized theme components (ZeldaButton, ZeldaToggle, etc.)
 * - Navigation system (App.js) for consistent navigation styling
 * - Any component that needs theme-aware colors or styling
 * 
 * REFERENCES:
 * - styles/theme.js (theme definitions and configurations)
 * - AsyncStorage (for persistent preference storage)
 * - Logger utility (for debugging and error tracking)
 * - React Context API (for state management)
 * 
 * IMPORTANCE TO APP:
 * Critical - This is one of the most important contexts in the app. It affects
 * the visual appearance of every single component and screen. The theming system
 * is essential for user experience, accessibility (dark mode), and the app's
 * unique personality (Adventure theme). Poor theming would make the app look
 * unprofessional and inconsistent.
 * 
 * IMPROVEMENT SUGGESTIONS:
 * 1. Add automatic theme switching - switch to dark mode based on time of day
 * 2. Add system theme detection - follow device dark/light mode preferences
 * 3. Add custom theme creation - let users create their own color schemes
 * 4. Add accessibility improvements - high contrast themes for vision impairment
 * 5. Add seasonal themes - special themes for holidays or seasons
 * 6. Add location-based themes - themes that match the current environment
 * 7. Add theme animations - smooth transitions when switching themes
 * 8. Add theme previews - let users preview themes before applying them
 * 9. Add color customization - fine-tune individual colors within themes
 * 10. Add font theming - different typography options for themes
 * 11. Add theme sharing - export/import custom themes between users
 * 12. Add dynamic themes - themes that change based on activity or time
 * 13. Add theme analytics - track which themes are most popular
 * 14. Add better error handling - more robust fallback mechanisms
 * 15. Add theme validation - ensure theme data integrity and format
 * 16. Add performance optimization - lazy loading of theme configurations
 * 17. Add theme caching - better performance for theme switching
 * 18. Add accessibility compliance - ensure all themes meet WCAG guidelines
 */

// contexts/ThemeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEME_TYPES, MAP_STYLES, getTheme, MAP_STYLE_CONFIGS, getFallbackTheme } from '../styles/theme';
import Logger from '../utils/Logger';

// Storage keys
const THEME_STORAGE_KEY = '@user_ui_theme';
const MAP_STYLE_STORAGE_KEY = '@user_map_style';

// Default values
const DEFAULT_THEME = THEME_TYPES.LIGHT;
const DEFAULT_MAP_STYLE = MAP_STYLES.STANDARD;

// Create context
const ThemeContext = createContext();

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(DEFAULT_THEME);
  const [currentMapStyle, setCurrentMapStyle] = useState(DEFAULT_MAP_STYLE);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme and map style on mount
  useEffect(() => {
    loadSavedPreferences();
  }, []);

  // Load saved preferences from AsyncStorage
  const loadSavedPreferences = async () => {
    try {
      const [savedTheme, savedMapStyle] = await Promise.all([
        AsyncStorage.getItem(THEME_STORAGE_KEY),
        AsyncStorage.getItem(MAP_STYLE_STORAGE_KEY)
      ]);

      if (savedTheme && Object.values(THEME_TYPES).includes(savedTheme)) {
        setCurrentTheme(savedTheme);
      } else {
        setCurrentTheme(DEFAULT_THEME);
      }

      if (savedMapStyle && Object.values(MAP_STYLES).includes(savedMapStyle)) {
        setCurrentMapStyle(savedMapStyle);
      } else {
        setCurrentMapStyle(DEFAULT_MAP_STYLE);
      }
    } catch (error) {
      Logger.error('THEME_CONTEXT', 'Error loading theme preferences', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Change UI theme
  const changeTheme = async (themeType) => {
    if (!Object.values(THEME_TYPES).includes(themeType)) {
      console.error('Invalid theme type:', themeType);
      return;
    }

    try {
      setCurrentTheme(themeType);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, themeType);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Change map style
  const changeMapStyle = async (mapStyle) => {
    if (!Object.values(MAP_STYLES).includes(mapStyle)) {
      console.error('Invalid map style:', mapStyle);
      return;
    }

    try {
      setCurrentMapStyle(mapStyle);
      await AsyncStorage.setItem(MAP_STYLE_STORAGE_KEY, mapStyle);
    } catch (error) {
      console.error('Error saving map style preference:', error);
    }
  };

  // Get current theme colors
  const getCurrentThemeColors = () => {
    
    const theme = getTheme(currentTheme);
    
    if (!theme) {
      Logger.warn('THEME_CONTEXT', 'Theme not found, using fallback', { currentTheme });
      // Fallback to light theme if something goes wrong
      return getFallbackTheme();
    }
    
    return theme;
  };

  // Get current map style configuration
  const getCurrentMapStyleConfig = () => {
    return MAP_STYLE_CONFIGS[currentMapStyle];
  };

  // Get current map style array for Google Maps
  const getCurrentMapStyleArray = () => {
    const config = getCurrentMapStyleConfig();
    return config?.style || null;
  };

  // Reset to defaults
  const resetToDefaults = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(THEME_STORAGE_KEY),
        AsyncStorage.removeItem(MAP_STYLE_STORAGE_KEY)
      ]);
      setCurrentTheme(DEFAULT_THEME);
      setCurrentMapStyle(DEFAULT_MAP_STYLE);
    } catch (error) {
      console.error('Error resetting theme preferences:', error);
    }
  };

  // Add this function to the ThemeContext value
  function getNavigationTheme() {
    
    const colors = getCurrentThemeColors();
    
    if (!colors) {
      Logger.warn('THEME_CONTEXT', 'Colors not found in getNavigationTheme, using fallback');
      // Fallback to light theme colors
      const fallbackColors = getFallbackTheme();
      return {
        dark: false,
        colors: {
          primary: fallbackColors.primary,
          background: fallbackColors.background,
          card: fallbackColors.surface || fallbackColors.background,
          text: fallbackColors.text,
          border: fallbackColors.border || fallbackColors.primary,
          notification: fallbackColors.primary,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          light: { fontFamily: 'System', fontWeight: '300' },
          thin: { fontFamily: 'System', fontWeight: '100' },
          bold: { fontFamily: 'System', fontWeight: 'bold' },
        },
      };
    }
    return {
      dark: currentTheme === THEME_TYPES.DARK || currentTheme === THEME_TYPES.ADVENTURE,
      colors: {
        primary: colors.primary,
        background: colors.background,
        card: colors.surface || colors.background,
        text: colors.text,
        border: colors.border || colors.primary,
        notification: colors.primary,
      },
      fonts: {
        regular: { fontFamily: 'System', fontWeight: '400' },
        medium: { fontFamily: 'System', fontWeight: '500' },
        light: { fontFamily: 'System', fontWeight: '300' },
        thin: { fontFamily: 'System', fontWeight: '100' },
        bold: { fontFamily: 'System', fontWeight: 'bold' },
      },
    };
  }

  // Context value
  const value = {
    // Current state
    currentTheme,
    currentMapStyle,
    isLoading,
    
    // Theme functions
    changeTheme,
    changeMapStyle,
    getCurrentThemeColors,
    getCurrentMapStyleConfig,
    getCurrentMapStyleArray,
    resetToDefaults,
    getNavigationTheme,
    
    // Available options
    availableThemes: Object.values(THEME_TYPES),
    availableMapStyles: Object.values(MAP_STYLES),
    themeTypes: THEME_TYPES,
    mapStyles: MAP_STYLES,
    mapStyleConfigs: MAP_STYLE_CONFIGS,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    Logger.error('THEME_CONTEXT', 'useTheme called outside ThemeProvider');
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Export context for direct access if needed
export default ThemeContext; 