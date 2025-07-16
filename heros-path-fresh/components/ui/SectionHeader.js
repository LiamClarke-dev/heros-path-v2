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