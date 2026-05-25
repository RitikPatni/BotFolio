const DISPLAY_DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export const formatDisplayDate = (value: Date) =>
  DISPLAY_DATE_FORMATTER.format(value);
