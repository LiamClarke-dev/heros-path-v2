/*
 * SPRITE WITH GPS INDICATOR COMPONENT
 * ==================================
 * 
 * PURPOSE:
 * This component renders the Link sprite with visual feedback for GPS states.
 * It handles smooth transitions between different GPS states and provides
 * visual indicators for GPS signal strength.
 * 
 * FUNCTIONALITY:
 * - Renders the Link sprite with appropriate animation based on movement direction
 * - Provides visual feedback for GPS signal strength (good, weak, lost)
 * - Handles smooth transitions between different sprite states
 * - Ensures consistent rendering on both Android and iOS
 */

import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import Logger from '../utils/Logger';

// GPS state constants
const GPS_STATE = {
  GOOD: 'good',
  WEAK: 'weak',
  LOST: 'lost'
};

const SpriteWithGpsIndicator = ({ 
  spriteSource, 
  gpsAccuracy = null,
  isMoving = false,
  size = 32
}) => {
  const { getCurrentThemeColors } = useTheme();
  const colors = getCurrentThemeColors();
  
  // Animation values for smooth transitions
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  
  // Determine GPS state based on accuracy
  const getGpsState = (accuracy) => {
    if (accuracy === null) return GPS_STATE.GOOD;
    if (accuracy > 50) return GPS_STATE.LOST;
    if (accuracy > 15) return GPS_STATE.WEAK;
    return GPS_STATE.GOOD;
  };
  
  const gpsState = getGpsState(gpsAccuracy);
  
  // Handle animations when GPS state or movement changes
  useEffect(() => {
    // Reset animations
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 0,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 0,
        useNativeDriver: true
      })
    ]).start();
    
    // Apply animations based on GPS state
    if (gpsState === GPS_STATE.WEAK) {
      // Subtle pulse animation for weak GPS
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: true
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true
          })
        ])
      ).start();
    } else if (gpsState === GPS_STATE.LOST) {
      // More pronounced pulse animation for lost GPS
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.5,
            duration: 500,
            useNativeDriver: true
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.8,
            duration: 500,
            useNativeDriver: true
          })
        ])
      ).start();
      
      // Add subtle scale animation for lost GPS
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 0.9,
            duration: 800,
            useNativeDriver: true
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true
          })
        ])
      ).start();
    }
    
    // Start pulse animation for GPS indicator
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true
        })
      ])
    ).start();
    
    // Cleanup animations on unmount
    return () => {
      opacityAnim.stopAnimation();
      scaleAnim.stopAnimation();
      pulseAnim.stopAnimation();
    };
  }, [gpsState, isMoving]);
  
  // Calculate sprite tint color based on GPS state
  const getTintColor = () => {
    switch (gpsState) {
      case GPS_STATE.WEAK:
        return colors?.warning || '#FFA500'; // Orange for weak GPS
      case GPS_STATE.LOST:
        return colors?.error || '#FF0000'; // Red for lost GPS
      default:
        return null; // No tint for good GPS
    }
  };
  
  // Get GPS indicator icon and color
  const getGpsIndicator = () => {
    switch (gpsState) {
      case GPS_STATE.WEAK:
        return {
          name: 'gps-not-fixed',
          color: colors?.warning || '#FFA500'
        };
      case GPS_STATE.LOST:
        return {
          name: 'gps-off',
          color: colors?.error || '#FF0000'
        };
      default:
        return null; // No indicator for good GPS
    }
  };
  
  const gpsIndicator = getGpsIndicator();
  const tintColor = getTintColor();
  
  // Calculate indicator pulse scale
  const indicatorScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2]
  });
  
  // Debug the sprite rendering
  Logger.debug('Rendering sprite with source:', {
    hasSource: !!spriteSource,
    gpsState,
    accuracy: gpsAccuracy,
    isMoving
  });
  
  return (
    <View style={styles.container}>
      {/* Animated sprite */}
      <Animated.View
        style={[
          styles.spriteWrapper,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        {spriteSource && (
          <Image
            source={spriteSource}
            style={[
              styles.spriteImage,
              { width: size / 2, height: size },
              tintColor ? { tintColor } : null
            ]}
            resizeMode="contain"
            // Force GIF rendering in production builds
            fadeDuration={0}
          />
        )}
      </Animated.View>
      
      {/* GPS indicator (only shown for weak or lost GPS) */}
      {gpsIndicator && (
        <Animated.View
          style={[
            styles.gpsIndicator,
            {
              transform: [{ scale: indicatorScale }],
              backgroundColor: colors?.cardBackground || '#FFFFFF'
            }
          ]}
        >
          <MaterialIcons
            name={gpsIndicator.name}
            size={12}
            color={gpsIndicator.color}
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spriteWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spriteImage: {
    width: 16,
    height: 32,
    resizeMode: 'contain',
  },
  gpsIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
});

export default SpriteWithGpsIndicator;