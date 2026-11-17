import { format } from 'date-fns';

export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function addLocalDays(value, amount) {
  const date = parseLocalDate(value);
  date.setDate(date.getDate() + amount);
  return getLocalDateString(date);
}

export function getMonday(value) {
  const date = parseLocalDate(value);
  const daysSinceMonday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - daysSinceMonday);
  return getLocalDateString(date);
}

export function getMonthKey(value) {
  return value.slice(0, 7);
}

export function formatDateLabel(value) {
  return format(parseLocalDate(value), 'EEE d MMM yyyy');
}

export function formatShortDate(value) {
  return format(parseLocalDate(value), 'EEE d');
}
