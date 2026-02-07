export function formatDaysUntilLabel(daysUntil: number): string {
  if (daysUntil === 0) {
    return "Today";
  }

  return `${daysUntil} day${daysUntil === 1 ? "" : "s"}`;
}

export function isMeetCountdownUrgent(daysUntil: number): boolean {
  return daysUntil === 1;
}

