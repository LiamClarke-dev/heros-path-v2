# Debug Logging System Guide

## Overview
This project uses a centralized logging system for debugging that can be easily enabled/disabled and removed for production.

## 🚨 **HANDOVER NOTES FOR NEXT DEVELOPER**

### **Current Status**
- **Debug Mode**: Currently ENABLED (`DEBUG_MODE = true`)
- **Production Ready**: System is ready for production cleanup
- **Comprehensive Coverage**: All major operations are logged

### **Before Production Deployment**
1. Set `DEBUG_MODE = false` in `utils/Logger.js`
2. Search for `🔍 DEBUG` in codebase and remove all debug logs
3. Remove development utilities (delete all journeys button)
4. Test all functionality with debug logs disabled

### **Key Files Modified**
- `utils/Logger.js` - Central logging utility
- `services/DiscoveryService.js` - Discovery operations logging
- `services/DiscoveriesService.js` - API call logging
- `services/NewPlacesService.js` - Places API logging
- `screens/DiscoveriesScreen.js` - UI operation logging

---

## Quick Start

### Enable/Disable All Debug Logs
Edit `utils/Logger.js` and set:
```javascript
const DEBUG_MODE = true;  // Enable all debug logs
const DEBUG_MODE = false; // Disable all debug logs
```

### Remove All Debug Logs for Production
Search for `🔍 DEBUG` in the codebase to find all debug logs that need to be removed.

## Logging Categories

### 1. General Debug Logs
```javascript
Logger.debug(component, message, data)
```
- **Purpose**: General debugging information
- **Example**: `Logger.debug('DISCOVERIES_SCREEN', 'Loading journey discoveries')`
- **Icon**: 🔍

### 2. Error Logs
```javascript
Logger.error(component, message, error)
```
- **Purpose**: Error conditions that need attention
- **Example**: `Logger.error('DISCOVERY_SERVICE', 'Failed to save place', error)`
- **Icon**: ❌

### 3. Warning Logs
```javascript
Logger.warn(component, message, data)
```
- **Purpose**: Warning conditions that might need attention
- **Example**: `Logger.warn('DISCOVERY_SERVICE', 'Fallback to legacy API', { type })`
- **Icon**: ⚠️

### 4. Info Logs
```javascript
Logger.info(component, message, data)
```
- **Purpose**: Important information that should always be logged
- **Example**: `Logger.info('APP', 'User signed in', { userId })`
- **Icon**: ℹ️

### 5. Performance Logs
```javascript
Logger.performance(component, operation, duration, details)
```
- **Purpose**: Track performance of operations
- **Example**: `Logger.performance('DISCOVERIES_SERVICE', 'getSuggestionsForRoute', 1500, { placesCount: 25 })`
- **Icon**: ⚡

### 6. API Call Logs
```javascript
Logger.apiCall(component, endpoint, method, success, duration, details)
```
- **Purpose**: Track API calls and their success/failure
- **Example**: `Logger.apiCall('NEW_PLACES_SERVICE', 'places:searchNearby', 'POST', true, 800, { type: 'restaurant' })`
- **Icon**: 🌐

### 7. Journey Status Logs
```javascript
Logger.journeyStatus(component, journeyId, action, details)
```
- **Purpose**: Track journey-related operations
- **Example**: `Logger.journeyStatus('DISCOVERY_SERVICE', 'journey123', 'COMPLETED', { discoveriesCount: 15 })`
- **Icon**: 🗺️

### 8. Discovery Action Logs
```javascript
Logger.discoveryAction(component, action, placeId, journeyId, details)
```
- **Purpose**: Track discovery-related operations
- **Example**: `Logger.discoveryAction('DISCOVERY_SERVICE', 'SAVE', 'place456', 'journey123', { userId })`
- **Icon**: 📍

### 9. Cache Logs
```javascript
Logger.cache(component, action, key, details)
```
- **Purpose**: Track cache operations
- **Example**: `Logger.cache('DISCOVERIES_SERVICE', 'HIT', 'journey_discoveries_123', { count: 15 })`
- **Icon**: 💾

## Component Names Used

