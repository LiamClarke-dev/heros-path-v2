# Hero's Path - React Native/Expo App

## Project Overview

Hero's Path is a React Native/Expo app that lets users track their walks with a glowing polyline and an animated Link sprite, save past routes for later review, and discover nearby points of interest after each outing. It also includes social sharing of walks and curated "Discoveries," plus user-defined goals to make daily walking more engaging.

## Tech Stack

* **Expo SDK:** ~53.0.17
* **React Native:** 0.79.5
* **React:** 19.0.0

### Core Libraries
* expo-location 18.1.6
* expo-constants 17.1.7
* expo-status-bar 2.2.3
* expo-dev-client 5.2.4
* react-native-maps 1.20.1
* react-native-reanimated 3.17.4
* react-native-gesture-handler 2.24.0
* @react-native-async-storage/async-storage 2.1.2
* @react-navigation/native 7.1.14
* @react-navigation/drawer 7.5.3
* firebase 11.10.0
* expo-auth-session 6.2.1

### Dev Dependencies
* @babel/core 7.20.0

## Git Workflow & Development Strategy

### 🎯 **Optimized Development Workflow**

**Our strategy balances cost control with proper testing:**

#### **When to Use Expo Go (Free, Instant Testing):**
- ✅ **JavaScript logic** (discovery preferences, settings UI)
- ✅ **React Native components** (most UI changes)
- ✅ **AsyncStorage** (saving preferences)
- ✅ **Basic navigation** (drawer, screens)
- ✅ **Firebase integration** (authentication, database)

#### **When to Build Development Version (~$5, Required):**
- 🔄 **Native dependencies** (like `react-native-root-toast`)
- 🔄 **App.js structural changes** (adding wrappers, providers)
- 🔄 **Custom native modules**
- 🔄 **Advanced map features** (new markers, callouts)
- 🔄 **Before merging to main** (final validation)

#### **Branch Strategy:**
```bash
main (stable, ready for production)
├── feature/discovery-preferences-and-map-enhancements (current)
├── feature/social-features
├── feature/advanced-analytics
└── feature/final-polish
```

#### **Development Workflow:**
```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Develop JavaScript features in Expo Go
npx expo start
# Test in Expo Go app

# 3. Build when adding native features
eas build --platform ios --profile development

# 4. Test thoroughly in development build

# 5. Merge to main when validated
git checkout main
git merge feature/new-feature
git push origin main
```

#### **Cost Optimization:**
- **Expo Go testing**: Free, instant iteration
- **Development builds**: Only when needed (~$5 each)
- **TestFlight builds**: Only for final validation (~$10)

### **Branching Best Practices**

#### When to Create Branches:
- ✅ New features (e.g., `feature/user-profiles`, `feature/social-sharing`)
- ✅ Major refactoring (e.g., `refactor/auth-system`)
- ✅ Bug fixes (e.g., `fix/oauth-redirect`)
- ✅ Experimental code that might break things

#### When to Commit to Main:
- ✅ Small bug fixes
- ✅ Documentation updates
- ✅ Configuration changes (like environment variables)
- ✅ Minor UI tweaks

#### Branch Naming Convention:
```bash
feature/user-profiles     # New features
fix/oauth-redirect        # Bug fixes
refactor/auth-system      # Code refactoring
docs/readme-update        # Documentation
```

#### Current Status:
- Configuration and environment setup: ✅ Complete (commit to main)
- **Next phase:** Use feature branches for all major feature development
- **Development workflow:** Optimized for cost control and rapid iteration

## Project Structure

```
heros-path-fresh/
├── App.js                   # Root navigation (drawer + auth stack)
├── index.js                 # Entry point
├── app.json                 # Expo config with environment variable mapping
├── eas.json                 # EAS build configuration
├── package.json
├── package-lock.json
├── config.js                # Environment variables configuration
├── firebase.js              # Firebase initialization
├── GoogleService-Info.plist # iOS Firebase configuration
├── .gitignore
├── screens/
│   ├── MapScreen.js
│   ├── PastJourneysScreen.js
│   ├── DiscoveriesScreen.js
│   ├── SavedPlacesScreen.js
│   ├── SocialScreen.js
│   ├── SettingsScreen.js
│   ├── DiscoveryPreferencesScreen.js  # Dedicated preferences modal
│   ├── SignInScreen.js
│   └── EmailAuthScreen.js   # Email/password sign in/up
├── contexts/
│   ├── UserContext.js       # User authentication and profile management
│   └── ExplorationContext.js # Exploration state management
├── services/
│   ├── DiscoveriesService.js
│   ├── UserProfileService.js
│   └── EnhancedPlacesService.js
├── hooks/
│   └── useSuggestedPlaces.js
├── constants/
│   └── PlaceTypes.js
├── styles/
│   └── theme.js
├── assets/
│   ├── icon.png
│   ├── adaptive-icon.png
│   ├── favicon.png
│   ├── splash-icon.png
│   └── link_sprites/
│       ├── link_idle.gif
│       ├── link_walk_down.gif
│       ├── link_walk_up.gif
│       ├── link_walk_right.gif
│       └── link_walk_left.gif
└── .expo/                   # Expo development files
```

