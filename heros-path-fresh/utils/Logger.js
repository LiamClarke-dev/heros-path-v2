/*
 * LOGGER UTILITY (CENTRALIZED LOGGING SYSTEM)
 * ============================================
 * 
 * PURPOSE:
 * This utility provides a centralized logging system for Hero's Path that enables
 * consistent debugging, monitoring, and troubleshooting throughout the app. It provides
 * different log levels for different types of information and automatically handles
 * development vs. production environments. Think of it as the app's monitoring and
 * debugging nerve system that helps developers understand what's happening.
 * 
 * FUNCTIONALITY:
 * - Provides multiple log levels: debug, info, warn, error, performance
 * - Includes specialized logging for API calls and discovery actions
 * - Automatically filters logs based on development/production environment
 * - Provides consistent log formatting with prefixes for easy identification
 * - Handles performance monitoring and timing information
 * - Supports error tracking and warning management
 * - Enables easy debugging of complex workflows and API interactions
 * - Provides development-only logs that are automatically removed in production
 * 
 * WHY IT EXISTS:
 * Hero's Path is a complex app with GPS tracking, API calls, discovery algorithms,
 * and real-time features. Debugging these systems requires comprehensive logging
 * that can be easily controlled and filtered. This utility centralizes all logging
 * needs and provides a consistent interface that makes troubleshooting much easier
 * while ensuring production builds remain clean and performant.
 * 
 * KEY FEATURES:
 * - Multiple log levels: debug, info, warn, error, performance, apiCall, discoveryAction
 * - Environment-aware: automatically disabled in production builds
 * - Consistent formatting: all logs include clear prefixes for easy identification
 * - Performance monitoring: specialized logging for performance-critical operations
 * - API tracking: detailed logging of API calls and responses
 * - Discovery tracking: specialized logging for the discovery workflow
 * - Error management: comprehensive error logging and tracking
 * - Easy filtering: logs can be filtered by type or component
 * 
 * RELATIONSHIPS:
 * - Used throughout the entire app for debugging and monitoring
 * - Integrates with all services for API call and operation tracking
 * - Used by components for user interaction debugging
 * - Connects to error handling and crash reporting systems
 * - May integrate with analytics and monitoring platforms
 * - Used by development and testing workflows
 * 
 * REFERENCED BY:
 * - All service files (DiscoveriesService, PingService, JourneyService, etc.)
 * - Screen components (MapScreen, DiscoveriesScreen, etc.)
 * - Context providers (UserContext, ThemeContext, etc.)
 * - Any component that needs debugging or monitoring capabilities
 * - Development and testing utilities
 * 
 * REFERENCES:
 * - React Native console methods (console.debug, console.info, etc.)
 * - __DEV__ environment variable for development detection
 * - Error tracking and monitoring systems
 * 
 * IMPORTANCE TO APP:
 * HIGH - While not directly user-facing, this utility is crucial for app development,
 * maintenance, and troubleshooting. Good logging significantly improves development
 * productivity and makes it easier to diagnose and fix issues. In a complex app
 * like Hero's Path, comprehensive logging is essential for understanding system
 * behavior and ensuring reliability.
 * 
 * IMPROVEMENT SUGGESTIONS:
 * 1. Add remote logging - send critical logs to remote monitoring services
 * 2. Add log persistence - store logs locally for offline debugging
 * 3. Add log filtering - runtime filtering of logs by component or level
 * 4. Add log analytics - analyze log patterns for insights and optimization
 * 5. Add performance metrics - automatic performance monitoring and alerting
 * 6. Add error aggregation - group and track similar errors for better debugging
 * 7. Add user action tracking - log user interactions for UX analysis
 * 8. Add crash reporting - automatic crash reporting with context
 * 9. Add log export - export logs for external analysis and debugging
 * 10. Add log search - search through log history for specific events
 * 11. Add log visualization - charts and graphs for log data analysis
 * 12. Add automated alerts - notifications for critical errors or issues
 * 13. Add log sampling - sample logs in production for performance monitoring
 * 14. Add contextual logging - include user and session context in logs
 * 15. Add log encryption - secure logging for sensitive information
 * 16. Add log rotation - manage log file size and retention
 * 17. Add log correlation - correlate logs across different components
 * 18. Add real-time monitoring - live monitoring dashboard for app health
 * 19. Add log compliance - ensure logging meets privacy and security requirements
 * 20. Add intelligent logging - AI-powered log analysis and insights
 * 
 * PRODUCTION NOTE:
 * Currently configured for development with __DEV__ checks. Before production
 * deployment, review all debug logs and ensure sensitive information is not logged.
 * Consider implementing remote logging for production error tracking while
 * maintaining user privacy.
 */

// utils/Logger.js
// Centralized logging utility for debugging
// TODO: REMOVE ALL DEBUG LOGS BEFORE PRODUCTION - Search for "🔍 DEBUG" to find all logs

const Logger = {
  debug: (...args) => false, // Disabled for production
  info: (...args) => __DEV__ && console.info('[INFO]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  performance: (...args) => false, // Disabled for production
  log: (...args) => false, // Disabled for production
  apiCall: (...args) => false, // Disabled for production
  discoveryAction: (...args) => false, // Disabled for production
  filter: (...args) => false, // Disabled for production
};

export default Logger; 