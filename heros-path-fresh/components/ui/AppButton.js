import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const VARIANTS = {
  primary: (colors) => ({
    backgroundColor: colors.primary,
    color: colors.onPrimary,
  }),
  secondary: (colors) => ({
    backgroundColor: colors.secondary,
    color: colors.onSecondary,
  }),
  danger: (colors) => ({
    backgroundColor: colors.error,
    color: colors.onError,
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
  const { getCurrentThemeColors } = useTheme();
  const colors = getCurrentThemeColors();
  const variantStyles = VARIANTS[variant] ? VARIANTS[variant](colors) : VARIANTS.primary(colors);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: variantStyles.backgroundColor, opacity: disabled ? 0.5 : 1 },
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
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginVertical: 4,
  },
  text: {
    fontSize: 15,
    fontWeight: '500',
  },
}); 