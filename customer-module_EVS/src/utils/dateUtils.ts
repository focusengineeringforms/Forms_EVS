const DISPLAY_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

const EXPORT_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

function parseTimestamp(timestamp?: string | Date): Date | null {
  if (!timestamp) return null;

  const parsed = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatTimestamp(timestamp: string | Date): string {
  const parsed = parseTimestamp(timestamp);
  if (!parsed) return "--";
  return parsed.toLocaleString(undefined, DISPLAY_FORMAT_OPTIONS);
}

export function formatResponseTimestamp(timestamp?: string): string {
  const parsed = parseTimestamp(timestamp);
  if (!parsed) return "--";
  return parsed.toLocaleString(undefined, EXPORT_FORMAT_OPTIONS);
}
