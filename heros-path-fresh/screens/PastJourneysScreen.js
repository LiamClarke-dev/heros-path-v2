/*
 * PAST JOURNEYS SCREEN (JOURNEY HISTORY INTERFACE)
 * =================================================
 * 
 * PURPOSE:
 * This screen displays a comprehensive history of all user's completed walking journeys,
 * providing an overview of their exploration progress and achievements. It serves as
 * both a personal walking diary and a gateway to reviewing discoveries from past walks.
 * Think of it as the "adventure logbook" where users can see their walking history,
 * track completion status, and manage their journey data.
 * 
 * FUNCTIONALITY:
 * - Displays chronological list of all completed walking journeys
 * - Shows journey metadata including date, distance, duration, and route information
 * - Indicates completion status for each journey (whether discoveries have been reviewed)
 * - Provides navigation to DiscoveriesScreen for reviewing journey-specific discoveries
 * - Handles journey deletion with comprehensive data cleanup
 * - Includes development utilities for data management and testing
 * - Automatically refreshes when returning from other screens
 * - Manages loading states and error handling gracefully
 * - Uses modern UI components for consistent visual experience
 * - Integrates with user authentication and migration systems
 * 
 * WHY IT EXISTS:
 * Users need to track their walking progress and revisit past discoveries. This screen
 * provides that historical view while also serving as the entry point for completing
 * the discovery review process. It helps users understand their walking patterns,
 * celebrate their achievements, and ensures they don't miss reviewing discoveries
 * from any of their walks.
 * 
 * KEY FEATURES:
 * - Journey History: Complete chronological list of all walking sessions
 * - Completion Tracking: Visual indicators showing which journeys need discovery review
 * - Quick Navigation: Easy access to discovery review for each journey
 * - Journey Management: Delete unwanted or test journeys
 * - Progress Visualization: See walking achievements and progress over time
 * - Data Integration: Seamless integration with discovery and user management systems
 * - Development Tools: Utilities for testing and data management (dev builds only)
 * - Real-time Updates: Automatically updates when journey status changes
 * 
 * RELATIONSHIPS:
 * - Uses JourneyService.js for loading and managing journey data
 * - Integrates with DiscoveryService.js for journey completion status tracking
 * - Connects to UserContext for authentication and user data
 * - Uses ThemeContext for consistent styling and theming
 * - Navigates to DiscoveriesScreen for discovery review workflows
 * - Works with migration systems for data consistency
 * - Uses shared UI components for modern, consistent interface
 * 
 * REFERENCED BY:
 * - AppNavigator.js (as part of the Map stack navigation)
 * - MapScreen.js (users access this to review past walks)
 * - Discovery completion workflows that update journey status
 * - User authentication flows that need journey history
 * 
 * REFERENCES:
 * - JourneyService.js (for journey data management)
 * - DiscoveryService.js (for completion status tracking)
 * - UserContext.js (for authentication and user data)
 * - ThemeContext.js (for styling and theming)
 * - Navigation system (for screen transitions)
 * - UI components (Card, ListItem, AppButton, SectionHeader)
 * 
 * IMPORTANCE TO APP:
 * HIGH - This screen is important for user engagement and discovery completion.
 * It provides the historical context that makes walking feel like a journey of
 * exploration rather than just exercise. It also ensures users complete the
 * discovery review process, which is crucial for the app's value proposition.
 * Good journey history builds user attachment and long-term engagement.
 * 
 * IMPROVEMENT SUGGESTIONS:
 * 1. Add journey statistics - total distance, average speed, calories burned
 * 2. Add journey visualization - maps showing route paths and discoveries
 * 3. Add journey sharing - share interesting walks with friends or community
 * 4. Add journey categories - organize journeys by type, location, or purpose
 * 5. Add journey search - search through journey history by various criteria
 * 6. Add journey analytics - insights about walking patterns and trends
 * 7. Add journey goals - set and track walking goals and achievements
 * 8. Add journey export - export journey data to GPX, KML, or other formats
 * 9. Add journey photos - attach photos and memories to specific journeys
 * 10. Add journey notes - add personal notes and observations to journeys
 * 11. Add journey weather - show weather conditions during each walk
 * 12. Add journey comparison - compare different journeys and performance
 * 13. Add journey recommendations - suggest new routes based on history
 * 14. Add journey challenges - participate in walking challenges and competitions
 * 15. Add journey social features - like, comment, and discuss journeys with others
 * 16. Add journey backup - backup and restore journey history
 * 17. Add journey insights - AI-powered insights about walking behavior
 * 18. Add journey optimization - suggest improvements for future walks
 * 19. Add journey accessibility - better support for users with different abilities
 * 20. Add journey gamification - achievements, badges, and rewards for walking milestones
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import JourneyService from '../services/JourneyService';
import DiscoveryService from '../services/DiscoveryService';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../components/ui/Card';
import ListItem from '../components/ui/ListItem';
import AppButton from '../components/ui/AppButton';
import SectionHeader from '../components/ui/SectionHeader';

export default function PastJourneysScreen({ navigation }) {
  const [journeys, setJourneys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [journeyStatuses, setJourneyStatuses] = useState({});
  const { user, migrationStatus } = useUser();
  const { getCurrentThemeColors } = useTheme();
  const colors = getCurrentThemeColors();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadJourneys);
    return unsubscribe;
  }, [navigation]);

  // Add focus effect to refresh journeys when returning from DiscoveriesScreen
  useFocusEffect(
    React.useCallback(() => {
      loadJourneys();
    }, [user])
  );

  async function loadJourneys() {
    if (!user) {
      setJourneys([]);
      setJourneyStatuses({});
      return;
    }

    try {
      setLoading(true);
      const result = await JourneyService.getUserJourneys(user.uid);
      
      if (result.success) {
        // Transform Firestore data to match existing UI expectations
        const transformedJourneys = result.journeys.map(journey => {
          const date = journey.createdAt?.toDate?.() || new Date(journey.createdAt) || new Date();
          return {
            id: journey.id,
            coords: journey.route || [],
            date: date.toISOString(), // Convert to string for serialization
            dateObj: date, // Keep as object for display purposes
            name: journey.name,
            distance: journey.distance,
            duration: journey.duration,
            startLocation: journey.startLocation,
            endLocation: journey.endLocation,
            // Use the new completion status fields from Firestore
            isCompleted: journey.isCompleted || false,
            reviewedDiscoveriesCount: journey.reviewedDiscoveriesCount || 0,
            totalDiscoveriesCount: journey.totalDiscoveriesCount || 0,
            completionPercentage: journey.completionPercentage || 0,
          };
        });
        
        setJourneys(transformedJourneys);
        
        // Create journey statuses from the Firestore data
        const statuses = {};
        transformedJourneys.forEach(journey => {
          statuses[journey.id] = journey.isCompleted || false;
        });
        setJourneyStatuses(statuses);
      } else {
        setJourneys([]);
        setJourneyStatuses({});
      }
    } catch (error) {
      console.error('Error loading journeys:', error);
      setJourneys([]);
      setJourneyStatuses({});
    } finally {
      setLoading(false);
    }
  }

  const deleteJourney = async (id) => {
    Alert.alert(
      'Delete Journey?',
      'Are you sure you want to delete this journey?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await JourneyService.deleteJourney(user.uid, id);
              // Reload journeys to reflect the change
              await loadJourneys();
            } catch (error) {
              console.error('Error deleting journey:', error);
              Alert.alert('Error', 'Failed to delete journey');
            }
          },
        },
      ]
    );
  };



  const renderItem = ({ item, index }) => {
    const d = item.dateObj || new Date(item.date);
    const formattedDate = d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    }).replace(',', '');
    const formattedTime = d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const label = item.name || `${formattedDate} ${formattedTime}`;
    return (
      <Card style={{ marginBottom: 8 }}>
        <ListItem
          title={label}
          subtitle={`Distance: ${item.distance}m | Duration: ${Math.round(item.duration / 60000)} min`}
          right={
            <AppButton
              title="Delete"
              variant="danger"
              onPress={() => deleteJourney(item.id)}
              style={{ paddingVertical: 6, paddingHorizontal: 12, marginLeft: 8 }}
              textStyle={{ fontSize: 14 }}
            />
          }
          onPress={() => navigation.navigate('Discoveries', { journeyId: item.id })}
        />
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SectionHeader title="Past Journeys" />
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <FlatList
          data={journeys}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={() => (
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
              No journeys found.
            </Text>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16,
  },
  emptyText: { 
    textAlign: 'center', 
    marginTop: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  migrationNote: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },

  item: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize:   16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  labelCompleted: {
    color: '#28a745', // Green color for completed journeys
  },
  sub: {
    fontSize:  12,
    color:     '#666',
    marginTop: 4,
  },
  reviewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#e3f2fd',
    marginRight: 8,
  },
  reviewButtonCompleted: {
    backgroundColor: '#e8f5e8', // Light green background for completed
  },
  reviewButtonNoDiscoveries: {
    backgroundColor: '#f5f5f5', // Light gray background for no discoveries
  },
  reviewText: {
    fontSize: 12,
    color:    '#1976d2', // A blue color for review
    fontWeight: '500',
  },
  reviewTextCompleted: {
    color: '#2e7d32', // Darker green for completed
  },
  reviewTextNoDiscoveries: {
    color: '#999', // Gray color for no discoveries
  },
  deleteButton: {
    padding:     8,
    borderRadius: 6,
    backgroundColor: '#ffebee',
  },
  deleteText: {
    fontSize: 16,
    color: '#d32f2f',
  },
});
