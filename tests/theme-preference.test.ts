import assert from 'node:assert/strict';
import test from 'node:test';

import { parseThemePreference } from '../lib/theme-preference';

test('theme preference accepts supported values and falls back to system', () => {
  assert.equal(parseThemePreference('light'), 'light');
  assert.equal(parseThemePreference('dark'), 'dark');
  assert.equal(parseThemePreference('system'), 'system');
  assert.equal(parseThemePreference('unexpected'), 'system');
  assert.equal(parseThemePreference(null), 'system');
});
