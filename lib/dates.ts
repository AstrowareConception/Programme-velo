// Calendar dates use the device's local timezone; instants remain ISO UTC in backups.
export function localInputDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function localInputDateTime(date = new Date()) {
  return `${localInputDate(date)}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function localDateToIso(value: string, dateOnly = false) {
  if (!(dateOnly ? /^\d{4}-\d{2}-\d{2}$/ : /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/).test(value)) return undefined;
  const date = new Date(dateOnly ? `${value}T12:00:00` : value);
  if (!Number.isFinite(date.getTime())) return undefined;
  if ((dateOnly ? localInputDate(date) : localInputDateTime(date)) !== value) return undefined;
  return date.toISOString();
}

export function localCalendarDay(date: Date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000;
}
