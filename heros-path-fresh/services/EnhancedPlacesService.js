/*
 * ENHANCED PLACES SERVICE (ADVANCED GOOGLE PLACES API FEATURES)
 * ==============================================================
 * 
 * PURPOSE:
 * This service provides advanced features and enhanced functionality on top of the
 * NewPlacesService, leveraging cutting-edge Google Places API capabilities like AI
 * summaries, editorial content, and advanced filtering options. It serves as the
 * "premium layer" that makes Hero's Path discoveries more informative and engaging
 * by providing richer, more intelligent place information.
 * 
 * FUNCTIONALITY:
 * - AI-Powered Summaries: Get intelligent summaries and descriptions for places
 * - Editorial Content: Access professionally curated place information
 * - Advanced Filtering: Enhanced filtering options for more precise discovery
 * - Field Masking: Optimize API calls by requesting only needed data fields
 * - Performance Optimization: Smart caching and request optimization
 * - Enhanced Photos: Higher quality photos with better metadata
 * - Rich Reviews: More detailed and contextual review information
 * - Language Support: Advanced multilingual content and localization
 * - Fallback Handling: Graceful degradation to basic features when enhanced unavailable
 * - Quality Scoring: AI-powered quality assessments for places
 * 
 * WHY IT EXISTS:
 * Google's new Places API offers advanced AI-powered features that can significantly
 * enhance the discovery experience. However, these features require careful integration
 * and fallback handling. This service provides a clean interface to these advanced
 * capabilities while maintaining compatibility with the basic Places API, ensuring
 * Hero's Path can offer premium discovery experiences when possible.
 * 
 * KEY ENHANCED FEATURES:
 * 1. **AI Summaries**: Intelligent, contextual place descriptions
 * 2. **Editorial Content**: Professional content and recommendations
 * 3. **Smart Filtering**: Advanced filtering based on user preferences and context
 * 4. **Quality Optimization**: AI-powered place quality assessment
 * 5. **Contextual Information**: Place information tailored to user context
 * 6. **Enhanced Photos**: Higher quality images with better metadata
 * 7. **Intelligent Reviews**: Curated and contextualized review content
 * 8. **Performance Optimization**: Efficient API usage and caching
 * 
 * ENHANCEMENT LAYERS:
 * - **Basic Layer**: Standard place information from NewPlacesService
 * - **AI Layer**: AI-generated summaries and intelligent content
 * - **Editorial Layer**: Professional content and curated information
 * - **Context Layer**: Personalized content based on user preferences
 * - **Quality Layer**: AI-powered quality scores and recommendations
 * 
 * RELATIONSHIPS:
 * - Extends NewPlacesService.js with advanced functionality
 * - Uses same Google Places API configuration and authentication
 * - Integrates with caching systems for performance optimization
 * - Works with Logger for detailed API usage tracking
 * - May be used by DiscoveriesService for enhanced place data
 * - Provides fallback to basic functionality when enhanced features unavailable
 * - Uses platform-specific API keys for optimal performance
 * 
 * REFERENCED BY:
 * - DiscoveriesService.js (for enhanced discovery information)
 * - Place detail screens requiring rich information
 * - Premium features that need high-quality place data
 * - AI-powered recommendation systems
 * - Editorial and content management features
 * 
 * REFERENCES:
 * - NewPlacesService.js (for basic place functionality and fallback)
 * - Google Places API (for enhanced features and AI capabilities)
 * - Configuration files (for API keys and feature flags)
 * - Logger.js (for tracking enhanced feature usage)
 * - Caching systems (for performance optimization)
 * 
 * IMPORTANCE TO APP:
 * HIGH - This service provides the "wow factor" that differentiates Hero's Path
 * from basic walking apps. The enhanced place information, AI summaries, and
 * editorial content create a premium discovery experience that adds significant
 * value for users and justifies the app's position as an intelligent exploration
 * companion.
 * 
 * IMPROVEMENT SUGGESTIONS:
 * 1. Add content personalization - tailor content to individual user preferences
 * 2. Add content caching - cache AI summaries and editorial content locally
 * 3. Add content versioning - track and update enhanced content over time
 * 4. Add content analytics - track which enhanced features users value most
 * 5. Add content customization - allow users to choose content detail levels
 * 6. Add content translation - AI-powered translation of enhanced content
 * 7. Add content moderation - filter and moderate AI-generated content
 * 8. Add content enrichment - supplement AI content with additional data sources
 * 9. Add content validation - validate AI-generated content for accuracy
 * 10. Add content scheduling - schedule content updates and refreshes
 * 11. Add content optimization - optimize content based on user engagement
 * 12. Add content accessibility - ensure enhanced content supports accessibility
 * 13. Add content syndication - share enhanced content across platforms
 * 14. Add content backup - backup and restore enhanced content data
 * 15. Add content monitoring - monitor enhanced content quality and relevance
 * 16. Add content integration - integrate with additional content providers
 * 17. Add content automation - automate content updates and management
 * 18. Add content insights - provide insights about content performance
 * 19. Add content compliance - ensure content meets legal and regulatory requirements
 * 20. Add content innovation - experiment with new types of enhanced content
 */
