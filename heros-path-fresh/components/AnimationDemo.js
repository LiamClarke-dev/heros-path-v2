// components/AnimationDemo.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getFallbackTheme } from '../styles/theme';
import PingAnimation from './PingAnimation';

// Ensure colors is defined at module scope so Hermes doesn't throw before components mount
const colors = getFallbackTheme();

const AnimationDemo = () => {
  const { getCurrentThemeColors } = useTheme();
  const colors = getCurrentThemeColors() || getFallbackTheme();
  
  const [activeAnimation, setActiveAnimation] = useState(null);
  const [selectedType, setSelectedType] = useState('ripple');

  // Create styles inside component to access colors
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: colors.backgroundSecondary,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 8,
      color: colors.text,
    },
    subtitle: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 30,
      color: colors.textSecondary,
    },
    animationContainer: {
      height: 200,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 12,
      marginBottom: 30,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    animation: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      marginLeft: -50,
      marginTop: -50,
    },
    buttonContainer: {
      gap: 12,
    },
    button: {
      backgroundColor: colors.background,
      padding: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    buttonActive: {
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}10`,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    buttonTextActive: {
      color: colors.primary,
    },
    buttonDescription: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    infoContainer: {
      marginTop: 30,
      padding: 16,
      backgroundColor: `${colors.primary}10`,
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 8,
    },
    infoText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
  });

  const animationTypes = [
    { key: 'ripple', name: 'Ripple Effect', description: 'Expanding circles with rotation' },
    { key: 'pulse', name: 'Pulse Wave', description: 'Simple expanding pulse' },
    { key: 'radar', name: 'Radar Sweep', description: 'Rotating radar-like sweep' },
    { key: 'particles', name: 'Particle Burst', description: 'Particles exploding outward' },
  ];

  const triggerAnimation = (type) => {
    setSelectedType(type);
    setActiveAnimation(type);
    
    // Auto-hide after animation completes
    setTimeout(() => {
      setActiveAnimation(null);
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ping Animation Options</Text>
      <Text style={styles.subtitle}>Tap to preview each animation style</Text>
      
      <View style={styles.animationContainer}>
        <PingAnimation
          isVisible={!!activeAnimation}
          animationType={selectedType}
          onAnimationComplete={() => setActiveAnimation(null)}
          style={styles.animation}
        />
      </View>

      <View style={styles.buttonContainer}>
        {animationTypes.map((type) => (
          <TouchableOpacity
            key={type.key}
            style={[
              styles.button,
              selectedType === type.key && styles.buttonActive
            ]}
            onPress={() => triggerAnimation(type.key)}
          >
            <Text style={[
              styles.buttonText,
              selectedType === type.key && styles.buttonTextActive
            ]}>
              {type.name}
            </Text>
            <Text style={styles.buttonDescription}>
              {type.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Selected: {animationTypes.find(t => t.key === selectedType)?.name}</Text>
        <Text style={styles.infoText}>
          This animation will play from the Link sprite's location when you tap the ping button.
        </Text>
      </View>
    </View>
  );
};

export default AnimationDemo; 