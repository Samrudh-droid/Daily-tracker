function isValidDateString(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || month < 1 || month > 12) {
    return false;
  }

  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31,
    isLeapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  return day >= 1 && day <= daysInMonth[month - 1];
}

function createUtcDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return date;
}

function formatDateParts(year, month, day) {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(
    2,
    '0'
  )}-${String(day).padStart(2, '0')}`;
}

function addDays(value, amount) {
  const date = createUtcDate(value);
  date.setUTCDate(date.getUTCDate() + amount);
  return formatDateParts(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate()
  );
}

function getWeekdayIndex(value) {
  return createUtcDate(value).getUTCDay();
}

function getDateRange(start, end) {
  const dates = [];
  for (let date = start; date <= end; date = addDays(date, 1)) {
    dates.push(date);
  }
  return dates;
}

function getTodayDateString(date = new Date()) {
  return formatDateParts(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );
}

module.exports = {
  addDays,
  getDateRange,
  getTodayDateString,
  getWeekdayIndex,
  isValidDateString,
};
