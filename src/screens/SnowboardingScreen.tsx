import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, SnowboardSession } from '../types';
import { SessionStorageService } from '../services';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

const SnowboardingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [sessions, setSessions] = useState<SnowboardSession[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const loadedSessions = await SessionStorageService.loadSessions();
      // Sort by date (newest first)
      const sortedSessions = loadedSessions.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setSessions(sortedSessions);
    } catch (error) {
      Alert.alert('Error', 'Failed to load sessions');
      console.error('Error loading sessions:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  };

  const handleStartNewSession = () => {
    navigation.navigate('LiveTracking');
  };

  const handleSessionPress = (sessionId: string) => {
    navigation.navigate('SessionDetails', { sessionId });
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  const formatDistance = (meters: number | undefined): string => {
    if (meters === undefined || meters === null || isNaN(meters)) {
      return '0 m';
    }
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    } else {
      return `${meters.toFixed(0)} m`;
    }
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const renderSessionItem = ({ item }: { item: SnowboardSession }) => (
    <TouchableOpacity
      style={styles.sessionItem}
      onPress={() => handleSessionPress(item.id)}
    >
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionDate}>{formatDate(item.date)}</Text>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </View>
      <View style={styles.sessionStats}>
        <View style={styles.statItem}>
          <Ionicons name="location" size={16} color="#007AFF" />
          <Text style={styles.statValue}>{formatDistance(item.distance)}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time" size={16} color="#007AFF" />
          <Text style={styles.statValue}>{formatDuration(item.duration || 0)}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="snow" size={16} color="#00D4AA" />
          <Text style={styles.statValue}>{item.numberOfRuns || 0} runs</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="trending-up" size={16} color="#9C27B0" />
          <Text style={styles.statValue}>{formatDistance(item.vertical)}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="speedometer" size={16} color="#FF6B35" />
          <Text style={styles.statValue}>
            {((item.maxSpeed || 0) * 3.6).toFixed(1)} km/h
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="snow" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No sessions yet</Text>
      <Text style={styles.emptySubtitle}>
        Start your first snowboarding session to see it here
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.startButton} onPress={handleStartNewSession}>
          <Ionicons name="play" size={24} color="white" />
          <Text style={styles.startButtonText}>Start Session</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={renderSessionItem}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={[
          styles.listContainer,
          sessions.length === 0 && styles.emptyListContainer,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  listContainer: {
    padding: 20,
    paddingTop: 10,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionDate: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sessionStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: '30%',
    marginBottom: 4,
  },
  statValue: {
    color: '#ccc',
    fontSize: 14,
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default SnowboardingScreen;