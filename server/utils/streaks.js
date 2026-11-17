const { addDays } = require('./date');

function calculateStreaks(logs, asOfDate) {
  const statusByDate = new Map(
    logs
      .filter((log) => log.date <= asOfDate)
      .map((log) => [log.date, log.status])
  );
  const doneDates = [...statusByDate.entries()]
    .filter(([, status]) => status === 'done')
    .map(([date]) => date)
    .sort();

  let longestStreak = 0;
  let runLength = 0;
  let previousDate = null;
  for (const date of doneDates) {
    runLength =
      previousDate && addDays(previousDate, 1) === date ? runLength + 1 : 1;
    longestStreak = Math.max(longestStreak, runLength);
    previousDate = date;
  }

  const statusOnAsOfDate = statusByDate.get(asOfDate);
  let currentDate =
    statusOnAsOfDate === 'done'
      ? asOfDate
      : statusOnAsOfDate === undefined
        ? addDays(asOfDate, -1)
        : null;
  let currentStreak = 0;
  while (currentDate && statusByDate.get(currentDate) === 'done') {
    currentStreak += 1;
    currentDate = addDays(currentDate, -1);
  }

  return { currentStreak, longestStreak };
}

module.exports = { calculateStreaks };
