/*
  SocialScreen.js
  ----------------
  What this page does:
  - Placeholder for future social features. Currently displays a "Coming Soon" message.
  - Intended to eventually allow users to share journeys and discoveries with friends.

  Why this page exists & its importance:
  - Sets up the structure for future social functionality, signaling planned features to users and developers.
  - Helps organize navigation and app structure in anticipation of social features.

  References & dependencies:
  - Uses the theme system (useTheme) for dynamic styling.
  - Uses SectionHeader UI component.

  Suggestions for improvement:
  - When implementing, ensure all social features use the theme system and are accessible.
  - Add navigation and sharing logic when features are ready.
  - Consider privacy and user safety when building social interactions.
*/
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getFallbackTheme } from '../styles/theme';
import SectionHeader from '../components/ui/SectionHeader';

export default function SocialScreen() {
  const { getCurrentThemeColors } = useTheme();
  const colors = getCurrentThemeColors() || getFallbackTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SectionHeader title="Social" />
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Coming Soon!</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
          Social features are in development. Share your journeys and discoveries with friends!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ 
  container: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
