/*
 * CLUSTERED MARKERS COMPONENT
 * ==========================
 * 
 * PURPOSE:
 * This component implements Google Maps Marker Clustering for efficient display
 * of large numbers of markers. It groups nearby markers into clusters that expand
 * when zoomed in, improving map performance and visual clarity.
 * 
 * FUNCTIONALITY:
 * - Groups nearby markers into clusters based on zoom level and proximity
 * - Provides theme-aware styling for clusters
 * - Handles zoom-based cluster expansion
 * - Optimizes performance for large numbers of markers
 * - Supports custom marker rendering for individual places
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { getMarkerColorForPlaceType } from '../../utils/placeTypeToIcon';
import { getIconForPlaceType } from '../../utils/placeTypeToIcon';
import Logger from '../../utils/Logger';

// Constants for clustering
const CLUSTER_MAX_ZOOM = 15; // Zoom level at which clustering stops
const CLUSTER_RADIUS = 50; // Pixel radius to consider for clustering
const ZOOM_ANIMATION_DURATION = 300; // ms

/**
 * ClusteredMarkers Component
 * 
 * @param {Object} props - Component props
 * @param {Array} props.places - Array of place objects to display
 * @param {boolean} props.visible - Whether the markers should be visible
 * @param {Object} props.colors - Theme colors object
 * @param {Object} props.mapRef - Reference to the MapView component
 * @param {Function} props.onMarkerPress - Function to call when a marker is pressed
 * @param {number} props.currentZoom - Current map zoom level
 */
export default function ClusteredMarkers({ 
  places, 
  visible, 
  colors, 
  mapRef, 
  onMarkerPress,
  currentZoom = 10 // Default zoom level
}) {
  const clustersRef = useRef([]);
  const lastZoom = useRef(currentZoom);
  
  // Skip rendering if markers shouldn't be visible or there are no places
  if (!visible || !places || places.length === 0) return null;
  
  // Calculate clusters based on current places and zoom level
  useEffect(() => {
    if (places.length > 0) {
      calculateClusters();
    }
  }, [places, currentZoom]);
  
  /**
   * Calculate clusters based on marker proximity and zoom level
   */
  const calculateClusters = () => {
    // Skip clustering at high zoom levels
    if (currentZoom >= CLUSTER_MAX_ZOOM) {
      clustersRef.current = places.map(place => ({
        id: place.id || place.place_id,
        coordinate: { latitude: place.latitude, longitude: place.longitude },
        places: [place],
        isCluster: false
      }));
      return;
    }
    
    // Simple clustering algorithm
    const clusters = [];
    const processed = new Set();
    
    places.forEach(place => {
      const placeId = place.id || place.place_id;
      
      // Skip already processed places
      if (processed.has(placeId)) return;
      processed.add(placeId);
      
      // Find nearby places for this place
      const nearbyPlaces = places.filter(otherPlace => {
        const otherId = otherPlace.id || otherPlace.place_id;
        if (processed.has(otherId) && otherId !== placeId) return false;
        
        // Calculate distance between places
        const distance = calculateDistance(
          place.latitude, 
          place.longitude, 
          otherPlace.latitude, 
          otherPlace.longitude
        );
        
        // Adjust clustering radius based on zoom level
        const adjustedRadius = CLUSTER_RADIUS * (16 - Math.min(currentZoom, 15));
        
        return distance <= adjustedRadius;
      });
      
      // Mark all nearby places as processed
      nearbyPlaces.forEach(nearbyPlace => {
        processed.add(nearbyPlace.id || nearbyPlace.place_id);
      });
      
      // Create a cluster or individual marker
      clusters.push({
        id: nearbyPlaces.length > 1 ? `cluster-${clusters.length}` : placeId,
        coordinate: { latitude: place.latitude, longitude: place.longitude },
        places: nearbyPlaces,
        isCluster: nearbyPlaces.length > 1
      });
    });
    
    clustersRef.current = clusters;
    
    Logger.debug('ClusteredMarkers: Calculated clusters', { 
      totalPlaces: places.length,
      clusters: clusters.length,
      clusterCount: clusters.filter(c => c.isCluster).length
    });
  };
  
  /**
   * Calculate distance between two coordinates in meters
   */
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  };
  
  /**
   * Handle cluster press - zoom in to expand cluster
   */
  const handleClusterPress = (cluster) => {
    if (!mapRef || !mapRef.current) return;
    
    // Calculate the bounding box for all places in the cluster
    let minLat = Number.MAX_VALUE;
    let maxLat = Number.MIN_VALUE;
    let minLng = Number.MAX_VALUE;
    let maxLng = Number.MIN_VALUE;
    
    cluster.places.forEach(place => {
      minLat = Math.min(minLat, place.latitude);
      maxLat = Math.max(maxLat, place.latitude);
      minLng = Math.min(minLng, place.longitude);
      maxLng = Math.max(maxLng, place.longitude);
    });
    
    // Add padding to the bounding box
    const latPadding = (maxLat - minLat) * 0.2;
    const lngPadding = (maxLng - minLng) * 0.2;
    
    // Animate to the new region
    mapRef.current.animateToRegion({
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(maxLat - minLat + latPadding, 0.01),
      longitudeDelta: Math.max(maxLng - minLng + lngPadding, 0.01)
    }, ZOOM_ANIMATION_DURATION);
    
    Logger.debug('ClusteredMarkers: Expanding cluster', { 
      clusterSize: cluster.places.length,
      region: {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.max(maxLat - minLat + latPadding, 0.01),
        longitudeDelta: Math.max(maxLng - minLng + lngPadding, 0.01)
      }
    });
  };
  
  /**
   * Handle individual marker press
   */
  const handleMarkerPress = (place) => {
    if (onMarkerPress) {
      onMarkerPress(place);
    }
  };
  
  /**
   * Get dominant place type from a cluster
   */
  const getDominantPlaceType = (places) => {
    const typeCounts = {};
    
    places.forEach(place => {
      if (place.types && place.types.length > 0) {
        const type = place.types[0];
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      }
    });
    
    let dominantType = 'place';
    let maxCount = 0;
    
    Object.entries(typeCounts).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantType = type;
      }
    });
    
    return dominantType;
  };
  
  /**
   * Render a cluster marker
   */
  const renderCluster = (cluster) => {
    const count = cluster.places.length;
    const dominantType = getDominantPlaceType(cluster.places);
    const clusterColor = getMarkerColorForPlaceType(dominantType);
    
    return (
      <View style={[styles.clusterContainer, { backgroundColor: clusterColor }]}>
        <Text style={styles.clusterText}>{count}</Text>
      </View>
    );
  };
  
  /**
   * Render an individual place marker
   */
  const renderPlaceMarker = (place) => {
    const iconConfig = getIconForPlaceType(place.types?.[0] || 'place', colors);
    const IconComponent = iconConfig.Component;
    
    return (
      <View style={[styles.markerContainer, { backgroundColor: iconConfig.color }]}>
        <IconComponent name={iconConfig.name} size={16} color="#FFFFFF" />
      </View>
    );
  };
  
  return (
    <>
      {clustersRef.current.map(cluster => (
        <Marker
          key={cluster.id}
          coordinate={cluster.coordinate}
          tracksViewChanges={false} // Improve performance
          onPress={() => cluster.isCluster 
            ? handleClusterPress(cluster) 
            : handleMarkerPress(cluster.places[0])
          }
        >
          {cluster.isCluster 
            ? renderCluster(cluster) 
            : renderPlaceMarker(cluster.places[0])
          }
        </Marker>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  clusterContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  clusterText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});