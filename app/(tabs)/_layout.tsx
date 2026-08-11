import { Tabs } from 'expo-router';
import React from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useAppTheme } from '@/components/theme-provider';

export default function TabLayout() {
  const { colorScheme, colors } = useAppTheme();

  return (
    <Tabs
      key={colorScheme}
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.subduedText,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 84,
          paddingTop: 8,
        },
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
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Options',
          tabBarIcon: ({ color }) => <MaterialIcons size={24} name="settings" color={color} />,
        }}
      />
    </Tabs>
  );
}
