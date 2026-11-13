export type DateInput = Date | string | number;

export const toDate = (value: DateInput): Date => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date value: ${String(value)}`);
  }

  return date;
};

export const dateTimestamp = (value: DateInput) => toDate(value).getTime();

const DISPLAY_DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/* en-GB abbreviates September as "Sept"; every other month is three letters. */
const threeLetterMonths = (value: string) => value.replace("Sept", "Sep");

export const formatDisplayDate = (value: DateInput) =>
  threeLetterMonths(DISPLAY_DATE_FORMATTER.format(toDate(value)));

const DAY_MONTH_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

/* For lists already grouped under a year heading. */
export const formatDayMonth = (value: DateInput) =>
  threeLetterMonths(DAY_MONTH_FORMATTER.format(toDate(value)));

/* Machine-readable date for <time datetime>. */
export const isoDate = (value: DateInput) =>
  toDate(value).toISOString().slice(0, 10);
