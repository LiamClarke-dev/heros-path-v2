/*
  PastJourneysScreen.js
  ----------------------
  What this page does:
  - Displays a list of the user's past journeys, including details like distance, duration, and completion status.
  - Allows users to delete journeys and navigate to the Discoveries screen for a specific journey.

  Why this page exists & its importance:
  - Provides users with a history of their recorded journeys, encouraging reflection and continued engagement.
  - Acts as a bridge between journey tracking and discovery management.

  References & dependencies:
  - Uses JourneyService and DiscoveryService for data.
  - Relies on the theme system (useTheme) and user context.
  - Uses UI components like Card, ListItem, AppButton, SectionHeader.
  - Integrates with navigation to link to DiscoveriesScreen.

  Suggestions for improvement:
  - Add more comments explaining the journey transformation and deletion logic.
  - Ensure all color and style values use the theme system (avoid hardcoded values).
  - Consider paginating or virtualizing the list for better performance with many journeys.
  - Improve accessibility for list items and action buttons.
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
          subtitle={`Distance: ${item.distance}m | Duration: ${Math.round(item.duration / 60)} min`}
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
