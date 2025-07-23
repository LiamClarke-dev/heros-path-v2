import { useState } from 'react';
import { Alert } from 'react-native';
import { calculateTotalDistance } from '../utils/geo';
import JourneyService from '../services/JourneyService';

export default function useJourneyTracking({
  user,
  loadSavedRoutes,
  setPathToRender,
  setPreviewRoute,
  setPreviewRoadCoords,
  setCurrentJourneyId,
}) {
  const [tracking, setTracking] = useState(false);
  const [showNamingModal, setShowNamingModal] = useState(false);
  const [journeyName, setJourneyName] = useState('');
  const [originalDefaultName, setOriginalDefaultName] = useState('');
  const [pendingJourneyData, setPendingJourneyData] = useState(null);

  const saveJourney = async (rawCoords, name) => {
    if (!user || rawCoords.length === 0) return;
    try {
      // Calculate distance first to check if journey is too short
      const distance = calculateTotalDistance(rawCoords);
      if (distance < 50) {
        Alert.alert(
          'Short Journey Warning',
          `Your journey is only ${Math.round(distance)}m long. This may be too short to be meaningful. Do you still want to save it?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Save Anyway', onPress: () => proceedWithSave(rawCoords, name, distance) }
          ]
        );
        return;
      }
      await proceedWithSave(rawCoords, name, distance);
    } catch (error) {
      Alert.alert('Error', 'Failed to save your walk. Please try again.');
    }
  };

  const proceedWithSave = async (rawCoords, name, distance) => {
    try {
      const journeyData = {
        userId: user.uid,
        name: name || `Walk on ${new Date().toLocaleDateString()}`,
        startTime: rawCoords[0].timestamp,
        endTime: rawCoords[rawCoords.length - 1].timestamp,
        route: rawCoords.map(coord => ({
          latitude: coord.latitude,
          longitude: coord.longitude,
          timestamp: coord.timestamp,
        })),
        distance: distance,
        duration: rawCoords[rawCoords.length - 1].timestamp - rawCoords[0].timestamp,
        status: 'completed',
      };
      const result = await JourneyService.createJourney(user.uid, journeyData);
      if (result.success) {
        try {
          await JourneyService.consolidateJourneyDiscoveries(
            user.uid,
            result.journey.id,
            journeyData.route
          );
        } catch (discoveryError) {}
        setCurrentJourneyId(null);
        setPathToRender([]);
        setPreviewRoute([]);
        setPreviewRoadCoords([]);
        await loadSavedRoutes();
        Alert.alert(
          'Walk Saved! 🎉',
          `Your ${Math.round(journeyData.distance)}m walk has been saved. Check your discoveries for new places found along your route!`
        );
      } else {
        throw new Error(result.error || 'Failed to save journey');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save your walk. Please try again.');
    }
  };

  const handleSaveJourneyWithName = async () => {
    if (!pendingJourneyData) return;
    try {
      setShowNamingModal(false);
      const finalName = journeyName.trim() || originalDefaultName;
      await saveJourney(pendingJourneyData.coordinates, finalName);
      setPendingJourneyData(null);
      setJourneyName('');
      setOriginalDefaultName('');
      Alert.alert('Journey Saved! 🎉', `Your walk "${finalName}" has been saved successfully.`);
    } catch (error) {
      Alert.alert('Error', 'Failed to save your journey. Please try again.');
    }
  };

  const handleCancelNaming = () => {
    Alert.alert(
      'Save Journey?',
      'Do you want to save this journey with the default name?',
      [
        {
          text: "Don't Save",
          style: 'destructive',
          onPress: () => {
            setShowNamingModal(false);
            setPendingJourneyData(null);
            setJourneyName('');
            setOriginalDefaultName('');
          }
        },
        {
          text: 'Save with Default Name',
          onPress: async () => {
            try {
              setShowNamingModal(false);
              await saveJourney(pendingJourneyData.coordinates, originalDefaultName);
              setPendingJourneyData(null);
              setJourneyName('');
              setOriginalDefaultName('');
              Alert.alert('Journey Saved!', `Your walk "${originalDefaultName}" has been saved with the default name.`);
            } catch (error) {
              Alert.alert('Error', 'Failed to save your journey.');
            }
          }
        }
      ]
    );
  };

  // toggleTracking and modal state logic should be integrated here in the next step

  return {
    tracking,
    setTracking,
    showNamingModal,
    setShowNamingModal,
    journeyName,
    setJourneyName,
    originalDefaultName,
    setOriginalDefaultName,
    pendingJourneyData,
    setPendingJourneyData,
    saveJourney,
    handleSaveJourneyWithName,
    handleCancelNaming,
    // toggleTracking: ... (to be added)
  };
} 