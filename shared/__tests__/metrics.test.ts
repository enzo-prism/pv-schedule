import { describe, expect, it } from "vitest";
import {
  normalizeMetricInput,
  parseHeightToMeters,
  parsePoleUsed,
  parseTakeoffToFeet,
  validateHeightCleared,
  validatePoleUsed,
  validateTakeoff,
} from "@shared/metrics";

describe("metrics parsing", () => {
  it("parses height in meters", () => {
    expect(parseHeightToMeters("4.80m")).toBeCloseTo(4.8, 3);
  });

  it("parses height in feet/inches", () => {
    expect(parseHeightToMeters("15' 9\"")).toBeCloseTo(4.8006, 3);
  });

  it("handles no-height input", () => {
    expect(parseHeightToMeters("NH")).toBe(0);
  });

  it("parses takeoff in feet/inches", () => {
    expect(parseTakeoffToFeet("12' 6\"")).toBeCloseTo(12.5, 3);
  });

  it("parses pole details", () => {
    const parsed = parsePoleUsed("14' 165");
    expect(parsed.lengthFt).toBeCloseTo(14, 3);
    expect(parsed.ratingLbs).toBe(165);
  });
});

describe("metrics validation and normalization", () => {
  it("normalizes curly quotes", () => {
    expect(normalizeMetricInput(" 15’ 9” ")).toBe("15' 9\"");
  });

  it("validates height input", () => {
    const result = validateHeightCleared("15' 3\"");
    expect(result.error).toBeUndefined();
    expect(result.normalized).toBe("15' 3\"");
  });

  it("rejects invalid height input", () => {
    const result = validateHeightCleared("bad height");
    expect(result.error).toBeTruthy();
  });

  it("validates takeoff input", () => {
    const result = validateTakeoff("11' 0\"");
    expect(result.error).toBeUndefined();
  });

  it("rejects invalid takeoff input", () => {
    const result = validateTakeoff("nope");
    expect(result.error).toBeTruthy();
  });

  it("validates pole input", () => {
    const result = validatePoleUsed("13' 160");
    expect(result.error).toBeUndefined();
  });

  it("rejects unparseable pole input", () => {
    const result = validatePoleUsed("unknown");
    expect(result.error).toBeTruthy();
  });
});
