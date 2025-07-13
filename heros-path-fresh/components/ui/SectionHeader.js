import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export default function SectionHeader({ title, style, ...props }) {
  const { getCurrentThemeColors } = useTheme();
  const colors = getCurrentThemeColors();
  return (
    <View style={[styles.container, style]} {...props}>
      <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
}); 