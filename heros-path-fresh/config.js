// config.js
// Environment variables are injected by EAS build system
// For local development, these will be undefined and you'll need to use .env file

import Constants from 'expo-constants';
import {
  GOOGLE_MAPS_API_KEY_ANDROID as ENV_GOOGLE_MAPS_API_KEY_ANDROID,
  GOOGLE_MAPS_API_KEY_IOS as ENV_GOOGLE_MAPS_API_KEY_IOS,
  GOOGLE_ROADS_API_KEY as ENV_GOOGLE_ROADS_API_KEY,
  FIREBASE_API_KEY as ENV_FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN as ENV_FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID as ENV_FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET as ENV_FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID as ENV_FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID as ENV_FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID as ENV_FIREBASE_MEASUREMENT_ID,
  GOOGLE_WEB_CLIENT_ID as ENV_GOOGLE_WEB_CLIENT_ID,
  GOOGLE_IOS_REVERSED_CLIENT_ID as ENV_GOOGLE_IOS_REVERSED_CLIENT_ID,
  GOOGLE_ANDROID_CLIENT_ID as ENV_GOOGLE_ANDROID_CLIENT_ID,
} from '@env';

// Debug: Log what's available in Constants
console.log('=== DEBUGGING ENVIRONMENT VARIABLES ===');
console.log('Constants.expoConfig:', Constants.expoConfig);
console.log('Constants.expoConfig?.extra:', Constants.expoConfig?.extra);
console.log('process.env keys:', Object.keys(process.env).filter(key => key.includes('GOOGLE') || key.includes('FIREBASE')));

// NEW: Direct EAS environment test
console.log('=== EAS ENVIRONMENT TEST ===');
console.log('All Constants.expoConfig keys:', Object.keys(Constants.expoConfig || {}));
console.log('All Constants.expoConfig.env keys:', Object.keys(Constants.expoConfig?.env || {}));
console.log('All Constants.expoConfig.extra keys:', Object.keys(Constants.expoConfig?.extra || {}));

// Try different ways to access EAS environment variables
const easEnvVars = Constants.expoConfig?.extra?.eas?.env || {};
console.log('EAS env vars from extra.eas.env:', easEnvVars);

// Test direct access to mapped variables
console.log('=== DIRECT MAPPING TEST ===');
console.log('GOOGLE_WEB_CLIENT_ID from env mapping:', Constants.expoConfig?.env?.GOOGLE_WEB_CLIENT_ID);
console.log('FIREBASE_API_KEY from env mapping:', Constants.expoConfig?.env?.FIREBASE_API_KEY);

// WORKAROUND: Check if EAS is returning variable names instead of values
const isEasReturningVariableNames = Constants.expoConfig?.env?.GOOGLE_WEB_CLIENT_ID === 'GOOGLE_WEB_CLIENT_ID';
console.log('EAS returning variable names instead of values:', isEasReturningVariableNames);

// Debug: Log imported env variables
console.log('=== IMPORTED ENV VARIABLES ===');
console.log('ENV_GOOGLE_WEB_CLIENT_ID:', ENV_GOOGLE_WEB_CLIENT_ID ? 'SET' : 'NOT SET');
console.log('ENV_FIREBASE_API_KEY:', ENV_FIREBASE_API_KEY ? 'SET' : 'NOT SET');

// Get environment variables from EAS build or fallback to .env file
const envMap = {
  'GOOGLE_MAPS_API_KEY_ANDROID': ENV_GOOGLE_MAPS_API_KEY_ANDROID,
  'GOOGLE_MAPS_API_KEY_IOS': ENV_GOOGLE_MAPS_API_KEY_IOS,
  'GOOGLE_ROADS_API_KEY': ENV_GOOGLE_ROADS_API_KEY,
  'FIREBASE_API_KEY': ENV_FIREBASE_API_KEY,
  'FIREBASE_AUTH_DOMAIN': ENV_FIREBASE_AUTH_DOMAIN,
  'FIREBASE_PROJECT_ID': ENV_FIREBASE_PROJECT_ID,
  'FIREBASE_STORAGE_BUCKET': ENV_FIREBASE_STORAGE_BUCKET,
  'FIREBASE_MESSAGING_SENDER_ID': ENV_FIREBASE_MESSAGING_SENDER_ID,
  'FIREBASE_APP_ID': ENV_FIREBASE_APP_ID,
  'FIREBASE_MEASUREMENT_ID': ENV_FIREBASE_MEASUREMENT_ID,
  'GOOGLE_WEB_CLIENT_ID': ENV_GOOGLE_WEB_CLIENT_ID,
  'GOOGLE_IOS_REVERSED_CLIENT_ID': ENV_GOOGLE_IOS_REVERSED_CLIENT_ID,
  'GOOGLE_ANDROID_CLIENT_ID': ENV_GOOGLE_ANDROID_CLIENT_ID,
};

