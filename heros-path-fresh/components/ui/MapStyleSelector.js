/*
 * MAP STYLE SELECTOR COMPONENT
 * ============================
 * 
 * PURPOSE:
 * This component provides a comprehensive map style selection interface with
 * visual previews, descriptions, and easy selection. It displays all available
 * map styles in a grid layout with preview images and handles style switching.
 * 
 * FUNCTIONALITY:
 * - Displays all available map styles in a grid
 * - Shows preview images for each style
 * - Handles style selection and persistence
 * - Provides visual feedback for current selection
 * - Supports theme-aware styling
 * - Includes accessibility support
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getFallbackTheme, Spacing, Typography, Layout } from '../../styles/theme';
import MapStylePreview from './MapStylePreview';

const MapStyleSelector = ({ onStyleChange }) => {
  const { 
    currentMapStyle, 
    changeMapStyle, 
    mapStyleConfigs,
    getCurrentThemeColors
  } = useTheme();
  const colors = getCurrentThemeColors() || getFallbackTheme();

  const handleStyleSelect = async (styleKey) => {
    try {
      await changeMapStyle(styleKey);
      if (onStyleChange) {
        onStyleChange(styleKey);
      }
      Alert.alert(
        'Map Style Updated', 
        `Switched to ${mapStyleConfigs[styleKey].name} map style!`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update map style. Please try again.');
    }
  };

  const mapStyleOptions = Object.entries(mapStyleConfigs);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>
        Choose Map Style
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Select your preferred map appearance
      </Text>
      
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.previewGrid}>
          {mapStyleOptions.map(([styleKey, styleConfig]) => (
            <MapStylePreview
              key={styleKey}
              styleKey={styleKey}
              styleConfig={styleConfig}
              isSelected={currentMapStyle === styleKey}
              onSelect={handleStyleSelect}
              showDescription={true}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    ...Typography.sectionTitle,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.caption,
    marginBottom: Spacing.lg,
  },
  scrollContainer: {
    flex: 1,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: Spacing.lg,
  },
});

export default MapStyleSelector;