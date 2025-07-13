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