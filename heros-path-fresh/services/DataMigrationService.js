/**
 * DataMigrationService
 *
 * Handles data migration and upgrades.
 * - Migrates old data formats to new ones.
 * - Ensures backward compatibility and data integrity during upgrades.
 * - Used during app updates or major feature rollouts.
 */
// services/DataMigrationService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import JourneyService from './JourneyService';
import DiscoveryService from './DiscoveryService';
import Logger from '../utils/Logger';

class DataMigrationService {
  // Check if user has already migrated their data
  async hasMigrated(userId) {
    try {
      const migrationKey = `migration_complete_${userId}`;
      const migrated = await AsyncStorage.getItem(migrationKey);
      return migrated === 'true';
    } catch (error) {
      console.error('Error checking migration status:', error);
      return false;
    }
  }

  // Mark migration as complete
  async markMigrationComplete(userId) {
    try {
      const migrationKey = `migration_complete_${userId}`;
      await AsyncStorage.setItem(migrationKey, 'true');
      return { success: true };
    } catch (error) {
      console.error('Error marking migration complete:', error);
      throw error;
    }
  }

  // Migrate journeys from AsyncStorage to Firestore
  async migrateJourneys(userId) {
    try {
      const journeysKey = 'savedRoutes';
      const journeysData = await AsyncStorage.getItem(journeysKey);
      
      if (!journeysData) {
        return { success: true, migrated: 0, message: 'No journeys to migrate' };
      }

      const journeys = JSON.parse(journeysData);
      let migratedCount = 0;

      for (const journey of journeys) {
        try {
          // Generate proper journey name if not available
          let journeyName = journey.name;
          if (!journeyName) {
            const journeyDate = journey.timestamp ? new Date(journey.timestamp) : new Date();
            const formattedDate = journeyDate.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: '2-digit'
            }).replace(',', '');
            const formattedTime = journeyDate.toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            });
            journeyName = `${formattedDate} ${formattedTime}`;
          }
          
          // Transform journey data to match Firestore structure
          const journeyData = {
            name: journeyName,
            startLocation: journey.startLocation || journey.route?.[0],
            endLocation: journey.endLocation || journey.route?.[journey.route.length - 1],
            route: journey.route || [],
            distance: journey.distance || 0,
            duration: journey.duration || 0,
            // Preserve original timestamp if available
            createdAt: journey.timestamp ? new Date(journey.timestamp) : new Date(),
          };

