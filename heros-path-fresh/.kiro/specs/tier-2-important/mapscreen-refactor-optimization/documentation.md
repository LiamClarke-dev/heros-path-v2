# MapScreen Refactor & Optimization Documentation

## Overview

This document provides an overview of the MapScreen refactoring and optimization work completed as part of the tier-2-important tasks. The refactoring focused on improving code organization, reusability, and maintainability by extracting UI components and business logic into separate modules.

## Architecture Changes

### Before Refactoring

Previously, the MapScreen component was a large monolithic file that contained:
- UI rendering logic
- State management
- Business logic for journey tracking
- Location handling
- Saved places management
- Event handlers

This made the component difficult to maintain, test, and extend.

### After Refactoring

The refactored architecture follows a more modular approach:

1. **Core MapScreen Component**: Focuses on composition and coordination
2. **Custom Hooks**: Encapsulate business logic and state management
3. **UI Components**: Handle specific UI rendering concerns
4. **Utility Functions**: Provide reusable calculations and helpers

## Component Structure

```
screens/
└── MapScreen.js (Main screen component)

components/
├── SpriteWithGpsIndicator.js (Character sprite with GPS status)
└── ui/
    ├── AccuracyIndicator.js (GPS accuracy display)
    ├── ControlButtons.js (Map control buttons)
    ├── JourneyNamingModal.js (Journey naming dialog)
    ├── PingControls.js (Ping functionality controls)
    ├── SavedPlaces.js (Saved places markers)
    └── SavedRoutes.js (Saved routes polylines)

hooks/
├── useJourneyTracking.js (Journey recording and saving)
├── useLocation.js (Location services and permissions)
└── useSavedPlaces.js (Saved places management)

utils/
└── geo.js (Geolocation utility functions)
```

## Custom Hooks

### useJourneyTracking

Manages all aspects of journey tracking:

- Starting and stopping journey tracking
- Saving journeys with names
- Journey data management
- Modal state for journey naming
- Developer mode for testing

**Key Functions:**
- `toggleTracking()`: Start/stop journey tracking
- `handleSaveJourneyWithName()`: Save journey with custom name
- `handleCancelNaming()`: Handle cancellation of journey naming
- `saveJourney()`: Core journey saving logic

### useLocation

Handles location services and permissions:

- Location initialization
- Permission management
- Location updates
- Background location tracking

**Key Functions:**
- `checkBackgroundPermissions()`: Check if background location is permitted
- `showBackgroundPermissionWarning()`: Show permission warning dialog

### useSavedPlaces

Manages saved places functionality:

- Loading saved places
- Toggling saved places visibility
- Managing saved places state

**Key Functions:**
- `loadSavedPlaces()`: Load user's saved places
- `toggleSavedPlaces()`: Toggle saved places visibility

## UI Components

### JourneyNamingModal

Modal dialog for naming journeys with the following features:
- Input field for journey name
- Default name suggestion
- Save and cancel buttons
- Loading state with visual feedback
- Error handling

### AccuracyIndicator

Displays current GPS accuracy with:
- Color-coded status (excellent, good, fair, poor)
- Numeric accuracy value
- Conditional rendering based on tracking state

### SavedRoutes

Renders saved journey routes on the map:
- Polylines with appropriate styling
- Conditional rendering based on visibility toggle
- Performance optimizations

### SavedPlaces

Renders saved places on the map:
- Markers with appropriate styling
- Conditional rendering based on visibility toggle
- Performance optimizations

### ControlButtons

Provides map control buttons:
- Locate me button with loading state
- Toggle saved routes button with count indicator
- Toggle saved places button
- Navigation to preferences

### PingControls

Manages ping functionality:
- Ping button for discovering places
- Ping stats display
- Conditional rendering based on tracking state

## Utility Functions

### geo.js

Provides geolocation utility functions:
- `calculateDistance()`: Calculate distance between coordinates
- `calculateTotalDistance()`: Calculate total distance of a route
- `getDirection()`: Determine movement direction based on coordinates

## Developer Tools

A developer mode was added to facilitate testing:
- Toggle with a hidden button below the main tracking button
- Dummy journey data for testing without actual GPS movement
- Bypass validation checks in developer mode
- Simulated network latency for testing loading states

## Performance Optimizations

Several performance optimizations were implemented:
- Reduced re-renders by extracting components
- Improved state management with custom hooks
- Added loading states to prevent multiple API calls
- Optimized marker rendering with conditional logic
- Added error boundaries and fallbacks

## User Experience Improvements

The refactoring also improved user experience:
- Added loading indicators during saving operations
- Prevented multiple submissions of the same action
- Improved error handling and user feedback
- Added visual feedback for long-running operations
- Enhanced accessibility with proper button states

## Known Issues and Limitations

- Some unused imports and variables remain (IDE warnings)
- Developer mode is enabled by default for testing purposes
- Some components could benefit from further optimization
- Unit tests need to be updated for the new structure

## Future Improvements

Potential areas for future improvement:
- Add comprehensive unit tests for hooks and components
- Further optimize marker clustering for large numbers of places
- Implement virtualized lists for performance with many items
- Add animation optimizations for smoother transitions
- Implement proper TypeScript typing for better type safety