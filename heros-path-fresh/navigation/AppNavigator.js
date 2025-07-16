/*
 * APP NAVIGATOR (MAIN NAVIGATION STRUCTURE)
 * ==========================================
 * 
 * PURPOSE:
 * This is the main navigation component that defines the entire navigation structure
 * for Hero's Path. It organizes all screens into a logical hierarchy using multiple
 * navigation patterns: Drawer (top-level), Stack (flows), and Tabs (sub-sections).
 * Think of it as the roadmap that determines how users move through the app and
 * how all screens connect to each other.
 * 
 * FUNCTIONALITY:
 * - Uses DrawerNavigator for top-level app sections (Map, Discoveries, Social, Settings, SignIn)
 * - Implements StackNavigators for linear flows (Settings → Preferences, Map → Past Journeys)
 * - Uses TabNavigator for related content groupings (Discoveries → Suggestions/Saved)
 * - Wraps everything in NavigationContainer for React Navigation integration
 * - Provides scalable structure that can accommodate new screens and features
 * - Organizes authentication flows separately from main app content
 * - Supports headerless screens (like MapScreen) and titled screens
 * 
 * WHY IT EXISTS:
 * Complex mobile apps need organized navigation structures to avoid chaos. This
 * component implements a modern, scalable navigation pattern that separates
 * concerns: top-level sections, linear flows, and grouped content. It provides
 * users with familiar navigation patterns while allowing developers to add new
 * features without restructuring the entire navigation system.
 * 
 * NAVIGATION STRUCTURE:
 * Drawer (Top Level)
 * ├── Map (Stack)
 * │   ├── MapScreen (headerless)
 * │   └── PastJourneysScreen
 * ├── Discoveries (Tabs)
 * │   ├── Suggestions (DiscoveriesScreen)
 * │   └── Saved (SavedPlacesScreen)
 * ├── Social (SocialScreen)
 * ├── Settings (Stack)
 * │   ├── SettingsScreen
 * │   └── DiscoveryPreferencesScreen
 * └── SignIn (Stack)
 *     ├── SignInScreen
 *     └── EmailAuthScreen
 * 
 * RELATIONSHIPS:
 * - Used by App.js as the main app navigation structure
 * - Connects all screen components into a cohesive navigation experience
 * - Works with ThemeContext for consistent navigation theming
 * - Integrates with authentication state to control access to screens
 * - Provides the structure for deep linking and navigation analytics
 * 
 * REFERENCED BY:
 * - App.js (primary usage as main app navigator)
 * - Any component that uses navigation.navigate() to move between screens
 * - Deep linking systems and external navigation references
 * 
 * REFERENCES:
 * - All screen components (MapScreen, SettingsScreen, etc.)
 * - React Navigation libraries (Drawer, Stack, Tab navigators)
 * - NavigationContainer (for navigation state management)
 * 
 * IMPORTANCE TO APP:
 * Critical - This defines the entire user experience flow through the app.
 * Poor navigation structure makes apps confusing and frustrating to use.
 * This component determines how intuitive and professional the app feels
 * to users. Changes here affect the entire app's usability and user experience.
 * 
 * IMPROVEMENT SUGGESTIONS:
 * 1. Add authentication guards - restrict access to authenticated screens
 * 2. Add dynamic navigation - show/hide sections based on user permissions
 * 3. Add deep linking support - handle URLs and external navigation
 * 4. Add navigation analytics - track user navigation patterns
 * 5. Add gesture customization - custom swipe behaviors and animations
 * 6. Add navigation state persistence - remember user's last screen
 * 7. Add conditional navigation - different structures for different user types
 * 8. Add accessibility improvements - better screen reader navigation
 * 9. Add navigation shortcuts - quick access to frequently used screens
 * 10. Add onboarding navigation - guided tours for new users
 * 11. Add modal overlays - system for app-wide modals and dialogs
 * 12. Add navigation themes - custom styling that matches app themes
 * 13. Add navigation preloading - preload next likely screens for performance
 * 14. Add navigation security - prevent access to sensitive screens
 * 15. Add responsive navigation - adapt to tablet and landscape orientations
 * 16. Add navigation search - search and jump to specific screens
 * 17. Add navigation customization - let users customize drawer order
 * 18. Add navigation breadcrumbs - show current location in complex flows
 */

import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MapScreen from '../screens/MapScreen';
import PastJourneysScreen from '../screens/PastJourneysScreen';
import DiscoveriesScreen from '../screens/DiscoveriesScreen';
import SavedPlacesScreen from '../screens/SavedPlacesScreen';
import SocialScreen from '../screens/SocialScreen';
import SettingsScreen from '../screens/SettingsScreen';
import DiscoveryPreferencesScreen from '../screens/DiscoveryPreferencesScreen';
import SignInScreen from '../screens/SignInScreen';
import EmailAuthScreen from '../screens/EmailAuthScreen';
import { NavigationContainer } from '@react-navigation/native';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function DiscoveriesTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Suggestions" component={DiscoveriesScreen} />
      <Tab.Screen name="Saved" component={SavedPlacesScreen} />
      {/* Add DismissedTab.js if/when created */}
    </Tab.Navigator>
  );
}

function MapStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MapScreen" component={MapScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PastJourneysScreen" component={PastJourneysScreen} />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
      <Stack.Screen name="DiscoveryPreferencesScreen" component={DiscoveryPreferencesScreen} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SignInScreen" component={SignInScreen} />
      <Stack.Screen name="EmailAuthScreen" component={EmailAuthScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Drawer.Navigator initialRouteName="Map">
        <Drawer.Screen name="Map" component={MapStack} />
        <Drawer.Screen name="Discoveries" component={DiscoveriesTabs} />
        <Drawer.Screen name="Social" component={SocialScreen} />
        <Drawer.Screen name="Settings" component={SettingsStack} />
        <Drawer.Screen name="SignIn" component={AuthStack} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
} 