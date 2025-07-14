/*
  SignInScreen.js
  ----------------
  What this page does:
  - Handles user authentication, allowing users to sign in with Google or email.
  - Manages the sign-in flow, displays loading states, and navigates to the email auth screen if needed.

  Why this page exists & its importance:
  - Provides secure access to the app's features by authenticating users.
  - Essential for user management and protecting user data.

  References & dependencies:
  - Uses Google Auth via expo-auth-session and Firebase.
  - Relies on UserContext for profile management.
  - Uses the theme system (useTheme) for dynamic styling.
  - Integrates with navigation and custom UI components (SectionHeader, AppButton).

  Suggestions for improvement:
  - Add more comments explaining the Google sign-in flow and error handling.
  - Ensure all color and style values use the theme system (avoid hardcoded values).
  - Consider extracting authentication logic into a custom hook for clarity.
  - Improve accessibility for all buttons and text fields.
*/
// screens/SignInScreen.js
import React, { useEffect, useState } from 'react';
import { Button, Alert, ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { useUser } from '../contexts/UserContext';
import { Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { getFallbackTheme } from '../styles/theme';

import { 
  GOOGLE_WEB_CLIENT_ID, 
  GOOGLE_IOS_CLIENT_ID, 
  GOOGLE_ANDROID_CLIENT_ID 
} from "../config";

import SectionHeader from '../components/ui/SectionHeader';
import AppButton from '../components/ui/AppButton';
import Logger from '../utils/Logger';

// Use platform-specific client IDs
const getClientId = () => {
  if (Platform.OS === 'ios') {
    return GOOGLE_IOS_CLIENT_ID || GOOGLE_WEB_CLIENT_ID;
  } else if (Platform.OS === 'android') {
    return GOOGLE_ANDROID_CLIENT_ID || GOOGLE_WEB_CLIENT_ID;
  } else {
    return GOOGLE_WEB_CLIENT_ID;
  }
};

const clientId = getClientId();
Logger.debug('Using Google Client ID for', Platform.OS, ':', clientId);

// discovery endpoints for Google
const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export default function SignInScreen() {
  const [loading, setLoading] = useState(false);
  const { createOrUpdateProfile } = useUser();
  const navigation = useNavigation();
  const { getCurrentThemeColors } = useTheme();
  
  console.log('[SignInScreen]', 'getCurrentThemeColors function exists:', !!getCurrentThemeColors);
  
  const colors = getCurrentThemeColors() || getFallbackTheme();
  
  console.log('[SignInScreen]', 'colors result:', { 
    colorsExists: !!colors, 
    colorsType: typeof colors, 
    colorsKeys: colors ? Object.keys(colors) : null,
    usingFallback: !getCurrentThemeColors()
  });
  
  Logger.debug('SIGNIN_SCREEN', 'Theme colors loaded', {
    colorsExists: !!colors,
    colorsType: typeof colors,
    colorsKeys: colors ? Object.keys(colors) : null
  });
  
  // Defensive check - if colors is undefined/null, use fallback rendering
  if (!colors) {
    Logger.warn('SIGNIN_SCREEN', 'Colors is undefined, using fallback rendering');
    return (
      <View style={[styles.container, { backgroundColor: '#1E1E1E' }]}>
        <SectionHeader title="Sign In" />
        <Text style={[styles.title, { color: '#FFFFFF' }]}>Hero's Path</Text>
        <Text style={[styles.subtitle, { color: '#8E8E93' }]}>Discover your journey</Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={[styles.loadingText, { color: '#8E8E93' }]}>Signing you in...</Text>
          </View>
        ) : (
          <View style={styles.buttonContainer}>
            <AppButton
              disabled={!request}
              title="Sign in with Google"
              onPress={handleSignIn}
              variant="primary"
            />
            <View style={{ height: 16 }} />
            <AppButton
              title="Sign in with Email"
              onPress={() => navigation.navigate('EmailAuth')}
              variant="secondary"
            />
          </View>
        )}
      </View>
    );
  }
  
  const [request, response, promptAsync] = Google.useAuthRequest(
    {
      expoClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
      androidClientId: GOOGLE_ANDROID_CLIENT_ID,
      scopes: ['profile', 'email', 'openid'],
    }
  );

  // Add: Log the request object
  useEffect(() => {
    Logger.debug('Google Auth Request object:', request);
  }, [request]);

  useEffect(() => {
    const signInWithGoogle = async () => {
      if (response?.type === 'success') {
        setLoading(true);
        try {
          const { authentication } = response;
          const credential = GoogleAuthProvider.credential(null, authentication.accessToken);
          const userCredential = await signInWithCredential(auth, credential);
        } catch (error) {
          Logger.error('Sign-in error details:', error);
          Logger.error('Error code:', error.code);
          Logger.error('Error message:', error.message);
          Alert.alert('Sign-in error', `Error: ${error.message}\nCode: ${error.code}`);
        } finally {
          setLoading(false);
        }
      } else if (response?.type === 'error') {
        Logger.error('Google auth error:', response.error);
        Alert.alert('Google Auth Error', response.error?.message || 'Unknown error occurred');
      }
    };
    signInWithGoogle();
  }, [response, createOrUpdateProfile]);

  const handleSignIn = async () => {
    try {
      const result = await promptAsync({
        useProxy: true, // <--- This is the key!
        webBrowserRedirectMode: 'browser'
      });
    } catch (error) {
      Logger.error('Google promptAsync error:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors?.background || '#1E1E1E' }]}>
      <SectionHeader title="Sign In" />
      <Text style={[styles.title, { color: colors?.text || '#FFFFFF' }]}>Hero's Path</Text>
      <Text style={[styles.subtitle, { color: colors?.secondaryText || '#8E8E93' }]}>Discover your journey</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors?.primary || '#007AFF'} />
          <Text style={[styles.loadingText, { color: colors?.secondaryText || '#8E8E93' }]}>Signing you in...</Text>
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          <AppButton
            disabled={!request}
            title="Sign in with Google"
            onPress={handleSignIn}
            variant="primary"
          />
          <View style={{ height: 16 }} />
          <AppButton
            title="Sign in with Email"
            onPress={() => navigation.navigate('EmailAuth')}
            variant="secondary"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 40,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
});
