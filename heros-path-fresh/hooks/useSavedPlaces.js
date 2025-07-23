import { useState, useCallback } from 'react';
import DiscoveryService from '../services/DiscoveryService';

export default function useSavedPlaces({ user, setSavedPlaces: setSavedPlacesParent }) {
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [showSavedPlaces, setShowSavedPlaces] = useState(false);

  const loadSavedPlaces = useCallback(async () => {
    if (!user) return;
    try {
      const result = await DiscoveryService.getSavedPlaces(user.uid);
      const places = result.success ? result.discoveries : [];
      setSavedPlaces(places);
      if (setSavedPlacesParent) setSavedPlacesParent(places);
    } catch (error) {
      // Optionally handle error
    }
  }, [user, setSavedPlacesParent]);

  const toggleSavedPlaces = useCallback(() => {
    setShowSavedPlaces(prev => !prev);
  }, []);

  return {
    savedPlaces,
    setSavedPlaces,
    showSavedPlaces,
    setShowSavedPlaces,
    loadSavedPlaces,
    toggleSavedPlaces,
  };
} 