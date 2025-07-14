# 🚨 Handover Issue Template

Use this template when creating issues during the audit handover process.

---

## **Issue Title**
`[AUDIT] Phase X: Brief description of issue`

## **Issue Body**

### **🔍 Issue Description**
Brief description of what's broken or needs attention.

### **📍 Current Status**
- **Phase**: [Phase number and name]
- **Priority**: [High/Medium/Low]
- **Status**: [Found/In Progress/Resolved]

### **🎯 Expected Behavior**
What should happen when this works correctly.

### **🐛 Actual Behavior**
What's currently happening (or not happening).

### **🔧 Steps to Reproduce**
1. Navigate to [screen/feature]
2. Perform [action]
3. Observe [unexpected behavior]

### **📁 Files Affected**
- `path/to/file1.js` - [description of issue]
- `path/to/file2.js` - [description of issue]

### **🔍 Root Cause Analysis**
What caused this issue (if known):
- Recent changes to [specific area]
- Missing integration between [components]
- Configuration issue with [service]

### **💡 Proposed Solution**
How to fix this issue:
- [ ] Update [specific code]
- [ ] Add missing [integration/import/configuration]
- [ ] Test [specific functionality]

### **🧪 Testing Steps**
How to verify the fix works:
1. [Test step 1]
2. [Test step 2]
3. [Test step 3]

### **📋 Related Issues**
- Links to related issues or documentation
- References to similar problems found

### **🏷️ Labels**
- `audit`
- `handover`
- `phase-[number]`
- `priority-[level]`
- `[component-name]` (e.g., `navigation`, `theme`, `service`)

---

## **Example Issue**

### **Issue Title**
`[AUDIT] Phase 1: Navigation parameter mismatch in DiscoveriesScreen`

### **Issue Body**

### **🔍 Issue Description**
PastJourneysScreen passes `journeyId` parameter but DiscoveriesScreen expects `selectedRoute` object, causing navigation to fail.

### **📍 Current Status**
- **Phase**: Phase 1 - Navigation & Data Flow Audit
- **Priority**: High
- **Status**: Resolved

### **🎯 Expected Behavior**
User taps journey in PastJourneysScreen → navigates to DiscoveriesScreen → sees discoveries for that journey.

### **🐛 Actual Behavior**
Navigation fails because parameter types don't match.

### **🔧 Steps to Reproduce**
1. Open PastJourneysScreen
2. Tap on any journey
3. Observe navigation error

### **📁 Files Affected**
- `screens/PastJourneysScreen.js` - Passes journeyId parameter
- `screens/DiscoveriesScreen.js` - Expected selectedRoute object

### **🔍 Root Cause Analysis**
Recent changes to navigation structure broke parameter consistency between screens.

### **💡 Proposed Solution**
Update DiscoveriesScreen to handle journeyId parameter and lookup journey object from saved routes.

### **🧪 Testing Steps**
1. Navigate from PastJourneysScreen to DiscoveriesScreen
2. Verify correct journey is selected
3. Verify discoveries load properly
4. Test filtering functionality

### **📋 Related Issues**
- See `docs/AUDIT_PROGRESS.md` for full audit context
- Related to theme integration issues in same screen

### **🏷️ Labels**
- `audit`
- `handover`
- `phase-1`
- `priority-high`
- `navigation`
- `discoveries-screen` 