// utils/Logger.js
// Centralized logging utility for debugging
// TODO: REMOVE ALL DEBUG LOGS BEFORE PRODUCTION - Search for "🔍 DEBUG" to find all logs

const DEBUG_MODE = true; // Set to false to disable all debug logs

class Logger {
  static debug(component, message, data = null) {
    if (!DEBUG_MODE) return;
    
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0]; // HH:MM:SS
    const logMessage = `🔍 DEBUG [${timestamp}] [${component}] ${message}`;
    
    if (data !== null) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
  }

  static error(component, message, error = null) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const logMessage = `❌ ERROR [${timestamp}] [${component}] ${message}`;
    
    if (error) {
      console.error(logMessage, error);
    } else {
      console.error(logMessage);
    }
  }

  static warn(component, message, data = null) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const logMessage = `⚠️ WARN [${timestamp}] [${component}] ${message}`;
    
    if (data !== null) {
      console.warn(logMessage, data);
    } else {
      console.warn(logMessage);
    }
  }

  static info(component, message, data = null) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const logMessage = `ℹ️ INFO [${timestamp}] [${component}] ${message}`;
    
    if (data !== null) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
  }

  // Performance logging
  static performance(component, operation, duration, details = null) {
    if (!DEBUG_MODE) return;
    
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const logMessage = `⚡ PERF [${timestamp}] [${component}] ${operation} took ${duration}ms`;
    
    if (details) {
      console.log(logMessage, details);
    } else {
      console.log(logMessage);
    }
  }

  // API call logging
  static apiCall(component, endpoint, method, success, duration = null, details = null) {
    if (!DEBUG_MODE) return;
    
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const status = success ? '✅' : '❌';
    const durationText = duration ? ` (${duration}ms)` : '';
    const logMessage = `🌐 API [${timestamp}] [${component}] ${status} ${method} ${endpoint}${durationText}`;
    
    if (details) {
      console.log(logMessage, details);
    } else {
      console.log(logMessage);
    }
  }

  // Journey status logging
  static journeyStatus(component, journeyId, action, details = null) {
    if (!DEBUG_MODE) return;
    
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const logMessage = `🗺️ JOURNEY [${timestamp}] [${component}] ${action} for journey ${journeyId}`;
    
    if (details) {
      console.log(logMessage, details);
    } else {
      console.log(logMessage);
    }
  }

  // Discovery action logging
  static discoveryAction(component, action, placeId, journeyId = null, details = null) {
    if (!DEBUG_MODE) return;
    
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const journeyText = journeyId ? ` (journey: ${journeyId})` : '';
    const logMessage = `📍 DISCOVERY [${timestamp}] [${component}] ${action} place ${placeId}${journeyText}`;
    
    if (details) {
      console.log(logMessage, details);
    } else {
      console.log(logMessage);
    }
  }

  // Cache logging
  static cache(component, action, key, details = null) {
    if (!DEBUG_MODE) return;
    
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const logMessage = `💾 CACHE [${timestamp}] [${component}] ${action} ${key}`;
    
    if (details) {
      console.log(logMessage, details);
    } else {
      console.log(logMessage);
    }
  }
}

export default Logger; 