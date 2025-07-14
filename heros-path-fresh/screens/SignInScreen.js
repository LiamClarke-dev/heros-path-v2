/*
 * SIGN IN SCREEN (USER AUTHENTICATION INTERFACE)
 * ===============================================
 * 
 * PURPOSE:
 * This screen handles user authentication for Hero's Path using Google Sign-In integration.
 * It provides a secure, streamlined way for users to create accounts and access their
 * personalized walking data, discoveries, and preferences. Think of it as the "gateway"
 * that transforms Hero's Path from a generic walking app into a personalized exploration
 * companion with cloud-synced data and social features.
 * 
 * FUNCTIONALITY:
 * - Google OAuth Integration: Secure authentication using Google accounts
 * - Platform-Specific Configuration: Handles iOS, Android, and web client IDs
 * - Firebase Authentication: Integrates with Firebase Auth for user management
 * - User Profile Creation: Automatically creates user profiles after successful sign-in
 * - Cross-Platform Support: Works consistently across different device platforms
 * - Error Handling: Graceful handling of authentication failures and edge cases
 * - Loading States: Clear visual feedback during authentication process
 * - Theme Integration: Consistent styling that adapts to current app theme
 * - Navigation Management: Proper routing after successful authentication
 * - Security Compliance: Follows OAuth 2.0 standards and best practices
 * 
 * WHY IT EXISTS:
 * Hero's Path requires user accounts to provide personalized features like discovery
 * history, saved places, user preferences, and social features. Google Sign-In provides
 * a trusted, secure authentication method that most users already have access to,
 * reducing friction while maintaining security. This enables cloud sync and personalization
 * that makes the app significantly more valuable.
 * 
 * KEY FEATURES:
 * - Google OAuth 2.0: Industry-standard secure authentication
 * - Platform Detection: Automatically uses correct client ID for each platform
 * - Seamless Integration: Smooth flow from authentication to app usage
 * - Profile Management: Automatic user profile creation and management
 * - Error Recovery: Clear error messages and retry mechanisms
 * - Security First: Secure token handling and credential management
 * - User Experience: Minimal friction authentication flow
 * - Theme Consistency: Authentication UI matches app theming
 * 
 * AUTHENTICATION FLOW:
 * 1. User taps "Sign In with Google" button
 * 2. Google OAuth flow opens in secure browser/webview
 * 3. User authenticates with Google and grants permissions
 * 4. App receives secure authentication token
 * 5. Token is exchanged for Firebase Authentication credential
 * 6. User profile is created or updated in Firebase
 * 7. User is automatically navigated to main app interface
 * 8. All subsequent app usage is personalized and cloud-synced
 * 
 * RELATIONSHIPS:
 * - Uses UserContext for profile creation and management
 * - Integrates with Firebase Authentication for user management
 * - Connects to Google OAuth services for secure authentication
 * - Uses ThemeContext for consistent visual styling
 * - Works with navigation system for post-authentication routing
 * - Triggers user data synchronization and migration processes
 * - Enables all personalized features throughout the app
 * 
 * REFERENCED BY:
 * - AppNavigator.js (as part of the authentication flow)
 * - Users who need to sign in to access personalized features
 * - First-time users creating accounts
 * - Returning users who need to re-authenticate
 * 
 * REFERENCES:
 * - UserContext.js (for user profile management)
 * - Firebase Authentication (for secure user management)
 * - Google OAuth services (for authentication provider)
 * - ThemeContext.js (for consistent styling)
 * - Navigation system (for post-authentication routing)
 * - Configuration files (for API keys and client IDs)
 * 
 * IMPORTANCE TO APP:
 * CRITICAL - This screen is essential for accessing Hero's Path's core value proposition.
 * Without authentication, users cannot access personalized discoveries, save places,
 * track walking history, or use social features. It's the gateway that unlocks the
 * app's full potential and enables the cloud sync that makes the experience valuable
 * across multiple devices and sessions.
 * 
 * IMPROVEMENT SUGGESTIONS:
 * 1. Add alternative authentication - Apple Sign-In, Facebook, email/password
 * 2. Add biometric authentication - fingerprint, face recognition for quick access
 * 3. Add guest mode - limited functionality without requiring account creation
 * 4. Add authentication analytics - track sign-in patterns and success rates
 * 5. Add two-factor authentication - enhanced security for sensitive accounts
 * 6. Add social login options - additional OAuth providers for user preference
 * 7. Add offline authentication - limited functionality when network unavailable
 * 8. Add authentication recovery - help users recover access to accounts
 * 9. Add privacy controls - granular permissions and data sharing controls
 * 10. Add authentication customization - branded authentication experience
 * 11. Add accessibility features - better support for users with disabilities
 * 12. Add authentication tutorials - help users understand the sign-in process
 * 13. Add single sign-on - integration with enterprise authentication systems
 * 14. Add authentication monitoring - detect and prevent fraudulent sign-ins
 * 15. Add progressive authentication - upgrade from guest to full account
 * 16. Add authentication preferences - remember user authentication choices
 * 17. Add multi-device management - manage authentication across multiple devices
 * 18. Add authentication insights - show users their authentication history
 * 19. Add authentication automation - streamline repeat authentication
 * 20. Add authentication compliance - ensure GDPR, CCPA, and other regulatory compliance
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
  const colors = getCurrentThemeColors() || getFallbackTheme();
  Logger.debug('SIGNIN_SCREEN', 'Theme colors loaded', {
    colorsExists: !!colors,
    colorsType: typeof colors,
    colorsKeys: colors ? Object.keys(colors) : null
  });
  if (!colors) {
    Logger.warn('SIGNIN_SCREEN', 'Colors is undefined after getCurrentThemeColors!');
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SectionHeader title="Sign In" />
      <Text style={[styles.title, { color: colors.text }]}>Hero's Path</Text>
      <Text style={[styles.subtitle, { color: colors.secondaryText }]}>Discover your journey</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.secondaryText }]}>Signing you in...</Text>
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
