/*
 * PLACE DETAILS MODAL COMPONENT
 * ============================
 * 
 * PURPOSE:
 * This component provides a rich, detailed view of a place using Google Places UI Kit styling.
 * It displays comprehensive information about a selected place including photos, ratings,
 * opening hours, and provides actions like navigation and sharing.
 * 
 * FUNCTIONALITY:
 * - Displays place details in a modal with Google Places UI Kit styling
 * - Shows place photos, ratings, opening hours, and other details
 * - Provides navigation and sharing actions
 * - Adapts to the current theme
 * - Handles loading states and errors
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  Linking,
  Platform,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Logger from '../../utils/Logger';
import { getIconForPlaceType } from '../../utils/placeTypeToIcon';
import NewPlacesService from '../../services/NewPlacesService';

const { width } = Dimensions.get('window');

/**
 * PlaceDetailsModal Component
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {Object} props.place - The place object to display details for
 * @param {Function} props.onClose - Function to call when closing the modal
 * @param {Object} props.colors - Theme colors object
 */
export default function PlaceDetailsModal({ visible, place, onClose, colors }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [placeDetails, setPlaceDetails] = useState(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Fetch additional place details when a place is selected
  useEffect(() => {
    async function fetchPlaceDetails() {
      if (!place || !place.place_id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        Logger.debug('PlaceDetailsModal: Fetching place details', { placeId: place.place_id });
        
        const result = await NewPlacesService.getPlaceDetails(place.place_id);
        
        if (result.success && result.place) {
          setPlaceDetails(result.place);
          Logger.debug('PlaceDetailsModal: Successfully fetched place details', { 
            placeId: place.place_id,
            hasPhotos: result.place.photos?.length > 0
          });
        } else {
          throw new Error(result.error || 'Failed to fetch place details');
        }
      } catch (err) {
        Logger.error('PlaceDetailsModal: Error fetching place details', err);
        setError('Could not load place details. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    if (visible && place) {
      fetchPlaceDetails();
    } else {
      // Reset state when modal is closed
      setPlaceDetails(null);
      setActivePhotoIndex(0);
      setError(null);
    }
  }, [visible, place]);

  // Handle navigation to the place
  const handleNavigate = () => {
    try {
      const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
      const latLng = `${place.latitude},${place.longitude}`;
      const label = place.name;
      const url = Platform.select({
        ios: `${scheme}${label}@${latLng}`,
        android: `${scheme}${latLng}(${label})`
      });

      Linking.openURL(url);
      Logger.debug('PlaceDetailsModal: Opening navigation', { url });
    } catch (error) {
      Logger.error('PlaceDetailsModal: Error opening navigation', error);
    }
  };

  // Handle sharing the place
  const handleShare = () => {
    try {
      const url = `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}&query_place_id=${place.place_id}`;
      Linking.openURL(url);
      Logger.debug('PlaceDetailsModal: Sharing place', { url });
    } catch (error) {
      Logger.error('PlaceDetailsModal: Error sharing place', error);
    }
  };

  // Handle opening the place website
  const handleOpenWebsite = () => {
    if (placeDetails?.website) {
      try {
        Linking.openURL(placeDetails.website);
        Logger.debug('PlaceDetailsModal: Opening website', { url: placeDetails.website });
      } catch (error) {
        Logger.error('PlaceDetailsModal: Error opening website', error);
      }
    }
  };

  // Handle opening the phone dialer
  const handleCall = () => {
    if (placeDetails?.formatted_phone_number) {
      try {
        Linking.openURL(`tel:${placeDetails.formatted_phone_number.replace(/\\s/g, '')}`);
        Logger.debug('PlaceDetailsModal: Making phone call', { 
          phone: placeDetails.formatted_phone_number 
        });
      } catch (error) {
        Logger.error('PlaceDetailsModal: Error making phone call', error);
      }
    }
  };

  // Get the appropriate icon for this place type
  const getPlaceIcon = () => {
    if (!place || !place.types || place.types.length === 0) {
      return null;
    }
    
    const iconConfig = getIconForPlaceType(place.types[0], colors);
    const IconComponent = iconConfig.Component;
    
    return (
      <View style={[styles.iconContainer, { backgroundColor: iconConfig.color }]}>
        <IconComponent name={iconConfig.name} size={24} color="#FFFFFF" />
      </View>
    );
  };

  // Render the photo gallery
  const renderPhotoGallery = () => {
    if (!placeDetails?.photos || placeDetails.photos.length === 0) {
      return null;
    }
    
    return (
      <View style={styles.photoGalleryContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.floor(event.nativeEvent.contentOffset.x / width);
            setActivePhotoIndex(newIndex);
          }}
        >
          {placeDetails.photos.map((photo, index) => (
            <Image
              key={index}
              source={{ uri: photo.url }}
              style={styles.photoGalleryImage}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
        
        {/* Photo indicators */}
        {placeDetails.photos.length > 1 && (
          <View style={styles.photoIndicators}>
            {placeDetails.photos.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.photoIndicator,
                  {
                    backgroundColor: index === activePhotoIndex ? colors.primary : colors.border,
                  },
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  // Format opening hours
  const formatOpeningHours = () => {
    if (!placeDetails?.opening_hours?.weekday_text) {
      return null;
    }
    
    return (
      <View style={styles.openingHoursContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Opening Hours</Text>
        {placeDetails.opening_hours.weekday_text.map((day, index) => (
          <Text key={index} style={[styles.openingHoursText, { color: colors.textSecondary || colors.text }]}>
            {day}
          </Text>
        ))}
      </View>
    );
  };

  // Render reviews
  const renderReviews = () => {
    if (!placeDetails?.reviews || placeDetails.reviews.length === 0) {
      return null;
    }
    
    // Only show up to 3 reviews
    const displayReviews = placeDetails.reviews.slice(0, 3);
    
    return (
      <View style={styles.reviewsContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Reviews</Text>
        {displayReviews.map((review, index) => (
          <View key={index} style={styles.reviewItem}>
            <View style={styles.reviewHeader}>
              <Text style={[styles.reviewAuthor, { color: colors.text }]}>{review.author_name}</Text>
              <View style={styles.ratingContainer}>
                <Text style={[styles.ratingText, { color: colors.warning || '#FFC107' }]}>{review.rating}</Text>
                <MaterialIcons name="star" size={16} color={colors.warning || '#FFC107'} />
              </View>
            </View>
            <Text 
              style={[styles.reviewText, { color: colors.textSecondary || colors.text }]}
              numberOfLines={3}
            >
              {review.text}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  if (!visible || !place) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.cardBackground || colors.background }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.text }]}>Loading place details...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={48} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
              <TouchableOpacity 
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  if (place && place.place_id) {
                    setPlaceDetails(null);
                    setError(null);
                    setLoading(true);
                    NewPlacesService.getPlaceDetails(place.place_id)
                      .then(result => {
                        if (result.success && result.place) {
                          setPlaceDetails(result.place);
                        } else {
                          throw new Error(result.error || 'Failed to fetch place details');
                        }
                      })
                      .catch(err => {
                        setError('Could not load place details. Please try again.');
                      })
                      .finally(() => {
                        setLoading(false);
                      });
                  }
                }}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Place icon and name */}
              <View style={styles.placeHeaderContainer}>
                {getPlaceIcon()}
                <View style={styles.placeHeaderTextContainer}>
                  <Text style={[styles.placeName, { color: colors.text }]}>
                    {place.name}
                  </Text>
                  {place.vicinity && (
                    <Text style={[styles.placeVicinity, { color: colors.textSecondary || colors.text }]}>
                      {place.vicinity}
                    </Text>
                  )}
                </View>
              </View>

              {/* Rating */}
              {(place.rating || placeDetails?.rating) && (
                <View style={styles.ratingRow}>
                  <View style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <MaterialIcons
                        key={star}
                        name={star <= Math.round(place.rating || placeDetails?.rating || 0) ? "star" : "star-border"}
                        size={20}
                        color={colors.warning || '#FFC107'}
                        style={styles.starIcon}
                      />
                    ))}
                  </View>
                  <Text style={[styles.ratingCount, { color: colors.textSecondary || colors.text }]}>
                    {place.rating || placeDetails?.rating || 0} ({place.user_ratings_total || placeDetails?.user_ratings_total || 0} reviews)
                  </Text>
                </View>
              )}

              {/* Photo Gallery */}
              {renderPhotoGallery()}

              {/* Quick Actions */}
              <View style={styles.quickActionsContainer}>
                <TouchableOpacity 
                  style={[styles.quickActionButton, { backgroundColor: colors.primary }]}
                  onPress={handleNavigate}
                >
                  <MaterialIcons name="directions" size={24} color="#FFFFFF" />
                  <Text style={styles.quickActionText}>Directions</Text>
                </TouchableOpacity>
                
                {placeDetails?.formatted_phone_number && (
                  <TouchableOpacity 
                    style={[styles.quickActionButton, { backgroundColor: colors.success || '#4CAF50' }]}
                    onPress={handleCall}
                  >
                    <MaterialIcons name="phone" size={24} color="#FFFFFF" />
                    <Text style={styles.quickActionText}>Call</Text>
                  </TouchableOpacity>
                )}
                
                {placeDetails?.website && (
                  <TouchableOpacity 
                    style={[styles.quickActionButton, { backgroundColor: colors.info || '#2196F3' }]}
                    onPress={handleOpenWebsite}
                  >
                    <MaterialIcons name="public" size={24} color="#FFFFFF" />
                    <Text style={styles.quickActionText}>Website</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  style={[styles.quickActionButton, { backgroundColor: colors.secondary || '#9C27B0' }]}
                  onPress={handleShare}
                >
                  <MaterialIcons name="share" size={24} color="#FFFFFF" />
                  <Text style={styles.quickActionText}>Share</Text>
                </TouchableOpacity>
              </View>

              {/* Address */}
              {(place.vicinity || placeDetails?.formatted_address) && (
                <View style={styles.infoSection}>
                  <View style={styles.infoRow}>
                    <MaterialIcons name="location-on" size={24} color={colors.primary} style={styles.infoIcon} />
                    <Text style={[styles.infoText, { color: colors.text }]}>
                      {placeDetails?.formatted_address || place.vicinity}
                    </Text>
                  </View>
                </View>
              )}

              {/* Opening Hours */}
              {formatOpeningHours()}

              {/* Reviews */}
              {renderReviews()}

              {/* Place Types */}
              {place.types && place.types.length > 0 && (
                <View style={styles.typesContainer}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Categories</Text>
                  <View style={styles.typeTagsContainer}>
                    {place.types.map((type, index) => (
                      <View 
                        key={index} 
                        style={[styles.typeTag, { backgroundColor: colors.cardBackground || colors.background, borderColor: colors.border }]}
                      >
                        <Text style={[styles.typeTagText, { color: colors.text }]}>
                          {type.replace(/_/g, ' ')}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Bottom padding */}
              <View style={styles.bottomPadding} />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  placeHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  placeHeaderTextContainer: {
    flex: 1,
  },
  placeName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  placeVicinity: {
    fontSize: 14,
    opacity: 0.8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  starIcon: {
    marginRight: 2,
  },
  ratingCount: {
    fontSize: 14,
  },
  photoGalleryContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoGalleryImage: {
    width: width - 32, // Account for padding
    height: 200,
  },
  photoIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
  },
  photoIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  quickActionButton: {
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 8,
    minWidth: 80,
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  infoSection: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  openingHoursContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  openingHoursText: {
    fontSize: 14,
    marginBottom: 4,
  },
  reviewsContainer: {
    marginBottom: 20,
  },
  reviewItem: {
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewAuthor: {
    fontWeight: '500',
    fontSize: 14,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginRight: 4,
    fontWeight: '500',
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
  },
  typesContainer: {
    marginBottom: 20,
  },
  typeTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  typeTag: {
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  typeTagText: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  bottomPadding: {
    height: 40,
  },
});