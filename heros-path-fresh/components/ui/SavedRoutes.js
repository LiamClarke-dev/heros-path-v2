import React from 'react';
import { Polyline } from 'react-native-maps';

/**
 * SavedRoutes
 * Props:
 * - showSavedRoutes: boolean
 * - savedRoutes: array of journeys
 * - colors: object (theme colors)
 */
export default function SavedRoutes({ showSavedRoutes, savedRoutes, colors }) {
  if (!showSavedRoutes || !savedRoutes || savedRoutes.length === 0) return null;
  return (
    <>
      {savedRoutes.map(journey => (
        <Polyline
          key={journey.id}
          coordinates={journey.route}
          strokeColor={colors.routeLine}
          strokeWidth={3}
          strokeOpacity={0.6}
          lineDashPattern={[1, 2]}
        />
      ))}
    </>
  );
} 