- `DISCOVERIES_SCREEN` - Main discoveries screen
- `DISCOVERY_SERVICE` - Discovery service operations
- `DISCOVERIES_SERVICE` - Discoveries service (API calls)
- `NEW_PLACES_SERVICE` - Google Places API service
- `JOURNEY_SERVICE` - Journey management service
- `PAST_JOURNEYS_SCREEN` - Past journeys screen

## Key Debug Scenarios

### 1. Performance Issues
Look for:
- `⚡ PERF` logs with high duration values
- `🌐 API` logs with failed requests
- Multiple rapid API calls

### 2. API Call Explosions
Look for:
- Multiple `🌐 API` logs in quick succession
- `🔍 DEBUG` logs showing repeated API calls
- `📍 DISCOVERY` logs showing repeated operations

### 3. Journey Status Issues
Look for:
- `🗺️ JOURNEY` logs with unexpected status changes
- `📍 DISCOVERY` logs showing incorrect journey associations
- Missing journey completion updates

### 4. Cache Issues
Look for:
- `💾 CACHE` logs showing cache misses when expected hits
- Repeated data loading from Firestore
- Performance degradation in repeated operations

## Production Cleanup Checklist

### 1. Remove Debug Logs
```bash
# Search for all debug logs
grep -r "🔍 DEBUG" .

# Search for Logger.debug calls
grep -r "Logger.debug" .
```

### 2. Remove Logger Import
```bash
# Search for Logger imports
grep -r "import Logger" .
```

### 3. Remove Logger.js File
```bash
rm utils/Logger.js
```

### 4. Keep Error Logs
- Keep `Logger.error()` calls for production error tracking
- Keep `Logger.warn()` calls for production warning tracking
- Keep `Logger.info()` calls for important production events

## Example Log Output

```
🔍 DEBUG [14:30:15] [DISCOVERIES_SCREEN] Loading journey discoveries
🌐 API [14:30:16] [NEW_PLACES_SERVICE] ✅ POST places:searchNearby (800ms) { type: 'restaurant', count: 5 }
📍 DISCOVERY [14:30:17] [DISCOVERY_SERVICE] SAVE place_123 (journey: journey_456) { userId: 'user_789' }
🗺️ JOURNEY [14:30:17] [DISCOVERY_SERVICE] STATUS_UPDATED for journey journey_456 { isCompleted: true, reviewedCount: 15, totalCount: 15 }
⚡ PERF [14:30:18] [DISCOVERIES_SERVICE] getSuggestionsForRoute took 1500ms { routeCoordsCount: 50, enabledTypesCount: 8, finalPlacesCount: 25 }
```

## Best Practices

1. **Use Descriptive Messages**: Make log messages clear and actionable
2. **Include Relevant Data**: Add context data to help with debugging
3. **Use Appropriate Log Levels**: Don't use error for warnings or debug for errors
4. **Keep Performance in Mind**: Don't log large objects or sensitive data
5. **Consistent Component Names**: Use the same component names across related files

## Troubleshooting

### Logs Not Appearing
1. Check `DEBUG_MODE` is set to `true` in `utils/Logger.js`
2. Verify Logger import is correct
3. Check console output in development environment

### Too Many Logs
1. Set `DEBUG_MODE` to `false` to disable all debug logs
2. Remove specific `Logger.debug()` calls that are too verbose
3. Use more specific log levels (warn, error) for important events only

### Performance Impact
1. Remove debug logs from performance-critical paths
2. Use conditional logging for expensive operations
3. Consider using `Logger.performance()` to track impact

## Recent Changes (December 2024)

### Added Comprehensive Logging
- Created centralized `utils/Logger.js` utility
- Added logging to all major services and screens
- Implemented performance tracking for API calls
- Added journey status and discovery action logging

### Performance Monitoring
- Added API call duration tracking
- Implemented performance logging for key operations
- Added cache operation logging
- Enhanced error logging with context

### Production Readiness
- All debug logs use `🔍 DEBUG` prefix for easy identification
- Logger can be completely disabled with single flag
- Comprehensive cleanup guide provided
- Error and warning logs preserved for production

---

**Last Updated**: December 2024  
**Status**: Ready for production cleanup  
**Next Developer**: Follow production cleanup checklist before deployment 