import { describe, expect, it } from "vitest";
import {
  normalizeAnalyticsEvent,
  normalizeAnalyticsPath,
  normalizeAnalyticsUrl,
} from "@/lib/analytics";

describe("normalizeAnalyticsPath", () => {
  it("keeps top-level routes stable", () => {
    expect(normalizeAnalyticsPath("/")).toBe("/");
    expect(normalizeAnalyticsPath("/trends")).toBe("/trends");
    expect(normalizeAnalyticsPath("/cycle/")).toBe("/cycle");
  });

  it("masks meet detail IDs", () => {
    expect(normalizeAnalyticsPath("/meet/42")).toBe("/meet/[id]");
  });

  it("masks cycle week and day segments", () => {
    expect(normalizeAnalyticsPath("/cycle/week/4")).toBe("/cycle/week/[week]");
    expect(normalizeAnalyticsPath("/cycle/week/4/day/2")).toBe(
      "/cycle/week/[week]/day/[day]",
    );
  });
});

describe("normalizeAnalyticsUrl", () => {
  it("strips query params and hashes from home screen state", () => {
    expect(
      normalizeAnalyticsUrl("https://pv-schedule.com/?add=1&filter=past#dialog"),
    ).toBe("https://pv-schedule.com/");
  });

  it("keeps the deployment origin while masking dynamic paths", () => {
    expect(
      normalizeAnalyticsUrl("https://preview.pv-schedule.com/meet/42?ref=share"),
    ).toBe("https://preview.pv-schedule.com/meet/[id]");
  });
});

describe("normalizeAnalyticsEvent", () => {
  it("returns a copied event with a normalized url", () => {
    expect(
      normalizeAnalyticsEvent({
        type: "pageview" as const,
        url: "https://pv-schedule.com/cycle/week/8/day/3?from=calendar",
      }),
    ).toEqual({
      type: "pageview",
      url: "https://pv-schedule.com/cycle/week/[week]/day/[day]",
    });
  });
});
