# Firestore Indexes Setup Guide

## 📊 **Current Query Analysis**

Based on your codebase analysis, here are the Firestore queries that require indexes:

### **Collections Structure**
```
journeys/{userId}/
├── journeys/{journeyId}          # User's journey records
├── discoveries/{discoveryId}     # Places discovered during journeys
└── dismissed/{placeId}           # Places dismissed by user
```

## 🔍 **Required Indexes**

### **1. Discoveries Collection Indexes**

#### **Index 1: Journey-based Discoveries**
- **Collection**: `journeys/{userId}/discoveries`
- **Fields**: 
  - `journeyId` (Ascending)
  - `createdAt` (Descending)
- **Purpose**: Query discoveries for a specific journey
- **Used in**: `getDiscoveriesByJourney()`, journey deletion cleanup

#### **Index 2: Place Type Filtering**
- **Collection**: `journeys/{userId}/discoveries`
- **Fields**:
  - `placeType` (Ascending)
  - `createdAt` (Descending)
- **Purpose**: Filter discoveries by place type
- **Used in**: Discovery filtering by category

#### **Index 3: Saved Places**
- **Collection**: `journeys/{userId}/discoveries`
- **Fields**:
  - `saved` (Ascending)
  - `createdAt` (Descending)
- **Purpose**: Get all saved places for a user
- **Used in**: `getSavedPlaces()`, SavedPlacesScreen

#### **Index 4: Dismissed Status**
- **Collection**: `journeys/{userId}/discoveries`
- **Fields**:
  - `dismissed` (Ascending)
  - `createdAt` (Descending)
- **Purpose**: Filter dismissed/not dismissed discoveries
- **Used in**: Discovery management

#### **Index 5: Place ID Lookup**
- **Collection**: `journeys/{userId}/discoveries`
- **Fields**:
  - `placeId` (Ascending)
- **Purpose**: Find specific discovery by place ID
- **Used in**: `dismissPlace()`, `undismissPlace()`

### **2. Dismissed Collection Indexes**

#### **Index 6: Journey-based Dismissed Places**
- **Collection**: `journeys/{userId}/dismissed`
- **Fields**:
  - `journeyId` (Ascending)
  - `dismissedAt` (Descending)
- **Purpose**: Get dismissed places for a specific journey
- **Used in**: Journey deletion cleanup

## 🛠 **How to Create Indexes**

### **Method 1: Firebase Console (Recommended)**

1. **Go to Firebase Console**
   - Navigate to your project
   - Go to Firestore Database → Indexes tab

2. **Create Composite Indexes**
   - Click "Create Index"
   - Select collection: `journeys/{userId}/discoveries`
   - Add fields as specified above
   - Set query scope to "Collection"

3. **Create Indexes for Each Query Pattern**

#### **Index 1: Journey Discoveries**
```
Collection: journeys/{userId}/discoveries
Fields:
- journeyId (Ascending)
- createdAt (Descending)
Query scope: Collection
```

#### **Index 2: Place Type Filter**
```
Collection: journeys/{userId}/discoveries
Fields:
- placeType (Ascending)
- createdAt (Descending)
Query scope: Collection
```

#### **Index 3: Saved Places**
```
Collection: journeys/{userId}/discoveries
Fields:
- saved (Ascending)
- createdAt (Descending)
Query scope: Collection
```

#### **Index 4: Dismissed Status**
```
Collection: journeys/{userId}/discoveries
Fields:
- dismissed (Ascending)
- createdAt (Descending)
Query scope: Collection
```

#### **Index 5: Place ID Lookup**
```
Collection: journeys/{userId}/discoveries
Fields:
- placeId (Ascending)
Query scope: Collection
```

#### **Index 6: Journey Dismissed Places**
```
Collection: journeys/{userId}/dismissed
Fields:
- journeyId (Ascending)
- dismissedAt (Descending)
Query scope: Collection
```

