import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Logger from '../../utils/Logger';
import PlaceDetailsModal from './PlaceDetailsModal';
import ClusteredMarkers from './ClusteredMarkers';

/**
 * SavedPlaces Component
 * 
 * Renders saved places on the map with appropriate icons based on place type.
 * Uses marker clustering for better performance with large numbers of markers.
 * Handles displaying detailed place information using Google Places UI Kit styling.
 * 
 * Props:
 * - showSavedPlaces: boolean - Whether to show saved places on the map
 * - savedPlaces: array - Array of place objects to display
 * - colors: object - Theme colors object
 * - mapRef - Reference to the MapView component
 * - currentZoom - Current map zoom level
 */
export default function SavedPlaces({ 
  showSavedPlaces, 
  savedPlaces, 
  colors,
  mapRef,
  currentZoom = 10 // Default zoom level
}) {
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [validPlaces, setValidPlaces] = useState([]);
  
  // Filter out places without valid coordinates
  useEffect(() => {
    if (savedPlaces && savedPlaces.length > 0) {
      const filtered = savedPlaces.filter(place => 
        place && place.latitude && place.longitude
      );
      
      setValidPlaces(filtered);
      
      Logger.debug('SavedPlaces: Filtered valid places', { 
        total: savedPlaces.length, 
        valid: filtered.length 
      });
    } else {
      setValidPlaces([]);
    }
  }, [savedPlaces]);

  /**
   * Handle marker press to show place details
   * @param {Object} place - The place object that was pressed
   */
  const handleMarkerPress = (place) => {
    setSelectedPlace(place);
    setDetailsVisible(true);
    Logger.debug('SavedPlaces: Marker pressed', { 
      placeId: place.id || place.place_id, 
      placeName: place.name 
    });
  };

  /**
   * Handle closing the place details modal
   */
  const handleCloseDetails = () => {
    setDetailsVisible(false);
    setSelectedPlace(null);
  };

  return (
    <>
      {/* Render clustered markers for saved places */}
      <ClusteredMarkers
        places={validPlaces}
        visible={showSavedPlaces}
        colors={colors}
        mapRef={mapRef}
        onMarkerPress={handleMarkerPress}
        currentZoom={currentZoom}
      />

      {/* Google Places UI Kit styled details modal */}
      <PlaceDetailsModal
        visible={detailsVisible}
        place={selectedPlace}
        onClose={handleCloseDetails}
        colors={colors}
      />
    </>
  );
}