          await JourneyService.createJourney(userId, journeyData);
          migratedCount++;
        } catch (error) {
          console.error(`Error migrating journey ${journey.name}:`, error);
          // Continue with other journeys even if one fails
        }
      }

      return { 
        success: true, 
        migrated: migratedCount, 
        total: journeys.length,
        message: `Migrated ${migratedCount} of ${journeys.length} journeys`
      };
    } catch (error) {
      console.error('Error migrating journeys:', error);
      throw error;
    }
  }

  // Migrate saved places from AsyncStorage to Firestore
  async migrateSavedPlaces(userId) {
    try {
      const savedPlacesKey = 'savedPlaces';
      const savedPlacesData = await AsyncStorage.getItem(savedPlacesKey);
      
      if (!savedPlacesData) {
        return { success: true, migrated: 0, message: 'No saved places to migrate' };
      }

      const savedPlaces = JSON.parse(savedPlacesData);
      let migratedCount = 0;

      for (const place of savedPlaces) {
        try {
          // Transform place data to match Firestore discovery structure
          const lat = place.geometry?.location?.lat || place.lat;
          const lng = place.geometry?.location?.lng || place.lng;
          
          // Skip places without valid coordinates
          if (lat === undefined || lng === undefined || lat === null || lng === null) {
            console.warn(`Skipping place ${place.name} - missing coordinates`);
            continue;
          }
          
          const discoveryData = {
            journeyId: null, // These are standalone saved places
            placeId: place.place_id || place.placeId,
            placeName: place.name,
            placeType: place.types?.[0] || 'unknown',
            location: {
              lat: lat,
              lng: lng,
            },
            discoveredAt: new Date(),
            dismissed: false,
            saved: true,
            // Store full place data for offline access
            placeData: {
              name: place.name,
              types: place.types || [],
              rating: place.rating,
              photos: place.photos || [],
              formatted_address: place.formatted_address,
              // Preserve any other relevant data
              ...place
            }
          };

          await DiscoveryService.createDiscovery(userId, discoveryData);
          migratedCount++;
        } catch (error) {
          console.error(`Error migrating saved place ${place.name}:`, error);
          // Continue with other places even if one fails
        }
      }

      return { 
        success: true, 
        migrated: migratedCount, 
        total: savedPlaces.length,
        message: `Migrated ${migratedCount} of ${savedPlaces.length} saved places`
      };
    } catch (error) {
      console.error('Error migrating saved places:', error);
      throw error;
    }
  }

  // Migrate dismissed places from AsyncStorage to Firestore
  async migrateDismissedPlaces(userId) {
    try {
      const dismissedPlacesKey = 'dismissedPlaces';
      const dismissedPlacesData = await AsyncStorage.getItem(dismissedPlacesKey);
      
      if (!dismissedPlacesData) {
        return { success: true, migrated: 0, message: 'No dismissed places to migrate' };
      }

      const dismissedPlaces = JSON.parse(dismissedPlacesData);
      let migratedCount = 0;

      for (const placeId of dismissedPlaces) {
        try {
          await DiscoveryService.dismissPlace(userId, placeId, {
            dismissedForever: true, // Assume existing dismissed places are permanent
            reason: 'migrated_from_async_storage'
          });
          migratedCount++;
        } catch (error) {
          console.error(`Error migrating dismissed place ${placeId}:`, error);
          // Continue with other places even if one fails
        }
      }

      return { 
        success: true, 
        migrated: migratedCount, 
        total: dismissedPlaces.length,
        message: `Migrated ${migratedCount} of ${dismissedPlaces.length} dismissed places`
      };
    } catch (error) {
      console.error('Error migrating dismissed places:', error);
      throw error;
    }
  }

  // Perform complete migration for a user
  async migrateAllData(userId) {
    try {
      Logger.debug('Starting data migration for user:', userId);

      // Check if already migrated
      if (await this.hasMigrated(userId)) {
        return { 
          success: true, 
          alreadyMigrated: true, 
          message: 'Data already migrated' 
        };
      }

      const results = {
        journeys: await this.migrateJourneys(userId),
        savedPlaces: await this.migrateSavedPlaces(userId),
        dismissedPlaces: await this.migrateDismissedPlaces(userId)
      };

      // Mark migration as complete
      await this.markMigrationComplete(userId);

      const totalMigrated = 
        results.journeys.migrated + 
        results.savedPlaces.migrated + 
        results.dismissedPlaces.migrated;

      Logger.debug('Migration completed:', results);

      return {
        success: true,
        alreadyMigrated: false,
        results,
        totalMigrated,
        message: `Migration completed: ${totalMigrated} items migrated`
      };
    } catch (error) {
      console.error('Error during complete migration:', error);
      throw error;
    }
  }

  // Get migration status and statistics
  async getMigrationStatus(userId) {
    try {
      const hasMigrated = await this.hasMigrated(userId);
      
      if (!hasMigrated) {
        // Check what data exists in AsyncStorage
        const [journeysData, savedPlacesData, dismissedPlacesData] = await Promise.all([
          AsyncStorage.getItem('savedRoutes'),
          AsyncStorage.getItem('savedPlaces'),
          AsyncStorage.getItem('dismissedPlaces')
        ]);

        const stats = {
          hasJourneys: !!journeysData,
          hasSavedPlaces: !!savedPlacesData,
          hasDismissedPlaces: !!dismissedPlacesData,
          journeysCount: journeysData ? JSON.parse(journeysData).length : 0,
          savedPlacesCount: savedPlacesData ? JSON.parse(savedPlacesData).length : 0,
          dismissedPlacesCount: dismissedPlacesData ? JSON.parse(dismissedPlacesData).length : 0,
        };

        return {
          success: true,
          hasMigrated: false,
          stats,
          message: 'Migration pending'
        };
      } else {
        // Get Firestore statistics
        const [journeyStats, discoveryStats] = await Promise.all([
          JourneyService.getJourneyStats(userId),
          DiscoveryService.getDiscoveryStats(userId)
        ]);

        return {
          success: true,
          hasMigrated: true,
          stats: {
            journeys: journeyStats.success ? journeyStats.stats : { totalJourneys: 0, totalDistance: 0, totalDuration: 0, averageDistance: 0, averageDuration: 0 },
            discoveries: discoveryStats.success ? discoveryStats.stats : { totalDiscoveries: 0, savedCount: 0, dismissedCount: 0, placeTypes: {}, saveRate: 0, dismissRate: 0 }
          },
          message: 'Migration completed'
        };
      }
    } catch (error) {
      console.error('Error getting migration status:', error);
      throw error;
    }
  }

  // Rollback migration (for testing purposes)
  async rollbackMigration(userId) {
    try {
      // Remove migration flag
      const migrationKey = `migration_complete_${userId}`;
      await AsyncStorage.removeItem(migrationKey);

      // Note: This doesn't delete Firestore data, just removes the migration flag
      // To actually rollback, you'd need to implement data deletion methods
      
      return { 
        success: true, 
        message: 'Migration flag removed. Firestore data remains.' 
      };
    } catch (error) {
      console.error('Error rolling back migration:', error);
      throw error;
    }
  }
}

export default new DataMigrationService(); 