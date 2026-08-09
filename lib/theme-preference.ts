export type ThemePreference = 'system' | 'light' | 'dark';

export function parseThemePreference(value: string | null): ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark' ? value : 'system';
}
