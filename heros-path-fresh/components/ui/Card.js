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