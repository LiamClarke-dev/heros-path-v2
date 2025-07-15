/*
 * LIST ITEM COMPONENT (UI PRIMITIVE)
 * ===================================
 * 
 * PURPOSE:
 * This is a foundational UI primitive that creates standardized list items throughout
 * the Hero's Path app. It provides consistent layout and styling for rows of information,
 * making lists look professional and organized. Think of it as the building block for
 * any kind of list content, from settings to search results to navigation menus.
 * 
 * FUNCTIONALITY:
 * - Renders a structured row with title, optional subtitle, and left/right content areas
 * - Supports touch interactions when onPress is provided
 * - Uses theme-aware colors that adapt to Light, Dark, and Adventure themes
 * - Provides proper spacing and alignment for different content types
 * - Supports custom left elements (icons, avatars) and right elements (arrows, toggles)
 * - Includes proper accessibility support with appropriate roles
 * - Uses consistent typography and spacing throughout the app
 * 
 * WHY IT EXISTS:
 * Lists are everywhere in mobile apps - settings, search results, navigation menus,
 * data displays. Without a standardized ListItem component, each list would look
 * different, creating an inconsistent and unprofessional user experience. This
 * component ensures all lists follow the same design patterns.
 * 
 * RELATIONSHIPS:
 * - Used throughout the app for any list-based content
 * - Part of the shared UI component system (alongside Card, AppButton, etc.)
 * - Uses ThemeContext for consistent styling across different app themes
 * - Often used within Card components for organized content sections
 * - Frequently contains icons, toggles, or other interactive elements
 * 
 * REFERENCED BY:
 * - SettingsScreen.js (for settings options)
 * - SavedPlacesScreen.js (for displaying saved places)
 * - DiscoveriesScreen.js (for showing discovered places)
 * - Navigation menus and search results
 * - Any screen that displays structured lists of information
 * 
 * REFERENCES:
 * - ThemeContext.js (for theme-aware colors and styling)
 * - React Native TouchableOpacity (for touch handling)
 * - React Native View and Text (for layout and typography)
 * 
 * IMPORTANCE TO APP:
 * Very High - This is one of the most frequently used UI components in the app.
 * Lists are fundamental to mobile app navigation and data display. A well-designed
 * ListItem component significantly improves the overall user experience and makes
 * the app feel professional and polished.
 * 
 * IMPROVEMENT SUGGESTIONS:
 * 1. Add selection states - visual indication when items are selected
 * 2. Add loading states - skeleton or shimmer effects while content loads
 * 3. Add swipe actions - left/right swipe for quick actions
 * 4. Add drag and drop - reorderable lists for customization
 * 5. Add size variants - compact, normal, large item heights
 * 6. Add error states - styling for items with errors or warnings
 * 7. Add badge support - notification badges or status indicators
 * 8. Implement divider integration - automatic dividers between items
 * 9. Add animation support - smooth transitions for dynamic lists
 * 10. Add image/avatar integration - better support for media content
 * 11. Create grouped list styling - different appearance for section headers
 * 12. Add keyboard navigation - better support for external keyboards
 * 13. Implement virtual scrolling - performance for very large lists
 * 14. Add contextual menus - long-press actions and quick options
 * 15. Add accessibility improvements - better voice-over and navigation support
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getFallbackTheme } from '../../styles/theme';

export default function ListItem({ title, subtitle, left, right, onPress, style, ...props }) {
  const { getCurrentThemeColors } = useTheme();
  const colors = getCurrentThemeColors() || getFallbackTheme();
  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface }, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      accessible
      accessibilityRole={onPress ? 'button' : 'text'}
      {...props}
    >
      {left && <View style={styles.left}>{left}</View>}
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.subtitle, { color: colors.secondaryText }]}>{subtitle}</Text>}
      </View>
      {right && <View style={styles.right}>{right}</View>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginVertical: 2,
  },
  left: {
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  right: {
    marginLeft: 10,
  },
}); 