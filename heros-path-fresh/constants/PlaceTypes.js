/*
 * PLACE TYPES CONSTANTS
 * =====================
 * 
 * PURPOSE:
 * This file defines all the different types of places that users can discover during
 * their walks in Hero's Path. It maps Google Places API types to user-friendly labels
 * and provides the foundation for the discovery preferences system. Think of it as
 * the "menu" of what kinds of places users can choose to find during their adventures.
 * 
 * FUNCTIONALITY:
 * - Defines mappings between Google Places API types and user-friendly labels
 * - Organizes place types into logical categories (Food & Drink, Shopping, etc.)
 * - Provides the 'key' that matches Google's API requirements exactly
 * - Provides the 'label' that users see in the app interface
 * - Supports an 'all' option for users who want to discover everything
 * - Covers major categories that most users would be interested in discovering
 * 
 * WHY IT EXISTS:
 * The Google Places API uses technical terms like 'meal_takeaway' and 'tourist_attraction'
 * that aren't user-friendly. This file translates those technical terms into readable
 * labels while maintaining the exact API requirements. It also centralizes all place
 * type definitions so they can be consistently used throughout the app.
 * 
 * RELATIONSHIPS:
 * - Used by DiscoveryPreferencesScreen.js to show user preference options
 * - Used by DiscoveriesService.js and PingService.js to filter API results
 * - Used by NewPlacesService.js for making API calls with specific place types
 * - Referenced by any component that needs to display or filter by place types
 * - Connected to user preference storage and filtering systems
 * 
 * REFERENCED BY:
 * - DiscoveryPreferencesScreen.js (for user preference selection)
 * - DiscoveriesService.js (for filtering discovered places)
 * - PingService.js (for real-time discovery filtering)
 * - NewPlacesService.js (for API query construction)
 * - Any screen that displays place type filters or categories
 * 
 * REFERENCES:
 * - Google Places API documentation (for valid place types)
 * - User preference storage systems
 * - Discovery and search algorithms
 * 
 * IMPORTANCE TO APP:
 * Very High - This is foundational to the app's core discovery feature. The types
 * defined here directly determine what users can discover and how the app categorizes
 * places. Changes to this file affect the entire discovery experience and user
 * preferences system.
 * 
 * IMPROVEMENT SUGGESTIONS:
 * 1. Add more specific categories - break food into subcategories (Fast Food, Fine Dining, etc.)
 * 2. Add seasonal categories - places relevant to different seasons or holidays
 * 3. Add activity-based grouping - places for specific activities (Date Night, Family Fun, etc.)
 * 4. Add user-customizable categories - let users create their own place type groups
 * 5. Add popularity indicators - show which types are most commonly selected
 * 6. Add location-aware suggestions - recommend relevant types based on current area
 * 7. Add accessibility categories - places with specific accessibility features
 * 8. Add budget-based categories - places grouped by price ranges
 * 9. Add time-based categories - places open early, late, or 24/7
 * 10. Add social categories - places good for groups, couples, or solo visits
 * 11. Add cultural categories - places specific to local culture or international cuisine
 * 12. Add health-conscious categories - healthy food options, fitness-related places
 * 13. Add weather-dependent categories - indoor vs outdoor places
 * 14. Add transportation categories - places accessible by different transport modes
 * 15. Add validation system - ensure all types are still supported by Google Places API
 * 16. Add description field - provide more context about what each category includes
 * 17. Add icon mapping - associate icons with each place type for better UI
 * 18. Add color coding - visual categorization with theme-aware colors
 */

// constants/PlaceTypes.js

// label: shown in the UI  
// key: must match a Google Places "type" exactly (or 'all')
// Updated to match new Google Places API supported types
export const PLACE_TYPES = [
  { key: 'all',               label: 'All Types' },
  
  // Food & Drink
  { key: 'restaurant',        label: 'Restaurants' },
  { key: 'cafe',              label: 'Cafés' },
  { key: 'bar',               label: 'Bars' },
  { key: 'bakery',            label: 'Bakeries' },
  { key: 'meal_takeaway',     label: 'Takeaway Food' },
  
  // Shopping
  { key: 'shopping_mall',     label: 'Shopping Malls' },
  { key: 'store',             label: 'Stores' },
  { key: 'convenience_store', label: 'Convenience Stores' },
  
  // Entertainment & Culture
  { key: 'museum',            label: 'Museums' },
  { key: 'art_gallery',       label: 'Art Galleries' },
  { key: 'night_club',        label: 'Nightclubs' },
  { key: 'tourist_attraction',label: 'Tourist Attractions' },
  { key: 'zoo',               label: 'Zoos' },
  { key: 'stadium',           label: 'Stadiums' },
  { key: 'concert_hall',      label: 'Concert Halls' },
  { key: 'movie_theater',     label: 'Movie Theaters' },
  
  // Health & Wellness
  { key: 'gym',               label: 'Gyms' },
  { key: 'pharmacy',          label: 'Pharmacies' },
  
  // Services & Utilities
  { key: 'bank',              label: 'Banks' },
  { key: 'atm',               label: 'ATMs' },
  { key: 'gas_station',       label: 'Gas Stations' },
  
  // Outdoors & Recreation
  { key: 'park',              label: 'Parks' },
  { key: 'lodging',           label: 'Hotels & Lodging' },
];
