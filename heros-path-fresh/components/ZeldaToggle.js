import React from 'react';
import { Pressable, View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function ZeldaToggle({ value, onValueChange, disabled, style, ...props }) {
  const { getCurrentThemeColors } = useTheme();
  const colors = getCurrentThemeColors();

  return (
    <Pressable
      onPress={() => !disabled && onValueChange && onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      style={[styles.container, style, disabled && styles.disabled]}
      {...props}
    >
      <View
        style={[
          styles.track,
          {
            backgroundColor: value ? colors.switchActive : colors.switchTrack,
            borderColor: value ? colors.primary : colors.border,
            shadowColor: value ? colors.primary : colors.border,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.thumb,
          {
            backgroundColor: value ? colors.switchThumb : colors.inputBackground,
            borderColor: value ? colors.secondary : colors.border,
            left: value ? 28 : 2,
            shadowColor: value ? colors.secondary : colors.border,
          },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 54,
    height: 32,
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 8,
  },
  track: {
    position: 'absolute',
    width: 50,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    top: 6,
    left: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  thumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    top: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 1,
  },
  disabled: {
    opacity: 0.5,
  },
}); 