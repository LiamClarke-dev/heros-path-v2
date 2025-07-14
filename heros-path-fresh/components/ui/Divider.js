import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export default function Divider({ style, ...props }) {
  const { getCurrentThemeColors } = useTheme();
  const colors = getCurrentThemeColors();
  
  // Defensive check - if colors is undefined, use fallback
  if (!colors) {
    return (
      <View
        style={[
          styles.divider,
          { backgroundColor: '#38383A' },
          style,
        ]}
        accessibilityRole="none"
        {...props}
      />
    );
  }
  
  return (
    <View
      style={[
        styles.divider,
        { backgroundColor: colors?.divider || '#38383A' },
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