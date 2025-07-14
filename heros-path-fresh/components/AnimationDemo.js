/*
 * ANIMATION DEMO COMPONENT
 * ========================
 * 
 * PURPOSE:
 * This is a demonstration and testing component for the ping animation system.
 * It provides a visual interface to preview the 4 different animation types that can 
 * be used when users tap the ping button during walks. Think of it as a preview tool 
 * for developers and potentially for users to choose their preferred animation style.
 * 
 * FUNCTIONALITY:
 * - Displays 4 different animation options: Ripple Effect, Pulse Wave, Radar Sweep, and Particle Burst
 * - Allows users to tap buttons to preview each animation type
 * - Shows a preview area where animations play when selected
 * - Provides descriptions of each animation type
 * - Currently selected animation is highlighted with visual feedback
 * 
 * WHY IT EXISTS:
 * The Hero's Path app has a "ping" feature where users can discover nearby places during walks.
 * This component was created to help visualize and test the different animation styles that 
 * provide visual feedback when the ping button is pressed. It's primarily for development 
 * and testing purposes.
 * 
 * RELATIONSHIPS:
 * - Uses PingAnimation.js to actually render the animations
 * - Uses ThemeContext for consistent styling across different app themes
 * - Would typically be accessed from a settings screen or developer tools
 * - Demonstrates the same animations used in MapScreen when users ping for discoveries
 * 
 * REFERENCED BY:
 * - Settings screens (potentially)
 * - Developer tools or test interfaces
 * - Could be integrated into user preferences for animation selection
 * 
 * REFERENCES:
 * - PingAnimation.js (the actual animation component)
 * - ThemeContext.js (for theme-aware styling)
 * 
 * IMPORTANCE TO APP:
 * Medium importance - This is a utility component for testing and demonstration.
 * While not critical to core functionality, it helps developers and potentially users
 * understand and choose animation preferences for the ping feature.
 * 
 * IMPROVEMENT SUGGESTIONS:
 * 1. Add persistence - save user's preferred animation type to AsyncStorage
 * 2. Add accessibility features - screen reader descriptions for animations
 * 3. Add sound options - let users test animation with sound effects
 * 4. Add duration controls - let users adjust animation speed/timing
 * 5. Add custom animation builder - let users create their own animation styles
 * 6. Add performance metrics - show how each animation affects performance
 * 7. Consider removing if not used in production - this seems like a dev tool
 * 8. Add animation intensity settings (subtle vs dramatic)
 * 9. Add color customization options for animations
 * 10. Include this in user onboarding to let them choose their preferred style
 */

// components/AnimationDemo.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import PingAnimation from './PingAnimation';

const AnimationDemo = () => {
  const { getCurrentThemeColors } = useTheme();
  const colors = getCurrentThemeColors();
  
  const [activeAnimation, setActiveAnimation] = useState(null);
  const [selectedType, setSelectedType] = useState('ripple');

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

export default AnimationDemo; 