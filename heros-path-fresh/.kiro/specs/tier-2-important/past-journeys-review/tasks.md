# Implementation Plan: Past Journeys Review

- [ ] 1. Set up core journey list display
  - Create enhanced PastJourneysScreen component with proper structure
  - Implement basic journey fetching from Firestore
  - Add loading states and error handling
  - _Requirements: 1.1, 1.3, 1.4_

- [ ] 2. Implement journey metadata display
  - Create JourneyCard component for consistent journey rendering
  - Add formatting utilities for date, time, distance, and duration
  - Implement proper styling for journey cards
  - _Requirements: 1.2_

- [ ] 3. Add journey completion status tracking
  - Update JourneyService to fetch completion status data
  - Create CompletionStatusBadge component
  - Implement status indicators in journey list
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 4. Implement journey deletion functionality
  - Add delete button to journey cards
  - Create confirmation dialog for journey deletion
  - Implement deletion logic in JourneyService
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [ ] 5. Implement comprehensive data cleanup
  - Enhance JourneyService.deleteJourney to handle associated discoveries
  - Add cleanup for dismissed places related to journey
  - Implement batch operations for efficient deletion
  - _Requirements: 4.4, 6.3_

- [ ] 6. Add journey grouping by time periods
  - Create utility function to group journeys by month/year
  - Implement SectionList with collapsible headers
  - Add proper styling for section headers
  - _Requirements: 1.7_

- [ ] 7. Implement pagination for large journey lists
  - Update JourneyService to support paginated queries
  - Add infinite scrolling with onEndReached handler
  - Implement loading indicators for pagination
  - _Requirements: 1.6, 5.5_

- [ ] 8. Add navigation to journey details
  - Implement onPress handler for journey cards
  - Set up navigation to DiscoveriesScreen with journey filter
  - Pass journey data through navigation params
  - _Requirements: 3.1, 3.3_

- [ ] 9. Implement real-time completion status updates
  - Create updateJourneyCompletionStatus method in DiscoveryService
  - Add listeners for discovery status changes
  - Update UI when completion status changes
  - _Requirements: 2.4, 2.5, 6.1, 6.2_

- [ ] 10. Implement smart caching for performance
  - Add in-memory caching for journey data
  - Implement AsyncStorage backup for offline access
  - Add time-based cache invalidation
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 11. Add pull-to-refresh functionality
  - Implement RefreshControl in journey list
  - Create refresh function to sync with Firestore
  - Add visual feedback during refresh
  - _Requirements: 5.3, 6.4_

- [ ] 12. Optimize rendering performance
  - Implement getItemLayout for FlatList optimization
  - Add memo and useCallback for component optimization
  - Implement virtualized rendering for large lists
  - _Requirements: 5.5_

- [ ] 13. Add automatic refresh on screen focus
  - Implement useFocusEffect for screen refresh
  - Add debouncing to prevent excessive refreshes
  - Ensure data consistency when returning from other screens
  - _Requirements: 1.5, 6.4_

- [ ] 14. Implement error recovery mechanisms
  - Add retry logic for failed Firestore operations
  - Implement graceful degradation for network issues
  - Add user feedback for error states
  - _Requirements: 6.4_

- [ ] 15. Write unit tests for journey services
  - Test JourneyService methods for data handling
  - Test completion status calculation logic
  - Test journey grouping and formatting utilities
  - _Requirements: 6.4, 6.5_

- [ ] 16. Write integration tests for data consistency
  - Test interaction between JourneyService and DiscoveryService
  - Test comprehensive journey deletion
  - Test completion status updates
  - _Requirements: 6.1, 6.2, 6.3, 6.5_