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
import JourneyService from '../services/JourneyService';
import DiscoveryService from '../services/DiscoveryService';
import { useFocusEffect } from '@react-navigation/native';

export default function PastJourneysScreen({ navigation }) {
  const [journeys, setJourneys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [journeyStatuses, setJourneyStatuses] = useState({});
  const { user, migrationStatus } = useUser();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadJourneys);
    return unsubscribe;
  }, [navigation]);

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

  const deleteAllJourneys = async () => {
    Alert.alert(
      'Delete ALL Journeys?',
      'This will permanently delete ALL your journeys and all associated data (discoveries, dismissed places, etc.). This action cannot be undone.\n\nAre you sure you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'DELETE ALL',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await JourneyService.deleteAllJourneys(user.uid);
              Alert.alert('Success', `Deleted ${result.deletedCount} journeys and all associated data.`);
              // Reload journeys to reflect the change
              await loadJourneys();
            } catch (error) {
              console.error('Error deleting all journeys:', error);
              Alert.alert('Error', 'Failed to delete all journeys');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item, index }) => {
    const d = item.dateObj || new Date(item.date);
    const dateStr = d.toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    });
    const timeStr = d.toLocaleTimeString(undefined, {
      hour: '2-digit', minute: '2-digit'
    });
    
    // Use journey name if available, otherwise generate label
    const label = item.name || `Journey #${index+1} – ${dateStr} at ${timeStr}`;

    // Get completion status from pre-computed state
    const isCompleted = journeyStatuses[item.id] || false;
    const isLoadingStatus = !(item.id in journeyStatuses);

    return (
      <View style={styles.item}>
        <TouchableOpacity
          style={styles.info}
          onPress={() =>
            navigation.navigate('Map', { routeToDisplay: { ...item, dateObj: undefined } })
          }
        >
          <View style={styles.infoRow}>
            <Text style={styles.label}>{label}</Text>
            {isCompleted && <Text style={styles.completedIcon}>✅</Text>}
          </View>
          <Text style={styles.sub}>{item.coords.length} points</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.reviewButton, isCompleted && styles.reviewButtonCompleted]}
          onPress={() =>
            navigation.navigate('Discoveries', { selectedRoute: { ...item, dateObj: undefined } })
          }
        >
          <Text style={[styles.reviewText, isCompleted && styles.reviewTextCompleted]}>
            {isLoadingStatus ? '...' : (isCompleted ? '✅ All Reviewed' : '🔍 Review')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteJourney(item.id)}
        >
          <MaterialIcons name="more-vert" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    );
  };

  // Oldest-first
  const sorted = [...journeys].sort((a, b) => a.id.localeCompare(b.id));

  return (
    <View style={styles.container}>
      {/* Temporary development button - REMOVE BEFORE PRODUCTION */}
      <TouchableOpacity
        style={styles.deleteAllButton}
        onPress={deleteAllJourneys}
      >
        <Text style={styles.deleteAllButtonText}>🗑️ DELETE ALL JOURNEYS (DEV)</Text>
      </TouchableOpacity>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading journeys...</Text>
        </View>
      ) : sorted.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.empty}>No past journeys yet.</Text>
          {migrationStatus && !migrationStatus.hasMigrated && (
            <Text style={styles.migrationNote}>
              Your data will be migrated to the cloud when you sign in.
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={item => item.id}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16,
    backgroundColor: '#f5f5f5', // Light gray background
  },
  empty: { 
    textAlign: 'center', 
    marginTop: 20,
    color: '#666',
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
    color: '#666',
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
  completedIcon: {
    fontSize: 16,
    color: '#28a745', // A green color for completed
    marginLeft: 8,
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
  reviewText: {
    fontSize: 12,
    color:    '#1976d2', // A blue color for review
    fontWeight: '500',
  },
  reviewTextCompleted: {
    color: '#2e7d32', // Darker green for completed
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
  deleteAllButton: {
    backgroundColor: '#ff9800',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 10,
  },
  deleteAllButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
