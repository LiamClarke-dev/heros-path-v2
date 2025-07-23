# Hero's Path - Technical Overview

## Tech Stack

- **Framework**: React Native (v0.79.5) with Expo SDK (v53.0.19)
- **Language**: JavaScript
- **State Management**: React Context API (UserContext, ThemeContext, ExplorationContext)
- **Navigation**: React Navigation v7 (Drawer, Stack)
- **Backend/Database**: Firebase (Authentication, Firestore)
- **Storage**: AsyncStorage for local persistence
- **Maps**: Google Maps (react-native-maps), Expo Maps
- **Location Services**: expo-location, expo-task-manager
- **UI Components**: Custom components, @expo/vector-icons
- **Animation**: react-native-reanimated, lottie-react-native

## Key Dependencies

- **@react-navigation/drawer**: v7.5.3
- **@react-navigation/native**: v7.1.14
- **@react-navigation/stack**: v7.4.2
- **expo-location**: v18.1.6
- **firebase**: v11.10.0
- **react-native-maps**: v1.20.1
- **react-native-reanimated**: v3.17.4
- **@react-native-async-storage/async-storage**: v2.1.2

## Environment & Configuration

- Environment variables are managed through `config.js`
- Firebase configuration is in `firebase.js`
- Google Maps API keys should be stored in environment variables, not hardcoded
- EAS (Expo Application Services) is used for builds

## Common Commands

### Development

```bash
# Start Expo development server
npm start

# Start on specific platform
npm run android
npm run ios
npm run web

# Export design tokens to Figma
npm run export-to-figma
```

### Build Process

```bash
# Build for development (using EAS)
eas build --platform ios --profile development

# Build for TestFlight
eas build --platform ios --profile preview

# Build for production
eas build --platform ios --profile production
```

## Development Workflow

1. Use Expo Go for JavaScript-only changes (free, instant testing)
2. Use Development builds for native dependencies (~$5 each)
3. Use TestFlight builds only for final validation (~$10)

## API Integration

- Google Places API is used for place discovery
- Search Along Route (SAR) is implemented for discovering places along walking paths
- API keys should be stored in environment variables:
  - `GOOGLE_MAPS_API_KEY_IOS`
  - `GOOGLE_MAPS_API_KEY_ANDROID`

## Data Storage

- **Firebase Firestore**: User data, journeys, discoveries, saved places
- **AsyncStorage**: Theme preferences, discovery preferences, exploration history

## Testing

- Manual testing is currently the primary method
- Test API connectivity through the Settings screen

## Performance Considerations

- Optimize API calls by caching journey data
- Reduce unnecessary re-renders in map components
- Be mindful of background location tracking battery usage
- Set `DEBUG_MODE = false` in `utils/Logger.js` for production

## Developer Tools

Developer tools have been reprioritized and split into tiers:

### Core Developer Tools (Tier 2)
- Debug logging system for tracking location and API calls
- Mock location data for testing journey tracking
- API response simulation for offline development
- Performance monitoring for critical path operations

### Advanced Developer Tools (Tier 4)
- Advanced analytics for user behavior tracking
- A/B testing framework for feature experimentation
- Automated testing for critical user flows
- Remote configuration management

## Data Migration

Data migration capabilities are implemented in phases:

### Core Data Migration (Tier 2)
- User authentication data migration
- Journey data schema updates
- Basic backup and restore functionality

### Advanced Data Migration (Tier 4)
- Custom lists migration
- Social sharing data migration
- Cross-platform data portability
- Historical data analytics conversion