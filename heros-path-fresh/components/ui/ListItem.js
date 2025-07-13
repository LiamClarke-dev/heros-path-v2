import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export default function ListItem({ title, subtitle, left, right, onPress, style, ...props }) {
  const { getCurrentThemeColors } = useTheme();
  const colors = getCurrentThemeColors();
  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface }, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      accessible
      accessibilityRole={onPress ? 'button' : 'text'}
      {...props}
    >
      {left && <View style={styles.left}>{left}</View>}
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.subtitle, { color: colors.secondaryText }]}>{subtitle}</Text>}
      </View>
      {right && <View style={styles.right}>{right}</View>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginVertical: 2,
  },
  left: {
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  right: {
    marginLeft: 10,
  },
}); 