### **Method 2: Firebase CLI (firestore.indexes.json)**

Create a `firestore.indexes.json` file in your project root:

```json
{
  "indexes": [
    {
      "collectionGroup": "discoveries",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "journeyId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "discoveries",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "placeType",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "discoveries",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "saved",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "discoveries",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "dismissed",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "discoveries",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "placeId",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "dismissed",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "journeyId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "dismissedAt",
          "order": "DESCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Then deploy with:
```bash
firebase deploy --only firestore:indexes
```

## 🚨 **Current Code Optimizations**

### **Good News: Your Code is Already Optimized!**

Your current code has been designed to **avoid complex index requirements**:

1. **No Composite Queries**: You're not combining multiple `where` clauses
2. **In-Memory Sorting**: Using `sort()` in JavaScript instead of `orderBy()`
3. **Simple Queries**: Each query uses only one `where` clause

### **Current Query Patterns (No Indexes Required)**

```javascript
// ✅ Simple queries - no indexes needed
query(discoveriesRef, where('journeyId', '==', journeyId))
query(discoveriesRef, where('saved', '==', true))
query(discoveriesRef, where('placeId', '==', placeId))

// ✅ In-memory sorting - no indexes needed
discoveries.sort((a, b) => {
  const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
  const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
  return dateB - dateA; // Descending order
});
```

## 📈 **Performance Considerations**

### **When You Need Indexes**

You'll need indexes if you want to:

1. **Add Composite Queries**:
   ```javascript
   // This would require an index
   query(discoveriesRef, 
     where('journeyId', '==', journeyId),
     where('saved', '==', true)
   )
   ```

2. **Add Server-Side Sorting**:
   ```javascript
   // This would require an index
   query(discoveriesRef, 
     where('journeyId', '==', journeyId),
     orderBy('createdAt', 'desc')
   )
   ```

3. **Add Range Queries**:
   ```javascript
   // This would require an index
   query(discoveriesRef,
     where('createdAt', '>=', startDate),
     where('createdAt', '<=', endDate)
   )
   ```

### **Current Performance is Good**

Your current approach is actually **very efficient** for small to medium datasets:

- **No index maintenance overhead**
- **Fast for small collections** (< 1000 documents per user)
- **Simple and reliable**
- **No complex query planning**

## 🎯 **Recommendations**

### **For Current App (Recommended)**
1. **Keep current approach** - no indexes needed
2. **Monitor performance** as user base grows
3. **Add indexes only when needed**

### **For Future Scaling**
1. **Add indexes when you have 1000+ discoveries per user**
2. **Consider server-side sorting for large datasets**
3. **Add composite queries for advanced filtering**

### **Index Creation Priority**
If you decide to add indexes, create them in this order:

1. **High Priority**: Journey-based discoveries (most common query)
2. **Medium Priority**: Saved places (frequently accessed)
3. **Low Priority**: Place type filtering (less common)

## 🔍 **Monitoring Index Usage**

### **Firebase Console**
- Go to Firestore → Indexes tab
- Check "Usage" column to see which indexes are being used
- Monitor "Index size" for storage costs

### **Performance Monitoring**
- Watch for "Missing index" errors in console
- Monitor query execution times
- Check Firestore usage in Firebase Console

## 📝 **Summary**

**Current Status**: ✅ **No indexes required** - your code is optimized

**Your app currently uses**:
- Simple single-field queries (no indexes needed)
- In-memory sorting (no indexes needed)
- Efficient data structure

**When to add indexes**:
- When you have 1000+ documents per user
- When you want to add composite queries
- When you want server-side sorting for large datasets

**Next steps**:
1. Deploy your current code (no changes needed)
2. Monitor performance as users grow
3. Add indexes only when you see performance issues

---

**Last Updated**: 12 July 2025  
**Status**: No indexes required for current implementation  
**Recommendation**: Keep current optimized approach 