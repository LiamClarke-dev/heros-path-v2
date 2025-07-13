// contexts/ThemeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEME_TYPES, MAP_STYLES, getTheme, MAP_STYLE_CONFIGS } from '../styles/theme';

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
      }

      if (savedMapStyle && Object.values(MAP_STYLES).includes(savedMapStyle)) {
        setCurrentMapStyle(savedMapStyle);
      }
    } catch (error) {
      console.error('Error loading theme preferences:', error);
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
    return getTheme(currentTheme);
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
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Export context for direct access if needed
export default ThemeContext; 