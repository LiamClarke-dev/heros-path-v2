import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export default function Card({ children, style, ...props }) {
  const { getCurrentThemeColors } = useTheme();
  const colors = getCurrentThemeColors();
  
  // Defensive check - if colors is undefined, use fallback
  if (!colors) {
    return (
      <View
        style={[
          styles.card,
          { backgroundColor: '#1C1C1E', shadowColor: '#000000' },
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
  
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors?.surface || '#1C1C1E', shadowColor: colors?.shadow || '#000000' },
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