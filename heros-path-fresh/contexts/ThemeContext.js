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
    Logger.debug('THEME_CONTEXT', 'loadSavedPreferences started');
    try {
      const [savedTheme, savedMapStyle] = await Promise.all([
        AsyncStorage.getItem(THEME_STORAGE_KEY),
        AsyncStorage.getItem(MAP_STYLE_STORAGE_KEY)
      ]);

      Logger.debug('THEME_CONTEXT', 'AsyncStorage results', { savedTheme, savedMapStyle });

      if (savedTheme && Object.values(THEME_TYPES).includes(savedTheme)) {
        Logger.debug('THEME_CONTEXT', 'Setting saved theme', { savedTheme });
        setCurrentTheme(savedTheme);
      } else {
        Logger.debug('THEME_CONTEXT', 'Using default theme', { defaultTheme: DEFAULT_THEME });
        setCurrentTheme(DEFAULT_THEME);
      }

      if (savedMapStyle && Object.values(MAP_STYLES).includes(savedMapStyle)) {
        Logger.debug('THEME_CONTEXT', 'Setting saved map style', { savedMapStyle });
        setCurrentMapStyle(savedMapStyle);
      } else {
        Logger.debug('THEME_CONTEXT', 'Using default map style', { defaultMapStyle: DEFAULT_MAP_STYLE });
        setCurrentMapStyle(DEFAULT_MAP_STYLE);
      }
    } catch (error) {
      Logger.error('THEME_CONTEXT', 'Error loading theme preferences', error);
    } finally {
      Logger.debug('THEME_CONTEXT', 'loadSavedPreferences completed, setting isLoading to false');
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
    Logger.debug('THEME_CONTEXT', 'getCurrentThemeColors called', { currentTheme, isLoading });
    
    const theme = getTheme(currentTheme);
    Logger.debug('THEME_CONTEXT', 'getTheme result', { currentTheme, themeExists: !!theme, themeKeys: theme ? Object.keys(theme) : null });
    
    if (!theme) {
      Logger.warn('THEME_CONTEXT', 'Theme not found, using fallback', { currentTheme });
      // Fallback to light theme if something goes wrong
      return getFallbackTheme();
    }
    
    Logger.debug('THEME_CONTEXT', 'Returning theme colors', { themeType: currentTheme, hasColors: !!theme });
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
    Logger.debug('THEME_CONTEXT', 'getNavigationTheme called', { currentTheme, isLoading });
    
    const colors = getCurrentThemeColors();
    Logger.debug('THEME_CONTEXT', 'getNavigationTheme colors result', { 
      colorsExists: !!colors, 
      colorsType: typeof colors, 
      colorsKeys: colors ? Object.keys(colors) : null 
    });
    
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
  Logger.debug('THEME_CONTEXT', 'useTheme hook called', { 
    hasContext: !!context, 
    contextKeys: context ? Object.keys(context) : null 
  });
  
  if (!context) {
    Logger.error('THEME_CONTEXT', 'useTheme called outside ThemeProvider');
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Export context for direct access if needed
export default ThemeContext; 