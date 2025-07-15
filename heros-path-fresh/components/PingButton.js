/*
 * PING BUTTON COMPONENT
 * =====================
 * 
 * PURPOSE:
 * This component renders the interactive button that users tap during walks to "ping"
 * for nearby places. It handles the entire ping workflow: checking eligibility (cooldowns,
 * credits), making API calls to discover places, providing visual feedback, and managing
 * user limits. Think of it as the "special power" button in a game that lets users
 * actively discover places rather than waiting until their walk ends.
 * 
 * FUNCTIONALITY:
 * - Displays a circular button with radio icon and credit counter
 * - Checks if user can ping (has credits, not in cooldown)
 * - Shows visual states: normal, loading, disabled, cooldown countdown
 * - Makes API calls to PingService to discover nearby places
 * - Manages 10-second cooldown timer and 50 monthly credits
 * - Provides visual feedback (pulsing when credits low, countdown display)
 * - Shows loading spinner during API calls
 * - Triggers onPingStart callback immediately for responsive UI
 * 
 * WHY IT EXISTS:
 * The ping feature is a core differentiator of Hero's Path - instead of only discovering
 * places at the end of walks, users can actively explore during their journey. This 
 * component makes that feature accessible and provides all the necessary feedback and
 * limitations to prevent abuse while maintaining engagement.
 * 
 * RELATIONSHIPS:
 * - Used by MapScreen.js during active walks (main usage)
 * - Works with PingService.js to make API calls and check eligibility
 * - Uses UserContext to get current user information
 * - Uses ThemeContext for consistent styling
 * - Triggers PingAnimation.js for visual feedback (via onPingStart callback)
 * - Displays PingStats.js information in compact form
 * 
 * REFERENCED BY:
 * - MapScreen.js (primary usage location)
 * - Any screen that might want to offer ping functionality
 * 
 * REFERENCES:
 * - PingService.js (API calls and eligibility checking)
 * - UserContext.js (current user information)
 * - ThemeContext.js (styling and colors)
 * - Logger.js (debugging and monitoring)
 * 
 * IMPORTANCE TO APP:
 * Very High - This is the primary interface for one of the app's key features.
 * The ping button is what makes Hero's Path interactive rather than just a passive
 * tracking app. Without this working well, users lose a major reason to use the app.
 * 
 * IMPROVEMENT SUGGESTIONS:
 * 1. Add haptic feedback on button press for tactile confirmation
 * 2. Add visual preview of ping radius on map when button is pressed
 * 3. Implement progressive disclosure - show more info when credits are low
 * 4. Add offline queueing - queue pings when offline and send when connected
 * 5. Add location accuracy warning - warn if GPS accuracy is poor
 * 6. Implement smart cooldown - shorter cooldown for premium users or special events
 * 7. Add ping history - show recent ping results and success rate
 * 8. Implement batch pinging - allow multiple pings with single API call
 * 9. Add contextual tips - explain why ping might be disabled
 * 10. Add achievement integration - unlock special pings for milestones
 * 11. Improve error messages - more specific feedback for different failure types
 * 12. Add ping scheduling - let users schedule automatic pings at intervals
 * 13. Consider credit purchase options - in-app purchase for more credits
 * 14. Add location-based ping suggestions - suggest when in interesting areas
 */

// components/PingButton.js
import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Alert,
  ActivityIndicator,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PingService from '../services/PingService';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { getFallbackTheme } from '../styles/theme';
import Logger from '../utils/Logger';

