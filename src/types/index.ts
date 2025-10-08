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
  route: LocationPoint[];
  status: 'completed' | 'active' | 'paused';
}

export interface LiveStats {
  distance: number;
  duration: number;
  currentSpeed: number;
  averageSpeed: number;
  elevationGain: number;
  elevationLoss: number;
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
  Snowboarding: undefined;
  Profile: undefined;
};
