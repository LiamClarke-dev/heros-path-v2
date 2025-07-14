/*
  EmailAuthScreen.js
  -------------------
  What this page does:
  - Provides email/password authentication for users (sign up and sign in).
  - Handles form input, validation, and displays feedback messages.

  Why this page exists & its importance:
  - Offers an alternative to Google sign-in, making the app accessible to more users.
  - Essential for user management and onboarding.

  References & dependencies:
  - Uses Firebase functions for email authentication.
  - Relies on the theme system (useTheme) for dynamic styling.
  - Integrates with navigation and custom UI components (SectionHeader, AppButton).

  Suggestions for improvement:
  - Add more comments explaining the authentication flow and error handling.
  - Ensure all color and style values use the theme system (avoid hardcoded values).
  - Consider extracting form logic into a custom hook for clarity.
  - Improve accessibility for input fields and buttons.
*/
import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';
import { signUpWithEmail, signInWithEmail } from '../firebase';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import SectionHeader from '../components/ui/SectionHeader';
import AppButton from '../components/ui/AppButton';

export default function EmailAuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { getCurrentThemeColors } = useTheme();
  
  console.log('[EmailAuthScreen]', 'getCurrentThemeColors function exists:', !!getCurrentThemeColors);
  
  const colors = getCurrentThemeColors();
  
  console.log('[EmailAuthScreen]', 'colors result:', { 
    colorsExists: !!colors, 
    colorsType: typeof colors, 
    colorsKeys: colors ? Object.keys(colors) : null
  });

  // Defensive check - if colors is undefined/null, use fallback rendering
  if (!colors) {
    console.warn('[EmailAuthScreen]', 'Colors is undefined, using fallback rendering');
    return (
      <View style={[styles.container, { backgroundColor: '#1E1E1E' }]}>
        <SectionHeader title="Email Authentication" />
        <TextInput
          style={[styles.input, { 
            backgroundColor: '#2C2C2E',
            borderColor: '#38383A',
            color: '#FFFFFF'
          }]}
          placeholder="Email"
          placeholderTextColor="#8E8E93"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={[styles.input, { 
            backgroundColor: '#2C2C2E',
            borderColor: '#38383A',
            color: '#FFFFFF'
          }]}
          placeholder="Password"
          placeholderTextColor="#8E8E93"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <View style={styles.buttonRow}>
          <AppButton title="Sign Up" onPress={handleSignUp} disabled={loading} variant="primary" />
          <View style={{ width: 16 }} />
          <AppButton title="Sign In" onPress={handleSignIn} disabled={loading} variant="secondary" />
        </View>
        {message ? <Text style={[styles.message, { color: '#FF453A' }]}>{message}</Text> : null}
      </View>
    );
  }

  const handleSignUp = async () => {
    setLoading(true);
    setMessage('');
    try {
      await signUpWithEmail(email, password);
      setMessage('Sign up successful! You can now sign in.');
      Alert.alert('Success', 'Account created! You can now sign in.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    setMessage('');
    try {
      await signInWithEmail(email, password);
      setMessage('Sign in successful!');
      Alert.alert('Success', 'Signed in!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors?.background || '#1E1E1E' }]}>
      <SectionHeader title="Email Authentication" />
      <TextInput
        style={[styles.input, { 
          backgroundColor: colors?.inputBackground || '#2C2C2E',
          borderColor: colors?.border || '#38383A',
          color: colors?.text || '#FFFFFF'
        }]}
        placeholder="Email"
        placeholderTextColor={colors?.secondaryText || '#8E8E93'}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={[styles.input, { 
          backgroundColor: colors?.inputBackground || '#2C2C2E',
          borderColor: colors?.border || '#38383A',
          color: colors?.text || '#FFFFFF'
        }]}
        placeholder="Password"
        placeholderTextColor={colors?.secondaryText || '#8E8E93'}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <View style={styles.buttonRow}>
        <AppButton title="Sign Up" onPress={handleSignUp} disabled={loading} variant="primary" />
        <View style={{ width: 16 }} />
        <AppButton title="Sign In" onPress={handleSignIn} disabled={loading} variant="secondary" />
      </View>
      {message ? <Text style={[styles.message, { color: colors?.error || '#FF453A' }]}>{message}</Text> : null}
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  input: {
    width: 280,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  message: {
    marginTop: 16,
    textAlign: 'center',
  },
}); 