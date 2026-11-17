require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Habit = require('../models/habit');
const HabitLog = require('../models/habitLog');
const Task = require('../models/task');
const User = require('../models/user');
const { addDays, getTodayDateString } = require('../utils/date');

async function seedDemoData() {
  const { MONGO_URI, DEMO_EMAIL, DEMO_PASSWORD } = process.env;
  if (!MONGO_URI || !DEMO_EMAIL || !DEMO_PASSWORD || DEMO_PASSWORD.length < 8) {
    throw new Error('MongoDB and valid demo account settings are required');
  }

  await mongoose.connect(MONGO_URI);
  const email = DEMO_EMAIL.trim().toLowerCase();
  let user = await User.findOne({ email });
  if (!user) {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    user = await User.create({
      name: process.env.DEMO_NAME?.trim() || 'Demo User',
      email,
      passwordHash,
    });
  }

  const [taskCount, habitCount, logCount] = await Promise.all([
    Task.countDocuments({ user: user._id }),
    Habit.countDocuments({ user: user._id }),
    HabitLog.countDocuments({ user: user._id }),
  ]);
  if (taskCount > 0 || habitCount > 0 || logCount > 0) {
    console.log('Demo account already has tracker data; no changes were made.');
    return;
  }

  const today = getTodayDateString();
  const taskStatuses = ['done', 'done', 'pending', 'missed', 'cancelled'];
  const tasks = [];
  for (let offset = 13; offset >= 0; offset -= 1) {
    const date = addDays(today, -offset);
    tasks.push(
      {
        user: user._id,
        title: 'Focus on the most important task',
        date,
        status: taskStatuses[offset % taskStatuses.length],
      },
      {
        user: user._id,
        title: 'Take a short movement break',
        date,
        status: taskStatuses[(offset + 2) % taskStatuses.length],
      }
    );
  }
  await Task.insertMany(tasks);

  const createdDate = addDays(today, -20);
  const habits = await Habit.insertMany([
    { user: user._id, name: 'Read for 20 minutes', createdDate },
    { user: user._id, name: 'Go for a walk', createdDate },
    { user: user._id, name: 'Plan tomorrow', createdDate },
  ]);

  const logs = [];
  for (const habit of habits) {
    for (let offset = 20; offset >= 0; offset -= 1) {
      if ((offset + String(habit._id).charCodeAt(0)) % 6 === 0) {
        continue;
      }
      logs.push({
        user: user._id,
        habit: habit._id,
        date: addDays(today, -offset),
        status: (offset + String(habit._id).charCodeAt(1)) % 5 === 0
          ? 'missed'
          : 'done',
      });
    }
  }
  await HabitLog.insertMany(logs);
  console.log('Demo data created successfully.');
}

seedDemoData()
  .catch(() => {
    console.error(
      'Could not create demo data. Check MongoDB connectivity and the DEMO_* environment settings.'
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
