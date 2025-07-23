import React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import Logger from '../../utils/Logger';

/**
 * JourneyNamingModal
 * Props:
 * - visible: boolean
 * - journeyName: string
 * - setJourneyName: function
 * - onSave: function
 * - onCancel: function
 * - colors: object (theme colors)
 * - originalDefaultName: string (for placeholder)
 * - isSaving: boolean (optional) - indicates if the journey is currently being saved
 */
export default function JourneyNamingModal({
  visible,
  journeyName,
  setJourneyName,
  onSave,
  onCancel,
  colors,
  originalDefaultName,
  isSaving = false
}) {
  // Add a wrapper function to handle the save button press
  const handleSave = () => {
    if (isSaving) return; // Prevent multiple saves if already saving
    
    Logger.debug('JourneyNamingModal: Save button pressed');
    try {
      if (typeof onSave === 'function') {
        onSave();
      } else {
        Logger.error('JourneyNamingModal: onSave is not a function', { onSaveType: typeof onSave });
        Alert.alert('Error', 'Could not save journey due to a technical issue. Please try again.');
      }
    } catch (error) {
      Logger.error('JourneyNamingModal: Error in handleSave', error);
      Alert.alert('Error', 'An error occurred while saving your journey. Please try again.');
    }
  };

  // Add a wrapper function to handle the cancel button press
  const handleCancel = () => {
    if (isSaving) return; // Prevent cancellation if saving
    
    Logger.debug('JourneyNamingModal: Cancel button pressed');
    try {
      if (typeof onCancel === 'function') {
        onCancel();
      } else {
        Logger.error('JourneyNamingModal: onCancel is not a function', { onCancelType: typeof onCancel });
        Alert.alert('Error', 'Could not cancel due to a technical issue. Please try again.');
      }
    } catch (error) {
      Logger.error('JourneyNamingModal: Error in handleCancel', error);
      Alert.alert('Error', 'An error occurred while canceling. Please try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.modalBackground || colors.cardBackground }]}> 
          <Text style={[styles.modalTitle, { color: colors.text }]}>Name Your Journey</Text>
          <Text style={[styles.modalSubtitle, { color: colors.textSecondary || colors.text }]}>Give your walk a memorable name</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBackground || colors.background,
                borderColor: colors.inputBorder || colors.border,
                color: colors.inputText || colors.text
              }
            ]}
            value={journeyName}
            onChangeText={setJourneyName}
            placeholder={originalDefaultName || 'Enter journey name'}
            placeholderTextColor={colors.placeholder || '#999'}
            autoFocus={true}
            editable={!isSaving} // Disable input while saving
          />
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={[
                styles.modalButton, 
                styles.cancelButton, 
                { borderColor: colors.border },
                isSaving && styles.disabledButton
              ]}
              onPress={handleCancel}
              disabled={isSaving} // Disable button while saving
            >
              <Text style={[
                styles.modalButtonText, 
                { color: colors.text },
                isSaving && styles.disabledButtonText
              ]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton, 
                styles.saveButton, 
                { backgroundColor: isSaving ? colors.buttonDisabled : colors.buttonPrimary }
              ]}
              onPress={handleSave}
              disabled={isSaving} // Disable button while saving
            >
              {isSaving ? (
                <View style={styles.savingContainer}>
                  <ActivityIndicator size="small" color={colors.buttonText} />
                  <Text style={[styles.modalButtonText, { color: colors.buttonText, marginLeft: 8 }]}>Saving...</Text>
                </View>
              ) : (
                <Text style={[styles.modalButtonText, { color: colors.buttonText }]}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '80%',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
    fontSize: 16,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    opacity: 0.7,
  },
  savingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});