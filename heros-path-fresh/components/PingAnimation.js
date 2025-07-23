/*
 * PING ANIMATION COMPONENT
 * ========================
 * 
 * PURPOSE:
 * This component creates visual animations that play when users tap the "ping" button 
 * during walks to discover nearby places. It provides immediate visual feedback to show 
 * that the ping action is working, making the experience feel more interactive and 
 * responsive. Now uses Lottie animations for smooth, professional-looking effects.
 * 
 * FUNCTIONALITY:
 * - Uses Lottie animation from "ping-animation.lottie" for smooth, professional effects
 * - Supports theming through ThemeContext for consistent app appearance
 * - Covers full screen with pointer events disabled to avoid interference
 * - Automatically calls completion callback when animation finishes
 * - Provides fallback for devices that don't support Lottie
 * 
 * WHY IT EXISTS:
 * The ping feature is a core part of the app's gamification - users can actively 
 * discover places during walks rather than waiting until the end. Visual feedback 
 * makes this feel like a "special power" being activated, enhancing user engagement.
 * Lottie animations provide smooth, professional-looking effects that enhance the user experience.
 * 
 * CURRENT STATUS:
 * HOTFIX: Temporarily using fallback animation due to Lottie compatibility issues.
 * 
 * RELATIONSHIPS:
 * - Used by MapScreen.js when users tap the ping button during active walks
 * - Uses ThemeContext for color theming that matches the current app theme
 * - Called by PingButton.js component as visual feedback
 * - Demonstrated in AnimationDemo.js for testing and selection
 * 
 * REFERENCED BY:
 * - MapScreen.js (main usage during walks)
 * - AnimationDemo.js (for testing and demonstration)
 * - PingButton.js (triggers the animation)
 * 
 * REFERENCES:
 * - ThemeContext.js (for theme-aware colors)
 * - Lottie React Native (for smooth animations)
 * - Dimensions API (for screen size calculations)
 * 
 * IMPORTANCE TO APP:
 * High importance for user experience - The ping feature is a key differentiator of the app,
 * and smooth Lottie animations make it feel responsive and engaging. Without good visual 
 * feedback, users may think it's broken or unresponsive.
 * 
 * IMPROVEMENT SUGGESTIONS:
 * 1. Add haptic feedback - vibration on animation start/end for tactile feedback
 * 2. Add sound effects - audio cues to make animations feel more impactful
 * 3. Add battery consideration - reduce animation complexity on low battery
 * 4. Add reduced motion support - simpler animations for accessibility
 * 5. Add user preferences - let users choose animation intensity or disable
 * 6. Add animation interrupt handling - what happens if user pings rapidly
 * 7. Add background/foreground handling - pause animations when app backgrounded
 * 8. Test on various device sizes and performance levels
 * 9. Consider multiple Lottie animations for different ping types
 * 10. Add animation caching for better performance
 */

// components/PingAnimation.js
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Platform, Text, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getFallbackTheme } from '../styles/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// HOTFIX: Disable Lottie due to import compatibility issues
// Using reliable fallback animation to prevent app crashes
const ANIMATIONS_ENABLED = true;
const USE_LOTTIE = false; // Temporarily disabled to prevent crashes

const PingAnimation = ({ 
  isVisible, 
  onAnimationComplete,
  style,
  animationType = 'fallback' // Changed default to fallback
}) => {
  const { getCurrentThemeColors } = useTheme();
  const themeColors = getCurrentThemeColors() || getFallbackTheme();
  
  const [animationFinished, setAnimationFinished] = useState(false);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Create styles inside component to access colors
  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      justifyContent: 'center',
      alignItems: 'center',
      width: screenWidth,
      height: screenHeight,
      zIndex: 1000,
      backgroundColor: 'transparent',
    },
    fallbackContainer: {
      position: 'absolute',
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: `${themeColors.primary}15`,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: `${themeColors.primary}60`,
    },
    fallbackText: {
      color: themeColors.primary,
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
      marginTop: 8,
    },
    fallbackPulse: {
      position: 'absolute',
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: `${themeColors.primary}08`,
      borderWidth: 2,
      borderColor: `${themeColors.primary}40`,
    },
    fallbackInnerPulse: {
      position: 'absolute',
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: `${themeColors.primary}12`,
      borderWidth: 1,
      borderColor: `${themeColors.primary}30`,
    },
    scanIcon: {
      fontSize: 32,
      marginBottom: 4,
    },
  });

  useEffect(() => {
    if (isVisible && ANIMATIONS_ENABLED) {
      setAnimationFinished(false);
      
      // Start fallback animation
      startFallbackAnimation();
    } else if (isVisible && !ANIMATIONS_ENABLED) {
      // Animations disabled - just call completion immediately
      if (onAnimationComplete) {
        setTimeout(() => onAnimationComplete(), 100);
      }
    }
  }, [isVisible, animationType, onAnimationComplete]);

  const startFallbackAnimation = () => {
    // Reset animations
    pulseAnim.setValue(0);
    fadeAnim.setValue(0);

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      { iterations: 2 }
    ).start(() => {
      // Fade out and complete
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        handleAnimationFinish();
      });
    });
  };

  const handleAnimationFinish = () => {
    setAnimationFinished(true);
    if (onAnimationComplete) {
      onAnimationComplete();
    }
  };

  const renderFallbackAnimation = () => {
    const pulseScale = pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.3],
    });

    const innerPulseScale = pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.5],
    });

    return (
      <Animated.View 
        style={[
          styles.fallbackContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: pulseScale }],
          }
        ]}
      >
        <Animated.View 
          style={[
            styles.fallbackPulse,
            {
              transform: [{ scale: pulseScale }],
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.fallbackInnerPulse,
            {
              transform: [{ scale: innerPulseScale }],
            }
          ]} 
        />
        <Text style={styles.scanIcon}>🎯</Text>
        <Text style={styles.fallbackText}>Scanning{'\n'}Nearby Places</Text>
      </Animated.View>
    );
  };

  if (!isVisible) {
    return null;
  }

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {renderFallbackAnimation()}
    </View>
  );
};

export default PingAnimation; 