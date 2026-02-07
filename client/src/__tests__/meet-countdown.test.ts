import { describe, expect, it } from "vitest";
import { formatDaysUntilLabel, isMeetCountdownUrgent } from "@/lib/meet-countdown";

describe("formatDaysUntilLabel", () => {
  it("renders Today for 0 days", () => {
    expect(formatDaysUntilLabel(0)).toBe("Today");
  });

  it("renders singular day for 1 day", () => {
    expect(formatDaysUntilLabel(1)).toBe("1 day");
  });

  it("renders plural days for 2+ days", () => {
    expect(formatDaysUntilLabel(2)).toBe("2 days");
  });
});

describe("isMeetCountdownUrgent", () => {
  it("is urgent only when exactly 1 day away", () => {
    expect(isMeetCountdownUrgent(1)).toBe(true);
    expect(isMeetCountdownUrgent(0)).toBe(false);
    expect(isMeetCountdownUrgent(2)).toBe(false);
  });
});

