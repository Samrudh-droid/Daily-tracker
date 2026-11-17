import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addLocalDays,
  formatDateLabel,
  getLocalDateString,
  getMonday,
  parseLocalDate,
} from './date.js';

test('formats and parses calendar dates without shifting the day', () => {
  assert.equal(formatDateLabel('2026-10-12'), 'Mon 12 Oct 2026');
  assert.equal(getLocalDateString(parseLocalDate('2026-10-12')), '2026-10-12');
});

test('moves dates and finds Monday using the local calendar', () => {
  assert.equal(addLocalDays('2026-11-17', 1), '2026-11-18');
  assert.equal(getMonday('2026-11-17'), '2026-11-16');
});
