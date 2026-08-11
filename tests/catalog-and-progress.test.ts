import assert from 'node:assert/strict';
import test from 'node:test';

import { COUNTRIES, DEPARTMENTS } from '../data/targets';
import { filterTargets, buildTargetProgress } from '../lib/target-stats';

test('the embedded catalog has 101 departments and 26 EU countries without France', () => {
  assert.equal(DEPARTMENTS.length, 101);
  assert.equal(COUNTRIES.length, 26);
  assert.equal(COUNTRIES.some((country) => country.name === 'France'), false);
  assert.equal(COUNTRIES.find((country) => country.name === 'Allemagne')?.code, 'D');
  assert.equal(COUNTRIES.find((country) => country.name === 'Espagne')?.code, 'E');
  assert.equal(COUNTRIES.find((country) => country.name === 'Irlande')?.code, 'IRL');
  assert.deepEqual(DEPARTMENTS.find((department) => department.code === '75')?.name, 'Paris');
});

test('search ignores case and accents and accepts plate codes', () => {
  assert.deepEqual(filterTargets(DEPARTMENTS, 'herault').map((target) => target.code), ['34']);
  assert.deepEqual(filterTargets(COUNTRIES, 'IRL').map((target) => target.name), ['Irlande']);
});

test('progress keeps the first and last observation and resets when its entries are gone', () => {
  const observations = [
    { id: 'first', targetId: 'department-75', targetType: 'department' as const, observedAt: '2026-08-01T10:00:00.000Z', note: null },
    { id: 'second', targetId: 'department-75', targetType: 'department' as const, observedAt: '2026-08-03T12:00:00.000Z', note: 'Périphérique' },
  ];
  const progress = buildTargetProgress(observations);
  assert.deepEqual(progress.get('department-75'), { count: 2, firstSeen: observations[0].observedAt, lastSeen: observations[1].observedAt });
  assert.equal(buildTargetProgress(observations.filter((item) => item.id !== 'first')).get('department-75')?.count, 1);
  assert.equal(buildTargetProgress([]).has('department-75'), false);
});
