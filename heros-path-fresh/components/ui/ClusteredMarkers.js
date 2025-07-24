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
const CLUSTER_RADIUS   = 50; // Pixel radius to consider for clustering
const CLUSTER_MIN_SIZE = 2;  // Minimum number of markers to form a cluster
const ZOOM_ANIMATION_DURATION = 300; // ms
const CLUSTER_GRID_SIZE = 40; // Grid size for clustering algorithm

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
  const lastZoom     = useRef(currentZoom);
  const lastPlaces   = useRef(places);

  /**
   * Calculate the center point of a cluster
   */
  function calculateClusterCenter(clusterPlaces) {
    const total   = clusterPlaces.length;
    const sumLat  = clusterPlaces.reduce((sum, p) => sum + p.latitude, 0);
    const sumLng  = clusterPlaces.reduce((sum, p) => sum + p.longitude, 0);
    return {
      latitude:  sumLat / total,
      longitude: sumLng / total,
    };
  }

  /**
   * Calculate clusters based on marker proximity and zoom level
   */
  function calculateClusters() {
    // Skip clustering at high zoom levels
    if (currentZoom >= CLUSTER_MAX_ZOOM) {
      clustersRef.current = places.map(place => ({
        id: place.id || place.place_id,
        coordinate: { latitude: place.latitude, longitude: place.longitude },
        places: [place],
        isCluster: false,
      }));
      return;
    }

    // Determine dynamic radius based on zoom level
    const baseRadius = CLUSTER_RADIUS;
    const zoomFactor = Math.max(0, CLUSTER_MAX_ZOOM - currentZoom);
    const radius     = baseRadius * (1 + zoomFactor * 0.5);

    // Grid-based clustering
    const grid = {};
    places.forEach((place) => {
      const cellX   = Math.floor(place.latitude  * CLUSTER_GRID_SIZE);
      const cellY   = Math.floor(place.longitude * CLUSTER_GRID_SIZE);
      const cellKey = `${cellX}:${cellY}`;
      if (!grid[cellKey]) grid[cellKey] = [];
      grid[cellKey].push(place);
    });

    const clusters  = [];
    const processed = new Set();

    Object.values(grid).forEach((cellPlaces) => {
      cellPlaces.forEach((place) => {
        const placeId = place.id || place.place_id;
        if (processed.has(placeId)) return;
        processed.add(placeId);

        // find nearby in same cell
        const nearby = cellPlaces.filter((p) => {
          const otherId = p.id || p.place_id;
          if (processed.has(otherId) && otherId !== placeId) return false;
          const dist = calculateDistance(place.latitude, place.longitude, p.latitude, p.longitude);
          return dist <= radius;
        });

        if (nearby.length >= CLUSTER_MIN_SIZE) {
          nearby.forEach((p) => processed.add(p.id || p.place_id));
          clusters.push({
            id: `cluster-${clusters.length}`,
            coordinate: calculateClusterCenter(nearby),
            places: nearby,
            isCluster: true,
          });
        } else {
          clusters.push({
            id: placeId,
            coordinate: { latitude: place.latitude, longitude: place.longitude },
            places: [place],
            isCluster: false,
          });
        }
      });
    });

    clustersRef.current = clusters;
    Logger.debug('ClusteredMarkers: Calculated clusters', {
      totalPlaces: places.length,
      clusters: clusters.length,
      clusterCount: clusters.filter((c) => c.isCluster).length,
      zoomLevel: currentZoom,
    });
  }

  // Recalculate clusters when places or zoom change significantly
  useEffect(() => {
    const shouldRecalc =
      !lastPlaces.current ||
      lastPlaces.current.length !== places.length ||
      Math.abs(lastZoom.current - currentZoom) >= 1;

    if (visible && places.length > 0 && shouldRecalc) {
      calculateClusters();
      lastPlaces.current = places;
      lastZoom.current   = currentZoom;
    }
    if (!visible) {
      clustersRef.current = [];
    }
  }, [places, currentZoom, visible]);
 
  // Skip rendering if markers shouldn't be visible or there are no places
  if (!visible || clustersRef.current.length === 0) return null;
  
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
    
    // Calculate size based on number of places
    const size = Math.min(60, Math.max(40, 40 + Math.floor(Math.log2(count)) * 5));
    const fontSize = Math.min(18, Math.max(14, 14 + Math.floor(Math.log2(count))));
    
    return (
      <View style={[
        styles.clusterContainer, 
        { 
          backgroundColor: colors.clusterBackground || clusterColor,
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: colors.clusterBorder || '#FFFFFF',
          borderWidth: 2,
          shadowColor: colors.shadow || '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5
        }
      ]}>
        <Text style={[
          styles.clusterText, 
          { 
            color: colors.clusterText || '#FFFFFF',
            fontSize: fontSize,
            fontWeight: 'bold'
          }
        ]}>
          {count}
        </Text>
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
      <View style={[
        styles.markerContainer, 
        { 
          backgroundColor: colors.markerBackground || iconConfig.color,
          borderColor: colors.markerBorder || '#FFFFFF',
          shadowColor: colors.shadow || '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5
        }
      ]}>
        <IconComponent 
          name={iconConfig.name} 
          size={20} 
          color={colors.markerIcon || '#FFFFFF'} 
        />
      </View>
    );
  };

  return (
    <>
      {clustersRef.current.map(cluster => (
        <Marker
          key={cluster.id}
          coordinate={cluster.coordinate}
          tracksViewChanges={false}
          onPress={() => cluster.isCluster 
            ? handleClusterPress(cluster) 
            : handleMarkerPress(cluster.places[0])
          }
          zIndex={cluster.isCluster ? 1 : 0} // Clusters appear above individual markers
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
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  clusterContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  clusterText: {
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});