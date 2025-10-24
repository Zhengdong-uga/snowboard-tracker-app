import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { MainTabParamList } from '../types';
import SnowboardingScreen from '../screens/SnowboardingScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import GearsScreen from '../screens/GearsScreen';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet } from 'react-native';

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      id={undefined}
      initialRouteName="Snowboarding"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Statistics') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Snowboarding') {
            iconName = focused ? 'snow' : 'snow-outline';
          } else if (route.name === 'Gears') {
            iconName = focused ? 'construct' : 'construct-outline';
          } else {
            iconName = 'ellipse';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        ),
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Statistics"
        component={StatisticsScreen}
        options={{ title: 'Statistics' }}
      />
      <Tab.Screen
        name="Snowboarding"
        component={SnowboardingScreen}
        options={{ title: 'Snowboarding' }}
      />
      <Tab.Screen
        name="Gears"
        component={GearsScreen}
        options={{ title: 'Gears' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    height: 70,
    borderRadius: 28,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
  },
});

export default MainTabNavigator;
