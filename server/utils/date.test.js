const assert = require('node:assert/strict');
const test = require('node:test');
const { isValidDateString } = require('./date');

test('accepts valid calendar dates in YYYY-MM-DD format', () => {
  assert.equal(isValidDateString('2026-11-17'), true);
  assert.equal(isValidDateString('2024-02-29'), true);
});

test('rejects invalid dates and noncanonical date strings', () => {
  assert.equal(isValidDateString('2025-02-29'), false);
  assert.equal(isValidDateString('2026-13-01'), false);
  assert.equal(isValidDateString('2026-2-01'), false);
  assert.equal(isValidDateString('2026-11-17T00:00:00Z'), false);
});
