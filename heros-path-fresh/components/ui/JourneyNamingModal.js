import React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

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
 */
export default function JourneyNamingModal({
  visible,
  journeyName,
  setJourneyName,
  onSave,
  onCancel,
  colors,
  originalDefaultName
}) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.modalBackground }]}> 
          <Text style={[styles.modalTitle, { color: colors.text }]}>Name Your Journey</Text>
          <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Give your walk a memorable name</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.inputText
              }
            ]}
            value={journeyName}
            onChangeText={setJourneyName}
            placeholder={originalDefaultName || 'Enter journey name'}
            placeholderTextColor={colors.placeholder}
            autoFocus={true}
          />
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
              onPress={onCancel}
            >
              <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.buttonPrimary }]}
              onPress={onSave}
            >
              <Text style={[styles.modalButtonText, { color: colors.buttonText }]}>Save</Text>
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
    // Shadows can be added here if needed
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
    // Add shadow or elevation if needed
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 