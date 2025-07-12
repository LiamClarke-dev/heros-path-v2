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
