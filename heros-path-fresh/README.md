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

## Git Workflow & Branching Strategy

### Branching Best Practices

**After configuration fixes are complete, use feature branches for major development:**

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

#### Feature Development Workflow:
```bash
# Start a new feature
git checkout -b feature/user-profiles
# ... work on feature ...
git add .
git commit -m "feat: add user profile creation"
git push origin feature/user-profiles

# When ready, merge back to main
git checkout main
git merge feature/user-profiles
git push origin main

# Clean up
git branch -d feature/user-profiles
```

#### Current Status:
- Configuration and environment setup: ✅ Complete (commit to main)
- **Next phase:** Use feature branches for all major feature development

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
│   ├── SignInScreen.js
│   └── EmailAuthScreen.js   # Email/password sign in/up
├── contexts/
│   ├── UserContext.js       # User authentication and profile management
│   └── ExplorationContext.js # Exploration state management
├── services/
│   ├── DiscoveriesService.js
│   └── UserProfileService.js
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
* **Configuration:** `app.json` contains environment variable mapping
* **Local Development:** `.env` file for local development (not committed to Git)
* **EAS Dashboard:** Set environment variables for each profile at https://expo.dev/accounts/[your-account]/projects/[your-project]/environment-variables

### Build Commands
```bash
# Development build
eas build --platform ios --profile development --branch feature/email-auth
# or for Android
eas build --platform android --profile development --branch feature/email-auth

# Start development server
npx expo start --dev-client

# Clear cache and restart
npx expo start -c
```

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

### 🔄 In Progress
* Firestore collection scaffolding and security rules
* Testing email/password and Google OAuth flows
* User profile management (avatar upload, privacy settings)

### 📋 Backlog
* Social feed, friends, privacy controls
* Settings toggles (categories, ratings, goals)
* Unexplored-first route suggestions
* Coverage percentage visualization

## Next Features Roadmap

### 1. User Profile Management
* Avatar upload and management
* Profile privacy settings

### 2. Advanced Discoveries Filtering
* Category tabs: Restaurants, Cafés, Bars, Parks, Museums, etc.
* "All" view showing every suggestion without filtering
* On-tap fetch for fresh Places API queries
* Cache-busting per category

### 3. Custom Collections & Swipe Actions
* Swipe-to-save suggestions
* Swipe-to-dismiss unwanted entries
* Saved places section
* User-created custom lists (e.g., "Date Night," "Dog-Friendly")

### 4. Smarter Route Suggestions
* Unexplored-first routing
* Alternative detours through new streets
* Distance & POI preferences

### 5. Neighborhood Coverage Visualization
* Painted streets overlay showing walked areas
* Coverage percentage display
* Heatmap view for frequent walking areas

### 6. Settings & Personalization
* Discovery category toggles
* Min rating & max distance filters
* Notification controls

### 7. Social Sharing & Network
* Friends list management
* Activity feed
* Privacy controls
* Profile pages

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

