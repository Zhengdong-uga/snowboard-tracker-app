import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const StatisticsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Statistics</Text>
        <Text style={styles.subtitle}>Progress and insights (coming soon)</Text>
      </View>

      <View style={styles.cards}>
        <View style={styles.card}>
          <Ionicons name="trophy" size={36} color="#FFD700" />
          <Text style={styles.cardTitle}>Levels</Text>
          <Text style={styles.cardText}>Track milestones like Nike Run levels.</Text>
        </View>
        <View style={styles.card}>
          <Ionicons name="bar-chart" size={36} color="#4CAF50" />
          <Text style={styles.cardTitle}>Weekly Summary</Text>
          <Text style={styles.cardText}>Distance, time, vertical, runs.</Text>
        </View>
      </View>

      <TouchableOpacity activeOpacity={0.9} style={styles.feedback}>
        <Ionicons name="chatbubbles" size={18} color="#7FFFD4" />
        <Text style={styles.feedbackText}>Fuel Our Ideas</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { padding: 24, paddingTop: 30 },
  title: { color: '#fff', fontSize: 34, fontWeight: '800' },
  subtitle: { color: '#9aa0a6', marginTop: 6 },
  cards: { paddingHorizontal: 20, gap: 14 },
  card: {
    backgroundColor: '#101010',
    borderColor: '#222',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 8 },
  cardText: { color: '#9aa0a6', marginTop: 4 },
  feedback: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 110,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  feedbackText: { color: '#7FFFD4', fontWeight: '700' },
});

export default StatisticsScreen;
