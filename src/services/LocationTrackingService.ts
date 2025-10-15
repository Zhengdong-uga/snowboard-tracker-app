import * as Location from 'expo-location';
import { LocationPoint, LiveStats, Run } from '../types';

export class LocationTrackingService {
  private watchId: Location.LocationSubscription | null = null;
  private route: LocationPoint[] = [];
  private runs: Run[] = [];
  private startTime: number = 0;
  private onStatsUpdate: ((stats: LiveStats) => void) | null = null;
  private isTracking: boolean = false;
  private currentRunStartIndex: number = -1;
  private isGoingDownhill: boolean = false;
  private maxSpeedReached: number = 0;

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
      this.runs = [];
      this.startTime = Date.now();
      this.onStatsUpdate = onStatsUpdate;
      this.isTracking = true;
      this.currentRunStartIndex = -1;
      this.isGoingDownhill = false;
      this.maxSpeedReached = 0;

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

    // Finish any ongoing run
    this.finishCurrentRun();

    this.isTracking = false;
    this.onStatsUpdate = null;

    const finalRoute = [...this.route];
    this.route = [];
    this.runs = [];
    this.maxSpeedReached = 0;
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

    // Update max speed
    if (point.speed && point.speed > this.maxSpeedReached) {
      this.maxSpeedReached = point.speed;
    }

    // Detect runs (downhill segments)
    this.detectRuns(point);

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
        maxSpeed: 0,
        elevationGain: 0,
        elevationLoss: 0,
        vertical: 0,
        numberOfRuns: 0,
        currentAltitude: 0,
        maxAltitude: 0,
        minAltitude: 0,
      };
    }

    const currentTime = Date.now();
    const duration = Math.floor((currentTime - this.startTime) / 1000);
    const distance = this.calculateTotalDistance();
    const currentSpeed = this.getCurrentSpeed();
    const averageSpeed = duration > 0 ? distance / duration : 0;
    const { elevationGain, elevationLoss } = this.calculateElevationChange();
    const { currentAltitude, maxAltitude, minAltitude } = this.calculateAltitudeStats();
    const vertical = elevationGain + elevationLoss;

    return {
      distance,
      duration,
      currentSpeed,
      averageSpeed,
      maxSpeed: this.maxSpeedReached,
      elevationGain,
      elevationLoss,
      vertical,
      numberOfRuns: this.runs.length,
      currentAltitude,
      maxAltitude,
      minAltitude,
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

  private calculateAltitudeStats(): { currentAltitude: number; maxAltitude: number; minAltitude: number } {
    if (this.route.length === 0) {
      return { currentAltitude: 0, maxAltitude: 0, minAltitude: 0 };
    }

    const altitudes = this.route
      .map(point => point.altitude)
      .filter((alt): alt is number => alt !== undefined);

    if (altitudes.length === 0) {
      return { currentAltitude: 0, maxAltitude: 0, minAltitude: 0 };
    }

    const currentPoint = this.route[this.route.length - 1];
    const currentAltitude = currentPoint.altitude || 0;
    const maxAltitude = Math.max(...altitudes);
    const minAltitude = Math.min(...altitudes);

    return { currentAltitude, maxAltitude, minAltitude };
  }

  private detectRuns(currentPoint: LocationPoint): void {
    if (this.route.length < 3 || currentPoint.altitude === undefined) return;

    const previousPoint = this.route[this.route.length - 2];
    if (previousPoint.altitude === undefined) return;

    const elevationChange = currentPoint.altitude - previousPoint.altitude;
    const isCurrentlyGoingDownhill = elevationChange < -2; // At least 2m drop to be considered downhill
    const isCurrentlyGoingUphill = elevationChange > 5; // At least 5m gain to end a run

    // Start a new run if going downhill and not already in a run
    if (isCurrentlyGoingDownhill && !this.isGoingDownhill) {
      this.startNewRun();
      this.isGoingDownhill = true;
    }
    // End current run if going uphill significantly or stopped moving downhill for a while
    else if (this.isGoingDownhill && (isCurrentlyGoingUphill || this.shouldEndCurrentRun())) {
      this.finishCurrentRun();
      this.isGoingDownhill = false;
    }
  }

  private startNewRun(): void {
    this.currentRunStartIndex = this.route.length - 1;
  }

  private shouldEndCurrentRun(): boolean {
    if (this.currentRunStartIndex === -1) return false;
    
    // End run if we've been going uphill or flat for more than 30 seconds
    const runDuration = this.route.length - this.currentRunStartIndex;
    return runDuration > 30; // Assuming 1 point per second
  }

  private finishCurrentRun(): void {
    if (this.currentRunStartIndex === -1 || this.route.length === 0) return;

    const startPoint = this.route[this.currentRunStartIndex];
    const endPoint = this.route[this.route.length - 1];

    if (startPoint.altitude === undefined || endPoint.altitude === undefined) return;

    const runPoints = this.route.slice(this.currentRunStartIndex);
    const verticalDrop = startPoint.altitude - endPoint.altitude;

    // Only count as a run if there's significant vertical drop (at least 10m)
    if (verticalDrop > 10) {
      const runDistance = this.calculateRunDistance(runPoints);
      const maxRunSpeed = this.getMaxSpeedInRun(runPoints);
      const avgRunSpeed = this.getAverageSpeedInRun(runPoints);

      const run: Run = {
        startTime: startPoint.timestamp,
        endTime: endPoint.timestamp,
        startAltitude: startPoint.altitude,
        endAltitude: endPoint.altitude,
        verticalDrop,
        maxSpeed: maxRunSpeed,
        avgSpeed: avgRunSpeed,
        distance: runDistance,
      };

      this.runs.push(run);
    }

    this.currentRunStartIndex = -1;
  }

  private calculateRunDistance(runPoints: LocationPoint[]): number {
    let distance = 0;
    for (let i = 1; i < runPoints.length; i++) {
      distance += this.calculateDistance(runPoints[i - 1], runPoints[i]);
    }
    return distance;
  }

  private getMaxSpeedInRun(runPoints: LocationPoint[]): number {
    return Math.max(...runPoints.map(point => point.speed || 0));
  }

  private getAverageSpeedInRun(runPoints: LocationPoint[]): number {
    const speeds = runPoints.map(point => point.speed || 0).filter(speed => speed > 0);
    return speeds.length > 0 ? speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length : 0;
  }

  getRuns(): Run[] {
    return [...this.runs];
  }
}
