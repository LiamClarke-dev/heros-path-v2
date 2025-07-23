/*
 * APP BUTTON COMPONENT (UI PRIMITIVE)
 * ===================================
 * 
 * PURPOSE:
 * This is a foundational UI primitive that provides standardized, reusable buttons
 * throughout the Hero's Path app. It ensures consistent button styling, behavior,
 * and accessibility across all screens. Think of it as the basic building block
 * for all standard buttons in the app, providing a unified design system approach.
 * 
 * FUNCTIONALITY:
 * - Renders buttons with consistent styling and theme integration
 * - Supports multiple variants: primary (main actions), secondary (alternative actions), danger (destructive actions)
 * - Handles disabled states with proper opacity and touch behavior
 * - Uses theme-aware colors that adapt to Light, Dark, and Adventure themes
 * - Provides proper accessibility support with roles and labels
 * - Supports custom styling overrides while maintaining design consistency
 * - Includes proper touch feedback with activeOpacity
 * 
 * WHY IT EXISTS:
 * The app was refactored to use shared UI primitives for consistency. Before this,
 * buttons were styled individually throughout the app, leading to inconsistencies
 * and maintenance issues. This component ensures all buttons look and behave the
 * same way, making the app feel more professional and polished.
 * 
 * RELATIONSHIPS:
 * - Used throughout the app as the standard button component
 * - Part of the shared UI component system (alongside Card, ListItem, etc.)
 * - Uses ThemeContext for consistent coloring across different app themes
 * - Works with the overall design system to provide standardized UI elements
 * - Complements other UI primitives for cohesive interface design
 * 
 * REFERENCED BY:
 * - Most screens throughout the app (SettingsScreen, MapScreen, etc.)
 * - Any component that needs standard button functionality
 * - Forms and dialogs that need consistent button styling
 * 
 * REFERENCES:
 * - ThemeContext.js (for theme-aware colors and styling)
 * - React Native TouchableOpacity (for touch handling)
 * 
 * IMPORTANCE TO APP:
 * Very High - This is a core UI primitive that affects the entire app's user
 * experience. Consistent, well-designed buttons are essential for usability
 * and making the app feel professional. Changes to this component impact
 * the entire application.
 * 
 * IMPROVEMENT SUGGESTIONS:
 * 1. Add more variants - outline, text-only, icon-only button styles
 * 2. Add size variants - small, medium, large, extra-large button sizes
 * 3. Add loading states - spinner or progress indicator support
 * 4. Add icon integration - easy way to add icons before/after text
 * 5. Implement haptic feedback - tactile confirmation for button presses
 * 6. Add press animations - scale or bounce effects for better feedback
 * 7. Add sound effects - optional audio feedback for button interactions
 * 8. Implement button groups - coordinated styling for multiple buttons
 * 9. Add validation states - error, warning, success styling variants
 * 10. Create floating action button variant - for primary screen actions
 * 11. Add gradient support - more visually appealing button backgrounds
 * 12. Implement dark mode optimizations - better contrast and visibility
 * 13. Add keyboard navigation - better support for external keyboards
 * 14. Create toggle button variant - buttons that stay pressed when active
 * 15. Add accessibility improvements - better voice-over and navigation support
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getFallbackTheme, THEME_TYPES } from '../../styles/theme';

const VARIANTS = {
  primary: (colors) => ({
    backgroundColor: colors.primary,
    color: colors.onPrimary,
    borderColor: colors.primary,
    borderWidth: 1,
  }),
  secondary: (colors, currentTheme) => ({
    backgroundColor: currentTheme === THEME_TYPES.ADVENTURE ? 'transparent' : colors.surface,
    color: colors.primary,
    borderColor: colors.primary,
    borderWidth: 1,
  }),
  danger: (colors) => ({
    backgroundColor: colors.error,
    color: colors.onError,
    borderColor: colors.error,
    borderWidth: 1,
  }),
};

export default function AppButton({
  title,
  onPress,
  variant = 'primary',
  style,
  textStyle,
  disabled,
  ...props
}) {
  const { getCurrentThemeColors, currentTheme } = useTheme();
  const colors = getCurrentThemeColors() || getFallbackTheme();
  const variantStyles = VARIANTS[variant] ? VARIANTS[variant](colors, currentTheme) : VARIANTS.primary(colors, currentTheme);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { 
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
          borderWidth: variantStyles.borderWidth,
          opacity: disabled ? 0.5 : 1 
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessible
      accessibilityRole="button"
      {...props}
    >
      <Text style={[styles.text, { color: variantStyles.color }, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginVertical: 4,
    // Add subtle shadow for better focus visibility
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 