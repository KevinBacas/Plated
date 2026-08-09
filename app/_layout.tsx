import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { ObservationsProvider } from '@/context/observations';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <ObservationsProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="target/[targetId]" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="dark" />
    </ObservationsProvider>
  );
}
