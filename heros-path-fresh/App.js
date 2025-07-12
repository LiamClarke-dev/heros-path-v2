import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, Text, StyleSheet, Alert } from 'react-native';
import { RootSiblingParent } from 'react-native-root-siblings';
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
import { Colors, Spacing, Typography } from './styles/theme';

const Drawer = createDrawerNavigator();
const AuthStack = createStackNavigator();
const MainStack = createStackNavigator();

function AuthStackScreen() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="EmailAuth" component={EmailAuthScreen} />
    </AuthStack.Navigator>
  );
}

function MainStackScreen() {
  return (
    <MainStack.Navigator>
      <MainStack.Screen 
        name="DrawerHome" 
        component={DrawerNavigator}
        options={{ headerShown: false }}
      />
      <MainStack.Screen 
        name="DiscoveryPreferences" 
        component={DiscoveryPreferencesScreen}
        options={{ 
          headerShown: false,
          presentation: 'modal'
        }}
      />
    </MainStack.Navigator>
  );
}

function DrawerNavigator() {
  return (
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
  );
}

function AppContent() {
  const { user, loading, error } = useUser();

  // Show error if Firebase is not properly configured
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Configuration Error</Text>
        <Text style={styles.errorText}>
          {error}
        </Text>
        <Text style={styles.errorSubtext}>
          Please check your environment variables and rebuild the app.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        <MainStackScreen />
      ) : (
        <AuthStackScreen />
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <RootSiblingParent>
      <UserProvider>
        <AppContent />
      </UserProvider>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  errorText: {
    ...Typography.body,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  errorSubtext: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontSize: 14,
  },
});
