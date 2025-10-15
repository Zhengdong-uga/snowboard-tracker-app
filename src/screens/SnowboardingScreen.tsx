import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { NativeModulesProxy } from 'expo-modules-core';
import { RootStackParamList, SnowboardSession } from '../types';
import { SessionStorageService } from '../services';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

const SnowboardingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [region, setRegion] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [AppleMapsMod, setAppleMapsMod] = useState<any>(null);
  const mapRef = useRef<any>(null);
  const locationWatcher = useRef<Location.LocationSubscription | null>(null);
  const [lastSession, setLastSession] = useState<SnowboardSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    // Only attempt to import expo-maps if the native module exists
    (async () => {
      try {
        if ((NativeModulesProxy as any)?.ExpoMaps) {
          const mod = await import('expo-maps');
          if (mod?.AppleMaps?.View) setAppleMapsMod(mod.AppleMaps);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission to access location was denied');
        } else {
          const pos = await Location.getCurrentPositionAsync({});
          setRegion({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          // follow user with periodic updates
          locationWatcher.current = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              timeInterval: 4000,
              distanceInterval: 5,
            },
            (loc) => {
              const next = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
              setRegion(next);
              if (AppleMapsMod?.View && mapRef.current?.setCameraPosition) {
                mapRef.current.setCameraPosition({ coordinates: next, zoom: 14 });
              }
            }
          );
        }
      } catch (e) {
        setError('Unable to fetch location');
      }
    })();

    return () => {
      locationWatcher.current?.remove?.();
      locationWatcher.current = null;
    };
  }, [AppleMapsMod]);

  useEffect(() => {
    (async () => {
      try {
        const all = await SessionStorageService.loadSessions();
        if (all.length > 0) {
          // newest by date
          const sorted = [...all].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setLastSession(sorted[0]);
        } else {
          setLastSession(null);
        }
      } catch {
        setLastSession(null);
      } finally {
        setLoadingSession(false);
      }
    })();
  }, []);

  const handleStartNewSession = () => {
    navigation.navigate('LiveTracking');
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds && seconds !== 0) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
  };

  const formatDistance = (meters?: number) => {
    if (meters == null) return '—';
    return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${meters.toFixed(0)} m`;
  };

  return (
    <View style={styles.container}>
      {/* Map or fallback */}
      <View style={styles.mapWrapper}>
        {AppleMapsMod?.View ? (
          <AppleMapsMod.View
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            cameraPosition={{
              coordinates: region || { latitude: 37.78825, longitude: -122.4324 },
              zoom: 14,
            }}
            markers={region ? [{ id: 'me', coordinates: region, title: 'You', tintColor: '#34d399' }] : []}
            uiSettings={{ myLocationButtonEnabled: true, compassEnabled: true }}
            properties={{ isMyLocationEnabled: true }}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.mapFallback]}>
            <Ionicons name="map" size={32} color="#888" />
            <Text style={styles.mapFallbackText}>Map preview requires a Development Build</Text>
          </View>
        )}

        {/* Top header */}
        <View style={styles.overlayHeader}>
          <Text style={styles.title}>Snowboarding</Text>
          <View style={styles.conditionsRow}>
            <View style={styles.conditionItem}>
              <Ionicons name="navigate" size={16} color="#7FFFD4" />
              <Text style={styles.conditionText}>{region ? 'GPS Ready' : 'Locating...'}</Text>
            </View>
            <View style={styles.conditionItem}>
              <Ionicons name="cloudy" size={16} color="#fff" />
              <Text style={styles.conditionText}>Cloudy</Text>
            </View>
          </View>
        </View>

        {/* Bottom controls and Start CTA (Nike Run-like) */}
        <View style={styles.bottomControls}>
          {/* Settings / Open Goal row */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.glassButton} activeOpacity={0.9}>
              <Ionicons name="settings" size={18} color="#000" />
              <Text style={[styles.glassButtonText, { color: '#000' }]}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.glassButton, styles.goalButton]} activeOpacity={0.9}>
              <Ionicons name="radio-button-on" size={18} color="#000" />
              <Text style={[styles.glassButtonText, { color: '#000' }]}>Open Goal</Text>
            </TouchableOpacity>
          </View>

          {/* Quick stat tiles */}
          <View style={styles.quickStats}>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatLabel}>Distance</Text>
              <Text style={styles.quickStatValue}>{formatDistance(lastSession?.distance)}</Text>
            </View>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatLabel}>Duration</Text>
              <Text style={styles.quickStatValue}>{formatDuration(lastSession?.duration)}</Text>
            </View>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatLabel}>Top Speed</Text>
              <Text style={styles.quickStatValue}>{((lastSession?.maxSpeed || 0) * 3.6).toFixed(1)} km/h</Text>
            </View>
          </View>

          {/* Big pill CTA like Nike Run */}
          <TouchableOpacity activeOpacity={0.9} style={styles.cta} onPress={handleStartNewSession}>
            <Text style={styles.ctaText}>LET'S DO IT</Text>
          </TouchableOpacity>

          {/* Last session card */}
          {!loadingSession && (
            <View style={styles.lastSessionCard}>
              <Ionicons name="time" size={18} color="#7FFFD4" />
              <Text style={styles.lastSessionText}>
                {lastSession
                  ? `Last: ${formatDistance(lastSession.distance)} • ${formatDuration(lastSession.duration)}`
                  : 'No previous sessions'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  mapWrapper: { flex: 1 },
  mapFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b0b0b' },
  mapFallbackText: { color: '#888', marginTop: 8, fontWeight: '600' },
  overlayHeader: { position: 'absolute', top: 60, left: 20, right: 20 },
  title: { color: '#fff', fontSize: 28, fontWeight: '800' },
  conditionsRow: { flexDirection: 'row', gap: 14, marginTop: 8 },
  conditionItem: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  conditionText: { color: '#fff', fontWeight: '600' },

  bottomControls: { position: 'absolute', left: 20, right: 20, bottom: 20 },

  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },

  quickStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  quickStat: {
    flex: 1,
    backgroundColor: '#fff',
    borderColor: 'rgba(0,0,0,0.08)',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  quickStatLabel: { color: '#444', fontWeight: '700', fontSize: 12 },
  quickStatValue: { color: '#000', fontWeight: '900', fontSize: 16, marginTop: 4 },

  glassButton: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  glassButtonText: { color: '#000', fontWeight: '800' },
  goalButton: { backgroundColor: '#C6F68D', borderColor: '#C6F68D' },

  cta: {
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0b0b0b',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  ctaText: { color: '#fff', fontWeight: '900', fontSize: 24, letterSpacing: 1 },

  lastSessionCard: {
    marginTop: 14,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  lastSessionText: { color: '#7FFFD4', fontWeight: '700' },

  errorBanner: { padding: 10, alignItems: 'center', backgroundColor: '#330000' },
  errorText: { color: '#ffaaaa' },
});

export default SnowboardingScreen;
