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

export const formatDisplayDate = (value: DateInput) =>
  DISPLAY_DATE_FORMATTER.format(toDate(value));
