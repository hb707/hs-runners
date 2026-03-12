/**
 * Returns ISO week number string, e.g. "2026-W11"
 * ISO week starts on Monday
 */
export function getISOWeekNumber(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Returns Monday and Sunday boundaries for a given ISO week string "YYYY-Www"
 */
export function getWeekBoundaries(weekNumber: string): { start: Date; end: Date } {
  const [year, week] = weekNumber.split('-W').map(Number);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4DayOfWeek = jan4.getUTCDay() || 7;
  const mondayOfWeek1 = new Date(jan4.getTime() - (jan4DayOfWeek - 1) * 86400000);
  const start = new Date(mondayOfWeek1.getTime() + (week - 1) * 7 * 86400000);
  const end = new Date(start.getTime() + 6 * 86400000);
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
}

/**
 * Returns the previous ISO week number
 */
export function getPreviousWeek(weekNumber: string): string {
  const { start } = getWeekBoundaries(weekNumber);
  const prevMonday = new Date(start.getTime() - 7 * 86400000);
  return getISOWeekNumber(prevMonday);
}

/**
 * Returns YYYY-MM string for a date
 */
export function getYearMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
