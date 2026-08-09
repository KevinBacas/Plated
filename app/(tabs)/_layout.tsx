import { Tabs } from 'expo-router';
import React from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0d6e63',
        tabBarInactiveTintColor: '#75808a',
        headerShown: false,
        tabBarStyle: { borderTopColor: '#e4e9ed', height: 84, paddingTop: 8 },
        tabBarLabelStyle: { fontWeight: '700', fontSize: 12 },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Collection',
          tabBarIcon: ({ color }) => <MaterialIcons size={24} name="directions-car-filled" color={color} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color }) => <MaterialIcons size={24} name="history" color={color} />,
        }}
      />
    </Tabs>
  );
}
