# Hero's Path - Project Structure

## Directory Organization

```
heros-path-fresh/
├── App.js                   # Root component with navigation and providers
├── index.js                 # Entry point
├── app.json                 # Expo configuration
├── config.js                # Environment variables
├── firebase.js              # Firebase initialization
├── assets/                  # Images, icons, animations, fonts
│   ├── link_sprites/        # Character sprite animations
│   └── fonts/               # Custom fonts
├── components/              # Reusable UI components
│   ├── ui/                  # Core UI primitives (buttons, cards, etc.)
│   └── [ComponentName].js   # Feature-specific components
├── constants/               # App-wide constants
│   └── PlaceTypes.js        # Place type definitions
├── contexts/                # React Context providers
│   ├── UserContext.js       # Authentication and user data
│   ├── ThemeContext.js      # Theme and styling
│   └── ExplorationContext.js # Exploration state
├── docs/                    # Documentation
├── hooks/                   # Custom React hooks
├── screens/                 # App screens/pages
│   ├── MapScreen.js         # Main map interface
│   ├── DiscoveriesScreen.js # Discoveries interface
│   ├── CustomListsScreen.js # Custom lists management
│   ├── GamificationScreen.js # Achievements and challenges
│   ├── RoutingScreen.js     # Destination routing interface
│   ├── SocialScreen.js      # Social sharing interface
│   └── [ScreenName].js      # Other screens
├── services/                # Business logic and API services
│   ├── JourneyService.js    # Journey management
│   ├── DiscoveriesService.js # Discovery engine
│   ├── NewPlacesService.js  # Google Places API integration
│   ├── GamificationService.js # Gamification features
│   ├── CustomListsService.js # Custom lists management
│   ├── RoutingService.js    # Destination routing
│   ├── SocialService.js     # Social sharing features
│   └── [ServiceName].js     # Other services
├── styles/                  # Styling and theming
│   └── theme.js             # Theme definitions
└── utils/                   # Utility functions
    └── Logger.js            # Logging utility
```

## Architecture Patterns

### Component Organization

- **Screens**: Full pages in the app, imported by navigation
- **Components**: Reusable UI elements used across multiple screens
- **Contexts**: App-wide state management using React Context API
- **Services**: Business logic and API interactions

### Data Flow

1. **User Interaction** → Screen components
2. **API/Data Requests** → Service layer
3. **Global State** → Context providers
4. **Local State** → Component state
5. **Persistence** → Firebase (remote) and AsyncStorage (local)

### Key Files and Their Roles

- **App.js**: Entry point with providers and navigation setup
- **firebase.js**: Firebase initialization and authentication utilities
- **contexts/UserContext.js**: User authentication and profile management
- **contexts/ThemeContext.js**: Theme management (colors, styles)
- **services/DiscoveriesService.js**: Core discovery engine using Google Places API
- **services/JourneyService.js**: Journey tracking and management
- **screens/MapScreen.js**: Main app interface with map and tracking
- **utils/Logger.js**: Centralized logging system

## Naming Conventions

- **Files**: PascalCase for components, camelCase for utilities and services
- **Components**: PascalCase (e.g., `PingButton.js`)
- **Functions**: camelCase (e.g., `getUserDiscoveryPreferences()`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `PLACE_TYPES`)
- **Context Providers**: PascalCase with "Provider" suffix (e.g., `ThemeProvider`)
- **Context Hooks**: camelCase with "use" prefix (e.g., `useTheme`)

## Code Style Guidelines

- Use functional components with hooks instead of class components
- Prefer destructuring for props and state
- Use async/await for asynchronous operations
- Include JSDoc comments for complex functions
- Group related functions in service files
- Use consistent error handling with try/catch
- Implement proper logging with the Logger utility

## State Management

- **Global State**: React Context API for app-wide state
- **Local State**: React's useState hook for component-specific state
- **Persistence**: AsyncStorage for local data, Firestore for remote data

## Navigation Structure

- **Drawer Navigation**: Main app navigation (MapScreen, DiscoveriesScreen, etc.)
- **Stack Navigation**: Authentication flow and modal screens
- **Tab Navigation**: Used within specific sections (e.g., Discoveries)