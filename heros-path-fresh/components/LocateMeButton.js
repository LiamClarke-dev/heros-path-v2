/*
 * LOCATE ME BUTTON
 * ===============
 * 
 * PURPOSE:
 * This component provides a UI button for centering the map on the user's current location.
 * It includes visual feedback during location acquisition and handles error states.
 * 
 * FUNCTIONALITY:
 * - Displays a button with appropriate icon for location centering
 * - Shows loading indicator during location acquisition
 * - Handles error states with visual feedback
 * - Provides callback for location centering action
 * 
 * WHY IT EXISTS:
 * Location centering is a common map interaction that users expect. This component
 * encapsulates that functionality with proper visual feedback and error handling
 * for a consistent user experience across the app.
 */

import React from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Shadows } from '../styles/theme';

/**
 * Button component for centering the map on user's current location
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onPress - Callback function when button is pressed
 * @param {boolean} props.isLocating - Whether location is currently being acquired
 * @param {boolean} props.hasError - Whether there was an error getting location
 * @param {Object} props.style - Additional styles for the button
 */
const LocateMeButton = ({ onPress, isLocating = false, hasError = false, style }) => {
  const { getCurrentThemeColors } = useTheme();
  const colors = getCurrentThemeColors();

  // Determine the icon based on state
  const getIcon = () => {
    if (isLocating) {
      return <ActivityIndicator size="small" color={colors.primary} />;
    }
    
    if (hasError) {
      return <MaterialIcons name="gps-off" size={24} color={colors.error} />;
    }
    
    return <MaterialIcons name="my-location" size={24} color={colors.primary} />;
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: colors.buttonSecondary },
        isLocating && styles.locating,
        hasError && styles.error,
        style
      ]}
      onPress={onPress}
      disabled={isLocating}
    >
      {getIcon()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
  },
  locating: {
    opacity: 0.8,
  },
  error: {
    borderWidth: 1,
    borderColor: 'red',
  }
});

export default LocateMeButton;