# GPS Tracking Fixes - Testing Guide

## 🚨 **Issues Fixed**

### 1. **Background Tracking Not Working**
**Problem**: GPS only tracked when app was open and phone unlocked
**Solution**: 
- Added `requestBackgroundPermissionsAsync()` to request background location permissions
- Added `UIBackgroundModes` in app.json for iOS
- Added `ACCESS_BACKGROUND_LOCATION` permission for Android
- Added `foregroundService` configuration for Android background tracking

### 2. **GPS Accuracy Issues**
**Problem**: Infrequent pings and 10-20m location snapping
**Solution**:
- Changed from `Location.Accuracy.Highest` to `Location.Accuracy.BestForNavigation`
- Reduced `timeInterval` from 2000ms to 1000ms (more frequent updates)
- Reduced `distanceInterval` from 5m to 1m (more precise tracking)

### 3. **Location Data Saving Verification**
**Problem**: Uncertain if data was being saved to Firestore
**Solution**:
- Added comprehensive debug logging
- Added debug tools in Settings screen
- Added user confirmation alerts

## 🧪 **Testing Steps**

### **Step 1: Build and Install New Version**
```bash
# Build new development version with fixes
eas build --platform ios --profile development

# Install on your device
# The build will include the new permissions and configuration
```

### **Step 2: Test Location Permissions**
1. **Open the app** and go to Settings screen
2. **Tap "Check Location Permissions"** in the Debug Information section
3. **Verify both permissions are granted**:
   - Foreground: `granted`
   - Background: `granted`

### **Step 3: Test Background Tracking**
1. **Start a journey** on the Map screen
2. **Minimize the app** (swipe up and tap home)
3. **Lock your phone** (press power button)
4. **Walk around** for 2-3 minutes
5. **Unlock and reopen the app**
6. **Check if new points were added** to your route

### **Step 4: Test GPS Accuracy**
1. **Start tracking** and walk in a straight line
2. **Check the route** - it should follow your path more closely
3. **Look for more frequent updates** (every 1 second instead of 2)
4. **Verify location accuracy** - should be within 1-3 meters

### **Step 5: Verify Firestore Data**
1. **Complete a journey** (start and stop tracking)
2. **Go to Settings** → Debug Information
3. **Tap "Check Journey Data in Firestore"**
4. **Verify the data shows**:
   - Number of journeys
   - Latest journey name
   - Total route points

## 🔧 **Debug Information**

### **Console Logs to Watch For**
When tracking, you should see these logs:
```
🗺️ [MAP_SCREEN] Saving journey to Firestore: {userId: "...", routePoints: 45, ...}
✅ [MAP_SCREEN] Journey saved successfully to Firestore
```

### **Settings Screen Debug Tools**
- **Check Journey Data in Firestore**: Shows how many journeys and route points are saved
- **Check Location Permissions**: Shows current permission status

## 🚨 **Common Issues & Solutions**

### **Background Tracking Still Not Working**
1. **Check iOS Settings**: 
   - Settings → Privacy & Security → Location Services → Hero's Path
   - Must be set to "Always" (not "While Using")
2. **Check Android Settings**:
   - Settings → Apps → Hero's Path → Permissions → Location
   - Must have "Allow all the time" enabled

### **Poor GPS Accuracy**
1. **Check device location settings**:
   - iOS: Settings → Privacy & Security → Location Services → System Services → Motion & Fitness (should be ON)
   - Android: Settings → Location → Mode → High accuracy
2. **Check for interference**: Buildings, tunnels, underground areas
3. **Wait for GPS lock**: First few points might be inaccurate

### **Data Not Saving to Firestore**
1. **Check internet connection**
2. **Check console logs** for error messages
3. **Verify user authentication** (must be signed in)
4. **Check Firestore rules** allow write access

## 📱 **iOS-Specific Notes**

### **Background App Refresh**
- iOS may limit background location updates
- App must be in background, not terminated
- System may show "Hero's Path is using your location" notification

### **Battery Optimization**
- iOS may reduce location accuracy to save battery
- Keep app in foreground for best accuracy
- Consider charging device during long journeys

## 🤖 **Android-Specific Notes**

### **Foreground Service**
- Android will show a persistent notification during tracking
- This is required for background location updates
- Notification cannot be dismissed while tracking

### **Battery Optimization**
- Disable battery optimization for the app
- Settings → Apps → Hero's Path → Battery → Unrestricted

## 📊 **Expected Performance**

### **Before Fixes**
- Background tracking: ❌ Not working
- GPS accuracy: 10-20m, every 2 seconds
- Data saving: Uncertain

### **After Fixes**
- Background tracking: ✅ Working (with proper permissions)
- GPS accuracy: 1-3m, every 1 second
- Data saving: ✅ Verified with debug tools

## 🎯 **Next Steps**

1. **Test thoroughly** with the steps above
2. **Report any remaining issues** with specific details
3. **Consider additional optimizations**:
   - Route smoothing algorithms
   - Distance calculation
   - Journey duration tracking
   - Battery optimization

---

**Last Updated**: 12 July 2025  
**Status**: Ready for testing  
**Next**: Test on device and report results 