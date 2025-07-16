/*
 * PING STATS COMPONENT
 * ====================
 * 
 * PURPOSE:
 * This component displays detailed information about the user's ping usage and statistics.
 * It shows credits remaining, total pings used, monthly limits, and provides educational
 * information about how the ping feature works. Think of it as the "dashboard" for the
 * ping feature that helps users understand their usage and learn how to use the system
 * effectively.
 * 
 * FUNCTIONALITY:
 * - Displays a compact stats button showing credits remaining and status icon
 * - Opens a detailed modal with full ping statistics and information
 * - Shows color-coded credit status (green=plenty, yellow=medium, red=low)
 * - Automatically refreshes stats every 5 seconds to stay current
 * - Provides educational content about how ping works and usage tips
 * - Shows cooldown time, monthly limits, and total usage
 * - Includes refresh functionality to update stats manually
 * 
 * WHY IT EXISTS:
 * The ping feature has complex rules (credits, cooldowns, monthly limits) that users
 * need to understand to use effectively. This component makes those rules transparent
 * and helps users track their usage. Without good stats, users would be confused
 * about why ping sometimes doesn't work or when they'll get more credits.
 * 
 * RELATIONSHIPS:
 * - Used alongside PingButton.js to show detailed usage information
 * - Fetches data from PingService.js to get current user stats
 * - Uses UserContext for current user identification
 * - Uses ThemeContext for consistent styling across app themes
 * - Complementary to PingButton which shows minimal stats
 * 
 * REFERENCED BY:
 * - MapScreen.js (likely displayed near the PingButton)
 * - Settings screens (for ping management)
 * - Any screen that needs to show ping usage information
 * 
 * REFERENCES:
 * - PingService.js (to fetch ping statistics and check limits)
 * - UserContext.js (for user identification)
 * - ThemeContext.js (for styling and colors)
 * - Logger.js (for error logging and debugging)
 * 
 * IMPORTANCE TO APP:
 * High - While not as critical as PingButton itself, this component is essential
 * for user education and preventing frustration. Users need to understand the ping
 * system to use it effectively. Good stats display leads to better feature adoption.
 * 
 * IMPROVEMENT SUGGESTIONS:
 * 1. Add usage charts - show ping usage over time with simple graphs
 * 2. Add success rate tracking - show percentage of pings that found places
 * 3. Add location-based insights - show best areas/times for successful pings
 * 4. Implement usage predictions - predict when user will run out of credits
 * 5. Add comparative stats - show usage vs other users (anonymized)
 * 6. Add achievement integration - show ping-related achievements and progress
 * 7. Include ping history - list recent pings with results and locations
 * 8. Add smart notifications - remind users when credits reset or cooldown ends
 * 9. Implement usage optimization tips - suggest better timing or locations
 * 10. Add export functionality - let users export their ping history
 * 11. Include cost analysis - show API costs saved through proper usage
 * 12. Add seasonal insights - show how ping success varies by season/weather
 * 13. Implement streak tracking - encourage consistent but moderate ping usage
 * 14. Add social features - compare stats with friends (opt-in)
 * 15. Include troubleshooting guide - help users solve common ping issues
 */

// components/PingStats.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PingService from '../services/PingService';
import { useUser } from '../contexts/UserContext';
import { Colors, Spacing, Typography, Layout, getFallbackTheme } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';
import Logger from '../utils/Logger';