const getEnvVar = (key) => {
  // Try multiple possible locations for EAS environment variables
  const possibleSources = [
    Constants.expoConfig?.extra?.[key],
    Constants.expoConfig?.extra?.eas?.env?.[key],
    Constants.expoConfig?.env?.[key],
    process.env[key]
  ];

  for (let i = 0; i < possibleSources.length; i++) {
    if (possibleSources[i]) {
      console.log(`Found ${key} in source ${i + 1}:`, possibleSources[i]);
      return possibleSources[i];
    }
  }

  // Always fall back to @env import if nothing else is found
  if (envMap[key]) {
    console.log(`Falling back to @env for ${key}:`, envMap[key]);
    return envMap[key];
  }

  console.log(`NOT FOUND: ${key} in any source`);
  return null;
};

// Debug: Log environment variables to see what's available
console.log('Environment variables check:');
console.log('FIREBASE_API_KEY:', getEnvVar('FIREBASE_API_KEY') ? 'SET' : 'NOT SET');
console.log('FIREBASE_AUTH_DOMAIN:', getEnvVar('FIREBASE_AUTH_DOMAIN') ? 'SET' : 'NOT SET');
console.log('GOOGLE_WEB_CLIENT_ID:', getEnvVar('GOOGLE_WEB_CLIENT_ID') ? 'SET' : 'NOT SET');

export const GOOGLE_MAPS_API_KEY_ANDROID = getEnvVar('GOOGLE_MAPS_API_KEY_ANDROID') || '';
export const GOOGLE_MAPS_API_KEY_IOS = getEnvVar('GOOGLE_MAPS_API_KEY_IOS') || '';
export const GOOGLE_ROADS_API_KEY = getEnvVar('GOOGLE_ROADS_API_KEY') || '';

export const FIREBASE_API_KEY = getEnvVar('FIREBASE_API_KEY') || '';
export const FIREBASE_AUTH_DOMAIN = getEnvVar('FIREBASE_AUTH_DOMAIN') || '';
export const FIREBASE_PROJECT_ID = getEnvVar('FIREBASE_PROJECT_ID') || '';
export const FIREBASE_STORAGE_BUCKET = getEnvVar('FIREBASE_STORAGE_BUCKET') || '';
export const FIREBASE_MESSAGING_SENDER_ID = getEnvVar('FIREBASE_MESSAGING_SENDER_ID') || '';
export const FIREBASE_APP_ID = getEnvVar('FIREBASE_APP_ID') || '';
export const FIREBASE_MEASUREMENT_ID = getEnvVar('FIREBASE_MEASUREMENT_ID') || '';

export const GOOGLE_WEB_CLIENT_ID = getEnvVar('GOOGLE_WEB_CLIENT_ID') || '';
export const GOOGLE_IOS_CLIENT_ID = getEnvVar('GOOGLE_IOS_REVERSED_CLIENT_ID') || '';
export const GOOGLE_ANDROID_CLIENT_ID = getEnvVar('GOOGLE_ANDROID_CLIENT_ID') || '';

// Debug: Log the actual values being used
console.log('Config values being used:');
console.log('FIREBASE_API_KEY value:', FIREBASE_API_KEY ? 'HAS VALUE' : 'EMPTY');
console.log('FIREBASE_AUTH_DOMAIN value:', FIREBASE_AUTH_DOMAIN ? 'HAS VALUE' : 'EMPTY');
console.log('GOOGLE_WEB_CLIENT_ID value:', GOOGLE_WEB_CLIENT_ID ? 'HAS VALUE' : 'EMPTY');