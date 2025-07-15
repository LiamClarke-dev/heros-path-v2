/*
 * CARD COMPONENT (UI PRIMITIVE)
 * ==============================
 * 
 * PURPOSE:
 * This is a foundational UI primitive that provides standardized card containers
 * throughout the Hero's Path app. Cards are used to group related content and
 * create visual hierarchy on screens. Think of it as a building block that wraps
 * content with consistent padding, shadows, and background colors to make information
 * feel organized and easy to scan.
 * 
 * FUNCTIONALITY:
 * - Renders a container with consistent rounded corners and shadows
 * - Uses theme-aware background colors that adapt to Light, Dark, and Adventure themes
 * - Provides standard padding and margins for consistent spacing
 * - Includes subtle shadows for depth and visual separation
 * - Supports custom styling overrides while maintaining design consistency
 * - Provides proper accessibility support with summary role for screen readers
 * 
 * WHY IT EXISTS:
 * The app was refactored to use shared UI primitives for consistency. Cards help
 * organize content visually and make screens easier to read and navigate. Without
 * consistent card styling, screens would look chaotic and unprofessional. Cards
 * create the visual structure that makes the app feel organized and polished.
 * 
 * RELATIONSHIPS:
 * - Used throughout the app to group related content (settings sections, journey info, etc.)
 * - Part of the shared UI component system (alongside AppButton, ListItem, etc.)
 * - Uses ThemeContext for consistent styling across different app themes
 * - Often contains other UI primitives like ListItem and AppButton
 * - Works with the overall design system to provide structured layouts
 * 
 * REFERENCED BY:
 * - SettingsScreen.js (for grouping settings sections)
 * - PastJourneysScreen.js (for journey information cards)
 * - DiscoveriesScreen.js (for discovery content)
 * - Any screen that needs to group related content visually
 * 
 * REFERENCES:
 * - ThemeContext.js (for theme-aware background colors and shadows)
 * - React Native View (for container functionality)
 * 
 * IMPORTANCE TO APP:
 * High - This is a core UI primitive that affects the visual organization of most
 * screens in the app. Good card design makes content easier to read and understand.
 * Consistent cards create a professional, organized feeling that users expect from
 * modern mobile apps.
 * 
 * IMPROVEMENT SUGGESTIONS:
 * 1. Add card variants - different elevations, borders, or background styles
 * 2. Add interactive states - press, hover, focus effects for tappable cards
 * 3. Add loading states - skeleton or shimmer effects while content loads
 * 4. Add collapse/expand functionality - expandable cards for detailed content
 * 5. Add header and footer sections - structured card areas for different content types
 * 6. Implement swipe actions - left/right swipe for card actions
 * 7. Add animation support - slide-in, fade-in, or other entrance animations
 * 8. Add error states - styling for cards that contain error information
 * 9. Create card groups - coordinated styling for related cards
 * 10. Add image support - easy way to add hero images or icons to cards
 * 11. Implement selection states - visual indication when cards are selected
 * 12. Add drag and drop support - reorderable cards for customization
 * 13. Create responsive sizing - cards that adapt to different screen sizes
 * 14. Add accessibility improvements - better navigation and screen reader support
 * 15. Implement card actions - built-in action buttons or menus
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getFallbackTheme } from '../../styles/theme';

export default function Card({ children, style, ...props }) {
  const { getCurrentThemeColors } = useTheme();
  const colors = getCurrentThemeColors() || getFallbackTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, shadowColor: colors.shadow },
        style,
      ]}
      accessible
      accessibilityRole="summary"
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    padding: 12,
    marginVertical: 6,
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
}); 