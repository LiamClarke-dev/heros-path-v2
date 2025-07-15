import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getFallbackTheme } from '../../styles/theme';

export default function Divider({ style, ...props }) {
  const { getCurrentThemeColors } = useTheme();
  const colors = getCurrentThemeColors() || getFallbackTheme();
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