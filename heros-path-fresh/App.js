import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, Text, StyleSheet, Alert } from 'react-native';
import { RootSiblingParent } from 'react-native-root-siblings';
import * as SplashScreen from 'expo-splash-screen';
import MapScreen from './screens/MapScreen';
import PastJourneysScreen from './screens/PastJourneysScreen';
import DiscoveriesScreen from './screens/DiscoveriesScreen';
import SavedPlacesScreen from './screens/SavedPlacesScreen';
import SocialScreen from './screens/SocialScreen';
import SettingsScreen from './screens/SettingsScreen';
import DiscoveryPreferencesScreen from './screens/DiscoveryPreferencesScreen';
import SignInScreen from './screens/SignInScreen';
import EmailAuthScreen from './screens/EmailAuthScreen';
import { UserProvider, useUser } from './contexts/UserContext';
import { ExplorationProvider } from './contexts/ExplorationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Colors, Spacing, Typography } from './styles/theme';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

// Memoized navigation components to prevent useInsertionEffect warnings
const MemoizedDrawerNavigator = React.memo(() => {
  const { user, profileLoading } = useUser();
  
  if (profileLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="EmailAuth" component={EmailAuthScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Drawer.Navigator
      initialRouteName="Map"
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        drawerStyle: {
          backgroundColor: Colors.background,
        },
        drawerActiveTintColor: Colors.tabActive,
        drawerInactiveTintColor: Colors.tabInactive,
      }}
    >
      <Drawer.Screen 
        name="Map" 
        component={MapScreen}
        options={{
          title: "Hero's Path",
          drawerIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>🗺️</Text>
          ),
        }}
      />
      <Drawer.Screen 
        name="PastJourneys" 
        component={PastJourneysScreen}
        options={{
          title: "Past Journeys",
          drawerIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>📚</Text>
          ),
        }}
      />
      <Drawer.Screen 
        name="Discoveries" 
        component={DiscoveriesScreen}
        options={{
          title: "Discoveries",
          drawerIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>🔍</Text>
          ),
        }}
      />
      <Drawer.Screen 
        name="SavedPlaces" 
        component={SavedPlacesScreen}
        options={{
          title: "Saved Places",
          drawerIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>❤️</Text>
          ),
        }}
      />
      <Drawer.Screen 
        name="Social" 
        component={SocialScreen}
        options={{
          title: "Social",
          drawerIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>👥</Text>
          ),
        }}
      />
      <Drawer.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: "Settings",
          drawerIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>⚙️</Text>
          ),
        }}
      />
      <Drawer.Screen 
        name="DiscoveryPreferences" 
        component={DiscoveryPreferencesScreen}
        options={{
          title: "Discovery Preferences",
          drawerIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>🎯</Text>
          ),
        }}
      />
    </Drawer.Navigator>
  );
});

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading Hero's Path...</Text>
      </View>
    );
  }

  return (
    <RootSiblingParent>
      <ThemeProvider>
        <UserProvider>
          <ExplorationProvider>
            <NavigationContainer>
              <MemoizedDrawerNavigator />
            </NavigationContainer>
          </ExplorationProvider>
        </UserProvider>
      </ThemeProvider>
    </RootSiblingParent>
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
