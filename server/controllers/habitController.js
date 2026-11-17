const mongoose = require('mongoose');
const Habit = require('../models/habit');
const HabitLog = require('../models/habitLog');
const { getDateRange, isValidDateString } = require('../utils/date');
const { calculateStreaks } = require('../utils/streaks');

const maximumNameLength = 80;

function isRequestObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasOnlyFields(value, allowedFields) {
  return Object.keys(value).every((field) => allowedFields.includes(field));
}

function validHabitId(req, res) {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    res.status(400).json({ message: 'Invalid habit id' });
    return false;
  }
  return true;
}

function serializeHabit(habit, logs, rangeStart, rangeEnd, asOfDate) {
  const visibleLogs = logs
    .filter((log) => log.date >= rangeStart && log.date <= rangeEnd)
    .map((log) => ({ date: log.date, status: log.status }));
  const streaks = calculateStreaks(
    logs.filter((log) => log.date >= habit.createdDate),
    asOfDate
  );

  return {
    id: String(habit._id),
    name: habit.name,
    createdDate: habit.createdDate,
    createdAt: habit.createdAt,
    currentStreak: streaks.currentStreak,
    longestStreak: streaks.longestStreak,
    logs: visibleLogs,
  };
}

async function listHabits(req, res) {
  const { start, end } = req.query;
  const asOfDate = req.query.asOf || end;
  if (
    !isValidDateString(start) ||
    !isValidDateString(end) ||
    !isValidDateString(asOfDate) ||
    start > end
  ) {
    return res.status(400).json({
      message: 'Valid start, end, and asOf dates in YYYY-MM-DD format are required',
    });
  }

  const requestedDates = getDateRange(start, end);
  if (requestedDates.length > 31) {
    return res.status(400).json({ message: 'Date range cannot exceed 31 days' });
  }

  const habits = await Habit.find({
    user: req.userId,
    createdDate: { $lte: end },
  })
    .sort({ createdAt: 1 })
    .lean();
  const habitIds = habits.map((habit) => habit._id);
  const latestDate = asOfDate > end ? asOfDate : end;
  const logs = habitIds.length
    ? await HabitLog.find({
        user: req.userId,
        habit: { $in: habitIds },
        date: { $lte: latestDate },
      }).lean()
    : [];
  const logsByHabit = new Map(habits.map((habit) => [String(habit._id), []]));
  for (const log of logs) {
    logsByHabit.get(String(log.habit)).push(log);
  }

  return res.json({
    dates: requestedDates,
    habits: habits.map((habit) =>
      serializeHabit(
        habit,
        logsByHabit.get(String(habit._id)),
        start,
        end,
        asOfDate
      )
    ),
  });
}

async function createHabit(req, res) {
  const body = req.body;
  if (
    !isRequestObject(body) ||
    !hasOnlyFields(body, ['name', 'createdDate']) ||
    typeof body.name !== 'string' ||
    !body.name.trim() ||
    body.name.trim().length > maximumNameLength ||
    !isValidDateString(body.createdDate)
  ) {
    return res.status(400).json({
      message: `Name (1-${maximumNameLength} characters) and a valid createdDate are required`,
    });
  }

  const habit = await Habit.create({
    user: req.userId,
    name: body.name.trim(),
    createdDate: body.createdDate,
  });
  return res.status(201).json({
    habit: serializeHabit(
      habit.toObject(),
      [],
      body.createdDate,
      body.createdDate,
      body.createdDate
    ),
  });
}

async function updateHabit(req, res) {
  const body = req.body;
  if (!validHabitId(req, res)) {
    return;
  }
  if (
    !isRequestObject(body) ||
    !hasOnlyFields(body, ['name']) ||
    typeof body.name !== 'string' ||
    !body.name.trim() ||
    body.name.trim().length > maximumNameLength
  ) {
    return res.status(400).json({
      message: `Name must be between 1 and ${maximumNameLength} characters`,
    });
  }

  const habit = await Habit.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    { $set: { name: body.name.trim() } },
    { new: true, runValidators: true }
  ).lean();
  if (!habit) {
    return res.status(404).json({ message: 'Habit not found' });
  }

  return res.json({
    habit: {
      id: String(habit._id),
      name: habit.name,
      createdDate: habit.createdDate,
      createdAt: habit.createdAt,
    },
  });
}

async function deleteHabit(req, res) {
  if (!validHabitId(req, res)) {
    return;
  }

  const habit = await Habit.findOneAndDelete({
    _id: req.params.id,
    user: req.userId,
  });
  if (!habit) {
    return res.status(404).json({ message: 'Habit not found' });
  }

  await HabitLog.deleteMany({ user: req.userId, habit: habit._id });
  return res.json({ message: 'Habit deleted' });
}

async function setHabitLog(req, res) {
  if (!validHabitId(req, res)) {
    return;
  }
  const { date } = req.params;
  const body = req.body;
  if (
    !isValidDateString(date) ||
    !isRequestObject(body) ||
    !hasOnlyFields(body, ['status']) ||
    !['done', 'missed'].includes(body.status)
  ) {
    return res
      .status(400)
      .json({ message: 'A valid date and done or missed status are required' });
  }

  const habit = await Habit.findOne({
    _id: req.params.id,
    user: req.userId,
  }).lean();
  if (!habit) {
    return res.status(404).json({ message: 'Habit not found' });
  }
  if (date < habit.createdDate) {
    return res
      .status(400)
      .json({ message: 'A habit cannot be logged before its created date' });
  }

  const log = await HabitLog.findOneAndUpdate(
    { user: req.userId, habit: habit._id, date },
    { $set: { status: body.status } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();
  return res.json({ log: { date: log.date, status: log.status } });
}

async function clearHabitLog(req, res) {
  if (!validHabitId(req, res)) {
    return;
  }
  const { date } = req.params;
  if (!isValidDateString(date)) {
    return res
      .status(400)
      .json({ message: 'Date must be a valid YYYY-MM-DD calendar date' });
  }

  const habit = await Habit.findOne({
    _id: req.params.id,
    user: req.userId,
  }).lean();
  if (!habit) {
    return res.status(404).json({ message: 'Habit not found' });
  }
  if (date < habit.createdDate) {
    return res
      .status(400)
      .json({ message: 'A habit cannot be logged before its created date' });
  }

  await HabitLog.deleteOne({
    user: req.userId,
    habit: habit._id,
    date,
  });
  return res.json({ message: 'Habit log cleared' });
}

module.exports = {
  clearHabitLog,
  createHabit,
  deleteHabit,
  listHabits,
  setHabitLog,
  updateHabit,
};
