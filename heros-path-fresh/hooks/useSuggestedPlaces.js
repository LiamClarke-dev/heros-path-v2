/*
 * USE SUGGESTED PLACES HOOK
 * =========================
 * 
 * PURPOSE:
 * This custom React hook fetches and manages suggested places based on the user's
 * last completed route. It handles the workflow of loading the most recent route
 * from storage, calling the discovery service to find relevant places along that
 * route, and providing the results to components that need suggested places.
 * Think of it as a bridge between route data and place discovery functionality.
 * 
 * FUNCTIONALITY:
 * - Loads the last completed route from AsyncStorage automatically
 * - Fetches place suggestions based on selected place type and language preferences
 * - Supports both specific place type filtering and user preference-based discovery
 * - Provides loading states for UI feedback during API calls
 * - Shows toast notifications when new suggestions are found
 * - Handles component lifecycle properly to prevent memory leaks
 * - Uses cancellation tokens to prevent state updates on unmounted components
 * - Gracefully handles errors and missing data scenarios
 * 
 * WHY IT EXISTS:
 * Discovery of places is a core feature of Hero's Path, but the logic for fetching
 * suggestions based on completed routes was being duplicated across components.
 * This hook centralizes that logic and provides a clean, reusable interface for
 * any component that needs to show suggested places based on recent journeys.
 * 
 * RELATIONSHIPS:
 * - Uses DiscoveriesService.js (specifically getPassingPlaces function) for place discovery
 * - Reads route data from AsyncStorage (stored by journey completion logic)
 * - Provides data to components that display suggested places
 * - Works with user preference systems for discovery filtering
 * - Integrates with toast notifications for user feedback
 * 
 * REFERENCED BY:
 * - DiscoveriesScreen.js (likely for showing suggested places)
 * - Components that need to display places based on completed routes
 * - Any screen that shows discovery suggestions after walks
 * 
 * REFERENCES:
 * - DiscoveriesService.js (for getPassingPlaces function)
 * - AsyncStorage (for loading last route data)
 * - react-native-root-toast (for user notifications)
 * - React hooks (useState, useEffect, useRef)
 * 
 * IMPORTANCE TO APP:
 * High - This hook is crucial for the discovery feature, which is one of Hero's Path's
 * main value propositions. It enables the app to automatically suggest interesting
 * places based on where users have walked, making the discovery process seamless
 * and automated. Good discovery suggestions drive user engagement and app usage.
 * 
 * IMPROVEMENT SUGGESTIONS:
 * 1. Add caching mechanism - avoid redundant API calls for same route/preferences
 * 2. Add retry logic - automatically retry failed requests with exponential backoff
 * 3. Add offline support - cache suggestions for offline viewing
 * 4. Add preference change detection - re-fetch when user preferences change
 * 5. Add debouncing - prevent excessive API calls when parameters change rapidly
 * 6. Add error state management - provide error information to components
 * 7. Add pagination support - handle large sets of suggestions efficiently
 * 8. Add real-time updates - refresh suggestions when new routes are completed
 * 9. Add suggestion filtering - post-process results based on user history
 * 10. Add analytics integration - track suggestion performance and user engagement
 * 11. Add location-based optimization - prioritize suggestions based on current location
 * 12. Add time-based filtering - show suggestions relevant to current time of day
 * 13. Add suggestion scoring - rank suggestions by relevance and user preferences
 * 14. Add cross-route analysis - suggest places that appear near multiple user routes
 * 15. Add seasonal adjustments - modify suggestions based on weather and season
 * 16. Add suggestion personalization - learn from user interactions to improve suggestions
 * 17. Add collaborative filtering - suggest places popular with similar users
 * 18. Add suggestion expiry - refresh stale suggestions periodically
 */

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