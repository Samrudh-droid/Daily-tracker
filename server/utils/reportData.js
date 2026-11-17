const Task = require('../models/task');
const Habit = require('../models/habit');
const HabitLog = require('../models/habitLog');
const { getDateRange, getWeekdayIndex } = require('./date');
const { calculateStreaks } = require('./streaks');

const taskStatuses = ['pending', 'done', 'missed', 'cancelled'];
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function percent(numerator, denominator) {
  return denominator
    ? Math.round((numerator / denominator) * 1000) / 10
    : 0;
}

function getTaskCounts() {
  return Object.fromEntries(taskStatuses.map((status) => [status, 0]));
}

function getHabitCounts() {
  return { done: 0, missed: 0, unmarked: 0, active: 0, tracked: 0 };
}

function countTasksByDay(tasks) {
  const counts = new Map();
  for (const task of tasks) {
    if (!counts.has(task.date)) {
      counts.set(task.date, getTaskCounts());
    }
    counts.get(task.date)[task.status] += 1;
  }
  return counts;
}

function countLogsByHabitAndDate(logs) {
  return new Map(logs.map((log) => [`${log.habit}:${log.date}`, log.status]));
}

function addCounts(target, source, fields) {
  for (const field of fields) {
    target[field] += source[field];
  }
}

function summarizeDays(days) {
  const taskTotals = getTaskCounts();
  const habitTotals = getHabitCounts();
  for (const day of days) {
    addCounts(taskTotals, day.tasks, taskStatuses);
    addCounts(habitTotals, day.habits, [
      'done',
      'missed',
      'unmarked',
      day.habits.tracked === undefined ? 'active' : 'tracked',
    ]);
  }

  const eligibleTasks =
    taskTotals.done + taskTotals.missed + taskTotals.pending;
  return {
    tasks: {
      ...taskTotals,
      eligible: eligibleTasks,
      completionPercent: percent(taskTotals.done, eligibleTasks),
    },
    habits: {
      ...habitTotals,
      active: habitTotals.tracked,
      completionPercent: percent(habitTotals.done, habitTotals.tracked),
    },
  };
}

function findBestAndWorstDays(days) {
  const eligibleDays = days.filter(
    (day) => day.tasks.done + day.tasks.missed + day.tasks.pending > 0
  );
  if (eligibleDays.length === 0) {
    return { bestDay: null, worstDay: null };
  }

  const byPercent = (left, right) =>
    left.tasks.completionPercent - right.tasks.completionPercent;
  const sorted = [...eligibleDays].sort(byPercent);
  const formatDay = (day) => ({
    date: day.date,
    weekday: day.weekday,
    completionPercent: day.tasks.completionPercent,
  });
  return {
    bestDay: formatDay(sorted[sorted.length - 1]),
    worstDay: formatDay(sorted[0]),
  };
}

function buildDailyData({ dates, tasks, habits, logs, asOfDate }) {
  const taskCounts = countTasksByDay(tasks);
  const logStatus = countLogsByHabitAndDate(logs);

  return dates.map((date) => {
    const taskData = taskCounts.get(date) || getTaskCounts();
    const eligibleTasks = taskData.done + taskData.missed + taskData.pending;
    const habitData = getHabitCounts();

    for (const habit of habits) {
      if (habit.createdDate > date) {
        continue;
      }
      habitData.active += 1;
      if (asOfDate && date > asOfDate) {
        continue;
      }
      habitData.tracked += 1;
      const status = logStatus.get(`${habit._id}:${date}`);
      if (status === 'done') {
        habitData.done += 1;
      } else if (status === 'missed') {
        habitData.missed += 1;
      } else {
        habitData.unmarked += 1;
      }
    }

    return {
      date,
      weekday: weekdays[getWeekdayIndex(date)],
      tasks: {
        ...taskData,
        eligible: eligibleTasks,
        completionPercent: percent(taskData.done, eligibleTasks),
      },
      habits: {
        ...habitData,
        completionPercent: percent(habitData.done, habitData.tracked),
      },
    };
  });
}

function buildHabitStats({ habits, logs, dates, asOfDate }) {
  return habits.map((habit) => {
    const activeDates = dates.filter(
      (date) => date >= habit.createdDate && date <= asOfDate
    );
    const counts = { done: 0, missed: 0, unmarked: 0 };
    const statusByDate = new Map(
      logs
        .filter((log) => String(log.habit) === String(habit._id))
        .map((log) => [log.date, log.status])
    );
    const habitDays = activeDates.map((date) => {
      const status = statusByDate.get(date) || 'unmarked';
      counts[status] += 1;
      return { date, status };
    });

    const streakLogs = logs
      .filter(
        (log) =>
          String(log.habit) === String(habit._id) &&
          log.date >= habit.createdDate &&
          log.date <= asOfDate
      )
      .map((log) => ({ date: log.date, status: log.status }));

    return {
      id: String(habit._id),
      name: habit.name,
      createdDate: habit.createdDate,
      activeDays: activeDates.length,
      days: habitDays,
      ...counts,
      completionPercent: percent(counts.done, activeDates.length),
      ...calculateStreaks(streakLogs, asOfDate),
    };
  });
}

async function getReportData({ userId, start, end, asOfDate }) {
  const [tasks, habits] = await Promise.all([
    Task.find({ user: userId, date: { $gte: start, $lte: end } })
      .select('date status')
      .lean(),
    Habit.find({ user: userId, createdDate: { $lte: end } })
      .select('name createdDate')
      .sort({ createdAt: 1 })
      .lean(),
  ]);
  const habitIds = habits.map((habit) => habit._id);
  const latestDate = asOfDate > end ? asOfDate : end;
  const logs = habitIds.length
    ? await HabitLog.find({
        user: userId,
        habit: { $in: habitIds },
        date: { $lte: latestDate },
      })
        .select('habit date status')
        .lean()
    : [];

  return { tasks, habits, logs };
}

function buildReportDays({ start, end, tasks, habits, logs, asOfDate }) {
  return buildDailyData({
    dates: getDateRange(start, end),
    tasks,
    habits,
    logs,
    asOfDate,
  });
}

function buildReportTotals(days) {
  return summarizeDays(days);
}

function buildReportBestAndWorst(days) {
  return findBestAndWorstDays(days);
}

function buildReportHabitStats({ habits, logs, dates, asOfDate }) {
  return buildHabitStats({ habits, logs, dates, asOfDate });
}

module.exports = {
  buildReportBestAndWorst,
  buildReportDays,
  buildReportHabitStats,
  buildReportTotals,
  getReportData,
  summarizeDays,
};
