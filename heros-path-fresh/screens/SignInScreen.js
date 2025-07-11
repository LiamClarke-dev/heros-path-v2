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

import { 
  GOOGLE_WEB_CLIENT_ID, 
  GOOGLE_IOS_CLIENT_ID, 
  GOOGLE_ANDROID_CLIENT_ID 
} from "../config";

// Add: Log all Google client IDs at startup
console.log('GOOGLE_WEB_CLIENT_ID:', GOOGLE_WEB_CLIENT_ID);
console.log('GOOGLE_IOS_CLIENT_ID:', GOOGLE_IOS_CLIENT_ID);
console.log('GOOGLE_ANDROID_CLIENT_ID:', GOOGLE_ANDROID_CLIENT_ID);

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
console.log('Using Google Client ID for', Platform.OS, ':', clientId);

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
    console.log('Google Auth Request object:', request);
  }, [request]);

  useEffect(() => {
    const signInWithGoogle = async () => {
      console.log('Google AuthSession response:', response);
      
      if (response?.type === 'success') {
        setLoading(true);
        try {
          console.log('Starting Google sign-in process...');
          const { authentication } = response;
          console.log('Authentication object:', authentication);
          
          const credential = GoogleAuthProvider.credential(null, authentication.accessToken);
          console.log('Created credential, signing in with Firebase...');
          
          const userCredential = await signInWithCredential(auth, credential);
          console.log('Firebase sign-in successful:', userCredential.user);
          
          // Create or update user profile in Firestore
          const user = userCredential.user;
          const profileData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'Hero Explorer',
            photoURL: user.photoURL,
            emailVerified: user.emailVerified,
            lastSignInAt: new Date().toISOString(),
            isNewUser: userCredential._tokenResponse?.isNewUser || false,
            // Default profile settings
            bio: '',
            location: '',
            preferences: {
              notifications: true,
              privacy: 'public',
              units: 'metric'
            },
            stats: {
              totalWalks: 0,
              totalDistance: 0,
              totalTime: 0,
              discoveries: 0
            }
          };

          console.log('Creating/updating profile with data:', profileData);
          await createOrUpdateProfile(profileData);
          console.log('Profile created/updated successfully');
          
          // Profile created successfully - user will be automatically navigated by App.js
          Alert.alert('🎉 Welcome!', 'Your profile has been created successfully!');
        } catch (error) {
          console.error('Sign-in error details:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          Alert.alert('Sign-in error', `Error: ${error.message}\nCode: ${error.code}`);
        } finally {
          setLoading(false);
        }
      } else if (response?.type === 'error') {
        console.error('Google auth error:', response.error);
        Alert.alert('Google Auth Error', response.error?.message || 'Unknown error occurred');
      } else {
        console.log('Google AuthSession response type:', response?.type);
      }
    };
    signInWithGoogle();
  }, [response, createOrUpdateProfile]);

  const handleSignIn = async () => {
    console.log('Sign in button pressed');
    try {
      const result = await promptAsync({
        useProxy: true, // <--- This is the key!
        webBrowserRedirectMode: 'browser'
      });
      console.log('Google promptAsync result:', result);
    } catch (error) {
      console.error('Google promptAsync error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hero's Path</Text>
      <Text style={styles.subtitle}>Discover your journey</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Signing you in...</Text>
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          <Button
            disabled={!request}
            title="Sign in with Google"
            onPress={handleSignIn}
            color="#007AFF"
          />
          <View style={{ height: 16 }} />
          <Button
            title="Sign in with Email"
            onPress={() => navigation.navigate('EmailAuth')}
            color="#888"
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
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
});
