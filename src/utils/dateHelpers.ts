/**
 * Date utility helpers for Hedge Manager scheduling and accidental execution prevention
 */

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTomorrowDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getIn2DaysDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getOffsetDateString(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateLabel(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
    }
  } catch {}
  return dateStr;
}

export interface ScheduledDateInfo {
  scheduledDate: string;
  isToday: boolean;
  isTomorrow: boolean;
  isIn2Days: boolean;
  isFuture: boolean;
  daysDiff: number;
  relativeText: string;
  formattedDateText: string;
  badgeLabel: string;
}

export function parseScheduledDate(scheduledDate?: string, targetDate?: string): ScheduledDateInfo {
  const todayStr = getTodayDateString();
  const tomorrowStr = getTomorrowDateString();
  const in2DaysStr = getIn2DaysDateString();

  let resolvedDate = scheduledDate;

  if (!resolvedDate) {
    if (targetDate === 'Today') {
      resolvedDate = todayStr;
    } else if (targetDate === 'Tomorrow') {
      resolvedDate = tomorrowStr;
    } else if (targetDate === 'In 2 Days') {
      resolvedDate = in2DaysStr;
    } else {
      resolvedDate = tomorrowStr; // default to tomorrow
    }
  }

  // Calculate day difference
  const today = new Date(todayStr + 'T00:00:00');
  const target = new Date(resolvedDate + 'T00:00:00');
  const diffTime = target.getTime() - today.getTime();
  const daysDiff = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const isToday = daysDiff <= 0;
  const isTomorrow = daysDiff === 1;
  const isIn2Days = daysDiff === 2;
  const isFuture = daysDiff > 0;

  const formattedDate = formatDateLabel(resolvedDate);

  let relativeText = 'Today';
  let badgeLabel = 'Ready for Today';

  if (daysDiff <= 0) {
    relativeText = 'Today';
    badgeLabel = '⚡ Ready Today';
  } else if (daysDiff === 1) {
    relativeText = 'Tomorrow';
    badgeLabel = `🗓️ Tomorrow (${formattedDate})`;
  } else if (daysDiff === 2) {
    relativeText = 'In 2 Days';
    badgeLabel = `🗓️ In 2 Days (${formattedDate})`;
  } else {
    relativeText = `In ${daysDiff} Days`;
    badgeLabel = `🗓️ In ${daysDiff} Days (${formattedDate})`;
  }

  return {
    scheduledDate: resolvedDate,
    isToday,
    isTomorrow,
    isIn2Days,
    isFuture,
    daysDiff,
    relativeText,
    formattedDateText: formattedDate,
    badgeLabel,
  };
}
