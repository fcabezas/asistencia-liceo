const TIMEZONE = "America/Santiago";

const WEEKDAY_TO_ISO: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

/** Today's wall-clock date/weekday in the school's timezone, not UTC-derived. */
export function chileToday(): { date: string; isoWeekday: number } {
  const now = new Date();
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const weekdayStr = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    weekday: "short",
  }).format(now);

  return { date, isoWeekday: WEEKDAY_TO_ISO[weekdayStr] };
}
