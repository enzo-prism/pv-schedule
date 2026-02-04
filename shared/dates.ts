const YMD_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function isYmdDateString(value: string): boolean {
  return YMD_REGEX.test(value);
}

export function parseDateInput(value: string | Date | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  }

  if (typeof value === "string") {
    if (isYmdDateString(value)) {
      const parsed = new Date(`${value}T00:00:00`);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

export function startOfDay(value: Date): Date {
  const normalized = new Date(value.getTime());
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

export function toYmdDateString(value: string | Date | null | undefined): string | null {
  const parsed = parseDateInput(value);
  if (!parsed) {
    return null;
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isPastDate(
  value: string | Date | null | undefined,
  referenceDate: Date = new Date(),
): boolean {
  const parsed = parseDateInput(value);
  if (!parsed) {
    return false;
  }

  const reference = startOfDay(referenceDate);
  const target = startOfDay(parsed);
  return target < reference;
}

export function diffInDays(
  value: string | Date | null | undefined,
  referenceDate: Date = new Date(),
): number | null {
  const parsed = parseDateInput(value);
  if (!parsed) {
    return null;
  }

  const reference = startOfDay(referenceDate);
  const target = startOfDay(parsed);
  const diffMs = Math.abs(target.getTime() - reference.getTime());
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