const PingStats = ({ style, onPingUsed }) => {
  const { user } = useUser();
  const { getCurrentThemeColors } = useTheme();
  const colors = (typeof getCurrentThemeColors === 'function' ? getCurrentThemeColors() : null) || getFallbackTheme();
  
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadStats();
    }
  }, [user?.uid]);

  // Refresh stats every 5 seconds to keep them current
  useEffect(() => {
    if (!user?.uid) return;
    
    const interval = setInterval(() => {
      loadStats();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [user?.uid]);

  // Listen for ping usage events
  useEffect(() => {
    if (onPingUsed) {
      // Refresh stats when ping is used
      const timeout = setTimeout(() => {
        loadStats();
      }, 1000); // Small delay to ensure data is updated
      
      return () => clearTimeout(timeout);
    }
  }, [onPingUsed]);

  const loadStats = async () => {
    if (!user?.uid) return;
    
    setIsLoading(true);
    try {
      const pingStats = await PingService.getPingStats(user.uid);
      setStats(pingStats);
    } catch (error) {
      Logger.error('PING_STATS', 'Failed to load ping stats', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadStats();
  };

  const handleInfoPress = () => {
    setShowModal(true);
  };

  const getCreditsColor = () => {
    if (!stats) return colors.textSecondary;
    const percentage = (stats.creditsRemaining / stats.maxCreditsPerMonth) * 100;
    if (percentage <= 20) return colors.error;
    if (percentage <= 50) return colors.warning;
    return colors.progress;
  };

  const getCreditsIcon = () => {
    if (!stats) return 'help-circle-outline';
    const percentage = (stats.creditsRemaining / stats.maxCreditsPerMonth) * 100;
    if (percentage <= 20) return 'warning-outline';
    if (percentage <= 50) return 'alert-circle-outline';
    return 'checkmark-circle-outline';
  };

  // Create styles inside component to access colors
  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
    },
    statsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statsText: {
      fontSize: 12,
      fontWeight: '600',
      marginHorizontal: 4,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 16,
      width: '90%',
      maxHeight: '80%',
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    modalBody: {
      padding: 20,
    },
    statRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    statLabel: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      marginLeft: 12,
    },
    statValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
    },
    infoSection: {
      marginTop: 24,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 12,
    },
    infoText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 8,
    },
    modalFooter: {
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      alignItems: 'center',
    },
    refreshButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.backgroundSecondary,
    },
    refreshButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
      marginLeft: 4,
    },
  });

  if (!stats) {
    return (
      <View style={[styles.container, style]}>
        <TouchableOpacity 
          style={styles.statsButton} 
          onPress={handleRefresh}
          disabled={isLoading}
        >
          <Ionicons name="refresh" size={16} color={colors.textSecondary} />
          <Text style={styles.statsText}>Loading...</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity 
        style={styles.statsButton} 
        onPress={handleInfoPress}
      >
        <Ionicons 
          name={getCreditsIcon()} 
          size={16} 
          color={getCreditsColor()} 
        />
        <Text style={[styles.statsText, { color: getCreditsColor() }]}>
          {stats.creditsRemaining}/{stats.maxCreditsPerMonth}
        </Text>
        <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ping Statistics</Text>
              <TouchableOpacity 
                onPress={() => setShowModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.statRow}>
                <Ionicons name="radio-outline" size={20} color={colors.primary} />
                <Text style={styles.statLabel}>Credits Remaining:</Text>
                <Text style={[styles.statValue, { color: getCreditsColor() }]}>
                  {stats.creditsRemaining}
                </Text>
              </View>

              <View style={styles.statRow}>
                <Ionicons name="radio" size={20} color={colors.textSecondary} />
                <Text style={styles.statLabel}>Total Pings Used:</Text>
                <Text style={styles.statValue}>{stats.totalPingsUsed}</Text>
              </View>

              <View style={styles.statRow}>
                <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.statLabel}>Monthly Limit:</Text>
                <Text style={styles.statValue}>{stats.maxCreditsPerMonth}</Text>
              </View>

              <View style={styles.statRow}>
                <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.statLabel}>Cooldown:</Text>
                <Text style={styles.statValue}>{stats.cooldownTime / 1000}s</Text>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>How Ping Works</Text>
                <Text style={styles.infoText}>
                  • Tap the ping button during walks to discover nearby places
                </Text>
                <Text style={styles.infoText}>
                  • Each ping costs 1 credit and has a 10-second cooldown
                </Text>
                <Text style={styles.infoText}>
                  • Credits reset monthly (50 credits per month)
                </Text>
                <Text style={styles.infoText}>
                  • Pings are stored temporarily and merged with route discoveries
                </Text>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>Tips</Text>
                <Text style={styles.infoText}>
                  • Use pings when you want to discover places mid-walk
                </Text>
                <Text style={styles.infoText}>
                  • Route discoveries happen automatically when you finish walking
                </Text>
                <Text style={styles.infoText}>
                  • All discoveries are consolidated and deduplicated
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={() => {
                  loadStats();
                  setShowModal(false);
                }}
              >
                <Ionicons name="refresh" size={16} color={colors.primary} />
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default PingStats; 