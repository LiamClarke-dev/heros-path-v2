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
 * ANIMATIONS_ENABLED is set to true, using Lottie animation for smooth effects.
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
import { View, StyleSheet, Dimensions, Platform, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getFallbackTheme } from '../styles/theme';

// Import Lottie with fallback for unsupported platforms
let LottieView;
try {
  LottieView = require('lottie-react-native').default;
} catch (error) {
  console.warn('Lottie not available, using fallback animation');
  LottieView = null;
}

// Define safe fallback colors for modules constants
const colors = getFallbackTheme();

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ANIMATION ENABLED - Using Lottie for smooth, professional effects
const ANIMATIONS_ENABLED = true;

const PingAnimation = ({ 
  isVisible, 
  onAnimationComplete,
  style,
  animationType = 'lottie' // Now defaults to 'lottie'
}) => {
  const { getCurrentThemeColors } = useTheme();
  const themeColors = getCurrentThemeColors() || colors;
  
  const [animationFinished, setAnimationFinished] = useState(false);
  const lottieRef = useRef(null);

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
    lottieContainer: {
      width: screenWidth,
      height: screenHeight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    fallbackContainer: {
      position: 'absolute',
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: `${themeColors.primary}20`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    fallbackText: {
      color: themeColors.primary,
      fontSize: 16,
      fontWeight: 'bold',
    },
  });

  useEffect(() => {
    if (isVisible && ANIMATIONS_ENABLED) {
      setAnimationFinished(false);
      
      if (LottieView && lottieRef.current) {
        // Play the Lottie animation
        lottieRef.current.play();
      } else {
        // Fallback for devices without Lottie support
        setTimeout(() => {
          setAnimationFinished(true);
          if (onAnimationComplete) {
            onAnimationComplete();
          }
        }, 2000);
      }
    } else if (isVisible && !ANIMATIONS_ENABLED) {
      // Animations disabled - just call completion immediately
      if (onAnimationComplete) {
        setTimeout(() => onAnimationComplete(), 100);
      }
    }
  }, [isVisible, animationType]);

  const handleAnimationFinish = () => {
    setAnimationFinished(true);
    if (onAnimationComplete) {
      onAnimationComplete();
    }
  };

  const renderLottieAnimation = () => {
    if (!LottieView) {
      return (
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackText}>Ping!</Text>
        </View>
      );
    }

         return (
       <LottieView
         ref={lottieRef}
         source={require('../assets/Scanning nearby.lottie')}
         style={styles.lottieContainer}
         autoPlay={false}
         loop={false}
         speed={1}
         onAnimationFinish={handleAnimationFinish}
         resizeMode="cover"
       />
     );
  };

  if (!isVisible) {
    return null;
  }

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {renderLottieAnimation()}
    </View>
  );
};

export default PingAnimation; 