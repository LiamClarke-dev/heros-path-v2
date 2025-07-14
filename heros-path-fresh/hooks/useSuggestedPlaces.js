// hooks/useSuggestedPlaces.js

import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Toast from 'react-native-root-toast';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPassingPlaces } from '../services/DiscoveriesService';

const LAST_ROUTE_KEY = 'lastRoute';

export default function useSuggestedPlaces(selectedType, language = 'en') {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const isMounted = useRef(false);

  // Track mount state so we don't setState on unmounted component
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    let didCancel = false;

    async function fetchAndCache() {
      if (!isMounted.current) return;
      setLoading(true);

      try {
        // 1. Load the last route
        const raw = await AsyncStorage.getItem(LAST_ROUTE_KEY);
        if (!raw) {
          if (isMounted.current && !didCancel) {
            setPlaces([]);
            setLoading(false);
          }
          return;
        }
        const { id: routeId, coords: routeCoords } = JSON.parse(raw);
        if (!routeCoords?.length) {
          if (isMounted.current && !didCancel) {
            setPlaces([]);
            setLoading(false);
          }
          return;
        }

        // 2. Fetch fresh suggestions: include both type and language
        const opts = {};
        if (selectedType && selectedType !== 'all') {
          opts.type = selectedType;
          opts.usePreferences = false; // Don't use preferences when specific type is selected
        } else {
          opts.usePreferences = true; // Use preferences when no specific type is selected
        }
        opts.language = language;

        const newPlaces = await getPassingPlaces(routeCoords, opts);

        // 3. Set state and notify user
        if (isMounted.current && !didCancel) {
          setPlaces(newPlaces);
          const count = newPlaces.length;
          if (count > 0) {
            const message = `${count} new suggestion${count === 1 ? '' : 's'} — view in Discoveries`;
            Toast.show(message, {
              duration: Toast.durations.LONG,
            });
          }
        }
      } catch (error) {
        console.warn('useSuggestedPlaces error:', error);
      } finally {
        if (isMounted.current && !didCancel) {
          setLoading(false);
        }
      }
    }

    fetchAndCache();
    return () => { didCancel = true; };
  }, [selectedType, language]);

  return { places, loading };
}