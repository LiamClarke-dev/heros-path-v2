import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, Text, StyleSheet, Alert, Image } from 'react-native';
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
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { Colors, Spacing, Typography, getFallbackTheme } from './styles/theme';
import { MaterialIcons } from '@expo/vector-icons';
import Logger from './utils/Logger';

SplashScreen.preventAutoHideAsync();

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

function MainDrawer() {
  const { getCurrentThemeColors, isLoading } = useTheme();
  const colors = getCurrentThemeColors() || getFallbackTheme();
  // Don't render until theme is ready
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading theme...</Text>
      </View>
    );
  }

  return (
    <Drawer.Navigator
      initialRouteName="Map"
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        drawerStyle: {
          backgroundColor: colors.background,
        },
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.tabInactive,
      }}
    >
      <Drawer.Screen 
        name="Map" 
        component={MapScreen}
        options={{
          headerTitle: '',
          headerRight: () => (
            <Image source={require('./assets/icon.png')} style={{ width: 36, height: 36, marginRight: 16 }} resizeMode="contain" />
          ),
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="map" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="PastJourneys" 
        component={PastJourneysScreen}
        options={{
          title: "Past Journeys",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="history" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Discoveries" 
        component={DiscoveriesScreen}
        options={{
          title: "Discoveries",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="explore" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="SavedPlaces" 
        component={SavedPlacesScreen}
        options={{
          title: "Saved Places",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="favorite" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Social" 
        component={SocialScreen}
        options={{
          title: "Social",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="group" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: "Settings",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="settings" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="DiscoveryPreferences" 
        component={DiscoveryPreferencesScreen}
        options={{
          title: "Discovery Preferences",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="tune" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}

function RootNavigation() {
  const { getNavigationTheme, isLoading } = useTheme();
  const { user } = useUser();
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading theme...</Text>
      </View>
    );
  }

  const navigationTheme = getNavigationTheme ? getNavigationTheme() : undefined;

  return (
    <NavigationContainer theme={navigationTheme}>
      {user ? (
        <MainDrawer />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen name="EmailAuth" component={EmailAuthScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
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
    <ThemeProvider>
      <UserProvider>
        <ExplorationProvider>
          <RootSiblingParent>
            <RootNavigation />
          </RootSiblingParent>
        </ExplorationProvider>
      </UserProvider>
    </ThemeProvider>
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
