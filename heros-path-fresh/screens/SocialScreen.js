import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SectionHeader from '../components/ui/SectionHeader';

export default function SocialScreen() {
  return (
    <View style={styles.container}>
      <SectionHeader title="Social" />
      <Text>Social</Text>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, alignItems: 'center', justifyContent: 'center' } });
