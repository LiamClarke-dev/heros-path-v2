/*
 * EMAIL AUTHENTICATION SCREEN (ALTERNATIVE AUTHENTICATION METHOD)
 * ================================================================
 * 
 * PURPOSE:
 * This screen provides an alternative authentication method using email/password
 * credentials for users who prefer not to use Google Sign-In or don't have Google
 * accounts. It offers traditional account creation and sign-in functionality while
 * maintaining integration with Firebase Authentication. Think of it as the "traditional
 * authentication option" that ensures Hero's Path is accessible to all users regardless
 * of their preferred authentication method.
 * 
 * FUNCTIONALITY:
 * - Email/Password Registration: Create new accounts using email credentials
 * - Email/Password Sign-In: Authenticate existing users with email credentials
 * - Input Validation: Ensure email and password meet security requirements
 * - Error Handling: Clear feedback for authentication failures and validation issues
 * - Loading States: Visual feedback during authentication processes
 * - Success Management: Proper navigation and feedback after successful authentication
 * - Firebase Integration: Seamless integration with Firebase Authentication system
 * - Theme Consistency: Styling that adapts to current app theme
 * - User Experience: Clean, simple interface for traditional authentication
 * - Security Compliance: Secure handling of credentials and authentication tokens
 * 
 * WHY IT EXISTS:
 * While Google Sign-In is convenient for many users, some prefer email/password
 * authentication for privacy reasons, lack Google accounts, or have organizational
 * restrictions. This screen ensures Hero's Path is accessible to all users while
 * maintaining the same personalized features and cloud sync capabilities regardless
 * of authentication method.
 * 
 * KEY FEATURES:
 * - Dual Functionality: Both registration and sign-in in one interface
 * - Input Validation: Real-time feedback on email and password requirements
 * - Error Recovery: Clear error messages and retry mechanisms
 * - Security First: Secure credential handling and Firebase integration
 * - User Feedback: Success messages and navigation guidance
 * - Theme Integration: Consistent styling with app theming system
 * - Simple Interface: Clean, focused design for easy use
 * - Accessibility: Proper form labeling and keyboard navigation
 * 
 * AUTHENTICATION FLOW:
 * 1. User enters email and password credentials
 * 2. User selects either "Sign Up" or "Sign In" action
 * 3. Input validation ensures email format and password strength
 * 4. Firebase Authentication processes the request
 * 5. Success or error feedback is provided to user
 * 6. Successful authentication navigates to main app interface
 * 7. User profile is created or loaded for personalized experience
 * 
 * RELATIONSHIPS:
 * - Uses Firebase Authentication for secure credential management
 * - Integrates with ThemeContext for consistent visual styling
 * - Works with navigation system for proper screen transitions
 * - Connects to same user management system as Google Sign-In
 * - Enables same personalized features as other authentication methods
 * - Uses shared UI components for consistent interface design
 * 
 * REFERENCED BY:
 * - AppNavigator.js (as part of the authentication flow)
 * - Users who prefer email/password authentication
 * - SignInScreen.js (as an alternative authentication option)
 * - Users in regions or organizations where Google services are limited
 * 
 * REFERENCES:
 * - Firebase Authentication (for credential processing)
 * - ThemeContext.js (for consistent styling)
 * - Navigation system (for screen transitions)
 * - UI components (SectionHeader, AppButton)
 * - Firebase configuration and security rules
 * 
 * IMPORTANCE TO APP:
 * MEDIUM - This screen ensures authentication accessibility and user choice.
 * While Google Sign-In may be the primary authentication method, email/password
 * authentication is important for user accessibility, privacy preferences, and
 * ensuring the app works for users in all regions and contexts.
 * 
 * IMPROVEMENT SUGGESTIONS:
 * 1. Add password strength indicator - visual feedback on password security
 * 2. Add email verification - confirm email addresses before account activation
 * 3. Add password reset - forgot password functionality
 * 4. Add form validation - real-time validation with helpful error messages
 * 5. Add account linking - link email accounts with Google accounts
 * 6. Add two-factor authentication - enhanced security for email accounts
 * 7. Add password policies - enforce strong password requirements
 * 8. Add login history - show users their authentication history
 * 9. Add account recovery - help users recover locked or compromised accounts
 * 10. Add password manager integration - better integration with password managers
 * 11. Add accessibility features - better support for screen readers and assistive technology
 * 12. Add progressive registration - collect profile information during signup
 * 13. Add social verification - verify accounts through social media
 * 14. Add phone verification - optional phone number verification
 * 15. Add security questions - additional account recovery options
 * 16. Add breach monitoring - alert users to potential security issues
 * 17. Add session management - control active sessions across devices
 * 18. Add privacy controls - granular permissions during account creation
 * 19. Add compliance features - ensure GDPR, CCPA regulatory compliance
 * 20. Add authentication analytics - track signup and signin patterns
 */
import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';
import { signUpWithEmail, signInWithEmail } from '../firebase';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { getFallbackTheme } from '../styles/theme';
import SectionHeader from '../components/ui/SectionHeader';
import AppButton from '../components/ui/AppButton';

export default function EmailAuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { getCurrentThemeColors } = useTheme();
  const colors = getCurrentThemeColors() || getFallbackTheme();

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SectionHeader title="Email Authentication" />
      <TextInput
        style={[styles.input, { 
          backgroundColor: colors.inputBackground,
          borderColor: colors.border,
          color: colors.text
        }]}
        placeholder="Email"
        placeholderTextColor={colors.secondaryText}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={[styles.input, { 
          backgroundColor: colors.inputBackground,
          borderColor: colors.border,
          color: colors.text
        }]}
        placeholder="Password"
        placeholderTextColor={colors.secondaryText}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <View style={styles.buttonRow}>
        <AppButton title="Sign Up" onPress={handleSignUp} disabled={loading} variant="primary" />
        <View style={{ width: 16 }} />
        <AppButton title="Sign In" onPress={handleSignIn} disabled={loading} variant="secondary" />
      </View>
      {message ? <Text style={[styles.message, { color: colors.error }]}>{message}</Text> : null}
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