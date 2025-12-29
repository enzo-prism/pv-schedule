import { describe, expect, it } from "vitest";
import {
  feetDecimalToFeetInches,
  metersToFeetInches,
  parseHeightToMeters,
  parsePoleUsed,
  parseTakeoffToFeet,
} from "@shared/metrics";

describe("parseHeightToMeters", () => {
  it("prefers meters when present", () => {
    expect(parseHeightToMeters("4.60m (15’1”)")).toBeCloseTo(4.6, 2);
  });

  it("parses feet and inches", () => {
    expect(parseHeightToMeters("15'1\"")).toBeCloseTo(4.597, 3);
  });

  it("returns null for junk input", () => {
    expect(parseHeightToMeters("not a height")).toBeNull();
  });

  it("returns 0 for no height entries", () => {
    expect(parseHeightToMeters("NH")).toBe(0);
    expect(parseHeightToMeters("No height")).toBe(0);
  });
});

describe("parseTakeoffToFeet", () => {
  it("parses curly quotes and inches", () => {
    expect(parseTakeoffToFeet("12’ 3”")).toBeCloseTo(12.25, 2);
  });

  it("parses feet only", () => {
    expect(parseTakeoffToFeet("12'")).toBeCloseTo(12, 2);
  });

  it("returns null for junk input", () => {
    expect(parseTakeoffToFeet("junk")).toBeNull();
  });
});

describe("parsePoleUsed", () => {
  it("parses length, rating, and flex", () => {
    const parsed = parsePoleUsed("15’ 170lbs 18.5");
    expect(parsed.lengthFt).toBeCloseTo(15, 2);
    expect(parsed.ratingLbs).toBeCloseTo(170, 2);
    expect(parsed.flex).toBeCloseTo(18.5, 2);
  });

  it("parses inches when explicitly provided", () => {
    const parsed = parsePoleUsed("170 lbs 15'6\" 18.5");
    expect(parsed.lengthFt).toBeCloseTo(15.5, 2);
    expect(parsed.ratingLbs).toBeCloseTo(170, 2);
    expect(parsed.flex).toBeCloseTo(18.5, 2);
  });

  it("always returns raw string", () => {
    expect(parsePoleUsed(null)).toEqual({ raw: "" });
  });
});

describe("unit conversion helpers", () => {
  it("converts meters to feet/inches", () => {
    expect(metersToFeetInches(4.6)).toEqual({ feet: 15, inches: 1 });
  });

  it("converts decimal feet to feet/inches", () => {
    expect(feetDecimalToFeetInches(12.25)).toEqual({ feet: 12, inches: 3 });
  });
});
