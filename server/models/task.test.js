const assert = require('node:assert/strict');
const test = require('node:test');
const mongoose = require('mongoose');
const Task = require('./task');

function createTask(overrides = {}) {
  return new Task({
    user: new mongoose.Types.ObjectId(),
    title: 'Review notes',
    date: '2026-11-17',
    ...overrides,
  });
}

test('defaults a new task to pending', async () => {
  const task = createTask();

  await task.validate();
  assert.equal(task.status, 'pending');
});

test('rejects statuses outside the task lifecycle', async () => {
  const task = createTask({ status: 'archived' });

  await assert.rejects(task.validate(), { name: 'ValidationError' });
});

test('rejects invalid task dates', async () => {
  const task = createTask({ date: '2026-02-29' });

  await assert.rejects(task.validate(), { name: 'ValidationError' });
});
