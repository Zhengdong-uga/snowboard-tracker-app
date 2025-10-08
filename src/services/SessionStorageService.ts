import AsyncStorage from '@react-native-async-storage/async-storage';
import { SnowboardSession } from '../types';

const SESSIONS_KEY = '@snowboard_sessions';

export class SessionStorageService {
  static async saveSessions(sessions: SnowboardSession[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(sessions, (key, value) => {
        if (key === 'date' && value instanceof Date) {
          return value.toISOString();
        }
        return value;
      });
      await AsyncStorage.setItem(SESSIONS_KEY, jsonValue);
    } catch (error) {
      console.error('Error saving sessions:', error);
      throw error;
    }
  }

  static async loadSessions(): Promise<SnowboardSession[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(SESSIONS_KEY);
      if (jsonValue != null) {
        const sessions = JSON.parse(jsonValue, (key, value) => {
          if (key === 'date' && typeof value === 'string') {
            return new Date(value);
          }
          return value;
        });
        return sessions;
      }
      return [];
    } catch (error) {
      console.error('Error loading sessions:', error);
      return [];
    }
  }

  static async saveSession(session: SnowboardSession): Promise<void> {
    try {
      const sessions = await this.loadSessions();
      const existingIndex = sessions.findIndex(s => s.id === session.id);
      
      if (existingIndex !== -1) {
        sessions[existingIndex] = session;
      } else {
        sessions.push(session);
      }
      
      await this.saveSessions(sessions);
    } catch (error) {
      console.error('Error saving session:', error);
      throw error;
    }
  }

  static async getSessionById(id: string): Promise<SnowboardSession | null> {
    try {
      const sessions = await this.loadSessions();
      return sessions.find(session => session.id === id) || null;
    } catch (error) {
      console.error('Error getting session by ID:', error);
      return null;
    }
  }

  static async deleteSession(id: string): Promise<void> {
    try {
      const sessions = await this.loadSessions();
      const filteredSessions = sessions.filter(session => session.id !== id);
      await this.saveSessions(filteredSessions);
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }
}