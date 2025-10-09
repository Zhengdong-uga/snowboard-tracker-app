import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, SnowboardSession, LocationPoint, MapRegion } from '../types';
import { SessionStorageService } from '../services';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type SessionDetailsRouteProp = RouteProp<RootStackParamList, 'SessionDetails'>;

const { width } = Dimensions.get('window');

const SessionDetailsScreen: React.FC = () => {
  const route = useRoute<SessionDetailsRouteProp>();
  const { sessionId } = route.params;
  const [session, setSession] = useState<SnowboardSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const loadedSession = await SessionStorageService.getSessionById(sessionId);
      if (loadedSession) {
        setSession(loadedSession);
      } else {
        Alert.alert('Error', 'Session not found');
      }
    } catch (error) {
      console.error('Error loading session:', error);
      Alert.alert('Error', 'Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  const getMapRegion = (route: LocationPoint[]): MapRegion => {
    if (route.length === 0) {
      return {
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
    }

    const lats = route.map(point => point.latitude);
    const lngs = route.map(point => point.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const deltaLat = (maxLat - minLat) * 1.2; // Add 20% padding
    const deltaLng = (maxLng - minLng) * 1.2;

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.max(deltaLat, 0.01),
      longitudeDelta: Math.max(deltaLng, 0.01),
    };
  };

  const getSpeedBasedColor = (speed: number, maxSpeed: number): string => {
    if (maxSpeed === 0) return '#007AFF';
    
    const ratio = speed / maxSpeed;
    
    // Create heat map colors: blue (slow) -> green (medium) -> yellow -> red (fast)
    if (ratio < 0.25) {
      return '#0066FF'; // Blue
    } else if (ratio < 0.5) {
      return '#00FF66'; // Green
    } else if (ratio < 0.75) {
      return '#FFFF00'; // Yellow
    } else {
      return '#FF0000'; // Red
    }
  };

  const formatDuration = (seconds: number | undefined): string => {
    if (seconds === undefined || seconds === null || isNaN(seconds)) {
      return '0s';
    }
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

  const formatSpeed = (mps: number | undefined): string => {
    if (mps === undefined || mps === null || isNaN(mps)) {
      return '0.0 km/h';
    }
    return `${(mps * 3.6).toFixed(1)} km/h`;
  };

  const formatElevation = (meters: number | undefined): string => {
    if (meters === undefined || meters === null || isNaN(meters)) {
      return '0 m';
    }
    return `${meters.toFixed(0)} m`;
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const createHeatMapSegments = (route: LocationPoint[], maxSpeed: number) => {
    const segments = [];
    
    for (let i = 1; i < route.length; i++) {
      const start = route[i - 1];
      const end = route[i];
      const speed = (start.speed || 0 + end.speed || 0) / 2; // Average speed for segment
      
      segments.push({
        coordinates: [
          { latitude: start.latitude, longitude: start.longitude },
          { latitude: end.latitude, longitude: end.longitude },
        ],
        strokeColor: getSpeedBasedColor(speed, maxSpeed),
        strokeWidth: 6,
      });
    }
    
    return segments;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Loading session...</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Session not found</Text>
      </View>
    );
  }

  const mapRegion = getMapRegion(session.route);
  const heatMapSegments = createHeatMapSegments(session.route, session.maxSpeed || 0);

  return (
    <ScrollView style={styles.container}>
      {/* Route Visualization Placeholder */}
      <LinearGradient
        colors={['#1e3c72', '#2a5298']}
        style={styles.mapContainer}
      >
        <View style={styles.routeInfo}>
          <Ionicons name="map" size={48} color="white" />
          <Text style={styles.routeTitle}>Route Tracked</Text>
          <Text style={styles.routeSubtitle}>
            {session.route?.length || 0} GPS points recorded
          </Text>
          <TouchableOpacity style={styles.viewMapButton}>
            <Ionicons name="location" size={16} color="#007AFF" />
            <Text style={styles.viewMapButtonText}>View Full Map (Coming Soon)</Text>
          </TouchableOpacity>
        </View>
        
        {/* Speed legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Speed Analysis</Text>
          <View style={styles.speedStats}>
            <View style={styles.speedStat}>
              <Text style={styles.speedValue}>{formatSpeed(session.maxSpeed)}</Text>
              <Text style={styles.speedLabel}>Max Speed</Text>
            </View>
            <View style={styles.speedStat}>
              <Text style={styles.speedValue}>{formatSpeed(session.averageSpeed)}</Text>
              <Text style={styles.speedLabel}>Avg Speed</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Session Info */}
      <View style={styles.infoSection}>
        <Text style={styles.dateText}>{formatDate(session.date)}</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="location" size={24} color="#007AFF" />
            <Text style={styles.statValue}>{formatDistance(session.distance)}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color="#007AFF" />
            <Text style={styles.statValue}>{formatDuration(session.duration)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="speedometer" size={24} color="#FF6B35" />
            <Text style={styles.statValue}>{formatSpeed(session.maxSpeed)}</Text>
            <Text style={styles.statLabel}>Top Speed</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={24} color="#007AFF" />
            <Text style={styles.statValue}>{formatSpeed(session.averageSpeed)}</Text>
            <Text style={styles.statLabel}>Avg Speed</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="snow" size={24} color="#00D4AA" />
            <Text style={styles.statValue}>{session.numberOfRuns || 0}</Text>
            <Text style={styles.statLabel}>Runs</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={24} color="#9C27B0" />
            <Text style={styles.statValue}>{formatElevation(session.vertical)}</Text>
            <Text style={styles.statLabel}>Vertical</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="mountain" size={24} color="#4CAF50" />
            <Text style={styles.statValue}>{formatElevation(session.maxAltitude)}</Text>
            <Text style={styles.statLabel}>Max Altitude</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="arrow-up" size={24} color="#4CAF50" />
            <Text style={styles.statValue}>{formatElevation(session.elevationGain)}</Text>
            <Text style={styles.statLabel}>Elevation ↑</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  errorText: {
    color: '#F44336',
    fontSize: 18,
  },
  mapContainer: {
    height: 300,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  routeTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  routeSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    marginBottom: 15,
  },
  viewMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewMapButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  legend: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 12,
  },
  legendTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  speedStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  speedStat: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  speedValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  speedLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  infoSection: {
    padding: 20,
  },
  dateText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: (width - 60) / 2,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default SessionDetailsScreen;