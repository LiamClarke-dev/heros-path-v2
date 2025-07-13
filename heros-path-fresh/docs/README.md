# Hero's Path - Documentation Index

Welcome to the Hero's Path documentation! This guide helps you find the right documentation for your needs.

# Next Steps for Development

## 1. Ping Animation Overhaul
- Redesign the ping animation to be a dramatic, gamified "special power" effect (see DEVELOPMENT_STATUS.md for details).
- Should include a charge-up and release phase, last 3–5 seconds, and be visually impactful.
- Part of the overall theme, user preferences, and map style overhaul.

## 2. React Native useInsertionEffect Warning
- Address the warning: `useInsertionEffect must not schedule updates.`
- See DEVELOPMENT_STATUS.md for call stack and details.

---

## 📚 **Documentation Categories**

### **🚀 Getting Started**
- **[README.md](../README.md)** - Main project overview, setup, and quick start guide
- **[CHANGELOG.md](CHANGELOG.md)** - Recent changes, updates, and version history

### **🔧 Development & Status**
- **[DEVELOPMENT_STATUS.md](DEVELOPMENT_STATUS.md)** - Current development status, priorities, and next steps
- **[SAR_IMPLEMENTATION_PLAN.md](SAR_IMPLEMENTATION_PLAN.md)** - Search Along Route (SAR) implementation plan for route discovery
- **[DEBUG_LOGGING_GUIDE.md](DEBUG_LOGGING_GUIDE.md)** - How to use the debug logging system and troubleshoot issues

### **🌐 API & Services**
- **[GOOGLE_PLACES_API_MIGRATION_COMPLETE.md](GOOGLE_PLACES_API_MIGRATION_COMPLETE.md)** - Complete Google Places API migration documentation
- **[LOCATION_OPTIMIZATIONS.md](LOCATION_OPTIMIZATIONS.md)** - Location tracking optimizations and background task improvements

### **🗄️ Database & Data**
- **[FIRESTORE_DATA_VIEWING_GUIDE.md](FIRESTORE_DATA_VIEWING_GUIDE.md)** - How to view and analyze your Firestore data
- **[FIRESTORE_INDEXES_GUIDE.md](FIRESTORE_INDEXES_GUIDE.md)** - Firestore indexes setup and optimization

### **📱 Platform-Specific**
- **[GPS_TRACKING_FIXES.md](GPS_TRACKING_FIXES.md)** - GPS tracking fixes and testing guide

---

## 🎯 **When to Consult Each Document**

### **For New Developers**
1. **Start with**: `README.md` - Complete project overview
2. **Then check**: `DEVELOPMENT_STATUS.md` - Current priorities and known issues
3. **Setup**: Follow the setup instructions in `README.md`

### **For API Development**
1. **Google Places**: `GOOGLE_PLACES_API_MIGRATION_COMPLETE.md` - API integration details
2. **Route Discovery**: `SAR_IMPLEMENTATION_PLAN.md` - New SAR implementation for route discovery
3. **Location Features**: `LOCATION_OPTIMIZATIONS.md` - Location tracking implementation
4. **GPS Issues**: `GPS_TRACKING_FIXES.md` - Platform-specific GPS fixes

### **For Database Work**
1. **Data Analysis**: `FIRESTORE_DATA_VIEWING_GUIDE.md` - How to view and export data
2. **Performance**: `FIRESTORE_INDEXES_GUIDE.md` - Database optimization
3. **Debugging**: `DEBUG_LOGGING_GUIDE.md` - Troubleshooting with logs

### **For Production Deployment**
1. **Recent Changes**: `CHANGELOG.md` - What's new and what's fixed
2. **Status Check**: `DEVELOPMENT_STATUS.md` - Production readiness status
3. **API Migration**: `GOOGLE_PLACES_API_MIGRATION_COMPLETE.md` - API stability

### **For Troubleshooting**
1. **Debug Logs**: `DEBUG_LOGGING_GUIDE.md` - Enable and use debug logging
2. **GPS Issues**: `GPS_TRACKING_FIXES.md` - Location tracking problems
3. **Data Issues**: `FIRESTORE_DATA_VIEWING_GUIDE.md` - Database problems

---

## 📋 **Documentation Maintenance**

### **When to Update Documentation**
- **After major features**: Update `CHANGELOG.md` and `DEVELOPMENT_STATUS.md`
- **API changes**: Update relevant API documentation
- **New issues found**: Add to troubleshooting guides
- **Performance improvements**: Update optimization guides

### **Documentation Standards**
- Keep documentation up-to-date with code changes
- Include practical examples and code snippets
- Provide clear step-by-step instructions
- Use consistent formatting and structure

---

## 🔍 **Quick Reference**

| Need | Document | Purpose |
|------|----------|---------|
| **Setup** | `README.md` | Project setup and configuration |
| **Current Status** | `DEVELOPMENT_STATUS.md` | What's working and what's next |
| **Route Discovery** | `SAR_IMPLEMENTATION_PLAN.md` | New SAR implementation plan |
| **API Issues** | `GOOGLE_PLACES_API_MIGRATION_COMPLETE.md` | Google Places API problems |
| **Location Problems** | `LOCATION_OPTIMIZATIONS.md` | GPS and location tracking |
| **Database Issues** | `FIRESTORE_DATA_VIEWING_GUIDE.md` | Firestore data problems |
| **Debugging** | `DEBUG_LOGGING_GUIDE.md` | Enable debug logs and troubleshoot |
| **Recent Changes** | `CHANGELOG.md` | What changed in recent updates |
| **Performance** | `FIRESTORE_INDEXES_GUIDE.md` | Database optimization |
| **Platform Issues** | `GPS_TRACKING_FIXES.md` | iOS/Android specific problems |

---

**Last Updated**: 12 July 2025  
**Maintained by**: Development Team  
**For questions**: Check the relevant documentation or create an issue 

# UI/UX and Navigation Refactor (July 2025)

## New Navigation Structure
- DrawerNavigator for top-level navigation (Map, Social, Settings, etc.)
- StackNavigator for flows (e.g., viewing a journey, editing a place)
- TabNavigator for sub-navigation within a section (e.g., Discoveries)

## Shared UI Components
- Card, ListItem, AppButton, SectionHeader, Divider, etc. in `components/ui/`
- Used across all screens for a unified look

## Card-Based Layouts
- All screens will use card-based layouts for lists and detail views
- Consistent padding, spacing, and section headers

## Theming
- Theme system used for all backgrounds, borders, text, and shadows

## Recent Changes
- Refactored SettingsScreen to use SectionCard and SettingsButton
- Forced Google Maps provider on iOS for custom map styles
- Plan to refactor all screens for consistency and scalability 