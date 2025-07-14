import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function SettingsOptionRow({
  label,
  value,
  onPress,
  isToggle = false,
  isOn = false,
  toggleType = 'onoff', // 'onoff', 'value', 'multivalue'
  toggleLabel,
  toggleIconLeft: ToggleIconLeft,
  toggleIconRight: ToggleIconRight,
  icon: Icon,
  description,
  style,
  ...props
}) {
  const { getCurrentThemeColors } = useTheme();
  const colors = getCurrentThemeColors();

  const Container = onPress ? Pressable : View;

  // Determine toggle content
  let toggleContent = null;
  if (toggleType === 'onoff') {
    toggleContent = (
      <Text style={[
        isOn ? styles.toggleTextOn : styles.toggleTextOff,
        { color: isOn ? colors.text : colors.secondaryText }
      ]}>
        {toggleLabel ? toggleLabel : isOn ? 'ON' : 'OFF'}
      </Text>
    );
  } else if (toggleType === 'value') {
    toggleContent = (
      <Text style={[styles.toggleTextValue, { color: colors.text }]}>
        {toggleLabel ? toggleLabel : value}
      </Text>
    );
  } else if (toggleType === 'multivalue') {
    toggleContent = (
      <View style={styles.multiValueRow}>
        {ToggleIconLeft && <ToggleIconLeft style={styles.arrowIcon} width={20} height={20} />}
        <Text style={[styles.toggleTextValue, { color: colors.text }]}>
          {toggleLabel ? toggleLabel : value}
        </Text>
        {ToggleIconRight && <ToggleIconRight style={styles.arrowIcon} width={20} height={20} />}
      </View>
    );
  }

  // Distinguish toggle types visually
  let toggleBg = colors.inputBackground;
  if (toggleType === 'multivalue') toggleBg = colors.primary + '20'; // blue accent with opacity
  if (toggleType === 'value') toggleBg = colors.secondary + '20'; // gold accent with opacity

  return (
    <Container
      style={[styles.optionRow, style]}
      onPress={onPress}
      accessibilityRole={onPress ? (isToggle ? 'switch' : 'button') : undefined}
      accessibilityState={isToggle ? { checked: isOn } : undefined}
      {...props}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.optionLabel, { color: colors.text }]}>{label}</Text>
        {description && <Text style={[styles.description, { color: colors.secondaryText }]}>{description}</Text>}
      </View>
      <View style={styles.valueContainer}>
        {isToggle ? (
                      <View
              style={[
                styles.toggleContainer,
                { 
                  backgroundColor: toggleBg,
                  borderColor: colors.border
                },
                isOn && toggleType === 'onoff' ? styles.toggleOn : null,
                !isOn && toggleType === 'onoff' ? styles.toggleOff : null,
              ]}
            >
              {toggleContent}
            </View>
        ) : (
          <Text style={[styles.valueText, { color: colors.text }]}>{value}</Text>
        )}
        {Icon && <Icon style={styles.icon} width={24} height={24} />}
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    paddingHorizontal: 24,
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  optionLabel: {
    fontSize: 27,
    fontFamily: 'Roboto-MediumItalic',
    color: '#e2ded3',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  description: {
    fontSize: 16,
    color: '#e2ded3BB',
    fontFamily: 'Roboto-Medium',
    marginTop: 2,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 100,
    justifyContent: 'flex-end',
  },
  valueText: {
    fontSize: 27,
    fontFamily: 'Roboto-Medium',
    color: '#e2ded3',
    fontWeight: '500',
    textAlign: 'right',
  },
  toggleContainer: {
    minWidth: 100,
    height: 44,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(226, 222, 211, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    paddingHorizontal: 12,
  },
  toggleOn: {},
  toggleOff: {},
  toggleTextOn: {
    fontFamily: 'Roboto-Medium',
    fontSize: 27,
    fontWeight: '500',
  },
  toggleTextOff: {
    fontFamily: 'Roboto-Medium',
    fontSize: 27,
    fontWeight: '500',
    opacity: 0.6,
  },
  toggleTextValue: {
    fontFamily: 'Roboto-Medium',
    fontSize: 27,
    fontWeight: '500',
    textAlign: 'center',
  },
  multiValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowIcon: {
    marginHorizontal: 4,
  },
  icon: {
    marginLeft: 8,
  },
}); 