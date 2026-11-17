const {
  addDays,
  getDateRange,
  getTodayDateString,
  getWeekdayIndex,
  isValidDateString,
} = require('../utils/date');
const {
  buildReportBestAndWorst,
  buildReportDays,
  buildReportHabitStats,
  buildReportTotals,
  getReportData,
  summarizeDays,
} = require('../utils/reportData');

function readAsOfDate(req, res) {
  const asOfDate = req.query.today || getTodayDateString();
  if (!isValidDateString(asOfDate)) {
    res.status(400).json({ message: 'today must be a valid YYYY-MM-DD date' });
    return null;
  }
  return asOfDate;
}

async function getWeeklyReport(req, res) {
  const asOfDate = readAsOfDate(req, res);
  if (!asOfDate) {
    return;
  }

  let start = req.query.start;
  if (start === undefined) {
    const weekday = getWeekdayIndex(asOfDate);
    start = addDays(asOfDate, -((weekday + 6) % 7));
  }
  if (!isValidDateString(start) || getWeekdayIndex(start) !== 1) {
    return res
      .status(400)
      .json({ message: 'start must be a Monday in YYYY-MM-DD format' });
  }

  const end = addDays(start, 6);
  const dates = getDateRange(start, end);
  const data = await getReportData({
    userId: req.userId,
    start,
    end,
    asOfDate,
  });
  const days = buildReportDays({ start, end, ...data, asOfDate });

  return res.json({
    start,
    end,
    days,
    totals: buildReportTotals(days),
    ...buildReportBestAndWorst(days),
    habits: buildReportHabitStats({
      ...data,
      dates,
      asOfDate,
    }),
  });
}

function getMonthBounds(month) {
  const match = /^(\d{4})-(\d{2})$/.exec(month || '');
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  if (year < 1 || monthNumber < 1 || monthNumber > 12) {
    return null;
  }

  const start = `${match[1]}-${match[2]}-01`;
  const firstDayNextMonth =
    monthNumber === 12
      ? `${String(year + 1).padStart(4, '0')}-01-01`
      : `${match[1]}-${String(monthNumber + 1).padStart(2, '0')}-01`;
  const end = addDays(firstDayNextMonth, -1);
  return { start, end };
}

async function getMonthlyReport(req, res) {
  const asOfDate = readAsOfDate(req, res);
  if (!asOfDate) {
    return;
  }
  const month = req.query.month || asOfDate.slice(0, 7);
  const bounds = getMonthBounds(month);
  if (!bounds) {
    return res
      .status(400)
      .json({ message: 'month must be a valid YYYY-MM value' });
  }

  const dates = getDateRange(bounds.start, bounds.end);
  const data = await getReportData({
    userId: req.userId,
    ...bounds,
    asOfDate,
  });
  const days = buildReportDays({ ...bounds, ...data, asOfDate });
  const weeks = [];
  for (let date = bounds.start; date <= bounds.end; ) {
    const monday = addDays(date, -((getWeekdayIndex(date) + 6) % 7));
    const sunday = addDays(monday, 6);
    const weekStart = monday < bounds.start ? bounds.start : monday;
    const weekEnd = sunday > bounds.end ? bounds.end : sunday;
    const weekDays = days.filter(
      (day) => day.date >= weekStart && day.date <= weekEnd
    );
    weeks.push({
      start: weekStart,
      end: weekEnd,
      totals: summarizeDays(weekDays),
    });
    date = addDays(weekEnd, 1);
  }

  const daysWithFullHabitCompletion = days.filter(
    (day) => day.habits.active > 0 && day.habits.completionPercent === 100
  ).length;

  return res.json({
    month,
    ...bounds,
    days,
    weeks,
    totals: buildReportTotals(days),
    ...buildReportBestAndWorst(days),
    daysWith100PercentHabitCompletion: daysWithFullHabitCompletion,
    habits: buildReportHabitStats({
      ...data,
      dates,
      asOfDate,
    }),
  });
}

module.exports = { getMonthlyReport, getWeeklyReport };
