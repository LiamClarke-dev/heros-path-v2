/*
 * MAP STYLE PREVIEW CARD COMPONENT
 * ================================
 * 
 * PURPOSE:
 * This component provides an enhanced preview card for map styles with
 * visual representations, detailed information, and selection capabilities.
 * It's designed to be used in the settings screen for map style selection.
 * 
 * FUNCTIONALITY:
 * - Displays visual preview of map style
 * - Shows style name, description, and features
 * - Handles style selection with visual feedback
 * - Provides theme-aware styling
 * - Supports accessibility
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { getFallbackTheme, Spacing, Typography, Layout, Shadows } from '../../styles/theme';
import { getPreviewColors } from '../../utils/MapStylePreviews';
import MapStyleVisualPreview from './MapStyleVisualPreview';

const MapStylePreviewCard = ({ 
  styleKey, 
  styleConfig, 
  isSelected, 
  onSelect,
  compact = false 
}) => {
  const { getCurrentThemeColors } = useTheme();
  const colors = getCurrentThemeColors() || getFallbackTheme();
  const previewColors = getPreviewColors(styleKey);

  const handlePress = () => {
    onSelect(styleKey);
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        compact ? styles.compactCard : styles.fullCard,
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
      {/* Preview Section */}
      <View style={[
        styles.previewSection,
        { backgroundColor: previewColors.primary }
      ]}>
        <MapStyleVisualPreview 
          styleKey={styleKey} 
          size={compact ? 50 : 60} 
        />
        
        {/* Selection Indicator */}
        {isSelected && (
          <View style={[styles.selectionBadge, { backgroundColor: colors.primary }]}>
            <MaterialIcons name="check" size={16} color={colors.buttonText} />
          </View>
        )}
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={[
          styles.styleName, 
          compact ? styles.compactStyleName : styles.fullStyleName,
          { color: colors.text }
        ]}>
          {styleConfig.name}
        </Text>
        {!compact && (
          <Text style={[styles.styleDescription, { color: colors.textSecondary }]}>
            {styleConfig.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Layout.borderRadius,
    overflow: 'hidden',
    ...Shadows.small,
  },
  fullCard: {
    marginBottom: Spacing.md,
  },
  compactCard: {
    marginBottom: Spacing.sm,
    marginHorizontal: Spacing.xs,
  },
  previewSection: {
    height: 60,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContent: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionBadge: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    padding: Spacing.sm,
  },
  styleName: {
    fontWeight: '600',
  },
  fullStyleName: {
    ...Typography.cardTitle,
    fontSize: 16,
    marginBottom: Spacing.xs,
  },
  compactStyleName: {
    ...Typography.body,
    fontSize: 14,
  },
  styleDescription: {
    ...Typography.caption,
    fontSize: 12,
    lineHeight: 16,
  },
});

export default MapStylePreviewCard;