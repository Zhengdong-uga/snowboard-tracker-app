export interface LocationPoint {
  latitude: number;
  longitude: number;
  altitude?: number;
  timestamp: number;
  speed?: number;
}

export interface SnowboardSession {
  id: string;
  date: Date;
  duration: number; // in seconds
  distance: number; // in meters
  maxSpeed: number; // in m/s
  averageSpeed: number; // in m/s
  elevationGain: number; // in meters
  elevationLoss: number; // in meters
  vertical: number; // total vertical distance (elevationGain + elevationLoss) in meters
  numberOfRuns: number; // number of downhill runs detected
  maxAltitude: number; // highest point reached in meters
  minAltitude: number; // lowest point reached in meters
  currentAltitude: number; // current altitude in meters
  route: LocationPoint[];
  status: 'completed' | 'active' | 'paused';
}

export interface LiveStats {
  distance: number;
  duration: number;
  currentSpeed: number;
  averageSpeed: number;
  maxSpeed: number; // top speed reached so far
  elevationGain: number;
  elevationLoss: number;
  vertical: number; // total vertical distance
  numberOfRuns: number;
  currentAltitude: number;
  maxAltitude: number;
  minAltitude: number;
}

export interface Run {
  startTime: number;
  endTime: number;
  startAltitude: number;
  endAltitude: number;
  verticalDrop: number;
  maxSpeed: number;
  avgSpeed: number;
  distance: number;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export type RootStackParamList = {
  Main: undefined;
  LiveTracking: undefined;
  SessionDetails: { sessionId: string };
};

export type MainTabParamList = {
  Statistics: undefined;
  Snowboarding: undefined;
  Gears: undefined;
};
