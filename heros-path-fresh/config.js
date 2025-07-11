// config.js
// Environment variables are injected by EAS build system
// For local development, these will be undefined and you'll need to use .env file

import Constants from 'expo-constants';
let envVars = {};
try {
  // Only import @env in dev, as it will fail in EAS builds
  // eslint-disable-next-line import/no-unresolved, import/extensions
  envVars = require('@env');
} catch (e) {
  // ignore if not available
}

// Debug: Log what's available in Constants
console.log('=== DEBUGGING ENVIRONMENT VARIABLES ===');
console.log('Constants.expoConfig:', Constants.expoConfig);
console.log('Constants.expoConfig?.extra:', Constants.expoConfig?.extra);
console.log('process.env keys:', Object.keys(process.env).filter(key => key.includes('GOOGLE') || key.includes('FIREBASE')));

const getEnvVar = (key) => {
  // 1. EAS build: extra
  if (Constants.expoConfig?.extra?.[key]) return Constants.expoConfig.extra[key];
  // 2. EAS build: env
  if (Constants.expoConfig?.env?.[key]) return Constants.expoConfig.env[key];
  // 3. process.env (local dev)
  if (process.env[key]) return process.env[key];
  // 4. @env (react-native-dotenv)
  if (envVars[key]) return envVars[key];
  return '';
};

// Debug: Log environment variables to see what's available
console.log('Environment variables check:');
console.log('FIREBASE_API_KEY:', getEnvVar('FIREBASE_API_KEY') ? 'SET' : 'NOT SET');
console.log('FIREBASE_AUTH_DOMAIN:', getEnvVar('FIREBASE_AUTH_DOMAIN') ? 'SET' : 'NOT SET');
console.log('GOOGLE_WEB_CLIENT_ID:', getEnvVar('GOOGLE_WEB_CLIENT_ID') ? 'SET' : 'NOT SET');

export const GOOGLE_MAPS_API_KEY_ANDROID = getEnvVar('GOOGLE_MAPS_API_KEY_ANDROID');
export const GOOGLE_MAPS_API_KEY_IOS = getEnvVar('GOOGLE_MAPS_API_KEY_IOS');
export const GOOGLE_ROADS_API_KEY = getEnvVar('GOOGLE_ROADS_API_KEY');

export const FIREBASE_API_KEY = getEnvVar('FIREBASE_API_KEY');
export const FIREBASE_AUTH_DOMAIN = getEnvVar('FIREBASE_AUTH_DOMAIN');
export const FIREBASE_PROJECT_ID = getEnvVar('FIREBASE_PROJECT_ID');
export const FIREBASE_STORAGE_BUCKET = getEnvVar('FIREBASE_STORAGE_BUCKET');
export const FIREBASE_MESSAGING_SENDER_ID = getEnvVar('FIREBASE_MESSAGING_SENDER_ID');
export const FIREBASE_APP_ID = getEnvVar('FIREBASE_APP_ID');
export const FIREBASE_MEASUREMENT_ID = getEnvVar('FIREBASE_MEASUREMENT_ID');

export const GOOGLE_WEB_CLIENT_ID = getEnvVar('GOOGLE_WEB_CLIENT_ID');
export const GOOGLE_IOS_REVERSED_CLIENT_ID = getEnvVar('GOOGLE_IOS_REVERSED_CLIENT_ID');
export const GOOGLE_ANDROID_CLIENT_ID = getEnvVar('GOOGLE_ANDROID_CLIENT_ID');

// Debug: Log the actual values being used
console.log('Config values being used:');
console.log('FIREBASE_API_KEY value:', FIREBASE_API_KEY ? 'HAS VALUE' : 'EMPTY');
console.log('FIREBASE_AUTH_DOMAIN value:', FIREBASE_AUTH_DOMAIN ? 'HAS VALUE' : 'EMPTY');
console.log('GOOGLE_WEB_CLIENT_ID value:', GOOGLE_WEB_CLIENT_ID ? 'HAS VALUE' : 'EMPTY');