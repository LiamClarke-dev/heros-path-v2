/*
 * SECTION HEADER COMPONENT (UI PRIMITIVE)
 * ========================================
 * 
 * PURPOSE:
 * This is a UI primitive that creates standardized section headers throughout the
 * Hero's Path app. It provides consistent typography and spacing for section titles,
 * helping organize content into logical groups. Think of it as the component that
 * labels and introduces different sections of content, making screens easier to
 * navigate and understand.
 * 
 * FUNCTIONALITY:
 * - Renders section titles with consistent typography and spacing
 * - Uses theme-aware text colors that adapt to Light, Dark, and Adventure themes
 * - Provides standard padding and margins for proper content separation
 * - Uses semantic header role for proper accessibility and screen reader support
 * - Supports custom styling overrides while maintaining design consistency
 * - Uses increased font weight and letter spacing for visual hierarchy
 * 
 * WHY IT EXISTS:
 * Good content organization requires clear section labels. Without consistent
 * section headers, screens would feel flat and hard to navigate. This component
 * ensures all section titles look the same and provide proper semantic meaning,
 * making the app more accessible and easier to use.
 * 
 * RELATIONSHIPS:
 * - Used throughout the app to introduce content sections
 * - Part of the shared UI component system (alongside Card, ListItem, etc.)
 * - Uses ThemeContext for consistent styling across different app themes
 * - Often used above Cards or groups of ListItems
 * - Works with the overall information architecture to provide content structure
 * 
 * REFERENCED BY:
 * - SettingsScreen.js (for settings section headers)
 * - DiscoveriesScreen.js (for discovery category headers)
 * - SavedPlacesScreen.js (for organizing saved places)
 * - Any screen that needs to organize content into labeled sections
 * 
 * REFERENCES:
 * - ThemeContext.js (for theme-aware text colors)
 * - React Native View and Text (for layout and typography)
 * 
 * IMPORTANCE TO APP:
 * High - While simple, this component is crucial for content organization and
 * accessibility. Clear section headers make complex screens much easier to navigate
 * and understand. They're essential for creating a logical information hierarchy
 * that users can quickly scan and comprehend.
 * 
 * IMPROVEMENT SUGGESTIONS:
 * 1. Add size variants - large, medium, small header sizes for different hierarchy levels
 * 2. Add icon integration - optional icons before or after header text
 * 3. Add action support - buttons or links within section headers
 * 4. Add collapsible sections - headers that can expand/collapse content
 * 5. Add badge integration - notification badges or counters in headers
 * 6. Add divider integration - automatic dividers above or below headers
 * 7. Add animation support - fade-in or slide effects for dynamic content
 * 8. Add sticky headers - headers that stick to top when scrolling
 * 9. Create themed variants - different styles for different content types
 * 10. Add loading states - skeleton effects while section content loads
 * 11. Add help text support - optional descriptions or tooltips
 * 12. Implement responsive typography - text size that adapts to device/settings
 * 13. Add color variants - different colors for categorization or emphasis
 * 14. Add accessibility improvements - better navigation and landmarks
 * 15. Create group headers - special styling for major section breaks
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getFallbackTheme, THEME_TYPES } from '../../styles/theme';

export default function SectionHeader({ title, style, ...props }) {
  const { getCurrentThemeColors, currentTheme } = useTheme();
  const colors = getCurrentThemeColors() || getFallbackTheme();
  const isAdventure = currentTheme === THEME_TYPES.ADVENTURE;
  
  return (
    <View style={[styles.container, style]} {...props}>
      <Text 
        style={[
          styles.title, 
          { 
            color: colors.navBar || colors.text,
            fontFamily: isAdventure ? 'HyliaSerifBeta-Regular' : 'Roboto',
            fontSize: isAdventure ? 28 : 18,
            fontWeight: isAdventure ? 'normal' : '600',
          }
        ]} 
        accessibilityRole="header"
      >
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  title: {
    letterSpacing: 0.3,
  },
}); 