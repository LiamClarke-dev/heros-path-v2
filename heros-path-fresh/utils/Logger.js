// utils/Logger.js
// Centralized logging utility for debugging
// TODO: REMOVE ALL DEBUG LOGS BEFORE PRODUCTION - Search for "🔍 DEBUG" to find all logs

const Logger = {
  debug: (...args) => __DEV__ && console.debug('[DEBUG]', ...args),
  info: (...args) => __DEV__ && console.info('[INFO]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  performance: (...args) => __DEV__ && console.info('[PERF]', ...args),
  log: (...args) => __DEV__ && console.log('[LOG]', ...args),
  apiCall: (...args) => __DEV__ && console.debug('[API]', ...args),
  discoveryAction: (...args) => __DEV__ && console.debug('[DISCOVERY]', ...args),
  filter: (...args) => __DEV__ && console.debug('[FILTER]', ...args),
};

export default Logger; 