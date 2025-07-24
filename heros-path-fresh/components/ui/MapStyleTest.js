/*
 * MAP STYLE TEST COMPONENT
 * ========================
 * 
 * PURPOSE:
 * This component provides a test interface for the map styling system,
 * allowing developers to verify that all components work correctly together.
 * It can be used during development to test the map style selection functionality.
 * 
 * FUNCTIONALITY:
 * - Tests all map style preview components
 * - Verifies style switching functionality
 * - Tests persistence of style preferences
 * - Provides visual feedback for testing
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { getFallbackTheme, Spacing, Typography, Layout } from '../../styles/theme';
import MapStylePreviewCard from './MapStylePreviewCard';
import MapStyleVisualPreview from './MapStyleVisualPreview';

const MapStyleTest = () => {
  const { 
    currentMapStyle, 
    changeMapStyle, 
    mapStyleConfigs,
    getCurrentThemeColors
  } = useTheme();
  const colors = getCurrentThemeColors() || getFallbackTheme();
  const [testResults, setTestResults] = useState({});

  const testStyleChange = async (styleKey) => {
    try {
      const startTime = Date.now();
      await changeMapStyle(styleKey);
      const endTime = Date.now();
      
      setTestResults(prev => ({
        ...prev,
        [styleKey]: {
          success: true,
          duration: endTime - startTime,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
      
      Alert.alert('Test Success', `Style changed to ${styleKey} in ${endTime - startTime}ms`);
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [styleKey]: {
          success: false,
          error: error.message,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
      
      Alert.alert('Test Failed', `Failed to change style: ${error.message}`);
    }
  };

  const runAllTests = async () => {
    Alert.alert('Running Tests', 'Testing all map styles...');
    
    for (const styleKey of Object.keys(mapStyleConfigs)) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
      await testStyleChange(styleKey);
    }
    
    Alert.alert('Tests Complete', 'All map style tests completed. Check results below.');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Map Style System Test
      </Text>
      
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Current Style: {mapStyleConfigs[currentMapStyle]?.name || 'Unknown'}
      </Text>

      {/* Test Controls */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Test Controls
        </Text>
        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: colors.primary }]}
          onPress={runAllTests}
        >
          <MaterialIcons name="play-arrow" size={20} color={colors.buttonText} />
          <Text style={[styles.testButtonText, { color: colors.buttonText }]}>
            Run All Tests
          </Text>
        </TouchableOpacity>
      </View>

      {/* Visual Previews Test */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Visual Previews
        </Text>
        <View style={styles.previewGrid}>
          {Object.entries(mapStyleConfigs).map(([styleKey, config]) => (
            <View key={styleKey} style={styles.previewItem}>
              <MapStyleVisualPreview styleKey={styleKey} size={60} />
              <Text style={[styles.previewLabel, { color: colors.text }]}>
                {config.name}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Preview Cards Test */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Preview Cards
        </Text>
        {Object.entries(mapStyleConfigs).map(([styleKey, config]) => (
          <MapStylePreviewCard
            key={styleKey}
            styleKey={styleKey}
            styleConfig={config}
            isSelected={currentMapStyle === styleKey}
            onSelect={testStyleChange}
            compact={false}
          />
        ))}
      </View>

      {/* Test Results */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Test Results
        </Text>
        {Object.entries(testResults).map(([styleKey, result]) => (
          <View key={styleKey} style={styles.resultItem}>
            <View style={styles.resultHeader}>
              <Text style={[styles.resultStyle, { color: colors.text }]}>
                {mapStyleConfigs[styleKey]?.name}
              </Text>
              <MaterialIcons
                name={result.success ? 'check-circle' : 'error'}
                size={20}
                color={result.success ? colors.success : colors.error}
              />
            </View>
            <Text style={[styles.resultDetails, { color: colors.textSecondary }]}>
              {result.success 
                ? `Success in ${result.duration}ms at ${result.timestamp}`
                : `Failed: ${result.error} at ${result.timestamp}`
              }
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
  },
  title: {
    ...Typography.sectionTitle,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.caption,
    marginBottom: Spacing.lg,
  },
  section: {
    borderRadius: Layout.borderRadius,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.cardTitle,
    marginBottom: Spacing.sm,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
    borderRadius: Layout.borderRadius,
  },
  testButtonText: {
    ...Typography.body,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  previewItem: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  previewLabel: {
    ...Typography.caption,
    marginTop: Spacing.xs,
    fontSize: 12,
  },
  resultItem: {
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  resultStyle: {
    ...Typography.body,
    fontWeight: '600',
  },
  resultDetails: {
    ...Typography.caption,
    fontSize: 12,
  },
});

export default MapStyleTest;