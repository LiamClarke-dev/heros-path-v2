// firebase.js
import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// import the native AsyncStorage
import AsyncStorage from "@react-native-async-storage/async-storage";

// import Constants from "expo-constants";

// const {
//   FIREBASE_API_KEY,
//   FIREBASE_AUTH_DOMAIN,
//   FIREBASE_PROJECT_ID,
//   FIREBASE_STORAGE_BUCKET,
//   FIREBASE_MESSAGING_SENDER_ID,
//   FIREBASE_APP_ID,
//   FIREBASE_MEASUREMENT_ID,
// } = Constants.manifest.extra;

import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID,
} from "./config";

// Debug: Log Firebase config values
console.log('Firebase config values:');
console.log('apiKey:', FIREBASE_API_KEY ? 'SET' : 'EMPTY');
console.log('authDomain:', FIREBASE_AUTH_DOMAIN ? 'SET' : 'EMPTY');
console.log('projectId:', FIREBASE_PROJECT_ID ? 'SET' : 'EMPTY');

// Check if required Firebase config values are available
const requiredConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
};

// Check if any required values are missing
const missingValues = Object.entries(requiredConfig)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingValues.length > 0) {
  console.error('Missing Firebase configuration values:', missingValues);
  console.error('Firebase initialization will fail. Please check your environment variables.');
  
  // Create a minimal config to prevent crash, but Firebase operations will fail
  const fallbackConfig = {
    apiKey: 'placeholder',
    authDomain: 'placeholder',
    projectId: 'placeholder',
    storageBucket: 'placeholder',
    messagingSenderId: 'placeholder',
    appId: 'placeholder',
    measurementId: FIREBASE_MEASUREMENT_ID || '',
  };
  
  console.log('Using fallback config to prevent crash');
  const app = initializeApp(fallbackConfig);
  
  // Initialize auth with error handling
  let auth;
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    console.error('Failed to initialize Firebase Auth:', error);
    // Create a mock auth object to prevent crashes
    auth = {
      onAuthStateChanged: (callback) => {
        console.warn('Firebase Auth not properly initialized');
        callback(null);
        return () => {};
      },
      signOut: async () => {
        console.warn('Firebase Auth not properly initialized');
        throw new Error('Firebase Auth not properly initialized');
      }
    };
  }
  
  export { auth };
  export const db = getFirestore(app);
} else {
  // All config values are present, proceed normally
  const firebaseConfig = {
    apiKey: FIREBASE_API_KEY,
    authDomain: FIREBASE_AUTH_DOMAIN,
    projectId: FIREBASE_PROJECT_ID,
    storageBucket: FIREBASE_STORAGE_BUCKET,
    messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
    appId: FIREBASE_APP_ID,
    measurementId: FIREBASE_MEASUREMENT_ID,
  };

  console.log('Full Firebase config:', {
    apiKey: FIREBASE_API_KEY ? '***' : 'EMPTY',
    authDomain: FIREBASE_AUTH_DOMAIN,
    projectId: FIREBASE_PROJECT_ID,
    storageBucket: FIREBASE_STORAGE_BUCKET,
    messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
    appId: FIREBASE_APP_ID,
    measurementId: FIREBASE_MEASUREMENT_ID,
  });

  const app = initializeApp(firebaseConfig);

  // <- HERE: initialize Auth with AsyncStorage persistence
  export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });

  export const db = getFirestore(app);
}