const PingButton = ({ 
  currentLocation, 
  onPingStart,
  onPingSuccess, 
  onPingError,
  style,
  disabled = false,
  journeyId = null
}) => {
  const { user } = useUser();
  const { getCurrentThemeColors } = useTheme();
  const colors = getCurrentThemeColors() || getFallbackTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [creditsRemaining, setCreditsRemaining] = useState(50);
  const [pulseAnim] = useState(new Animated.Value(1));

  // Check eligibility on mount and when user changes
  useEffect(() => {
    if (user?.uid) {
      checkEligibility();
    }
  }, [user?.uid]);

  // Cooldown timer
  useEffect(() => {
    let interval;
    if (cooldownRemaining > 0) {
      interval = setInterval(() => {
        setCooldownRemaining(prev => {
          if (prev <= 1) {
            checkEligibility();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldownRemaining]);

  // Pulse animation when credits are low
  useEffect(() => {
    if (creditsRemaining <= 5 && creditsRemaining > 0) {
      const pulse = Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]);
      Animated.loop(pulse).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [creditsRemaining]);

  const checkEligibility = async () => {
    try {
      if (!user?.uid) return;
      
      const eligibility = await PingService.checkPingEligibility(user.uid);
      
      if (eligibility.canPing) {
        setCooldownRemaining(0);
        setCreditsRemaining(eligibility.creditsRemaining);
      } else {
        if (eligibility.reason === 'cooldown') {
          setCooldownRemaining(eligibility.cooldownRemaining);
          setCreditsRemaining(eligibility.creditsRemaining);
        } else if (eligibility.reason === 'no_credits') {
          setCooldownRemaining(0);
          setCreditsRemaining(0);
        }
      }
    } catch (error) {
      Logger.error('PING_BUTTON', 'Failed to check eligibility', error);
    }
  };

  const handlePing = async () => {
    if (!user?.uid || !journeyId || !currentLocation || disabled) {
      return;
    }

    setIsLoading(true);
    
    // Trigger onPingStart callback immediately
    if (onPingStart) {
      onPingStart();
    }
    
    try {
      Logger.debug('PING_BUTTON', 'Initiating ping', {
        userId: user.uid,
        journeyId: journeyId,
        location: currentLocation
      });

      const result = await PingService.pingNearbyPlaces(
        user.uid,
        journeyId,
        currentLocation
      );

      if (result.error) {
        handlePingError(result);
      } else {
        handlePingSuccess(result);
      }
    } catch (error) {
      Logger.error('PING_BUTTON', 'Ping failed', error);
      handlePingError({ error: 'ping_failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePingSuccess = (result) => {
    setCreditsRemaining(result.creditsRemaining);
    setCooldownRemaining(10); // 10 second cooldown
    
    Logger.info('PING_BUTTON', 'Ping successful', {
      placesFound: result.places?.length || 0,
      creditsRemaining: result.creditsRemaining
    });

    if (onPingSuccess) {
      onPingSuccess(result);
    }

    // Show success feedback
    Alert.alert(
      'Discovery Found! 🎉',
      `Found ${result.places?.length || 0} nearby places. Check your discoveries!`,
      [{ text: 'OK' }]
    );
  };

  const handlePingError = (result) => {
    let message = 'Failed to discover nearby places.';
    
    if (result.error === 'cooldown') {
      message = `Please wait ${result.cooldownRemaining} seconds before pinging again.`;
    } else if (result.error === 'no_credits') {
      message = 'You\'ve used all your monthly ping credits. Credits reset monthly.';
    } else if (result.error === 'ping_failed') {
      message = 'Network error. Please try again.';
    }

    Logger.warn('PING_BUTTON', 'Ping error', { error: result.error, message });

    if (onPingError) {
      onPingError(result);
    }

    Alert.alert('Discovery Unavailable', message, [{ text: 'OK' }]);
  };

  const isDisabled = disabled || isLoading || cooldownRemaining > 0 || creditsRemaining <= 0;
  const showCooldown = cooldownRemaining > 0;
  const showNoCredits = creditsRemaining <= 0;

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.button,
          { 
            backgroundColor: showNoCredits ? colors.inputBackground : colors.primary,
            shadowColor: colors.shadow
          },
          isDisabled && { backgroundColor: colors.secondaryText },
          showNoCredits && { borderColor: colors.border }
        ]}
        onPress={handlePing}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          {isLoading ? (
            <ActivityIndicator color={colors.buttonText} size="small" />
          ) : (
            <Ionicons 
              name="radio-outline" 
              size={24} 
              color={showNoCredits ? colors.secondaryText : colors.buttonText} 
            />
          )}
        </Animated.View>
        
        {showCooldown && (
          <Text style={[styles.cooldownText, { backgroundColor: colors.error, color: colors.onError }]}>
            {cooldownRemaining}s
          </Text>
        )}
      </TouchableOpacity>
      
      <View style={styles.infoContainer}>
        <Text style={[styles.creditsText, { color: colors.secondaryText }]}>
          {showNoCredits ? 'No credits' : `${creditsRemaining} credits`}
        </Text>
        {showCooldown && (
          <Text style={[styles.cooldownInfoText, { color: colors.secondaryText }]}>
            Cooldown: {cooldownRemaining}s
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonDisabled: {
    // Will be styled dynamically
  },
  buttonNoCredits: {
    borderWidth: 2,
    // Will be styled dynamically
  },
  cooldownText: {
    position: 'absolute',
    top: -5,
    right: -5,
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    textAlign: 'center',
  },
  infoContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  creditsText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cooldownInfoText: {
    fontSize: 10,
    marginTop: 2,
  },
});

export default PingButton; 