# 1\. Project Overview & Goals

Hero’s Path is a React Native/Expo app that lets users track their walks with a glowing polyline and an animated Link sprite, save past routes for later review, and discover nearby points of interest after each outing. It also includes social sharing of walks and curated “Discoveries,” plus user-defined goals to make daily walking more engaging.

# 2\. Tech Stack & Versions

* **Expo SDK:** \~53.0.17

* **React Native:** 0.79.5

* **React:** 19.0.0

* **Core Libraries:**

  * expo-location 18.1.6

  * expo-constants 17.1.7

  * expo-status-bar 2.2.3

  * expo-updates 0.28.16

  * expo-dev-client 5.2.4

  * react-native-maps 1.20.1

  * react-native-reanimated 3.17.4

  * react-native-gesture-handler 2.24.0

  * @react-native-async-storage/async-storage 2.1.2

  * @react-navigation/native 7.1.14

  * @react-navigation/drawer 7.5.2

* **Dev Dependencies:** @babel/core 7.20.0, react-native-dotenv 3.4.11

* **Native Modules:** None—everything in JS/TS

* **Dev Client:** Using `expo-dev-client` for builds requiring native modules

# 3\. Current File Layout

C:\\Users\\LiamS\\Documents\\GitHub\\heros-path-app\\heros-path

`├── App.js                   # Root drawer navigator + gesture-handler setup`  

`├── index.js                 # Entry point`  

`├── babel.config.js`  

`├── app.config.js            # Expo config + .env injection`  

`├── package.json`  

`├── .env`  

`├── eas.json`  

`├── screens/`  

`│   ├── MapScreen.js`  

`│   ├── PastJourneysScreen.js`  

`│   ├── DiscoveriesScreen.js`  

`│   ├── SavedPlacesScreen.js`  

`│   ├── SocialScreen.js`  

`│   └── SettingsScreen.js`  

`├── hooks/`  

`│   └── useSuggestedPlaces.js`  

`├── services/`  

`│   └── DiscoveriesService.js`  

`├── constants/`  

`│   └── PlaceTypes.js`  

`└── assets/                  # Sprites, icons, etc.`

**File Upload Limitation**

Due to platform constraints, I can only upload up to **10 project files** per session. To get the most value out of each upload, I will share the ten highest‐priority files—those that define our configuration (`package.json`, `.env`, `app.config.js`), your core Expo setup (`App.js`, `index.js`), and the modules we’re currently working on (e.g. `DiscoveriesScreen.js`, `useSuggestedPlaces.js`, `DiscoveriesService.js`, `PlaceTypes.js`, and `env.js`). If you ever need to debug or develop a different feature area, I can swap in the relevant files upon request.

# 4\. Environment & Build Setup

* **Workflow:** Managed Expo with prebuild disabled (CNG).

* **Metro:** Runs in LAN mode over hotspot; uses `--tunnel` when needed.

* **Client:** Primarily Expo Go for rapid iteration; `expo-dev-client` for native debugging.

* **EAS:** Profiles in `eas.json` for development (internal/dev-client), preview, production.

* **API Keys:** Stored in `.env` and injected via `app.config.js` → `Constants.expoConfig.extra`.

# 5\. Personal Preferences

* **Language:** JS/TS only—no Java/Kotlin edits.

* **Code Diffs:** Full file replacements under \~50 lines; unified diffs if larger.

* **Testing:** Android first (device/emulator), then iOS when credentials are ready.

* **Debugging:**

  * Clear Metro (`expo start --clear`)

  * Port checks with `netstat`

  * Kill stray processes via PowerShell

  * Stub web-only modules behind `Platform.OS !== 'web'`

# 6\. What’s Done vs Backlog

* **Completed:**

  * Live map tracking & glowing polyline

  * Animated Link sprite on map

  * Save/Load routes in AsyncStorage

  * Past Journeys screen (list, preview, delete)

  * Basic Discoveries UI with caching & toasts

  * Drawer navigation for all core screens

  * `.env` → `app.config.js` API key injection  
  * Category tabs \+ filtered Discoveries    
  * Custom lists & swipe-to-save/dismiss (SavedPlacesScreen)    
  * Side-by-side dropdowns for journey \+ discovery-type    
  * “View on Maps” deep-link for every suggestion   
  * Painted-streets overlay

* **Backlog:**

  * Unexplored-first route suggestions  
  * coverage %  
  * Settings toggles (categories, ratings, goals)  
  * Social feed, friends, privacy controls

# 7\. Hero’s Path: Next Features Roadmap

1. ## Advanced Discoveries Filtering

   * **Category Tabs**: Restaurants, Cafés, Bars, Parks, Museums, etc.  
   * **“All” View**: Shows every suggestion without filtering.  
   * **On-Tap Fetch**: Tapping a tab immediately runs a fresh Places API query for that type.  
   * **Cache-Busting**: Each category has its own cache key so you never see stale data.

2. ## Custom Collections & Swipe Actions

   * **Swipe-to-Save**: Right-swipe a suggestion to save it.  
   * **Swipe-to-Dismiss**: Left-swipe to remove unwanted entries forever.  
   * **Saved Section**: All saved places live under “Saved” with no filtering.  
   * **User Lists**: Create/rename/delete custom lists (e.g. “Date Night,” “Dog-Friendly”).

3. ## Smarter Route Suggestions

   * **Unexplored-First Routing**: Enter a destination and get guided along streets you haven’t walked.  
   * **Alternative Detours**: System suggests side-streets or loops you’ve never taken.  
   * **Distance & POI Preferences**: Optionally prefer shorter green routes or café-dense areas.

4. ## Neighborhood Coverage Visualization

   * **Painted Streets Overlay**: Roads you’ve walked light up on the map, filling in as you explore.  
   * **Coverage %**  
      **Display**: “You’ve explored 27% of nearby streets” as a progress indicator.  
   * **Heatmap View**: When zoomed out, areas of frequent walking glow more intensely.

5. ## Settings & Personalization

   * **Discovery Toggles**: Turn on/off auto-suggested categories (e.g. disable “Nightlife”).  
   * **Min Rating & Max Distance**: Only show POIs above X stars or within Y meters.  
   * **Notification Controls**: In-app toast or push notification when new suggestions appear.

6. ## Social Sharing & Network

   * **Friends List**: Add/search friends by username or invite link.  
   * **Activity Feed**: See “Alice completed a 5 km walk” or “Bob saved The Coffee Corner.”  
   * **Privacy Controls**: Toggle which lists or journeys are shareable vs. private.  
   * **Profile Pages**: Viewable by accepted friends only, no global browsing.

   ## 

   ## Why These Matter

* Keeps users engaged by making each walk feel fresh

* Empowers personalization—users see only what they care about

* Turns routine walks into discovery adventures

* Provides clear goals and progress, driving daily usage

With these features in place, Hero’s Path will move from simply tracking walks to becoming an indispensable exploration companion.

