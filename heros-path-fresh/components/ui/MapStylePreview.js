/*
 * MAP STYLE PREVIEW COMPONENT
 * ===========================
 * 
 * PURPOSE:
 * This component provides visual previews for different map styles, allowing users
 * to see what each style looks like before selecting it. It displays preview images
 * or placeholder representations of each map style with descriptions and selection state.
 * 
 * FUNCTIONALITY:
 * - Displays preview images for each map style
 * - Shows style name, description, and selection state
 * - Handles style selection with visual feedback
 * - Supports theme-aware styling
 * - Provides accessibility support
 * - Falls back to placeholder when preview images are unavailable
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { getFallbackTheme, Spacing, Typography, Layout, Shadows } from '../../styles/theme';
import { getPreviewImage, getPreviewColors } from '../../utils/MapStylePreviews';

const { width } = Dimensions.get('window');
const PREVIEW_WIDTH = (width - 48) / 2; // Two columns with padding
const PREVIEW_HEIGHT = PREVIEW_WIDTH * 0.6; // 3:5 aspect ratio

const MapStylePreview = ({ 
  styleKey, 
  styleConfig, 
  isSelected, 
  onSelect, 
  showDescription = true 
}) => {
  const { getCurrentThemeColors } = useTheme();
  const colors = getCurrentThemeColors() || getFallbackTheme();

  const handlePress = () => {
    onSelect(styleKey);
  };

  const previewImage = getPreviewImage(styleKey);
  const previewColors = getPreviewColors(styleKey);

  return (
    <TouchableOpacity
      style={[
        styles.previewContainer,
        {
          backgroundColor: colors.surface,
          borderColor: isSelected ? colors.primary : colors.border,
          borderWidth: isSelected ? 2 : 1,
        }
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
      accessibilityLabel={`Map style: ${styleConfig.name}. ${styleConfig.description}`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
    >
      {/* Preview Image */}
      <View style={[
        styles.previewImageContainer,
        { backgroundColor: previewColors.primary }
      ]}>
        {previewImage ? (
          <Image
            source={previewImage}
            style={styles.previewImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[
            styles.placeholderPreview,
            { backgroundColor: previewColors.primary }
          ]}>
            <MaterialIcons
              name={styleConfig.icon || 'map'}
              size={32}
              color={previewColors.text}
            />
            <Text style={[styles.placeholderText, { color: previewColors.text }]}>
              {styleConfig.name}
            </Text>
          </View>
        )}
        
        {/* Selection Indicator */}
        {isSelected && (
          <View style={[styles.selectionIndicator, { backgroundColor: colors.primary }]}>
            <MaterialIcons name="check" size={16} color={colors.buttonText} />
          </View>
        )}
      </View>

      {/* Style Info */}
      <View style={styles.styleInfo}>
        <Text style={[styles.styleName, { color: colors.text }]}>
          {styleConfig.name}
        </Text>
        {showDescription && (
          <Text style={[styles.styleDescription, { color: colors.textSecondary }]}>
            {styleConfig.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  previewContainer: {
    width: PREVIEW_WIDTH,
    borderRadius: Layout.borderRadius,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  previewImageContainer: {
    width: '100%',
    height: PREVIEW_HEIGHT,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholderPreview: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  selectionIndicator: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  styleInfo: {
    padding: Spacing.sm,
  },
  styleName: {
    ...Typography.cardTitle,
    fontSize: 16,
    marginBottom: Spacing.xs,
  },
  styleDescription: {
    ...Typography.caption,
    fontSize: 12,
    lineHeight: 16,
  },
});

export default MapStylePreview;