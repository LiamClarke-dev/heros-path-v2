import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ROUTES_STORAGE_KEY = '@saved_routes';

export default function PastJourneysScreen({ navigation }) {
  const [journeys, setJourneys] = useState([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadJourneys);
    return unsubscribe;
  }, [navigation]);

  async function loadJourneys() {
    const stored = await AsyncStorage.getItem(ROUTES_STORAGE_KEY);
    const raw = stored ? JSON.parse(stored) : [];
    setJourneys(
      raw.map((entry, idx) =>
        Array.isArray(entry)
          ? { id: String(idx), coords: entry, date: new Date().toISOString() }
          : entry
      )
    );
  }

  const deleteJourney = (id) => {
    Alert.alert(
      'Delete Journey?',
      'Are you sure you want to delete this journey?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updated = journeys.filter(j => j.id !== id);
            setJourneys(updated);
            AsyncStorage.setItem(ROUTES_STORAGE_KEY, JSON.stringify(updated))
              .catch(err => console.error(err));
          },
        },
      ]
    );
  };

  const renderItem = ({ item, index }) => {
    const d = new Date(item.date);
    const dateStr = d.toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    });
    const timeStr = d.toLocaleTimeString(undefined, {
      hour: '2-digit', minute: '2-digit'
    });
    const label = `Journey #${index+1} – ${dateStr} at ${timeStr}`;

    // Dummy completion status - in real app, this would come from storage
    const isCompleted = index % 2 === 0; // Every other journey is "completed" for demo

    return (
      <View style={styles.item}>
        <TouchableOpacity
          style={styles.info}
          onPress={() =>
            navigation.navigate('Map', { routeToDisplay: item })
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
            navigation.navigate('Discoveries', { selectedRoute: item })
          }
        >
          <Text style={[styles.reviewText, isCompleted && styles.reviewTextCompleted]}>
            {isCompleted ? '🔍 Reviewed' : '🔍 Review'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteJourney(item.id)}
        >
          <Text style={styles.deleteText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Oldest-first
  const sorted = [...journeys].sort((a, b) => a.id.localeCompare(b.id));

  return (
    <View style={styles.container}>
      {sorted.length === 0 ? (
        <Text style={styles.empty}>No past journeys yet.</Text>
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
});
