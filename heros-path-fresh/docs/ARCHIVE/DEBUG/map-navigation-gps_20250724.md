Bug Report: GPS Tracking and Journey Experience Issues
Branch: feature/map-navigation-gps
Priority: High
Reporter: Liam Clarke
Date: 2025-07-24

Summary
Multiple critical issues affecting the core GPS tracking and journey experience functionality, impacting user experience and app reliability.

Environment
Platform: iOS/Android
App Version: [Current Version]
Device: [Device Info]
OS Version: [OS Version]
Issues Identified
1. Discovery System Failure
Severity: Critical
Status: Open (Fix attempted but issue persists)

Description: No discoveries are populated after completing a journey, even after recent consolidation service fixes.

Expected Behavior: After completing a walk, users should see discovered places along their route for review and saving.

Actual Behavior: Discovery screen remains empty or shows no new discoveries.

Impact: Core app functionality broken - users cannot discover places, which is the main value proposition.

Technical Notes:

Recent fixes were applied to DiscoveryConsolidationService.js, JourneyService.js, and useJourneyTracking.js
Issue persists, suggesting deeper problems in the discovery pipeline
May need to investigate:
Google Places API connectivity and responses
Route coordinate format/validation
Discovery preferences configuration
Firestore write permissions and data structure
2. Route Visualization Problems
Severity: High
Status: Open

2a. Route Not Snapping
Description: Walking route doesn't snap to roads/paths properly.

Expected Behavior: Route should follow actual walkable paths and roads.

Actual Behavior: Route appears as straight lines between GPS points, often cutting through buildings or non-walkable areas.

2b. Route Not Displaying in Real-Time
Description: Route polyline doesn't update in real-time as user walks.

Expected Behavior: Route should appear progressively as user walks, showing their path in real-time.

Actual Behavior: Route may not appear until after tracking stops, or updates very infrequently.

Impact: Users can't see their progress during walks, reducing engagement and confidence in tracking.

3. GPS Performance Issues
Severity: High
Status: Open

Description: GPS coordinate updates are too slow/infrequent, causing poor tracking accuracy.

Expected Behavior: Smooth, frequent GPS updates (every 1-2 seconds) for accurate route tracking.

Actual Behavior: GPS updates are slow, causing choppy or inaccurate route recording.

Technical Notes:

May need to adjust timeInterval and distanceInterval in location tracking configuration
Current settings may be too conservative for real-time tracking
4. Sprite Animation System Issues
Severity: Medium
Status: Open

4a. Sprite Not Appearing on App Launch
Description: Link sprite GIF doesn't appear when app first opens.

Expected Behavior: Sprite should be visible immediately when map loads, showing idle animation.

Actual Behavior: Sprite is invisible until user starts walking, then suddenly appears.

4b. Sprite Frozen After Journey
Description: After ending a journey, sprite gets stuck on a single walking frame without animation.

Expected Behavior: Sprite should return to idle animation after journey ends.

Actual Behavior: Sprite shows a static walking frame, appearing broken.

4c. GPS Status Indicators Unclear
Description: GPS signal strength indicators and pulsing animations are confusing to users.

Expected Behavior: Clear visual feedback about GPS status with user-friendly explanations.

Actual Behavior: Users interpret GPS status animations as bugs rather than intentional feedback.

Suggested Solution: Add GPS status legend or tooltip explaining different states (good signal, weak signal, no signal).

5. Journey Statistics Display Errors
Severity: Medium
Status: Open

5a. Distance Precision Issues
Description: Past journey distances show excessive decimal places.

Example: "1.2847392 km" instead of "1.3 km"

Expected Behavior: Distance should be rounded to 1 decimal place for readability.

5b. Duration Calculation Error
Description: Journey duration shows incorrect values.

Example: "3321 mins" when actual duration was ~3.3 minutes

Expected Behavior: Duration should show accurate time in appropriate units (seconds, minutes, hours).

Technical Notes: Likely a unit conversion error (milliseconds vs seconds) or timestamp calculation issue.

Steps to Reproduce
For Discovery Issues (Still Failing):
Start a new journey
Walk for several minutes in an area with businesses/POIs
Stop and save the journey
Navigate to Discoveries screen
Expected: See discovered places
Actual: No discoveries shown (issue persists after recent fixes)
For Route Issues:
Start journey tracking
Begin walking
Observe map during walk
Expected: See route appearing in real-time, snapped to roads
Actual: No route visible or straight lines between points
For Sprite Issues:
Open app fresh
Expected: See animated Link sprite
Actual: No sprite visible
Start walking, then stop journey
Expected: Sprite returns to idle animation
Actual: Sprite frozen on walking frame
For Statistics Issues:
Complete a short journey (2-3 minutes)
View journey in past journeys list
Expected: Clean distance (e.g., "0.5 km") and duration (e.g., "3 min")
Actual: "0.4837291 km" and "3321 mins"
Proposed Solutions
Critical Priority (Discovery System):
Debug Discovery Pipeline: Add comprehensive logging to trace the entire discovery flow
Verify API Connectivity: Test Google Places API responses manually
Check Route Data: Ensure route coordinates are properly formatted and passed to consolidation
Validate Preferences: Confirm user discovery preferences are properly configured
Database Investigation: Check Firestore for discovery records and permissions
High Priority Fixes:
GPS Frequency: Reduce timeInterval to 1000ms and distanceInterval to 1-2 meters
Route Real-time Display: Ensure polyline updates on each GPS coordinate received
Statistics Formatting: Add proper rounding and unit conversion functions
Medium Priority Improvements:
Route Snapping: Implement Google Roads API for route snapping
Sprite System: Debug sprite state management and add proper idle state handling
GPS Status UI: Add user-friendly GPS status indicators with explanations
Testing Checklist
[ ] CRITICAL: Discoveries populate after journey completion
[ ] Route appears in real-time during tracking
[ ] GPS updates smoothly (1-2 second intervals)
[ ] Sprite appears immediately on app launch
[ ] Sprite returns to idle animation after journey ends
[ ] Journey statistics show clean, accurate values
[ ] Route snaps to roads/paths appropriately
Additional Notes
The discovery system failure is the most critical issue as it breaks the core app functionality. Despite recent fixes to the consolidation service, the issue persists, indicating a deeper problem in the discovery pipeline that requires immediate investigation and resolution.