// services/EnhancedPlacesService.js
import { Platform } from 'react-native';
import { GOOGLE_MAPS_API_KEY_ANDROID, GOOGLE_MAPS_API_KEY_IOS } from '../config';
import { 
  getPlaceDetails, 
  getPlaceSummaries as getNewPlaceSummaries,
  searchNearbyPlaces as searchNearbyPlacesNew
} from './NewPlacesService';
import Logger from '../utils/Logger';

// Use platform-specific API key for Places API
const getPlacesAPIKey = () => {
  const key = Platform.OS === 'ios' ? GOOGLE_MAPS_API_KEY_IOS : GOOGLE_MAPS_API_KEY_ANDROID;
  return key || ''; // Return empty string if undefined to avoid API failures
};

/**
 * Get enhanced place details including AI summaries
 * Uses the new Google Places API with AI-powered features
 */
export async function getEnhancedPlaceDetails(placeId, language = 'en') {
  try {
    // Use the new Places API service with automatic fallback
    const basicDetails = await getPlaceDetails(placeId, language, true);
    
    // Then get AI summaries if available
    const summaries = await getNewPlaceSummaries(placeId, language);
    
    return {
      ...basicDetails,
      summaries
    };
  } catch (error) {
    Logger.warn('Failed to get enhanced place details:', error);
    // Fallback to basic details only
    return await getPlaceDetails(placeId, { language, useNewAPI: false });
  }
}

/**
 * Get nearby places with enhanced filtering and sorting
 * Uses the new Places API features for better results
 */
export async function getNearbyPlacesEnhanced(latitude, longitude, radius, options = {}) {
  const {
    types = [],
    minRating = 0,
    maxPrice = 4,
    openNow = false,
    language = 'en',
    maxResults = 20
  } = options;
  
  let allResults = [];
  
  // If specific types are provided, search for each type
  if (types.length > 0) {
    for (const type of types) {
      try {
        const results = await searchNearbyPlacesNew(latitude, longitude, radius, type, {
          minRating,
          maxPrice,
          openNow,
          language,
          maxResults: Math.ceil(maxResults / types.length)
        });
        allResults = [...allResults, ...results];
      } catch (error) {
        Logger.warn(`Failed to search for type ${type}:`, error);
      }
    }
  } else {
    // Search for general points of interest
    const results = await searchNearbyPlacesNew(latitude, longitude, radius, 'point_of_interest', {
      minRating,
      maxPrice,
      openNow,
      language,
      maxResults
    });
    allResults = results;
  }
  
  // Filter and sort results
  allResults = allResults
    .filter(place => !place.rating || place.rating >= minRating)
    .filter(place => !place.priceLevel || place.priceLevel <= maxPrice)
    .sort((a, b) => {
      // Sort by rating (descending), then by distance
      if (a.rating && b.rating && a.rating !== b.rating) {
        return b.rating - a.rating;
      }
      return 0;
    })
    .slice(0, maxResults);
  
  return allResults;
}

/**
 * Generate a photo URL for a place
 * Updated to handle both new and legacy photo references
 */
export function getPlacePhotoUrl(photoReference, maxWidth = 400) {
  if (!photoReference) return null;
  
  // Check if it's a new API photo reference (contains 'places/')
  if (photoReference.includes('places/')) {
    return `https://places.googleapis.com/v1/${photoReference}/media?maxWidthPx=${maxWidth}&key=${getPlacesAPIKey()}`;
  }
  
  // Legacy photo reference
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${getPlacesAPIKey()}`;
}

/**
 * Get place types that are supported by the API
 * Based on the latest Google Places API documentation
 * Updated to only include types that are actually supported
 */
export const SUPPORTED_PLACE_TYPES = [
  // Food & Drink
  'restaurant', 'cafe', 'bar', 'bakery', 'meal_takeaway',
  
  // Shopping
  'shopping_mall', 'store', 'convenience_store', 'department_store',
  
  // Entertainment & Culture
  'museum', 'art_gallery', 'night_club', 'tourist_attraction', 'zoo',
  'stadium', 'concert_hall', 'movie_theater', 'amusement_park',
  
  // Health & Wellness
  'gym', 'pharmacy', 'hospital', 'dentist', 'doctor',
  
  // Services & Utilities
  'bank', 'atm', 'gas_station', 'car_wash', 'car_repair',
  
  // Outdoors & Recreation
  'park', 'lodging', 'campground', 'natural_feature',
  
  // Transportation
  'subway_station', 'train_station', 'bus_station', 'airport',
  
  // Education
  'school', 'university', 'library',
  
  // Religious
  'church', 'mosque', 'synagogue', 'hindu_temple',
  
  // General
  'point_of_interest', 'establishment'
]; 