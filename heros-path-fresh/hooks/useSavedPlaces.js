import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import DiscoveryService from '../services/DiscoveryService';
import NewPlacesService from '../services/NewPlacesService';
import EnhancedPlacesService from '../services/EnhancedPlacesService';
import Logger from '../utils/Logger';

/**
 * Custom hook for managing saved places
 * Provides functionality to load, display, and toggle saved places on the map
 */
export default function useSavedPlaces({ user, setSavedPlacesParent }) {
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [showSavedPlaces, setShowSavedPlaces] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load saved places from the user's saved discoveries
   * Enhances basic place data with additional details from Google Places API
   */
  const loadSavedPlaces = useCallback(async () => {
    if (!user) {
      Logger.debug('useSavedPlaces: No user, skipping load');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      Logger.debug('useSavedPlaces: Loading saved places');
      
      // Get basic saved places from DiscoveryService
      const result = await DiscoveryService.getSavedPlaces(user.uid);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load saved places');
      }
      
      const basicPlaces = result.discoveries || [];
      Logger.debug(`useSavedPlaces: Loaded ${basicPlaces.length} basic places`);
      
      // If we have places, enhance them with additional details
      if (basicPlaces.length > 0) {
        // Process places in batches to avoid overwhelming the API
        const enhancedPlaces = await Promise.all(
          basicPlaces.map(async (place) => {
            try {
              // Only fetch enhanced details if we have a place_id
              if (place.place_id) {
                // Try to get enhanced place details first
                try {
                  const enhancedDetails = await EnhancedPlacesService.getEnhancedPlaceDetails(place.place_id);
                  if (enhancedDetails.success) {
                    Logger.debug('useSavedPlaces: Enhanced place details loaded', {
                      placeId: place.place_id,
                      name: place.name || enhancedDetails.place.name
                    });
                    return { ...place, ...enhancedDetails.place };
                  }
                } catch (enhancedError) {
                  Logger.debug('useSavedPlaces: Enhanced details failed, falling back to basic details', { 
                    placeId: place.place_id, 
                    error: enhancedError.message 
                  });
                }
                
                // Fall back to basic place details
                try {
                  const details = await NewPlacesService.getPlaceDetails(place.place_id);
                  if (details.success) {
                    Logger.debug('useSavedPlaces: Basic place details loaded', {
                      placeId: place.place_id,
                      name: place.name || details.place.name
                    });
                    return { ...place, ...details.place };
                  }
                } catch (detailsError) {
                  Logger.debug('useSavedPlaces: Basic details failed, using original place data', { 
                    placeId: place.place_id, 
                    error: detailsError.message 
                  });
                }
              }
              
              // If all else fails, return the original place data
              return place;
            } catch (error) {
              Logger.error('useSavedPlaces: Error enhancing place', { 
                placeId: place.place_id, 
                error: error.message 
              });
              return place;
            }
          })
        );
        
        Logger.debug('useSavedPlaces: Successfully enhanced places', { 
          count: enhancedPlaces.length,
          hasCoordinates: enhancedPlaces.filter(p => p.latitude && p.longitude).length
        });
        
        setSavedPlaces(enhancedPlaces);
        if (setSavedPlacesParent) setSavedPlacesParent(enhancedPlaces);
      } else {
        // No places to enhance
        setSavedPlaces([]);
        if (setSavedPlacesParent) setSavedPlacesParent([]);
      }
    } catch (error) {
      Logger.error('useSavedPlaces: Error loading saved places', error);
      setError(error.message || 'Failed to load saved places');
      
      // Show error alert only for critical failures
      if (!savedPlaces.length) {
        Alert.alert(
          'Error Loading Places',
          'There was a problem loading your saved places. Please try again later.',
          [{ text: 'OK' }]
        );
      }
      
      // Keep existing places if we have them
      if (!savedPlaces.length) {
        setSavedPlaces([]);
        if (setSavedPlacesParent) setSavedPlacesParent([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, setSavedPlacesParent, savedPlaces.length]);

  /**
   * Toggle visibility of saved places on the map
   */
  const toggleSavedPlaces = useCallback(() => {
    setShowSavedPlaces(prev => {
      const newValue = !prev;
      Logger.debug('useSavedPlaces: Toggling saved places visibility', {
        oldValue: prev,
        newValue,
        placesCount: savedPlaces.length,
        isLoading
      });
      
      // If turning on and we don't have places yet, load them
      if (newValue && savedPlaces.length === 0 && !isLoading) {
        loadSavedPlaces();
      }
      
      return newValue;
    });
  }, [savedPlaces.length, isLoading, loadSavedPlaces]);

  // Load saved places when user changes or when visibility is turned on
  useEffect(() => {
    if (user && showSavedPlaces) {
      Logger.debug('useSavedPlaces: Auto-loading places due to user/visibility change', {
        hasUser: !!user,
        showSavedPlaces,
        currentPlacesCount: savedPlaces.length
      });
      loadSavedPlaces();
    }
  }, [user, showSavedPlaces, loadSavedPlaces]);

  return {
    savedPlaces,
    setSavedPlaces,
    showSavedPlaces,
    setShowSavedPlaces,
    loadSavedPlaces,
    toggleSavedPlaces,
    isLoading,
    error,
  };
}