// components/PingAnimation.js
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

const PingAnimation = ({ 
  isVisible, 
  onAnimationComplete,
  style,
  animationType = 'ripple' // 'ripple', 'pulse', 'radar', 'particles'
}) => {
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
  ]).current;

  useEffect(() => {
    if (isVisible) {
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(1);
      rotationAnim.setValue(0);
      particleAnims.forEach(anim => anim.setValue(0));

      switch (animationType) {
        case 'ripple':
          playRippleAnimation();
          break;
        case 'pulse':
          playPulseAnimation();
          break;
        case 'radar':
          playRadarAnimation();
          break;
        case 'particles':
          playParticleAnimation();
          break;
        default:
          playRippleAnimation();
      }
    }
  }, [isVisible, animationType]);

  const playRippleAnimation = () => {
    // Create ripple effect with multiple rings - faster and larger
    const ring1 = Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 2,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(rotationAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]);

    const ring2 = Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 4,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(rotationAnim, {
        toValue: 2,
        duration: 400,
        useNativeDriver: true,
      }),
    ]);

    const ring3 = Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 6,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(rotationAnim, {
        toValue: 3,
        duration: 500,
        useNativeDriver: true,
      }),
    ]);

    Animated.sequence([ring1, ring2, ring3]).start(() => {
      if (onAnimationComplete) onAnimationComplete();
    });
  };

  const playPulseAnimation = () => {
    // Simple pulse effect - faster and larger
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onAnimationComplete) onAnimationComplete();
    });

    Animated.timing(opacityAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  const playRadarAnimation = () => {
    // Radar sweep effect - faster and larger
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 5,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(rotationAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onAnimationComplete) onAnimationComplete();
    });
  };

  const playParticleAnimation = () => {
    // Particle burst effect - faster and larger
    const particleAnimations = particleAnims.map((anim, index) => {
      const angle = (index * 60) * (Math.PI / 180);
      const distance = 100; // Increased distance
      
      return Animated.parallel([
        Animated.timing(anim, {
          toValue: 1,
          duration: 400, // Faster
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 400, // Faster
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(particleAnimations).start(() => {
      if (onAnimationComplete) onAnimationComplete();
    });
  };

  if (!isVisible) {
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
                inputRange: [0, 3],
                outputRange: ['0deg', '360deg'],
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
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
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
        const angle = (index * 60) * (Math.PI / 180);
        const distance = 100; // Increased distance
        
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
              outputRange: [1, 1.5],
            }) }],
            opacity: opacityAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.8, 0.4, 0],
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
    width: 200, // Increased container size
    height: 200,
  },
  ripple: {
    position: 'absolute',
    width: 40, // Larger ripple
    height: 40,
    borderRadius: 20,
    borderWidth: 3, // Thicker border
    borderColor: '#4A90E2',
    backgroundColor: 'rgba(74, 144, 226, 0.2)', // More visible
  },
  pulse: {
    position: 'absolute',
    width: 60, // Larger pulse
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(74, 144, 226, 0.4)', // More visible
  },
  radar: {
    position: 'absolute',
    width: 80, // Larger radar
    height: 80,
    borderRadius: 40,
    borderWidth: 4, // Thicker border
    borderColor: '#4A90E2',
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  particle: {
    position: 'absolute',
    width: 12, // Larger particles
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4A90E2',
  },
  centerPulse: {
    position: 'absolute',
    width: 16, // Larger center pulse
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4A90E2',
  },
});

export default PingAnimation; 