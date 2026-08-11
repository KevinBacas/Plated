import 'expo-sqlite/localStorage/install';

import { createContext, type PropsWithChildren, use, useCallback, useEffect, useMemo, useState } from 'react';
import { Appearance, useColorScheme as useSystemColorScheme } from 'react-native';

import { AppColors, type AppColorScheme, type AppThemeColors } from '@/constants/app-theme';
import { parseThemePreference, type ThemePreference } from '@/lib/theme-preference';

export type { ThemePreference } from '@/lib/theme-preference';

const THEME_PREFERENCE_KEY = 'plated.theme-preference';

type ThemeContextValue = {
  colorScheme: AppColorScheme;
  colors: AppThemeColors;
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getStoredThemePreference(): ThemePreference {
  if (typeof globalThis.localStorage === 'undefined') return 'system';

  try {
    const storedPreference = globalThis.localStorage.getItem(THEME_PREFERENCE_KEY);
    return parseThemePreference(storedPreference);
  } catch {
    return 'system';
  }
}

function persistThemePreference(preference: ThemePreference) {
  try {
    globalThis.localStorage?.setItem(THEME_PREFERENCE_KEY, preference);
  } catch {
    // The app can still use the selected theme for the current session.
  }
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemColorScheme = useSystemColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(() => {
    return process.env.EXPO_OS === 'web' ? 'system' : getStoredThemePreference();
  });

  useEffect(() => {
    if (process.env.EXPO_OS === 'web') {
      setThemePreferenceState(getStoredThemePreference());
    }
  }, []);

  useEffect(() => {
    if (typeof Appearance.setColorScheme === 'function') {
      Appearance.setColorScheme(themePreference === 'system' ? null : themePreference);
    }
  }, [themePreference]);

  const setThemePreference = useCallback((preference: ThemePreference) => {
    setThemePreferenceState(preference);
    persistThemePreference(preference);
  }, []);

  const colorScheme: AppColorScheme =
    themePreference === 'system' ? (systemColorScheme ?? 'light') : themePreference;
  const colors = AppColors[colorScheme];

  useEffect(() => {
    if (process.env.EXPO_OS !== 'web') return;

    document.documentElement.style.colorScheme = colorScheme;
    document.body.style.backgroundColor = colors.background;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colors.background);
  }, [colorScheme, colors.background]);

  const value = useMemo(
    () => ({ colorScheme, colors, themePreference, setThemePreference }),
    [colorScheme, colors, setThemePreference, themePreference]
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useAppTheme() {
  const theme = use(ThemeContext);

  if (!theme) {
    throw new Error('useAppTheme must be used within a ThemeProvider.');
  }

  return theme;
}

export function useAppColorScheme() {
  return useAppTheme().colorScheme;
}
