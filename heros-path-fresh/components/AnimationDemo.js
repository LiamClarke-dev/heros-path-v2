// components/AnimationDemo.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import PingAnimation from './PingAnimation';

const AnimationDemo = () => {
  const [activeAnimation, setActiveAnimation] = useState(null);
  const [selectedType, setSelectedType] = useState('ripple');

  const animationTypes = [
    { key: 'ripple', name: 'Ripple Effect', description: 'Expanding circles with rotation' },
    { key: 'pulse', name: 'Pulse Wave', description: 'Simple expanding pulse' },
    { key: 'radar', name: 'Radar Sweep', description: 'Rotating radar-like sweep' },
    { key: 'particles', name: 'Particle Burst', description: 'Particles exploding outward' },
  ];

  const triggerAnimation = (type) => {
    setSelectedType(type);
    setActiveAnimation(type);
    
    // Auto-hide after animation completes
    setTimeout(() => {
      setActiveAnimation(null);
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ping Animation Options</Text>
      <Text style={styles.subtitle}>Tap to preview each animation style</Text>
      
      <View style={styles.animationContainer}>
        <PingAnimation
          isVisible={!!activeAnimation}
          animationType={selectedType}
          onAnimationComplete={() => setActiveAnimation(null)}
          style={styles.animation}
        />
      </View>

      <View style={styles.buttonContainer}>
        {animationTypes.map((type) => (
          <TouchableOpacity
            key={type.key}
            style={[
              styles.button,
              selectedType === type.key && styles.buttonActive
            ]}
            onPress={() => triggerAnimation(type.key)}
          >
            <Text style={[
              styles.buttonText,
              selectedType === type.key && styles.buttonTextActive
            ]}>
              {type.name}
            </Text>
            <Text style={styles.buttonDescription}>
              {type.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Selected: {animationTypes.find(t => t.key === selectedType)?.name}</Text>
        <Text style={styles.infoText}>
          This animation will play from the Link sprite's location when you tap the ping button.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  animationContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  animation: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -50,
    marginTop: -50,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonActive: {
    borderColor: '#4A90E2',
    backgroundColor: '#f0f8ff',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  buttonTextActive: {
    color: '#4A90E2',
  },
  buttonDescription: {
    fontSize: 14,
    color: '#666',
  },
  infoContainer: {
    marginTop: 30,
    padding: 16,
    backgroundColor: '#e8f4fd',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});

export default AnimationDemo; 