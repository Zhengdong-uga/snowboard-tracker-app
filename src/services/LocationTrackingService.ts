import * as Location from 'expo-location';
import { LocationPoint, LiveStats } from '../types';

export class LocationTrackingService {
  private watchId: Location.LocationSubscription | null = null;
  private route: LocationPoint[] = [];
  private startTime: number = 0;
  private onStatsUpdate: ((stats: LiveStats) => void) | null = null;
  private isTracking: boolean = false;

  async requestPermissions(): Promise<boolean> {
    try {
      // First check if we already have permission
      let { status } = await Location.getForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('Requesting foreground location permissions...');
        const result = await Location.requestForegroundPermissionsAsync();
        status = result.status;
      }
      
      if (status !== 'granted') {
        console.error('Location permission not granted:', status);
        return false;
      }

      console.log('Foreground location permission granted');
      
      // Try to request background permission but don't fail if it's not granted
      try {
        const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus.status === 'granted') {
          console.log('Background location permission granted');
        } else {
          console.warn('Background location permission not granted, but app will still work');
        }
      } catch (bgError) {
        console.warn('Background permission request failed, continuing with foreground only:', bgError);
      }

      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  async startTracking(onStatsUpdate: (stats: LiveStats) => void): Promise<boolean> {
    if (this.isTracking) {
      console.warn('Tracking already started');
      return true;
    }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      return false;
    }

    try {
      this.route = [];
      this.startTime = Date.now();
      this.onStatsUpdate = onStatsUpdate;
      this.isTracking = true;

      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000, // Update every second
          distanceInterval: 1, // Update every meter
        },
        (location) => {
          this.handleLocationUpdate(location);
        }
      );

      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      this.isTracking = false;
      return false;
    }
  }

  async stopTracking(): Promise<LocationPoint[]> {
    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
    }

    this.isTracking = false;
    this.onStatsUpdate = null;

    const finalRoute = [...this.route];
    this.route = [];
    return finalRoute;
  }

  private handleLocationUpdate(location: Location.LocationObject): void {
    const point: LocationPoint = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      altitude: location.coords.altitude || undefined,
      timestamp: location.timestamp,
      speed: location.coords.speed || undefined,
    };

    this.route.push(point);

    if (this.onStatsUpdate) {
      const stats = this.calculateLiveStats();
      this.onStatsUpdate(stats);
    }
  }

  private calculateLiveStats(): LiveStats {
    if (this.route.length === 0) {
      return {
        distance: 0,
        duration: 0,
        currentSpeed: 0,
        averageSpeed: 0,
        elevationGain: 0,
        elevationLoss: 0,
      };
    }

    const currentTime = Date.now();
    const duration = Math.floor((currentTime - this.startTime) / 1000);
    const distance = this.calculateTotalDistance();
    const currentSpeed = this.getCurrentSpeed();
    const averageSpeed = duration > 0 ? distance / duration : 0;
    const { elevationGain, elevationLoss } = this.calculateElevationChange();

    return {
      distance,
      duration,
      currentSpeed,
      averageSpeed,
      elevationGain,
      elevationLoss,
    };
  }

  private calculateTotalDistance(): number {
    let totalDistance = 0;

    for (let i = 1; i < this.route.length; i++) {
      const prev = this.route[i - 1];
      const curr = this.route[i];
      totalDistance += this.calculateDistance(prev, curr);
    }

    return totalDistance;
  }

  private calculateDistance(point1: LocationPoint, point2: LocationPoint): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (point1.latitude * Math.PI) / 180;
    const φ2 = (point2.latitude * Math.PI) / 180;
    const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private getCurrentSpeed(): number {
    if (this.route.length === 0) return 0;
    const lastPoint = this.route[this.route.length - 1];
    return lastPoint.speed || 0;
  }

  private calculateElevationChange(): { elevationGain: number; elevationLoss: number } {
    let elevationGain = 0;
    let elevationLoss = 0;

    for (let i = 1; i < this.route.length; i++) {
      const prev = this.route[i - 1];
      const curr = this.route[i];

      if (prev.altitude !== undefined && curr.altitude !== undefined) {
        const diff = curr.altitude - prev.altitude;
        if (diff > 0) {
          elevationGain += diff;
        } else {
          elevationLoss += Math.abs(diff);
        }
      }
    }

    return { elevationGain, elevationLoss };
  }

  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  getCurrentRoute(): LocationPoint[] {
    return [...this.route];
  }
}