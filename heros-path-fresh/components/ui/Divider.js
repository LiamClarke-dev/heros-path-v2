/*
 * DIVIDER COMPONENT (UI PRIMITIVE)
 * =================================
 * 
 * PURPOSE:
 * This is a simple UI primitive that creates visual separation between sections
 * of content. It renders a thin horizontal line that helps organize information
 * and create visual hierarchy on screens. Think of it as a way to break up content
 * without adding too much visual weight, making screens easier to scan and read.
 * 
 * FUNCTIONALITY:
 * - Renders a thin horizontal line with theme-aware coloring
 * - Uses hairline width for consistent, subtle appearance across devices
 * - Adapts to different themes (Light, Dark, Adventure) with appropriate colors
 * - Includes standard vertical margins for proper spacing
 * - Supports custom styling overrides for special cases
 * - Uses accessibility role "none" as it's purely decorative
 * 
 * WHY IT EXISTS:
 * Proper visual separation is crucial for readable, organized interfaces. Without
 * dividers, content can feel cramped or unclear. This component provides consistent
 * separation throughout the app, ensuring that sections are clearly distinguished
 * while maintaining the overall design system's aesthetic.
 * 
 * RELATIONSHIPS:
 * - Used throughout the app to separate content sections
 * - Part of the shared UI component system (alongside Card, ListItem, etc.)
 * - Uses ThemeContext for theme-aware border colors
 * - Often used within Cards or between ListItems
 * - Works with the overall design system to provide structured layouts
 * 
 * REFERENCED BY:
 * - SettingsScreen.js (to separate settings sections)
 * - List-based screens (to separate list items)
 * - Modal dialogs (to separate content areas)
 * - Any screen that needs visual content separation
 * 
 * REFERENCES:
 * - ThemeContext.js (for theme-aware divider colors)
 * - React Native View (for line rendering)
 * - StyleSheet.hairlineWidth (for consistent thin lines)
 * 
 * IMPORTANCE TO APP:
 * Medium - While simple, this component is important for visual organization
 * and readability. Well-placed dividers make complex screens easier to navigate
 * and understand. Poor or inconsistent dividers can make an app feel cluttered
 * or unprofessional.
 * 
 * IMPROVEMENT SUGGESTIONS:
 * 1. Add thickness variants - thin, medium, thick divider options
 * 2. Add color variants - different colors for emphasis or categorization
 * 3. Add gradient dividers - more visually interesting separation lines
 * 4. Implement vertical dividers - for side-by-side content separation
 * 5. Add text integration - dividers with centered text labels
 * 6. Create dotted/dashed styles - different line patterns for variety
 * 7. Add animation support - fade-in or slide-in effects for dynamic content
 * 8. Implement spacing variants - different margin options for various use cases
 * 9. Add icon integration - dividers with small icons or symbols
 * 10. Create section dividers - larger, more prominent dividers for major sections
 * 11. Add responsive sizing - dividers that adapt to screen size and orientation
 * 12. Implement smart spacing - automatic spacing based on surrounding content
 * 13. Add glow effects - subtle lighting effects for the Adventure theme
 * 14. Create branded dividers - dividers with app-specific styling or patterns
 * 15. Add accessibility improvements - better screen reader handling
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export default function Divider({ style, ...props }) {
  const { getCurrentThemeColors } = useTheme();
  const colors = getCurrentThemeColors();
  return (
    <View
      style={[
        styles.divider,
        { backgroundColor: colors.divider },
        style,
      ]}
      accessibilityRole="none"
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
    marginVertical: 8,
  },
}); 