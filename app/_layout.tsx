import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { PwaUpdateBanner } from '@/components/pwa-update-banner';
import { ThemeProvider, useAppTheme } from '@/components/theme-provider';
import { ObservationsProvider } from '@/context/observations';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { colorScheme } = useAppTheme();

  useEffect(() => {
    if (process.env.EXPO_OS === 'android') {
      NavigationBar.setStyle(colorScheme);
    }
  }, [colorScheme]);

  return (
    <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ObservationsProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="target/[targetId]" options={{ headerShown: false }} />
        </Stack>
        <PwaUpdateBanner />
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </ObservationsProvider>
    </NavigationThemeProvider>
  );
}
