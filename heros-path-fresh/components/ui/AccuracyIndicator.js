import React from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * AccuracyIndicator
 * Props:
 * - locationAccuracy: number
 * - colors: object (theme colors)
 * - tracking: boolean
 */
export default function AccuracyIndicator({ locationAccuracy, colors, tracking }) {
  if (!tracking || !locationAccuracy) return null;
  return (
    <View style={{
      position: 'absolute',
      top: 60,
      right: 16,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 12,
      backgroundColor: colors.cardBackground,
      // Add shadow if needed
    }}>
      <MaterialIcons
        name="gps-fixed"
        size={16}
        color={
          locationAccuracy <= 5 ? colors.success :
          locationAccuracy <= 15 ? colors.warning :
          colors.error
        }
      />
      <Text style={{ marginLeft: 4, color: colors.textSecondary, fontSize: 12 }}>
        GPS: {Math.round(locationAccuracy)}m
      </Text>
      <Text style={{
        marginLeft: 4,
        color: locationAccuracy <= 5 ? colors.success :
               locationAccuracy <= 15 ? colors.warning :
               colors.error,
        fontWeight: '600',
        fontSize: 12
      }}>
        {locationAccuracy <= 5 ? 'Excellent' :
         locationAccuracy <= 15 ? 'Good' :
         locationAccuracy <= 50 ? 'Fair' : 'Poor'}
      </Text>
    </View>
  );
} 