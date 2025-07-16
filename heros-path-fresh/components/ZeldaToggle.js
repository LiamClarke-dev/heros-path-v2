/*
 * ZELDA TOGGLE COMPONENT
 * ======================
 * 
 * PURPOSE:
 * This is a themed toggle switch component that matches the "Adventure" theme styling
 * of the app. It provides a fantasy-themed alternative to standard toggle switches,
 * with custom colors, shadows, and animations that fit the medieval/adventure aesthetic.
 * Think of it as the Adventure theme's version of a standard on/off switch.
 * 
 * FUNCTIONALITY:
 * - Renders a custom-styled toggle switch with track and thumb elements
 * - Supports on/off states with smooth visual transitions
 * - Uses theme-aware colors that coordinate with the Adventure theme
 * - Includes shadows and elevation for depth and visual appeal
 * - Supports disabled state with reduced opacity
 * - Provides proper accessibility support for screen readers
 * - Uses animated positioning for the thumb element
 * 
 * WHY IT EXISTS:
 * Standard React Native switches don't match the Adventure theme's aesthetic.
 * This component provides a themed alternative that maintains the fantasy/medieval
 * look while providing standard toggle functionality. It ensures that even form
 * controls match the overall Adventure theme design language.
 * 
 * RELATIONSHIPS:
 * - Used within the Adventure theme context alongside ZeldaButton
 * - Uses ThemeContext for consistent Adventure theme coloring
 * - Complements other Zelda-themed components for cohesive theming
 * - Likely used in SettingsScreen for Adventure-themed toggle options
 * - Works with the overall theme system to provide themed form controls
 * 
 * REFERENCED BY:
 * - SettingsScreen.js (for Adventure-themed settings toggles)
 * - DiscoveryPreferencesScreen.js (potentially for themed preference toggles)
 * - Any screen that needs Adventure-themed toggle switches
 * 
 * REFERENCES:
 * - ThemeContext.js (for Adventure theme colors and styling)
 * - React Native Animated API (for smooth thumb transitions)
 * - React Native Pressable (for touch handling)
 * 
 * IMPORTANCE TO APP:
 * Medium - This component is part of the Adventure theme system that enhances
 * user engagement and app personality. While not critical for core functionality,
 * it contributes to the polished, cohesive feel of the Adventure theme. Themed
 * components help make the app feel more like an immersive experience.
 * 
 * IMPROVEMENT SUGGESTIONS:
 * 1. Add smooth animations - transition animations for state changes
 * 2. Add sound effects - satisfying toggle sounds that match the theme
 * 3. Implement custom thumb designs - medieval-styled toggle elements
 * 4. Add haptic feedback - tactile confirmation when toggling
 * 5. Create size variants - small, medium, large toggle options
 * 6. Add custom track designs - textured or styled track backgrounds
 * 7. Implement loading states - show when toggle changes are being processed
 * 8. Add icon integration - show icons in on/off states
 * 9. Create different toggle styles - various Adventure-themed designs
 * 10. Add press animations - visual feedback when thumb is pressed
 * 11. Implement gesture support - swipe to toggle functionality
 * 12. Add accessibility improvements - better voice-over descriptions
 * 13. Create toggle groups - coordinated styling for multiple toggles
 * 14. Add validation indicators - show errors or warnings with themed styling
 * 15. Consider spring animations - more natural feeling toggle movements
 */

import React from 'react';
import { Pressable, View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getFallbackTheme } from '../styles/theme';

export default function ZeldaToggle({ value, onValueChange, disabled, style, ...props }) {
  const { getCurrentThemeColors } = useTheme();
  const colors = getCurrentThemeColors() || getFallbackTheme();

  return (
    <Pressable
      onPress={() => !disabled && onValueChange && onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      style={[styles.container, style, disabled && styles.disabled]}
      {...props}
    >
      <View
        style={[
          styles.track,
          {
            backgroundColor: value ? colors.switchActive : colors.switchTrack,
            borderColor: value ? colors.primary : colors.border,
            shadowColor: value ? colors.primary : colors.border,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.thumb,
          {
            backgroundColor: value ? colors.switchThumb : colors.inputBackground,
            borderColor: value ? colors.secondary : colors.border,
            left: value ? 28 : 2,
            shadowColor: value ? colors.secondary : colors.border,
          },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 54,
    height: 32,
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 8,
  },
  track: {
    position: 'absolute',
    width: 50,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    top: 6,
    left: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  thumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    top: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 1,
  },
  disabled: {
    opacity: 0.5,
  },
}); 