import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const GearsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="construct" size={72} color="#00D4AA" />
        <Text style={styles.title}>Gears</Text>
        <Text style={styles.subtitle}>Manage boards, bindings and boots (coming soon)</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 16 },
  subtitle: { color: '#9aa0a6', fontSize: 14, textAlign: 'center', marginTop: 6 },
});

export default GearsScreen;
