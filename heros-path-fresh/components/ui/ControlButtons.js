import React from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * ControlButtons
 * Props:
 * - colors: object (theme colors)
 * - navigation: navigation object
 * - locateMe: function
 * - isLocating: boolean
 * - locationError: boolean
 * - showSavedRoutes: boolean
 * - toggleSavedRoutes: function
 * - isLoadingSavedRoutes: boolean
 * - savedRoutes: array
 * - showSavedPlaces: boolean
 * - toggleSavedPlaces: function
 */
export default function ControlButtons({
  colors,
  navigation,
  locateMe,
  isLocating,
  locationError,
  showSavedRoutes,
  toggleSavedRoutes,
  isLoadingSavedRoutes,
  savedRoutes,
  showSavedPlaces,
  toggleSavedPlaces
}) {
  return (
    <View style={{
      position: 'absolute',
      right: 16,
      bottom: 120,
      alignItems: 'center',
    }}>
      {/* Discovery preferences button */}
      <TouchableOpacity
        style={{
          borderRadius: 25,
          width: 50,
          height: 50,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.buttonSecondary,
          marginBottom: 8,
        }}
        onPress={() => navigation.navigate('DiscoveryPreferences')}
      >
        <MaterialIcons name="tune" size={24} color={colors.primary} />
      </TouchableOpacity>
      {/* Locate me button */}
      <TouchableOpacity
        style={{
          borderRadius: 25,
          width: 50,
          height: 50,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.buttonSecondary,
          marginBottom: 8,
        }}
        onPress={locateMe}
        disabled={isLocating}
      >
        <MaterialIcons name="my-location" size={24} color={locationError ? colors.error : colors.primary} />
        {isLocating && <ActivityIndicator size="small" color={colors.primary} style={{ position: 'absolute' }} />}
      </TouchableOpacity>
      {/* Toggle saved routes button */}
      <TouchableOpacity
        style={{
          borderRadius: 25,
          width: 50,
          height: 50,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: showSavedRoutes ? colors.buttonPrimary : colors.buttonSecondary,
          marginBottom: 8,
        }}
        onPress={toggleSavedRoutes}
        disabled={isLoadingSavedRoutes}
      >
        <MaterialIcons
          name="timeline"
          size={24}
          color={showSavedRoutes ? colors.buttonText : colors.primary}
        />
        {isLoadingSavedRoutes && (
          <ActivityIndicator size="small" color={showSavedRoutes ? colors.buttonText : colors.primary} style={{ position: 'absolute' }} />
        )}
        {showSavedRoutes && savedRoutes && savedRoutes.length > 0 && (
          <View style={{
            position: 'absolute',
            top: 6,
            right: 6,
            backgroundColor: colors.primary,
            borderRadius: 8,
            paddingHorizontal: 4,
            minWidth: 16,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{ color: colors.buttonText, fontSize: 10, fontWeight: 'bold' }}>{savedRoutes.length}</Text>
          </View>
        )}
      </TouchableOpacity>
      {/* Toggle saved places button */}
      <TouchableOpacity
        style={{
          borderRadius: 25,
          width: 50,
          height: 50,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: showSavedPlaces ? colors.buttonPrimary : colors.buttonSecondary,
        }}
        onPress={toggleSavedPlaces}
      >
        <MaterialIcons
          name="place"
          size={24}
          color={showSavedPlaces ? colors.buttonText : colors.primary}
        />
      </TouchableOpacity>
    </View>
  );
} 