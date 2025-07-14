import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Corner from '../assets/Corner.svg';
import { useTheme } from '../contexts/ThemeContext';

export default function ZeldaButton({ onPress, children, disabled, selected, style, ...props }) {
  const { getCurrentThemeColors } = useTheme();
  const colors = getCurrentThemeColors();
  
  // Zelda-specific palette with theme integration - moved inside component
  const colorGray200 = selected ? colors.surface : colors.surface + '99'; // 60% opacity
  const colorGray100 = colors.surface;
  const colorGainsboro200 = colors.border + '4D'; // 30% opacity
  const colorGainsboro100 = colors.border;
  const colorDimgray = colors.secondaryText;
  const colorBeige = colors.primary + 'CC'; // 80% opacity

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      style={[
        styles.button,
        {
          backgroundColor: selected ? colorGray100 : colorGray200,
          borderColor: selected ? colorGainsboro100 : colorGainsboro200,
          shadowColor: selected ? colorBeige : 'transparent',
          shadowOpacity: selected ? 1 : 0,
          shadowRadius: selected ? 8 : 0,
          elevation: selected ? 8 : 0,
        },
        disabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      {...props}
    >
      <View style={styles.bgContainer}>
        <View style={[
          styles.background,
          selected ? styles.backgroundSelected : styles.backgroundUnselected,
          { borderColor: selected ? colorGainsboro100 : colorGainsboro200 },
        ]} />
        {selected && (
          <>
            <Corner style={[styles.cornerIcon, styles.cornerTopRight]} width={12} height={12} />
            <Corner style={[styles.cornerIcon, styles.cornerTopLeft]} width={12} height={12} />
            <Corner style={[styles.cornerIcon, styles.cornerBottomLeft]} width={12} height={12} />
            <Corner style={[styles.cornerIcon, styles.cornerBottomRight]} width={12} height={12} />
          </>
        )}
        <Text
          style={[
            styles.buttonText,
            {
              color: colors.text,
              fontFamily: 'Roboto-MediumItalic',
            },
          ]}
        >
          {children}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 75,
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
    marginHorizontal: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    position: 'relative',
    overflow: 'visible',
  },
  bgContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  background: {
    position: 'absolute',
    top: 3,
    right: 3,
    bottom: 3,
    left: 3,
    borderRadius: 2,
    borderWidth: 1,
  },
  backgroundSelected: {
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  backgroundUnselected: {
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  buttonText: {
    fontSize: 30,
    fontStyle: 'italic',
    fontWeight: '500',
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    width: 392,
    height: 44,
    position: 'absolute',
    top: 16,
    left: 4,
  },
  cornerIcon: {
    position: 'absolute',
    width: 12,
    height: 12,
  },
  cornerTopRight: {
    right: 0,
    top: 0,
  },
  cornerTopLeft: {
    left: 0,
    top: 0,
  },
  cornerBottomLeft: {
    left: 0,
    bottom: 0,
  },
  cornerBottomRight: {
    right: 0,
    bottom: 0,
  },
  disabled: {
    opacity: 0.5,
  },
}); 