const assert = require('node:assert/strict');
const test = require('node:test');
const { calculateStreaks } = require('./streaks');

test('keeps yesterday streak active when today has not been marked', () => {
  const streaks = calculateStreaks(
    [
      { date: '2026-11-15', status: 'done' },
      { date: '2026-11-16', status: 'done' },
    ],
    '2026-11-17'
  );

  assert.deepEqual(streaks, { currentStreak: 2, longestStreak: 2 });
});

test('a missed day ends the current streak but preserves the longest streak', () => {
  const streaks = calculateStreaks(
    [
      { date: '2026-11-14', status: 'done' },
      { date: '2026-11-15', status: 'done' },
      { date: '2026-11-16', status: 'missed' },
    ],
    '2026-11-16'
  );

  assert.deepEqual(streaks, { currentStreak: 0, longestStreak: 2 });
});
