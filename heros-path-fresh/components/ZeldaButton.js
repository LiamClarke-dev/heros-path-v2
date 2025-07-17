/*
 * ZELDA BUTTON COMPONENT
 * ======================
 * 
 * PURPOSE:
 * This is a themed button component that creates buttons styled to match the "Adventure"
 * theme of the app, which takes inspiration from the Legend of Zelda games. It provides
 * a fantasy-themed, medieval-looking button with decorative corners and special styling
 * that gives the app a unique, game-like personality when users choose the Adventure theme.
 * 
 * FUNCTIONALITY:
 * - Renders a pressable button with fantasy/medieval styling
 * - Shows decorative corner elements when button is selected/active
 * - Supports selected and disabled states with different visual styles
 * - Uses theme-aware colors that integrate with the app's theme system
 * - Includes drop shadows and elevation for depth and visual hierarchy
 * - Supports custom styling overrides and accessibility features
 * - Uses Roboto-MediumItalic font for thematic consistency
 * 
 * WHY IT EXISTS:
 * The Hero's Path app includes an "Adventure" theme that transforms the UI to feel
 * more like a fantasy adventure game. This component is part of that theming system,
 * providing buttons that match the adventure aesthetic. It helps make the app feel
 * more like an engaging game rather than just a utility app.
 * 
 * RELATIONSHIPS:
 * - Used within the Adventure theme context, particularly on themed screens
 * - Uses ThemeContext for color coordination with the overall app theme
 * - Works with the theme system to provide consistent Adventure-style buttons
 * - Likely used by SettingsScreen when Adventure theme is selected
 * - Complements other Zelda-themed components like ZeldaToggle
 * 
 * REFERENCED BY:
 * - SettingsScreen.js (when Adventure theme is active)
 * - Any screen that needs Adventure-themed button styling
 * - Theme selection interfaces
 * 
 * REFERENCES:
 * - ThemeContext.js (for theme-aware styling and colors)
 * - Corner.svg (decorative corner graphics)
 * - SafeAreaView (for proper layout handling)
 * 
 * IMPORTANCE TO APP:
 * Medium - This component is important for the app's personality and user engagement
 * through theming, but not critical for core functionality. It helps differentiate
 * the app and makes the Adventure theme feel cohesive and polished. Good theming
 * can significantly improve user engagement and app memorability.
 * 
 * IMPROVEMENT SUGGESTIONS:
 * 1. Add press animations - bouncy or scale effects when pressed
 * 2. Add sound effects - authentic medieval/fantasy button sounds
 * 3. Implement loading states - spinner or progress indicators with theme styling
 * 4. Add more visual states - hover, focus, and active state improvements
 * 5. Create size variants - small, medium, large button options
 * 6. Add icon support - integrate icons that match the fantasy theme
 * 7. Implement gradient backgrounds - more realistic medieval button appearance
 * 8. Add texture overlays - stone, wood, or metal textures for authenticity
 * 9. Create button variants - different styles for different actions (primary, secondary, danger)
 * 10. Add haptic feedback - subtle vibration that feels like pressing physical buttons
 * 11. Implement theme transitions - smooth animation when switching to/from Adventure theme
 * 12. Add custom corner graphics - more variety in decorative elements
 * 13. Consider dark/light variants - Adventure theme with different lighting
 * 14. Add accessibility improvements - better support for screen readers and navigation
 * 15. Create button groups - coordinated styling for multiple buttons together
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Corner from '../assets/Corner.svg';
import { useTheme } from '../contexts/ThemeContext';
import { getFallbackTheme } from '../styles/theme';

export default function ZeldaButton({ onPress, children, disabled, selected, style, ...props }) {
  const { getCurrentThemeColors } = useTheme();
  const colors = getCurrentThemeColors() || getFallbackTheme();
  
  // Zelda-specific palette with theme integration - moved inside component
  const colorGray200 = selected ? colors.surface : colors.surface + '99'; // 60% opacity
  const colorGray100 = colors.surface;
  const colorGainsboro200 = colors.border + '4D'; // 30% opacity
  const colorGainsboro100 = colors.border;
  const colorDimgray = colors.secondaryText;
  const colorBeige = colors.primary + 'CC'; // 80% opacity

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      style={[
        styles.button,
        {
          backgroundColor: selected ? colorGray100 : colorGray200,
          borderColor: selected ? colorGainsboro100 : colorGainsboro200,
          shadowColor: selected ? colorBeige : 'transparent',
          shadowOpacity: selected ? 1 : 0,
          shadowRadius: selected ? 8 : 0,
          elevation: selected ? 8 : 0,
        },
        disabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      {...props}
    >
      <View style={styles.bgContainer}>
        <View style={[
          styles.background,
          selected ? styles.backgroundSelected : styles.backgroundUnselected,
          { 
            borderColor: selected ? colorGainsboro100 : colorGainsboro200,
            backgroundColor: selected ? colors.overlay : colors.overlay + '99', // 60% opacity for unselected
          },
        ]} />
        {selected && (
          <>
            <Corner style={[styles.cornerIcon, styles.cornerTopRight]} width={12} height={12} />
            <Corner style={[styles.cornerIcon, styles.cornerTopLeft]} width={12} height={12} />
            <Corner style={[styles.cornerIcon, styles.cornerBottomLeft]} width={12} height={12} />
            <Corner style={[styles.cornerIcon, styles.cornerBottomRight]} width={12} height={12} />
          </>
        )}
        <Text
          style={[
            styles.buttonText,
            {
              color: colors.text,
              fontFamily: 'Roboto-MediumItalic',
            },
          ]}
        >
          {children}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 75,
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
    marginHorizontal: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    position: 'relative',
    overflow: 'visible',
  },
  bgContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  background: {
    position: 'absolute',
    top: 3,
    right: 3,
    bottom: 3,
    left: 3,
    borderRadius: 2,
    borderWidth: 1,
  },
  backgroundSelected: {
    backgroundColor: 'transparent', // Will use theme overlay dynamically
  },
  backgroundUnselected: {
    backgroundColor: 'transparent', // Will use theme overlay dynamically
  },
  buttonText: {
    fontSize: 30,
    fontStyle: 'italic',
    fontWeight: '500',
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    width: 392,
    height: 44,
    position: 'absolute',
    top: 16,
    left: 4,
  },
  cornerIcon: {
    position: 'absolute',
    width: 12,
    height: 12,
  },
  cornerTopRight: {
    right: 0,
    top: 0,
  },
  cornerTopLeft: {
    left: 0,
    top: 0,
  },
  cornerBottomLeft: {
    left: 0,
    bottom: 0,
  },
  cornerBottomRight: {
    right: 0,
    bottom: 0,
  },
  disabled: {
    opacity: 0.5,
  },
}); 