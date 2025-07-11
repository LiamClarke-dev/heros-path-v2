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