## Environment & Build Setup

### Development Workflow
* **Workflow:** Managed Expo with prebuild disabled (CNG)
* **Metro:** Runs in LAN mode over hotspot; uses `--tunnel` when needed
* **Client:** Development builds with `expo-dev-client` for native debugging
* **EAS:** Profiles in `eas.json` for development (internal/dev-client), preview, production

### Environment Variables
* **Storage:** Environment variables stored in EAS and injected at build time
* **Configuration:** `config.js` contains environment variable mapping
* **Local Development:** `.env` file for local development (not committed to Git)
* **EAS Dashboard:** Set environment variables for each profile at https://expo.dev/accounts/[your-account]/projects/[your-project]/environment-variables

### Build Commands
```bash
# For JavaScript-only features (test in Expo Go first)
npx expo start
# Test in Expo Go app

# For native features (build required)
eas build --platform ios --profile development
# or for Android
eas build --platform android --profile development
# or for both platforms
eas build --platform all --profile development

# Start development server with dev client
npx expo start --dev-client

# Clear cache and restart
npx expo start -c
```

### Testing Strategy
* **Expo Go:** Use for JavaScript logic, UI components, and basic functionality
* **Development Build:** Use for native features, App.js changes, and final validation
* **TestFlight:** Use for wider beta testing and App Store validation

## Authentication

### Google OAuth
- Google sign-in is available via the main sign-in screen.
- Make sure Google Cloud Console OAuth credentials and redirect URIs are set up as described in the project wiki.

### Email/Password Authentication
- Users can sign up or sign in with email/password via the "Sign in with Email" button on the sign-in screen.
- The `EmailAuthScreen.js` handles both sign up and sign in.
- All authentication is managed via Firebase Auth.

## Firestore Database Setup

### Enabling Firestore
1. Go to the Firebase Console and select your project.
2. Click "Firestore Database" in the sidebar.
3. Click "Create database" and choose test mode (for development) or production mode (for production).
4. Choose a region and click "Enable".

### Collections to Scaffold
- `users` (created automatically by the app)
- `journeys` (create manually for testing, or let the app create)
- `savedPlaces` (create manually for testing, or let the app create)
- `discoveries` (optional, for discovery features)

### Example Document Structure
- See `services/UserProfileService.js` for user profile fields.
- Journeys and saved places should include a `userId` field to associate with the user.

