/*
 * MAP STYLE SELECTION SCREEN
 * ==========================
 * 
 * PURPOSE:
 * This screen provides a dedicated interface for selecting map styles with
 * large preview images and detailed descriptions. It offers a comprehensive
 * map style selection experience separate from the main settings screen.
 * 
 * FUNCTIONALITY:
 * - Displays all available map styles with large previews
 * - Shows detailed descriptions and features for each style
 * - Handles style selection and immediate preview
 * - Provides navigation back to previous screen
 * - Supports theme-aware styling
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getFallbackTheme, Spacing, Typography, Layout } from '../styles/theme';
import MapStyleSelector from '../components/ui/MapStyleSelector';

const MapStyleSelectionScreen = ({ navigation }) => {
  const { getCurrentThemeColors } = useTheme();
  const colors = getCurrentThemeColors() || getFallbackTheme();

  const handleStyleChange = (styleKey) => {
    // Optional: Navigate back after selection
    // navigation.goBack();
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Map Styles
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <MapStyleSelector onStyleChange={handleStyleChange} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  headerTitle: {
    ...Typography.sectionTitle,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40, // Same width as back button for centering
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
});

export default MapStyleSelectionScreen;