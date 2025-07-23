import { useState } from 'react';
import { Alert } from 'react-native';
import { calculateTotalDistance } from '../utils/geo';
import JourneyService from '../services/JourneyService';
import Logger from '../utils/Logger';

// Developer mode flag - set to true to enable developer options
const DEVELOPER_MODE = true;

// Dummy journey data for testing in developer mode
const DUMMY_JOURNEY_DATA = [
  {
    latitude: 37.7749,
    longitude: -122.4194,
    timestamp: Date.now() - 3600000, // 1 hour ago
  },
  {
    latitude: 37.7750,
    longitude: -122.4195,
    timestamp: Date.now() - 3000000, // 50 minutes ago
  },
  {
    latitude: 37.7751,
    longitude: -122.4196,
    timestamp: Date.now() - 2400000, // 40 minutes ago
  },
  {
    latitude: 37.7752,
    longitude: -122.4197,
    timestamp: Date.now() - 1800000, // 30 minutes ago
  },
  {
    latitude: 37.7753,
    longitude: -122.4198,
    timestamp: Date.now() - 1200000, // 20 minutes ago
  },
  {
    latitude: 37.7754,
    longitude: -122.4199,
    timestamp: Date.now() - 600000, // 10 minutes ago
  },
  {
    latitude: 37.7755,
    longitude: -122.4200,
    timestamp: Date.now(),
  },
];

