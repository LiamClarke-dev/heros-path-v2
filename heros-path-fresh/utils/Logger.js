// utils/Logger.js
// Centralized logging utility for debugging
// TODO: REMOVE ALL DEBUG LOGS BEFORE PRODUCTION - Search for "🔍 DEBUG" to find all logs

const DEBUG_MODE = true; // Set to false to disable all debug logs

const Logger = {
  debug: (...args) => DEBUG_MODE && console.debug('[DEBUG]', ...args),
  info: (...args) => console.info('[INFO]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  performance: (...args) => console.info('[PERF]', ...args),
  log: (...args) => console.log('[LOG]', ...args),
  apiCall: (...args) => DEBUG_MODE && console.debug('[API]', ...args),
  discoveryAction: (...args) => DEBUG_MODE && console.debug('[DISCOVERY]', ...args),
  filter: (...args) => DEBUG_MODE && console.debug('[FILTER]', ...args),
};

export default Logger; 