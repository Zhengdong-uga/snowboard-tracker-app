import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList, LiveStats, SnowboardSession } from '../types';
import { LocationTrackingService, SessionStorageService } from '../services';

type NavigationProp = StackNavigationProp<RootStackParamList, 'LiveTracking'>;

const LiveTrackingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [stats, setStats] = useState<LiveStats>({
    distance: 0,
    duration: 0,
    currentSpeed: 0,
    averageSpeed: 0,
    maxSpeed: 0,
    elevationGain: 0,
    elevationLoss: 0,
    vertical: 0,
    numberOfRuns: 0,
    currentAltitude: 0,
    maxAltitude: 0,
    minAltitude: 0,
  });

  const locationService = useRef(new LocationTrackingService());
  const pausedDuration = useRef(0);
  const pauseStartTime = useRef(0);

  useEffect(() => {
    startTracking();

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' && isTracking && !isPaused) {
        // App moved to background while tracking
        console.log('App moved to background during tracking');
      } else if (nextAppState === 'active' && isTracking) {
        // App came back to foreground
        console.log('App returned to foreground during tracking');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
      if (isTracking) {
        stopTracking();
      }
    };
  }, []);

  const startTracking = async () => {
    try {
      console.log('Starting location tracking...');
      const success = await locationService.current.startTracking(handleStatsUpdate);
      if (success) {
        console.log('Location tracking started successfully');
        setIsTracking(true);
        setIsPaused(false);
      } else {
        console.log('Location tracking failed - showing permission alert');
        Alert.alert(
          'Location Permission Required',
          'Please enable location permissions in your device settings to track your snowboarding session.\n\nGo to Settings > Privacy & Security > Location Services and enable location for Expo Go.',
          [
            { text: 'Cancel', onPress: () => navigation.goBack(), style: 'cancel' },
            { text: 'Try Again', onPress: startTracking }
          ]
        );
      }
    } catch (error) {
      console.error('Error starting tracking:', error);
      Alert.alert(
        'Error Starting Tracking', 
        `Failed to start location tracking: ${error.message || 'Unknown error'}`,
        [
          { text: 'Cancel', onPress: () => navigation.goBack(), style: 'cancel' },
          { text: 'Try Again', onPress: startTracking }
        ]
      );
    }
  };

  const pauseTracking = () => {
    setIsPaused(true);
    pauseStartTime.current = Date.now();
  };

  const resumeTracking = () => {
    if (isPaused) {
      pausedDuration.current += Date.now() - pauseStartTime.current;
      setIsPaused(false);
    }
  };

  const stopTracking = async () => {
    try {
      const route = await locationService.current.stopTracking();
      
      if (route.length < 2) {
        Alert.alert('Session Too Short', 'Please track for a longer duration to save the session.');
        navigation.goBack();
        return;
      }

      // Calculate final session data
      const endTime = Date.now();
      const totalDuration = Math.floor((stats.duration * 1000 - pausedDuration.current) / 1000);
      
      // Calculate max speed from route
      const maxSpeed = route.reduce((max, point) => {
        return Math.max(max, point.speed || 0);
      }, 0);

      const session: SnowboardSession = {
        id: Date.now().toString(),
        date: new Date(),
        duration: totalDuration,
        distance: stats.distance,
        maxSpeed: stats.maxSpeed,
        averageSpeed: stats.averageSpeed,
        elevationGain: stats.elevationGain,
        elevationLoss: stats.elevationLoss,
        vertical: stats.vertical,
        numberOfRuns: stats.numberOfRuns,
        maxAltitude: stats.maxAltitude,
        minAltitude: stats.minAltitude,
        currentAltitude: stats.currentAltitude,
        route,
        status: 'completed',
      };

      await SessionStorageService.saveSession(session);
      
      Alert.alert(
        'Session Saved!',
        `Great session! You covered ${formatDistance(stats.distance)} in ${formatDuration(totalDuration)}.`,
        [
          {
            text: 'View Details',
            onPress: () => {
              navigation.replace('SessionDetails', { sessionId: session.id });
            },
          },
          {
            text: 'Done',
            onPress: () => navigation.navigate('Main'),
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error saving session:', error);
      Alert.alert('Error', 'Failed to save session');
      navigation.goBack();
    }
  };

  const handleStatsUpdate = (newStats: LiveStats) => {
    if (!isPaused) {
      setStats(newStats);
    }
  };

  const handleStopPress = () => {
    Alert.alert(
      'End Session',
      'Are you sure you want to end this snowboarding session?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Session', style: 'destructive', onPress: stopTracking },
      ]
    );
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  };

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    } else {
      return `${meters.toFixed(0)} m`;
    }
  };

  const formatSpeed = (mps: number): string => {
    return `${(mps * 3.6).toFixed(1)} km/h`;
  };

  const formatElevation = (meters: number): string => {
    return `${meters.toFixed(0)} m`;
  };

  return (
    <LinearGradient
      colors={['#1a1a1a', '#000']}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, isPaused ? styles.pausedDot : styles.activeDot]} />
          <Text style={styles.statusText}>
            {isPaused ? 'PAUSED' : 'LIVE TRACKING'}
          </Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.primaryStats}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatDistance(stats.distance)}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatDuration(stats.duration)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
        </View>

        {/* Speed Stats */}
        <View style={styles.secondaryStats}>
          <Text style={styles.sectionTitle}>Speed</Text>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statTitle}>Current</Text>
              <Text style={styles.statData}>{formatSpeed(stats.currentSpeed)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statTitle}>Top Speed</Text>
              <Text style={styles.statData}>{formatSpeed(stats.maxSpeed)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statTitle}>Average</Text>
              <Text style={styles.statData}>{formatSpeed(stats.averageSpeed)}</Text>
            </View>
          </View>
        </View>

        {/* Altitude Stats */}
        <View style={styles.secondaryStats}>
          <Text style={styles.sectionTitle}>Altitude</Text>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statTitle}>Current</Text>
              <Text style={styles.statData}>{formatElevation(stats.currentAltitude)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statTitle}>Max</Text>
              <Text style={styles.statData}>{formatElevation(stats.maxAltitude)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statTitle}>Min</Text>
              <Text style={styles.statData}>{formatElevation(stats.minAltitude)}</Text>
            </View>
          </View>
        </View>

        {/* Vertical & Runs Stats */}
        <View style={styles.secondaryStats}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statTitle}>Vertical</Text>
              <Text style={styles.statData}>{formatElevation(stats.vertical)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statTitle}>Runs</Text>
              <Text style={styles.statData}>{stats.numberOfRuns}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statTitle}>Elev ↑</Text>
              <Text style={styles.statData}>{formatElevation(stats.elevationGain)}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.controls}>
        {!isPaused ? (
          <TouchableOpacity style={styles.pauseButton} onPress={pauseTracking}>
            <Ionicons name="pause" size={32} color="white" />
            <Text style={styles.buttonText}>Pause</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.resumeButton} onPress={resumeTracking}>
            <Ionicons name="play" size={32} color="white" />
            <Text style={styles.buttonText}>Resume</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.stopButton} onPress={handleStopPress}>
          <Ionicons name="stop" size={32} color="white" />
          <Text style={styles.buttonText}>Stop</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  activeDot: {
    backgroundColor: '#4CAF50',
  },
  pausedDot: {
    backgroundColor: '#FF9800',
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  statsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  primaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  statValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '500',
  },
  secondaryStats: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statTitle: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  statData: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    paddingVertical: 30,
    paddingBottom: 50,
  },
  pauseButton: {
    backgroundColor: '#FF9800',
    borderRadius: 35,
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  resumeButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 35,
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  stopButton: {
    backgroundColor: '#F44336',
    borderRadius: 35,
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});

export default LiveTrackingScreen;