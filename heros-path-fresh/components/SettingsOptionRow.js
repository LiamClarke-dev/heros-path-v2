/*
 * SETTINGS OPTION ROW COMPONENT
 * =============================
 * 
 * PURPOSE:
 * This is a reusable UI component that creates standardized rows for settings screens.
 * It provides a consistent layout and styling for different types of settings options
 * including toggles, value pickers, and action buttons. Think of it as the building
 * block that makes all settings look and behave consistently throughout the app.
 * 
 * FUNCTIONALITY:
 * - Renders a label on the left with optional description text
 * - Supports multiple toggle types: on/off switches, value displays, multi-value pickers
 * - Handles different visual styles for different toggle types (background colors)
 * - Supports custom icons on the right side of the row
 * - Can be pressable (for navigation) or non-pressable (for display only)
 * - Provides proper accessibility support with roles and states
 * - Uses theme-aware styling for colors and fonts
 * 
 * WHY IT EXISTS:
 * Settings screens need many similar-looking rows with consistent spacing, fonts,
 * and behavior. Without this component, each settings option would need custom
 * styling, leading to inconsistency and more code. This component enforces
 * design standards and reduces development time for new settings.
 * 
 * RELATIONSHIPS:
 * - Used extensively by SettingsScreen.js for all settings options
 * - Uses ThemeContext for consistent styling across different app themes
 * - May be used by other screens that need settings-like option rows
 * - Likely used by DiscoveryPreferencesScreen.js for preference options
 * 
 * REFERENCED BY:
 * - SettingsScreen.js (primary usage for most app settings)
 * - DiscoveryPreferencesScreen.js (for discovery preference options)
 * - Any screen that needs consistent option row styling
 * 
 * REFERENCES:
 * - ThemeContext.js (for theme-aware colors and styling)
 * - React Native Pressable and View components
 * 
 * IMPORTANCE TO APP:
 * Medium-High - This component is crucial for maintaining consistent UI/UX across
 * all settings screens. While not core functionality, good settings UI is essential
 * for user adoption and app configuration. Inconsistent settings would make the
 * app feel unprofessional.
 * 
 * IMPROVEMENT SUGGESTIONS:
 * 1. Add animation support - smooth transitions when values change
 * 2. Add validation indicators - show invalid settings with red styling
 * 3. Implement loading states - show when settings are being saved remotely
 * 4. Add help text support - expandable descriptions for complex settings
 * 5. Implement nested options - support for sub-settings with indentation
 * 6. Add search/filter support - searchable settings for large lists
 * 7. Implement setting dependencies - disable/enable options based on others
 * 8. Add reset functionality - easy way to reset individual settings to defaults
 * 9. Implement setting groups - collapsible sections for organization
 * 10. Add keyboard navigation - support for external keyboards
 * 11. Implement setting change tracking - show which settings have been modified
 * 12. Add import/export support - backup and restore settings configurations
 * 13. Implement A/B testing support - different layouts for testing
 * 14. Add accessibility improvements - better screen reader support
 * 15. Consider responsive design - better layout on tablets and landscape mode
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getFallbackTheme } from '../styles/theme';

export default function SettingsOptionRow({
  label,
  value,
  onPress,
  isToggle = false,
  isOn = false,
  toggleType = 'onoff', // 'onoff', 'value', 'multivalue'
  toggleLabel,
  toggleIconLeft: ToggleIconLeft,
  toggleIconRight: ToggleIconRight,
  icon: Icon,
  description,
  style,
  ...props
}) {
  const { getCurrentThemeColors } = useTheme();
  const colors = getCurrentThemeColors() || getFallbackTheme();

  const Container = onPress ? Pressable : View;

  // Determine toggle content
  let toggleContent = null;
  if (toggleType === 'onoff') {
    toggleContent = (
      <Text style={[
        isOn ? styles.toggleTextOn : styles.toggleTextOff,
        { color: isOn ? colors.text : colors.secondaryText }
      ]}>
        {toggleLabel ? toggleLabel : isOn ? 'ON' : 'OFF'}
      </Text>
    );
  } else if (toggleType === 'value') {
    toggleContent = (
      <Text style={[styles.toggleTextValue, { color: colors.text }]}>
        {toggleLabel ? toggleLabel : value}
      </Text>
    );
  } else if (toggleType === 'multivalue') {
    toggleContent = (
      <View style={styles.multiValueRow}>
        {ToggleIconLeft && <ToggleIconLeft style={styles.arrowIcon} width={20} height={20} />}
        <Text style={[styles.toggleTextValue, { color: colors.text }]}>
          {toggleLabel ? toggleLabel : value}
        </Text>
        {ToggleIconRight && <ToggleIconRight style={styles.arrowIcon} width={20} height={20} />}
      </View>
    );
  }

  // Distinguish toggle types visually - moved inside component
  let toggleBg = colors.inputBackground;
  if (toggleType === 'multivalue') toggleBg = colors.highlight; // blue accent with built-in opacity
  if (toggleType === 'value') toggleBg = colors.surface; // use surface color for value toggle

  return (
    <Container
      style={[styles.optionRow, style]}
      onPress={onPress}
      accessibilityRole={onPress ? (isToggle ? 'switch' : 'button') : undefined}
      accessibilityState={isToggle ? { checked: isOn } : undefined}
      {...props}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.optionLabel, { color: colors.text }]}>{label}</Text>
        {description && <Text style={[styles.description, { color: colors.secondaryText }]}>{description}</Text>}
      </View>
      <View style={styles.valueContainer}>
        {isToggle ? (
                      <View
              style={[
                styles.toggleContainer,
                { 
                  backgroundColor: toggleBg,
                  borderColor: colors.border
                },
                isOn && toggleType === 'onoff' ? styles.toggleOn : null,
                !isOn && toggleType === 'onoff' ? styles.toggleOff : null,
              ]}
            >
              {toggleContent}
            </View>
        ) : (
          <Text style={[styles.valueText, { color: colors.text }]}>{value}</Text>
        )}
        {Icon && <Icon style={styles.icon} width={24} height={24} />}
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    paddingHorizontal: 24,
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  optionLabel: {
    fontSize: 27,
    fontFamily: 'Roboto-MediumItalic',
    color: '#e2ded3',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  description: {
    fontSize: 16,
    color: '#e2ded3BB',
    fontFamily: 'Roboto-Medium',
    marginTop: 2,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 100,
    justifyContent: 'flex-end',
  },
  valueText: {
    fontSize: 27,
    fontFamily: 'Roboto-Medium',
    color: '#e2ded3',
    fontWeight: '500',
    textAlign: 'right',
  },
  toggleContainer: {
    minWidth: 100,
    height: 44,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(226, 222, 211, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    paddingHorizontal: 12,
  },
  toggleOn: {},
  toggleOff: {},
  toggleTextOn: {
    fontFamily: 'Roboto-Medium',
    fontSize: 27,
    fontWeight: '500',
  },
  toggleTextOff: {
    fontFamily: 'Roboto-Medium',
    fontSize: 27,
    fontWeight: '500',
    opacity: 0.6,
  },
  toggleTextValue: {
    fontFamily: 'Roboto-Medium',
    fontSize: 27,
    fontWeight: '500',
    textAlign: 'center',
  },
  multiValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowIcon: {
    marginHorizontal: 4,
  },
  icon: {
    marginLeft: 8,
  },
}); 