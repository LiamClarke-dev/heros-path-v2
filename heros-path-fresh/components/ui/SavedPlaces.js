import React from 'react';
import { View, Text } from 'react-native';
import { Marker } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * SavedPlaces
 * Props:
 * - showSavedPlaces: boolean
 * - savedPlaces: array of places
 * - colors: object (theme colors)
 */
export default function SavedPlaces({ showSavedPlaces, savedPlaces, colors }) {
  if (!showSavedPlaces || !savedPlaces || savedPlaces.length === 0) return null;
  return (
    <>
      {savedPlaces.map(place => (
        <Marker
          key={place.id}
          coordinate={{ latitude: place.latitude, longitude: place.longitude }}
          title={place.name}
          description={place.vicinity}
        >
          <View style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.primary,
            // Add shadow if needed
          }}>
            <MaterialIcons name="favorite" size={16} color={colors.buttonText} />
          </View>
        </Marker>
      ))}
    </>
  );
} 