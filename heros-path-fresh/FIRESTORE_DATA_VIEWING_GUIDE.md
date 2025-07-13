# Firestore Data Viewing Guide

## 🔒 **Privacy-First Data Access**

This guide shows you how to view **your own personal data only**. Users can only access their own journey data, ensuring complete privacy and security.

## 🔍 **How to View Your Data**

### **Method 1: Firebase Console (Admin Access Only)**

**⚠️ IMPORTANT**: Only use Firebase Console if you have admin access to your Firebase project. Regular users should use the app's debug tools.

#### **Step 1: Access Firebase Console**
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Select your project (`heros-path-fresh` or similar)
3. Click **"Firestore Database"** in the left sidebar
4. Click **"Data"** tab (default view)

#### **Step 2: Navigate Your Data Structure**
Your data is organized like this:
```
journeys/{userId}/
├── journeys/{journeyId}          # Individual journey records
├── discoveries/{discoveryId}     # Places discovered during journeys
└── dismissed/{placeId}           # Places dismissed by user
```

#### **Step 3: View Specific User's Data (Admin Only)**
1. Click on the **`journeys`** collection
2. Find the specific user ID you want to view
3. Click on the user ID
4. Click on the **`journeys`** subcollection
5. View individual journey documents

### **Method 2: App Debug Tools (Recommended for Users)**

I've added privacy-focused debug tools to your Settings screen:

#### **Access Debug Tools**
1. Open your app
2. Go to **Settings** screen
3. Scroll down to **"🔧 Debug Information"** section

#### **Available Tools (Your Data Only)**

##### **1. Check Your Journey Data**
- Shows your personal journey count
- Displays your latest journey name
- Shows your total route points

##### **2. Your Journey Statistics**
- Complete analytics for your journeys only
- Route data statistics for your data
- Your activity date range
- Your personal performance metrics

##### **3. Export Your Journey Data**
- Exports your personal journey data as JSON
- Shows data in console for analysis
- Includes all your route points and metadata
- **Privacy guaranteed**: Only your data

## 📊 **Understanding Your Data**

### **Journey Document Structure**
```json
{
  "id": "journey_123",
  "name": "Journey 7/12/2025",
  "route": [
    {"latitude": 40.7128, "longitude": -74.0060},
    {"latitude": 40.7129, "longitude": -74.0061},
    // ... more coordinates
  ],
  "createdAt": "2025-07-12T10:30:00Z",
  "updatedAt": "2025-07-12T10:35:00Z",
  "startLocation": {"latitude": 40.7128, "longitude": -74.0060},
  "endLocation": {"latitude": 40.7130, "longitude": -74.0062},
  "distance": 150.5,
  "duration": 300
}
```

### **Discovery Document Structure**
```json
{
  "id": "discovery_456",
  "placeId": "ChIJ...",
  "placeName": "Central Park",
  "placeType": "park",
  "location": {"lat": 40.7829, "lng": -73.9654},
  "journeyId": "journey_123",
  "saved": true,
  "dismissed": false,
  "createdAt": "2025-07-12T10:30:00Z"
}
```

## 🔧 **Advanced Data Analysis (Your Data Only)**

### **Using Firebase Console Queries (Admin Only)**

#### **Filter by Date Range**
1. In Firebase Console, go to your user's collection
2. Click **"Add filter"**
3. Select `createdAt` field
4. Choose date range operators (`>=`, `<=`)
5. Enter your date values

#### **Filter by Journey Properties**
1. Click **"Add filter"**
2. Select field (e.g., `name`, `distance`)
3. Choose operator (`==`, `>`, `<`, etc.)
4. Enter value

#### **Sort Results**
1. Click **"Sort by"**
2. Select field (e.g., `createdAt`)
3. Choose order (ascending/descending)

### **Export Your Data for Analysis**

#### **Method 1: App Export (Recommended)**
1. Use the **"Export Your Journey Data"** tool in Settings
2. Data is logged to console
3. Copy from console for analysis
4. **Privacy guaranteed**: Only your data

#### **Method 2: Firebase Console Export (Admin Only)**
1. Go to Firestore Database
2. Click **"Export"** button
3. Choose specific user collections
4. Download as JSON

#### **Method 3: Firebase CLI (Admin Only)**
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Export specific user data
firebase firestore:export --project=your-project-id --collection-ids=journeys/userId
```

## 📈 **Data Analytics Examples (Your Data Only)**

### **Check Your GPS Tracking Quality**
```javascript
// In your app's debug tools, look for:
- Your total route points per journey
- Your average route points per journey
- Your journeys with/without routes
- Your date range of activity
```

### **Monitor Your Activity**
```javascript
// Key metrics for your data:
- Your total journeys
- Your journey frequency over time
- Your most recent activity
- Your route quality trends
```

### **Verify Your Data Integrity**
```javascript
// Check for issues in your data:
- Your journeys with empty routes
- Your missing timestamps
- Your invalid coordinates
- Your orphaned discoveries
```

## 🚨 **Privacy & Security**

### **Data Access Controls**
- ✅ **Users can only access their own data**
- ✅ **No cross-user data access**
- ✅ **All queries are user-scoped**
- ✅ **Export functions are user-specific**

### **Firestore Security Rules**
Ensure your Firestore rules enforce user data isolation:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own journey data
    match /journeys/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🎯 **Best Practices**

### **For Users**
1. **Use app debug tools** for quick data checks
2. **Export your data regularly** for backup
3. **Monitor your journey quality**
4. **Check your data integrity**

### **For Developers**
1. **Always scope queries to current user**
2. **Validate user access before data operations**
3. **Log security violations**
4. **Test privacy controls regularly**

### **For Data Analysis**
1. **Export your data regularly** for backup
2. **Use consistent date formats**
3. **Validate your data integrity**
4. **Document your data structure**

## 📱 **Quick Reference**

### **Firebase Console Navigation (Admin Only)**
```
Firebase Console → Your Project → Firestore Database → Data
→ journeys collection → {specificUserId} → journeys subcollection
```

### **App Debug Tools**
```
Settings → Debug Information → Choose tool
```

### **Your Data Queries**
- **Your journeys**: `journeys/{yourUserId}/journeys`
- **Your saved places**: `journeys/{yourUserId}/discoveries` (filter by `saved: true`)
- **Your dismissed places**: `journeys/{yourUserId}/dismissed`

## 🔒 **Privacy Guarantee**

- **No cross-user data access**: Users can only see their own data
- **User-scoped queries**: All database queries are limited to the current user
- **Secure exports**: Data exports contain only the user's personal data
- **Privacy logging**: Security violations are logged for monitoring

---

**Last Updated**: 12 July 2025  
**Status**: Privacy-focused data access  
**Security**: User data isolation enforced 