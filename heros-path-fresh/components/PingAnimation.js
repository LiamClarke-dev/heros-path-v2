// components/PingAnimation.js
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getFallbackTheme } from '../styles/theme';

// Define safe fallback colors for modules constants
const colors = getFallbackTheme();

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ANIMATION DISABLED - Scaffolding kept for future implementation
// To re-enable animations:
// 1. Set ANIMATIONS_ENABLED = true
// 2. Uncomment the setShowPingAnimation(true) line in MapScreen.js
// 3. Implement your preferred animation style
const ANIMATIONS_ENABLED = false;

const PingAnimation = ({ 
  isVisible, 
  onAnimationComplete,
  style,
  animationType = 'ripple' // 'ripple', 'pulse', 'radar', 'particles'
}) => {
  const { getCurrentThemeColors } = useTheme();
  // Access current theme if needed (but styles already use fallback colors)
  const _themeColors = getCurrentThemeColors();
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const particleAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  
  // New dramatic effects
  const glowAnim = useRef(new Animated.Value(0)).current;
  const screenFlashAnim = useRef(new Animated.Value(0)).current;
  const chargeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible && ANIMATIONS_ENABLED) {
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(1);
      rotationAnim.setValue(0);
      glowAnim.setValue(0);
      screenFlashAnim.setValue(0);
      chargeAnim.setValue(0);
      particleAnims.forEach(anim => anim.setValue(0));

      switch (animationType) {
        case 'ripple':
          playDramaticRippleAnimation();
          break;
        case 'pulse':
          playDramaticPulseAnimation();
          break;
        case 'radar':
          playDramaticRadarAnimation();
          break;
        case 'particles':
          playDramaticParticleAnimation();
          break;
        default:
          playDramaticRippleAnimation();
      }
    } else if (isVisible && !ANIMATIONS_ENABLED) {
      // Animations disabled - just call completion immediately
      if (onAnimationComplete) {
        setTimeout(() => onAnimationComplete(), 100); // Small delay for future animation
      }
    }
  }, [isVisible, animationType]);

  // Animation functions kept for future implementation
  const playDramaticRippleAnimation = () => {
    // Phase 1: Charge up (1 second)
    const chargeUp = Animated.parallel([
      Animated.timing(chargeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]);

    // Phase 2: Release (2 seconds)
    const release = Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 8, // Much larger scale
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(rotationAnim, {
        toValue: 2,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(screenFlashAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]);

    // Phase 3: Screen flash fade (1 second)
    const flashFade = Animated.timing(screenFlashAnim, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
    });

    Animated.sequence([
      chargeUp,
      release,
      flashFade
    ]).start(() => {
      if (onAnimationComplete) onAnimationComplete();
    });
  };

  const playDramaticPulseAnimation = () => {
    // Phase 1: Charge up (1.5 seconds)
    const chargeUp = Animated.parallel([
      Animated.timing(chargeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]);

    // Phase 2: Explosive pulse (2.5 seconds)
    const pulse = Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 6,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]);

    Animated.parallel([
      chargeUp,
      pulse,
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 2500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onAnimationComplete) onAnimationComplete();
    });
  };

  const playDramaticRadarAnimation = () => {
    // Phase 1: Charge up (1 second)
    const chargeUp = Animated.timing(chargeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    });

    // Phase 2: Radar sweep (3 seconds)
    const radarSweep = Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 10, // Very large scale
        duration: 3000,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 3000,
        useNativeDriver: true,
      }),
      Animated.timing(rotationAnim, {
        toValue: 3,
        duration: 3000,
        useNativeDriver: true,
      }),
    ]);

    Animated.sequence([
      chargeUp,
      radarSweep
    ]).start(() => {
      if (onAnimationComplete) onAnimationComplete();
    });
  };

  const playDramaticParticleAnimation = () => {
    // Phase 1: Charge up (1 second)
    const chargeUp = Animated.timing(chargeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    });

    // Phase 2: Particle burst (3 seconds)
    const particleAnimations = particleAnims.map((anim, index) => {
      const angle = (index * 45) * (Math.PI / 180);
      const distance = 200; // Much larger distance
      
      return Animated.parallel([
        Animated.timing(anim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.sequence([
      chargeUp,
      Animated.parallel(particleAnimations)
    ]).start(() => {
      if (onAnimationComplete) onAnimationComplete();
    });
  };

  // Don't render anything when animations are disabled
  if (!isVisible || !ANIMATIONS_ENABLED) {
    return null;
  }

  const renderRipple = () => (
    <Animated.View
      style={[
        styles.ripple,
        {
          transform: [
            { scale: scaleAnim },
            {
              rotate: rotationAnim.interpolate({
                inputRange: [0, 2],
                outputRange: ['0deg', '720deg'],
              }),
            },
          ],
          opacity: opacityAnim,
        },
      ]}
    />
  );

  const renderPulse = () => (
    <Animated.View
      style={[
        styles.pulse,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    />
  );

  const renderRadar = () => (
    <Animated.View
      style={[
        styles.radar,
        {
          transform: [
            { scale: scaleAnim },
            {
              rotate: rotationAnim.interpolate({
                inputRange: [0, 3],
                outputRange: ['0deg', '1080deg'],
              }),
            },
          ],
          opacity: opacityAnim,
        },
      ]}
    />
  );

  const renderParticles = () => (
    <>
      {particleAnims.map((anim, index) => {
        const angle = (index * 45) * (Math.PI / 180);
        const distance = 200;
        
        return (
          <Animated.View
            key={index}
            style={[
              styles.particle,
              {
                transform: [
                  {
                    translateX: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, Math.cos(angle) * distance],
                    }),
                  },
                  {
                    translateY: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, Math.sin(angle) * distance],
                    }),
                  },
                  { scale: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0],
                  }) },
                ],
                opacity: anim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 0.5, 0],
                }),
              },
            ]}
          />
        );
      })}
    </>
  );

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {/* Screen flash overlay */}
      <Animated.View
        style={[
          styles.screenFlash,
          {
            opacity: screenFlashAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.3],
            }),
          },
        ]}
      />
      
      {/* Charge up glow */}
      <Animated.View
        style={[
          styles.chargeGlow,
          {
            transform: [{ scale: chargeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 2],
            }) }],
            opacity: chargeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.8],
            }),
          },
        ]}
      />
      
      {/* Main animation */}
      {animationType === 'ripple' && renderRipple()}
      {animationType === 'pulse' && renderPulse()}
      {animationType === 'radar' && renderRadar()}
      {animationType === 'particles' && renderParticles()}
      
      {/* Center pulse for all animations */}
      <Animated.View
        style={[
          styles.centerPulse,
          {
            transform: [{ scale: scaleAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 2],
            }) }],
            opacity: opacityAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [1, 0.5, 0],
            }),
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: screenWidth,
    height: screenHeight,
    zIndex: 1000,
  },
  ripple: {
    position: 'absolute',
    width: 80, // Much larger ripple
    height: 80,
    borderRadius: 40,
    borderWidth: 6, // Thicker border
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}30`, // More visible with transparency
  },
  pulse: {
    position: 'absolute',
    width: 120, // Much larger pulse
    height: 120,
    borderRadius: 60,
    backgroundColor: `${colors.primary}50`, // More visible with transparency
  },
  radar: {
    position: 'absolute',
    width: 160, // Much larger radar
    height: 160,
    borderRadius: 80,
    borderWidth: 8, // Thicker border
    borderColor: colors.primary,
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  particle: {
    position: 'absolute',
    width: 20, // Larger particles
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  centerPulse: {
    position: 'absolute',
    width: 32, // Larger center pulse
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  screenFlash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: `${colors.background}30`, // Theme-aware flash
    zIndex: 1,
  },
  chargeGlow: {
    position: 'absolute',
    width: screenWidth * 2,
    height: screenHeight * 2,
    borderRadius: (screenWidth * 2) / 2,
    backgroundColor: `${colors.primary}20`, // Light theme-aware glow
    opacity: 0,
    zIndex: 0,
  },
});

export default PingAnimation; 