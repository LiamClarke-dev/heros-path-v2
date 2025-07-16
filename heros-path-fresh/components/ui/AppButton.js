import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getFallbackTheme, THEME_TYPES } from '../../styles/theme';

const VARIANTS = {
  primary: (colors) => ({
    backgroundColor: colors.primary,
    color: colors.onPrimary,
    borderColor: colors.primary,
    borderWidth: 1,
  }),
  secondary: (colors, currentTheme) => ({
    backgroundColor: currentTheme === THEME_TYPES.ADVENTURE ? 'transparent' : colors.surface,
    color: colors.primary,
    borderColor: colors.primary,
    borderWidth: 1,
  }),
  danger: (colors) => ({
    backgroundColor: colors.error,
    color: colors.onError,
    borderColor: colors.error,
    borderWidth: 1,
  }),
};

export default function AppButton({
  title,
  onPress,
  variant = 'primary',
  style,
  textStyle,
  disabled,
  ...props
}) {
  const { getCurrentThemeColors, currentTheme } = useTheme();
  const colors = getCurrentThemeColors() || getFallbackTheme();
  const variantStyles = VARIANTS[variant] ? VARIANTS[variant](colors, currentTheme) : VARIANTS.primary(colors, currentTheme);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { 
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
          borderWidth: variantStyles.borderWidth,
          opacity: disabled ? 0.5 : 1 
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessible
      accessibilityRole="button"
      {...props}
    >
      <Text style={[styles.text, { color: variantStyles.color }, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginVertical: 4,
    // Add subtle shadow for better focus visibility
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 