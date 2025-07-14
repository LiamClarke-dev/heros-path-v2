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
  const colors = getCurrentThemeColors();
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