### Firestore Security Rules (Recommended)
```
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /journeys/{journeyId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    match /savedPlaces/{savedPlaceId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    match /discoveries/{discoveryId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

## Secrets & Security
- **Never commit secrets or API keys to GitHub.**
- If a secret is accidentally committed, use [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) to scrub it from history.
- `.env` is in `.gitignore` and should never be tracked by git.

## Current Status

### ✅ Completed Features
* Live map tracking & glowing polyline
* Animated Link sprite on map
* Save/Load routes in AsyncStorage
* Past Journeys screen (list, preview, delete)
* Basic Discoveries UI with caching & toasts
* Drawer navigation for all core screens
* Environment variable configuration
* Category tabs + filtered Discoveries
* Custom lists & swipe-to-save/dismiss (SavedPlacesScreen)
* Side-by-side dropdowns for journey + discovery-type
* "View on Maps" deep-link for every suggestion
* Painted-streets overlay
* Firebase authentication setup
* Google OAuth integration (configuration complete)
* Email/password authentication (sign up & sign in)
* User profile creation and editing
* Testing email/password and Google OAuth flows
* Firestore collection scaffolding and security rules
* **Discovery preferences system** (user-selectable place types with grouped categories)
* **Enhanced map features** (saved places pins with callouts)
* **Toast notifications** (properly configured with RootSiblingParent)
* **Optimized development workflow** (cost-effective testing strategy)
* **Improved deduplication** (using place_id as primary method)
* **Rating filtering** (minimum rating preferences)
* **AI summaries integration** (ready for Google Places API New)
* **Discovery preferences screen** (dedicated modal with organized categories)

### 🔄 In Progress
* User profile management (avatar upload, privacy settings)
* AI summaries testing (Google Places API New integration)

### 📋 Backlog
* Social feed, friends, privacy controls
* Settings toggles (categories, ratings, goals)
* Unexplored-first route suggestions
* Coverage percentage visualization

## Next Features Roadmap

### Phase 1: Gamification Foundation (2-3 weeks)
**Street Coverage Tracking System**
* GPS coordinate to street mapping
* Binary street state: walked/unwalked
* Visual: Blue polylines for walked streets (extends existing saved routes)
* Coverage percentage calculation
* Local storage for coverage data

**Achievement System**
* "First Street": Walk your first new street
* "Explorer": Walk 10 different streets
* "Neighborhood Master": Complete 80% of neighborhood
* "Consistent Walker": Walk 7 days in a row
* Achievement notifications and progress tracking

### Phase 2: Smart Routing System (3-4 weeks)
**Destination Selection**
* Google Places search bar with autocomplete
* Saved places/discoveries picker
* Destination pin on map

**Route Types**
* **Fastest Route**: Direct path via Google Maps Directions API
* **Exploration Route**: Avoids previously walked streets, respects max detour time
* **Discovery Route**: Avoids walked streets + considers discovery preferences

**Exploration Settings**
* Max detour time (5, 10, 15, 20 minutes)
* Exploration vs. discovery preference weighting
* Route optimization algorithms

### Phase 3: Visual Enhancements (2-3 weeks)
**Map Overlays**
* Neighborhood boundaries and completion indicators
* Achievement markers and special street highlights
* Progress visualization

**UI Polish**
* Enhanced theme system with platform-specific styling
* Achievement badges and progress indicators
* Improved map controls and interactions

### Phase 4: Advanced Features (Future)
**Social Features**
* Friends list and activity sharing
* Neighborhood leaderboards
* Route sharing and recommendations

**Analytics & Insights**
* Walking patterns and statistics
* Discovery analytics
* Personal walking insights

**Premium Features**
* Advanced exploration algorithms
* Detailed neighborhood analytics
* Custom achievement creation
* Route sharing with friends

## Technical Architecture & Decisions

### Platform Strategy
* **Primary Platform:** iOS (React Native with platform-specific styling)
* **Secondary Platform:** Android (cross-platform compatibility)
* **Future Consideration:** Native SwiftUI app for iOS (separate project)
* **Current Approach:** React Native with enhanced iOS styling

### Data Architecture
* **Local Storage:** AsyncStorage for user preferences and cached data
* **Cloud Storage:** Firebase Firestore for user profiles and social features
* **API Integration:** Google Places API for discoveries and routing
* **Real-time Updates:** Firebase real-time listeners for social features

### Key Technical Decisions
* **Deduplication Strategy:** Place_id primary, location/name fallback
* **Discovery Preferences:** Grouped categories with rating filtering
* **Map Visualization:** Blue polylines for walked streets (simple binary state)
* **Routing Algorithm:** Exploration-first with discovery preferences integration
* **Achievement System:** Street-based milestones with progress tracking

### Performance Considerations
* **Lazy Loading:** AI summaries loaded on-demand
* **Caching Strategy:** Discovery results cached with preference-based filtering
* **Map Optimization:** Polylines rendered efficiently with proper key management
* **Memory Management:** Proper cleanup of location subscribers and map references

## Development Notes

### Personal Preferences
* **Language:** JavaScript only—no TypeScript
* **Testing:** iOS first (device), then Android
* **Debugging:** Clear Metro cache, check network connectivity

### Common Issues & Solutions
* **Black screen:** Usually indicates JavaScript error or missing environment variables
* **OAuth redirect errors:** Check Google Cloud Console redirect URIs
* **Environment variables not loading:** Rebuild development client after config changes
* **Metro connection issues:** Ensure phone and computer are on same WiFi network

## Why These Features Matter

* Keeps users engaged by making each walk feel fresh
* Empowers personalization—users see only what they care about
* Turns routine walks into discovery adventures
* Provides clear goals and progress, driving daily usage

With these features in place, Hero's Path will move from simply tracking walks to becoming an indispensable exploration companion.

