/*
 * EXPLORATION CONTEXT
 * ===================
 * 
 * PURPOSE:
 * This React Context manages the user's exploration history by tracking which route
 * segments they have previously walked. It provides a way to remember where users
 * have been so the app can show their exploration progress over time and potentially
 * avoid suggesting the same routes repeatedly. Think of it as a memory system that
 * helps the app understand the user's walking patterns and history.
 * 
 * FUNCTIONALITY:
 * - Stores an array of explored route segments with persistent storage
 * - Automatically loads previously explored segments when the app starts
 * - Saves new segments to AsyncStorage for persistence across app sessions
 * - Provides functions to add new explored segments and clear exploration history
 * - Uses simple array-based storage with JSON serialization/deserialization
 * - Handles storage errors gracefully by ignoring failures
 * 
 * WHY IT EXISTS:
 * Hero's Path is about exploration and discovery, so remembering where users have
 * been is important for the experience. This context enables features like showing
 * exploration progress, avoiding repetitive route suggestions, and potentially
 * creating personal exploration maps. It's the foundation for understanding user
 * movement patterns and providing personalized experiences.
 * 
 * RELATIONSHIPS:
 * - Used by components that track user movement and route completion
 * - Provides data for any features that need to understand exploration history
 * - Works with route planning and suggestion algorithms
 * - Could integrate with achievement systems and progress tracking
 * - May be used by MapScreen to visualize previously explored areas
 * 
 * REFERENCED BY:
 * - MapScreen.js (likely for showing explored areas)
 * - Route planning components (to avoid suggesting explored routes)
 * - Progress tracking and statistics screens
 * - Achievement or gamification systems
 * 
 * REFERENCES:
 * - AsyncStorage (for persistent data storage)
 * - React Context API (for state management)
 * 
 * IMPORTANCE TO APP:
 * Medium-High - This context is important for the exploration experience and
 * personalization features. While not critical for basic functionality, it enables
 * advanced features that make the app more engaging and useful over time. Good
 * exploration tracking can significantly improve user retention and engagement.
 * 
 * IMPROVEMENT SUGGESTIONS:
 * 1. Add timestamp tracking - record when each segment was explored
 * 2. Add frequency tracking - count how many times each segment was visited
 * 3. Implement segment deduplication - avoid storing duplicate segments
 * 4. Add segment metadata - store additional info like weather, time of day, etc.
 * 5. Implement exploration statistics - distance explored, areas covered, etc.
 * 6. Add exploration goals - set targets for area coverage or new discoveries
 * 7. Implement data expiry - remove very old exploration data to save space
 * 8. Add export/import functionality - backup and restore exploration history
 * 9. Implement exploration sharing - let users share their exploration maps
 * 10. Add privacy controls - options to clear or disable exploration tracking
 * 11. Implement smart suggestions - use exploration history for better route planning
 * 12. Add seasonal tracking - track exploration by season or weather conditions
 * 13. Implement exploration challenges - encourage exploring new areas
 * 14. Add visualization features - heat maps and exploration coverage displays
 * 15. Add cloud sync - synchronize exploration data across multiple devices
 * 16. Implement performance optimization - use more efficient storage for large datasets
 * 17. Add data validation - ensure segment data integrity and format consistency
 */

// contexts/ExplorationContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@explored_segments';

const ExplorationContext = createContext();

export function ExplorationProvider({ children }) {
  const [segments, setSegments] = useState([]);

  // Load persisted segments on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => raw ? JSON.parse(raw) : [])
      .then(saved => setSegments(saved))
      .catch(() => {/* ignore */});
  }, []);

  // Persist whenever segments change
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(segments))
      .catch(() => {/* ignore */});
  }, [segments]);

  const addExploredSegments = newSegs => {
    // flatten or dedupe if desired
    setSegments(prev => [...prev, ...newSegs]);
  };

  const clearExploredSegments = () => {
    setSegments([]);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {/* ignore */});
  };

  return (
    <ExplorationContext.Provider value={{ segments, addExploredSegments, clearExploredSegments }}>
      {children}
    </ExplorationContext.Provider>
  );
}

export function useExploration() {
  return useContext(ExplorationContext);
}