export default function useJourneyTracking({
  user,
  loadSavedRoutes,
  setPathToRender,
  setPreviewRoute,
  setPreviewRoadCoords,
  setCurrentJourneyId,
  pathToRender,
}) {
  const [tracking, setTracking] = useState(false);
  const [showNamingModal, setShowNamingModal] = useState(false);
  const [journeyName, setJourneyName] = useState('');
  const [originalDefaultName, setOriginalDefaultName] = useState('');
  const [pendingJourneyData, setPendingJourneyData] = useState(null);
  const [devMode, setDevMode] = useState(DEVELOPER_MODE);
  const [isSaving, setIsSaving] = useState(false); // Add loading state for saving

  const saveJourney = async (rawCoords, name) => {
    if (!user) {
      Logger.warn('useJourneyTracking: Cannot save journey - missing user');
      return;
    }
    
    // In developer mode, if no coordinates are provided, use dummy data
    if (devMode && (!rawCoords || rawCoords.length === 0)) {
      Logger.debug('Developer mode: Using dummy journey data');
      rawCoords = DUMMY_JOURNEY_DATA;
    }
    
    if (!rawCoords || rawCoords.length === 0) {
      Logger.warn('useJourneyTracking: Cannot save journey - missing coordinates');
      return;
    }
    
    try {
      // Calculate distance first to check if journey is too short
      const distance = calculateTotalDistance(rawCoords);
      Logger.debug(`Journey distance calculated: ${distance}m`);
      
      if (distance < 50 && !devMode) {
        Logger.debug('Journey is short, showing warning');
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
      Logger.error('Error saving journey:', error);
      Alert.alert('Error', 'Failed to save your walk. Please try again.');
      setIsSaving(false); // Reset saving state on error
    }
  };

  const proceedWithSave = async (rawCoords, name, distance) => {
    setIsSaving(true); // Set saving state to true
    
    try {
      Logger.debug('Proceeding with journey save');
      
      if (!rawCoords || rawCoords.length === 0) {
        throw new Error('No coordinates to save');
      }
      
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
      
      Logger.debug('Saving journey data:', { 
        name: journeyData.name,
        points: journeyData.route.length,
        distance: Math.round(journeyData.distance)
      });
      
      // Add a small delay in dev mode to simulate network latency
      if (devMode) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      const result = await JourneyService.createJourney(user.uid, journeyData);
      
      if (result.success) {
        try {
          await JourneyService.consolidateJourneyDiscoveries(
            user.uid,
            result.journey.id,
            journeyData.route
          );
        } catch (discoveryError) {
          Logger.error('Error consolidating discoveries:', discoveryError);
        }
        
        // Clean up tracking state
        setTracking(false);
        setCurrentJourneyId(null);
        setPathToRender([]);
        setPreviewRoute([]);
        setPreviewRoadCoords([]);
        
        // Clean up modal state
        setShowNamingModal(false);
        setPendingJourneyData(null);
        setJourneyName('');
        setOriginalDefaultName('');
        
        await loadSavedRoutes();
        Alert.alert(
          'Walk Saved! 🎉',
          `Your ${Math.round(journeyData.distance)}m walk has been saved. Check your discoveries for new places found along your route!`
        );
      } else {
        throw new Error(result.error || 'Failed to save journey');
      }
    } catch (error) {
      Logger.error('Error in proceedWithSave:', error);
      Alert.alert('Error', 'Failed to save your walk. Please try again.');
    } finally {
      setIsSaving(false); // Reset saving state regardless of outcome
    }
  };

  const handleSaveJourneyWithName = async () => {
    if (isSaving) return; // Prevent multiple saves if already saving
    
    Logger.debug('Handling save journey with name');
    setIsSaving(true); // Set saving state to true
    
    try {
      // In developer mode, if no coordinates are provided, use dummy data
      if (devMode && (!pendingJourneyData || !pendingJourneyData.coordinates || pendingJourneyData.coordinates.length === 0)) {
        Logger.debug('Developer mode: Using dummy journey data for naming');
        await saveJourney(DUMMY_JOURNEY_DATA, journeyName.trim() || originalDefaultName);
        return;
      }
      
      if (!pendingJourneyData || !pendingJourneyData.coordinates) {
        Logger.warn('No pending journey data to save');
        Alert.alert('Error', 'No journey data to save. Please try again.');
        setIsSaving(false);
        return;
      }
      
      const finalName = journeyName.trim() || originalDefaultName;
      Logger.debug(`Saving journey with name: ${finalName}`);
      await saveJourney(pendingJourneyData.coordinates, finalName);
      // State clearing is handled in proceedWithSave
    } catch (error) {
      Logger.error('Error in handleSaveJourneyWithName:', error);
      Alert.alert('Error', 'Failed to save your journey. Please try again.');
      setIsSaving(false);
    }
  };

  const handleCancelNaming = () => {
    if (isSaving) return; // Prevent cancellation if saving
    
    Logger.debug('Journey naming cancelled, showing confirmation');
    Alert.alert(
      'Save Journey?',
      'Do you want to save this journey with the default name?',
      [
        {
          text: "Don't Save",
          style: 'destructive',
          onPress: () => {
            Logger.debug('User chose not to save journey');
            setShowNamingModal(false);
            setPendingJourneyData(null);
            setJourneyName('');
            setOriginalDefaultName('');
            setTracking(false);
          }
        },
        {
          text: 'Save with Default Name',
          onPress: async () => {
            try {
              Logger.debug('Saving journey with default name');
              setShowNamingModal(false);
              setIsSaving(true); // Set saving state to true
              
              // In developer mode, if no coordinates are provided, use dummy data
              if (devMode && (!pendingJourneyData || !pendingJourneyData.coordinates || pendingJourneyData.coordinates.length === 0)) {
                Logger.debug('Developer mode: Using dummy journey data for default name');
                await saveJourney(DUMMY_JOURNEY_DATA, originalDefaultName);
                return;
              }
              
              if (!pendingJourneyData || !pendingJourneyData.coordinates) {
                throw new Error('No journey data to save');
              }
              
              await saveJourney(pendingJourneyData.coordinates, originalDefaultName);
              // State clearing is handled in proceedWithSave
            } catch (error) {
              Logger.error('Error saving with default name:', error);
              Alert.alert('Error', 'Failed to save your journey.');
              setIsSaving(false);
            }
          }
        }
      ]
    );
  };

  const toggleTracking = () => {
    if (tracking) {
      // If currently tracking, stop and check if there's path data
      Logger.debug('Stopping tracking, preparing to save journey');
      
      if ((!pathToRender || pathToRender.length < 2) && !devMode) {
        // If there's no meaningful path data and not in dev mode, ask if the user wants to discard the journey
        Logger.warn('No meaningful path data to save');
        Alert.alert(
          'No Journey Data',
          'There is not enough journey data to save. Would you like to end tracking without saving?',
          [
            {
              text: 'Continue Tracking',
              style: 'cancel',
            },
            {
              text: 'End Without Saving',
              style: 'destructive',
              onPress: () => {
                // End tracking without saving
                Logger.debug('User chose to end tracking without saving');
                setTracking(false);
                setCurrentJourneyId(null);
                setPathToRender([]);
                setPreviewRoute([]);
                setPreviewRoadCoords([]);
              }
            }
          ]
        );
        return;
      }
      
      // If there's path data or in dev mode, proceed with the naming modal
      const now = new Date();
      const defaultName = `Journey on ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
      setOriginalDefaultName(defaultName);
      
      // In developer mode, if no path data, use dummy data
      if (devMode && (!pathToRender || pathToRender.length < 2)) {
        Logger.debug('Developer mode: Using dummy journey data for modal');
        setPendingJourneyData({ coordinates: DUMMY_JOURNEY_DATA });
      } else {
        setPendingJourneyData({ coordinates: pathToRender });
      }
      
      setShowNamingModal(true);
    } else {
      // If not tracking, start a new journey
      Logger.debug('Starting new journey tracking');
      setTracking(true);
      setPathToRender([]);
      setPreviewRoute([]);
      setPreviewRoadCoords([]);
      setCurrentJourneyId(Date.now().toString()); // Set unique journey ID
    }
  };

  // Developer mode toggle function
  const toggleDevMode = () => {
    setDevMode(prev => !prev);
    Logger.debug(`Developer mode ${!devMode ? 'enabled' : 'disabled'}`);
    Alert.alert(
      'Developer Mode',
      `Developer mode ${!devMode ? 'enabled' : 'disabled'}`,
      [{ text: 'OK' }]
    );
  };

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
    toggleTracking,
    devMode,
    toggleDevMode,
    isSaving, // Export the saving state
  };
}