import React from 'react';
import { View } from 'react-native';
import PingStats from '../PingStats';
import PingButton from '../PingButton';

/**
 * PingControls
 * Props:
 * - tracking: boolean
 * - currentPosition: object
 * - currentJourneyId: string
 * - pingUsed: number
 * - setPingUsed: function
 * - style: style object (optional)
 */
export default function PingControls({
  tracking,
  currentPosition,
  currentJourneyId,
  pingUsed,
  setPingUsed,
  style
}) {
  if (!tracking || !currentPosition || !currentJourneyId) return null;
  return (
    <View style={style}>
      <PingStats 
        style={{ marginBottom: 8 }} 
        onPingUsed={pingUsed}
      />
      <PingButton
        currentLocation={currentPosition}
        journeyId={currentJourneyId}
        onPingStart={() => {
          // Animation scaffolding (if needed)
        }}
        onPingSuccess={(result) => {
          setPingUsed(prev => prev + 1);
        }}
        onPingError={(error) => {
          // Optionally handle error
        }}
        style={{}}
        disabled={!tracking}
      />
    </View>
  );
} 