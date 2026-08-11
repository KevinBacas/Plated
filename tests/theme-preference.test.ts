import assert from 'node:assert/strict';
import test from 'node:test';

import { AppColors } from '../constants/app-theme';
import { parseThemePreference } from '../lib/theme-preference';

function relativeLuminance(hex: string) {
  const channels = hex.match(/[a-f\d]{2}/gi)?.map((channel) => {
    const value = Number.parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  if (!channels || channels.length !== 3) throw new Error(`Invalid color: ${hex}`);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(foreground: string, background: string) {
  const lightest = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darkest = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lightest + 0.05) / (darkest + 0.05);
}

test('theme preference accepts supported values and falls back to system', () => {
  assert.equal(parseThemePreference('light'), 'light');
  assert.equal(parseThemePreference('dark'), 'dark');
  assert.equal(parseThemePreference('system'), 'system');
  assert.equal(parseThemePreference('unexpected'), 'system');
  assert.equal(parseThemePreference(null), 'system');
});

test('notification titles remain readable in every theme', () => {
  for (const colors of Object.values(AppColors)) {
    assert.ok(contrastRatio(colors.snackTitle, colors.snackBackground) >= 4.5);
  }
});
