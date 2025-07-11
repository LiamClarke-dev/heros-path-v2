import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import MapScreen from './screens/MapScreen';
import PastJourneysScreen from './screens/PastJourneysScreen';
import DiscoveriesScreen from './screens/DiscoveriesScreen';
import SavedPlacesScreen from './screens/SavedPlacesScreen';
import SocialScreen from './screens/SocialScreen';
import SettingsScreen from './screens/SettingsScreen';
import SignInScreen from './screens/SignInScreen';
import { UserProvider, useUser } from './contexts/UserContext';
import { Colors, Spacing, Typography } from './styles/theme';

const Drawer = createDrawerNavigator();

function AppContent() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return <SignInScreen />;
  }

  return (
    <NavigationContainer>
      <Drawer.Navigator 
        initialRouteName="Map"
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: Colors.background,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Drawer.Screen 
          name="Map" 
          component={MapScreen}
          options={{
            title: 'Hero\'s Path',
            drawerLabel: 'Map',
          }}
        />
        <Drawer.Screen 
          name="PastJourneys" 
          component={PastJourneysScreen}
          options={{
            title: 'Past Journeys',
            drawerLabel: 'Past Journeys',
          }}
        />
        <Drawer.Screen 
          name="Discoveries" 
          component={DiscoveriesScreen}
          options={{
            title: 'Discoveries',
            drawerLabel: 'Discoveries',
          }}
        />
        <Drawer.Screen 
          name="SavedPlaces" 
          component={SavedPlacesScreen}
          options={{
            title: 'Saved Places',
            drawerLabel: 'Saved Places',
          }}
        />
        <Drawer.Screen 
          name="Social" 
          component={SocialScreen}
          options={{
            title: 'Social',
            drawerLabel: 'Social',
          }}
        />
        <Drawer.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{
            title: 'Settings',
            drawerLabel: 'Settings',
          }}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    ...Typography.body,
    color: Colors.text,
  },
});
