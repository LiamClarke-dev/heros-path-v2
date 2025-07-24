/*
 * MAP STYLE VISUAL PREVIEW COMPONENT
 * ==================================
 * 
 * PURPOSE:
 * This component creates visual representations of map styles using
 * geometric shapes, gradients, and colors to simulate how each map
 * style would look. It provides a more engaging preview than simple icons.
 * 
 * FUNCTIONALITY:
 * - Generates visual representations for each map style
 * - Uses gradients and shapes to simulate map appearance
 * - Provides animated previews for better user experience
 * - Supports theme-aware styling
 */

import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { getPreviewColors } from '../../utils/MapStylePreviews';
import { MAP_STYLES } from '../../styles/theme';

const { width } = Dimensions.get('window');
const PREVIEW_SIZE = 60;

const MapStyleVisualPreview = ({ styleKey, size = PREVIEW_SIZE }) => {
  const previewColors = getPreviewColors(styleKey);

  const renderStandardPreview = () => (
    <View style={[styles.previewContainer, { width: size, height: size, backgroundColor: previewColors.primary }]}>
      <View style={[styles.backgroundLayer, { backgroundColor: previewColors.secondary }]} />
      {/* Road lines */}
      <View style={[styles.roadLine, styles.horizontalRoad, { backgroundColor: previewColors.accent }]} />
      <View style={[styles.roadLine, styles.verticalRoad, { backgroundColor: previewColors.accent }]} />
      {/* Buildings */}
      <View style={[styles.building, styles.building1, { backgroundColor: previewColors.text }]} />
      <View style={[styles.building, styles.building2, { backgroundColor: previewColors.text }]} />
    </View>
  );

  const renderSatellitePreview = () => (
    <View style={[styles.previewContainer, { width: size, height: size, backgroundColor: previewColors.primary }]}>
      <View style={[styles.backgroundLayer, { backgroundColor: previewColors.secondary }]} />
      {/* Terrain patches */}
      <View style={[styles.terrainPatch, styles.patch1, { backgroundColor: previewColors.accent }]} />
      <View style={[styles.terrainPatch, styles.patch2, { backgroundColor: previewColors.text }]} />
      <View style={[styles.terrainPatch, styles.patch3, { backgroundColor: previewColors.secondary }]} />
    </View>
  );

  const renderTerrainPreview = () => (
    <View style={[styles.previewContainer, { width: size, height: size, backgroundColor: previewColors.primary }]}>
      <View style={[styles.backgroundLayer, { backgroundColor: previewColors.secondary }]} />
      {/* Contour lines */}
      <View style={[styles.contourLine, styles.contour1, { borderColor: previewColors.accent }]} />
      <View style={[styles.contourLine, styles.contour2, { borderColor: previewColors.text }]} />
      <View style={[styles.contourLine, styles.contour3, { borderColor: previewColors.accent }]} />
    </View>
  );

  const renderNightPreview = () => (
    <View style={[styles.previewContainer, { width: size, height: size, backgroundColor: previewColors.primary }]}>
      <View style={[styles.backgroundLayer, { backgroundColor: previewColors.secondary }]} />
      {/* City lights */}
      <View style={[styles.cityLight, styles.light1, { backgroundColor: previewColors.text }]} />
      <View style={[styles.cityLight, styles.light2, { backgroundColor: previewColors.accent }]} />
      <View style={[styles.cityLight, styles.light3, { backgroundColor: previewColors.text }]} />
      {/* Dark roads */}
      <View style={[styles.darkRoad, styles.darkRoad1, { backgroundColor: previewColors.accent }]} />
    </View>
  );

  const renderAdventurePreview = () => (
    <View style={[styles.previewContainer, { width: size, height: size, backgroundColor: previewColors.primary }]}>
      <View style={[styles.backgroundLayer, { backgroundColor: previewColors.secondary }]} />
      {/* Fantasy elements */}
      <View style={[styles.fantasyElement, styles.castle, { backgroundColor: previewColors.text }]} />
      <View style={[styles.fantasyElement, styles.forest, { backgroundColor: previewColors.accent }]} />
      <View style={[styles.fantasyPath, { backgroundColor: previewColors.secondary }]} />
    </View>
  );

  const renderPreview = () => {
    switch (styleKey) {
      case MAP_STYLES.SATELLITE:
        return renderSatellitePreview();
      case MAP_STYLES.TERRAIN:
        return renderTerrainPreview();
      case MAP_STYLES.NIGHT:
        return renderNightPreview();
      case MAP_STYLES.ADVENTURE:
        return renderAdventurePreview();
      case MAP_STYLES.STANDARD:
      default:
        return renderStandardPreview();
    }
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {renderPreview()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  previewContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  backgroundLayer: {
    position: 'absolute',
    top: '20%',
    left: '20%',
    right: '20%',
    bottom: '20%',
    borderRadius: 4,
    opacity: 0.7,
  },
  // Standard style elements
  roadLine: {
    position: 'absolute',
  },
  horizontalRoad: {
    height: 2,
    width: '60%',
    top: '40%',
    left: '20%',
  },
  verticalRoad: {
    width: 2,
    height: '60%',
    left: '50%',
    top: '20%',
  },
  building: {
    position: 'absolute',
    borderRadius: 1,
  },
  building1: {
    width: 8,
    height: 8,
    top: '25%',
    left: '25%',
  },
  building2: {
    width: 6,
    height: 10,
    top: '60%',
    right: '25%',
  },
  // Satellite style elements
  terrainPatch: {
    position: 'absolute',
    borderRadius: 4,
  },
  patch1: {
    width: 12,
    height: 8,
    top: '20%',
    left: '15%',
  },
  patch2: {
    width: 8,
    height: 12,
    top: '50%',
    right: '20%',
  },
  patch3: {
    width: 10,
    height: 6,
    bottom: '25%',
    left: '40%',
  },
  // Terrain style elements
  contourLine: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 20,
  },
  contour1: {
    width: 30,
    height: 15,
    top: '20%',
    left: '25%',
  },
  contour2: {
    width: 25,
    height: 12,
    top: '45%',
    right: '20%',
  },
  contour3: {
    width: 20,
    height: 10,
    bottom: '25%',
    left: '30%',
  },
  // Night style elements
  cityLight: {
    position: 'absolute',
    borderRadius: 2,
  },
  light1: {
    width: 3,
    height: 3,
    top: '25%',
    left: '30%',
  },
  light2: {
    width: 2,
    height: 2,
    top: '40%',
    right: '35%',
  },
  light3: {
    width: 3,
    height: 3,
    bottom: '30%',
    left: '45%',
  },
  darkRoad: {
    position: 'absolute',
  },
  darkRoad1: {
    width: '50%',
    height: 1,
    top: '60%',
    left: '25%',
  },
  // Adventure style elements
  fantasyElement: {
    position: 'absolute',
  },
  castle: {
    width: 8,
    height: 12,
    top: '20%',
    left: '30%',
    borderRadius: 1,
  },
  forest: {
    width: 10,
    height: 8,
    bottom: '25%',
    right: '25%',
    borderRadius: 4,
  },
  fantasyPath: {
    position: 'absolute',
    width: '40%',
    height: 2,
    top: '50%',
    left: '30%',
    borderRadius: 1,
  },
});

export default MapStyleVisualPreview;