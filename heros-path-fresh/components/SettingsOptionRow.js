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
  // Zelda/Figma palette
  const colorGainsboro100 = '#e2ded3';
  const colorGainsboro300 = 'rgba(226, 222, 211, 0.4)';
  const colorGainsboro400 = 'rgba(226, 222, 211, 0.2)';
  const colorDimgray100 = '#66645d';
  const colorBlueAccent = '#54c0fd';
  const colorGoldAccent = '#ffea2e';

  const Container = onPress ? Pressable : View;

  // Determine toggle content
  let toggleContent = null;
  if (toggleType === 'onoff') {
    toggleContent = (
      <Text style={isOn ? styles.toggleTextOn : styles.toggleTextOff}>
        {toggleLabel ? toggleLabel : isOn ? 'ON' : 'OFF'}
      </Text>
    );
  } else if (toggleType === 'value') {
    toggleContent = (
      <Text style={styles.toggleTextValue}>{toggleLabel ? toggleLabel : value}</Text>
    );
  } else if (toggleType === 'multivalue') {
    toggleContent = (
      <View style={styles.multiValueRow}>
        {ToggleIconLeft && <ToggleIconLeft style={styles.arrowIcon} width={20} height={20} />}
        <Text style={styles.toggleTextValue}>{toggleLabel ? toggleLabel : value}</Text>
        {ToggleIconRight && <ToggleIconRight style={styles.arrowIcon} width={20} height={20} />}
      </View>
    );
  }

  // Distinguish toggle types visually
  let toggleBg = colorGainsboro300;
  if (toggleType === 'multivalue') toggleBg = 'rgba(84,192,253,0.10)'; // blue accent
  if (toggleType === 'value') toggleBg = 'rgba(255,234,46,0.10)'; // gold accent

  return (
    <Container
      style={[styles.optionRow, style]}
      onPress={onPress}
      accessibilityRole={onPress ? (isToggle ? 'switch' : 'button') : undefined}
      accessibilityState={isToggle ? { checked: isOn } : undefined}
      {...props}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.optionLabel}>{label}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      <View style={styles.valueContainer}>
        {isToggle ? (
          <View
            style={[
              styles.toggleContainer,
              { backgroundColor: toggleBg },
              isOn && toggleType === 'onoff' ? styles.toggleOn : null,
              !isOn && toggleType === 'onoff' ? styles.toggleOff : null,
            ]}
          >
            {toggleContent}
          </View>
        ) : (
          <Text style={styles.valueText}>{value}</Text>
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
    color: '#e2ded3',
    fontFamily: 'Roboto-Medium',
    fontSize: 27,
    fontWeight: '500',
  },
  toggleTextOff: {
    color: '#66645d',
    fontFamily: 'Roboto-Medium',
    fontSize: 27,
    fontWeight: '500',
    opacity: 0.6,
  },
  toggleTextValue: {
    color: '#e2ded3',
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