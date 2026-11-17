const assert = require('node:assert/strict');
const test = require('node:test');
const {
  buildReportBestAndWorst,
  buildReportDays,
  buildReportHabitStats,
  buildReportTotals,
} = require('./reportData');

const habit = {
  _id: 'habit-1',
  name: 'Read',
  createdDate: '2026-10-14',
};

test('report totals exclude cancelled tasks and count unmarked active habits', () => {
  const days = buildReportDays({
    start: '2026-10-12',
    end: '2026-10-16',
    tasks: [
      { date: '2026-10-12', status: 'cancelled' },
      { date: '2026-10-14', status: 'done' },
      { date: '2026-10-14', status: 'done' },
      { date: '2026-10-14', status: 'missed' },
      { date: '2026-10-14', status: 'pending' },
      { date: '2026-10-15', status: 'done' },
    ],
    habits: [habit],
    logs: [
      { habit: habit._id, date: '2026-10-14', status: 'done' },
      { habit: habit._id, date: '2026-10-15', status: 'missed' },
    ],
  });
  const totals = buildReportTotals(days);

  assert.equal(totals.tasks.cancelled, 1);
  assert.equal(totals.tasks.eligible, 5);
  assert.equal(totals.tasks.completionPercent, 60);
  assert.equal(days[1].habits.active, 0);
  assert.equal(days[4].habits.unmarked, 1);
  assert.equal(totals.habits.active, 3);
  assert.equal(totals.habits.completionPercent, 33.3);
});

test('report best and worst days are empty when there are no eligible tasks', () => {
  const days = buildReportDays({
    start: '2026-10-12',
    end: '2026-10-12',
    tasks: [{ date: '2026-10-12', status: 'cancelled' }],
    habits: [],
    logs: [],
  });

  assert.deepEqual(buildReportBestAndWorst(days), {
    bestDay: null,
    worstDay: null,
  });
  assert.equal(buildReportTotals(days).tasks.completionPercent, 0);
  assert.equal(buildReportTotals(days).habits.completionPercent, 0);
});

test('per-habit completion starts on the habit creation date', () => {
  const stats = buildReportHabitStats({
    habits: [habit],
    logs: [{ habit: habit._id, date: '2026-10-14', status: 'done' }],
    dates: ['2026-10-12', '2026-10-13', '2026-10-14'],
    asOfDate: '2026-10-14',
  });

  assert.equal(stats[0].activeDays, 1);
  assert.equal(stats[0].done, 1);
  assert.equal(stats[0].completionPercent, 100);
});

test('future dates are not counted in report habit totals', () => {
  const days = buildReportDays({
    start: '2026-11-16',
    end: '2026-11-18',
    asOfDate: '2026-11-17',
    tasks: [],
    habits: [habit],
    logs: [
      { habit: habit._id, date: '2026-11-16', status: 'done' },
      { habit: habit._id, date: '2026-11-18', status: 'done' },
    ],
  });
  const totals = buildReportTotals(days);

  assert.equal(days[2].habits.active, 1);
  assert.equal(days[2].habits.tracked, 0);
  assert.equal(days[2].habits.completionPercent, 0);
  assert.equal(totals.habits.active, 2);
  assert.equal(totals.habits.done, 1);
});
