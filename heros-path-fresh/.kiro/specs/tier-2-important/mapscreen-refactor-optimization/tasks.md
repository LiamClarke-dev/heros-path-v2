# Implementation Plan: MapScreen Refactor & Performance Optimization

- [x] 1. Extract Utility Functions
  - Move geo calculations (distance, direction, clustering) to utils/geo.js
  - Ensure all utility functions are pure and tested
  - _Requirements: 1.1, 3.2_

- [x] 2. Extract UI Subcomponents
  - [x] 2.1 JourneyNamingModal
    - Move modal UI and logic to components/ui/JourneyNamingModal.js
    - _Requirements: 1.1_
  - [x] 2.2 AccuracyIndicator
    - Move GPS accuracy indicator to components/ui/AccuracyIndicator.js
    - _Requirements: 1.1_
  - [x] 2.3 SavedRoutes
    - Move saved routes rendering to components/ui/SavedRoutes.js
    - _Requirements: 1.1, 2.1_
  - [x] 2.4 SavedPlaces
    - Move saved places rendering and clustering to components/ui/SavedPlaces.js
    - _Requirements: 1.1, 2.1, 3.3_
  - [x] 2.5 ControlButtons
    - Move floating action buttons to components/ui/ControlButtons.js
    - _Requirements: 1.1_
  - [x] 2.6 PingControls
    - Move ping button and stats to components/ui/PingControls.js
    - _Requirements: 1.1_

- [x] 3. Create Custom Hooks
  - [x] 3.1 useJourneyTracking
    - Encapsulate journey tracking logic in hooks/useJourneyTracking.js
    - _Requirements: 1.1, 3.1_
  - [x] 3.2 useLocation
    - Encapsulate location permission and update logic in hooks/useLocation.js
    - _Requirements: 1.1, 3.1_
  - [x] 3.3 useSavedPlaces
    - Encapsulate saved places loading and management in hooks/useSavedPlaces.js
    - _Requirements: 1.1, 3.1_

- [x] 4. Refactor MapScreen.js
  - Replace inline logic with imports from new modules
  - Pass state and props to subcomponents and hooks
  - Ensure all features and UI remain unchanged
  - _Requirements: 1.1, 2.1, 4.1_

- [x] 5. Testing and Validation


  - Run manual QA to ensure no regression in features or UI
  - Add/Update unit tests for hooks and utils
  - _Requirements: 2.1, 4.1_

- [x] 6. Documentation and Code Review


  - Update documentation to reflect new structure
  - Submit for code review and address feedback
  - _Requirements: All_ 