import { describe, expect, it } from "vitest";
import { seedMeets } from "@shared/fixtures/meets";
import {
  aggregateCompetitionPins,
  findCompetitionPlace,
  getUnmappedCompetitionLocations,
  normalizeCompetitionLocation,
} from "@shared/competition-map";

describe("competition map location matching", () => {
  it("normalizes flags and punctuation", () => {
    expect(normalizeCompetitionLocation("Palo Alto, CA 🇺🇸")).toBe("palo alto ca");
    expect(normalizeCompetitionLocation("New Clark City, Philippines 🇵🇭")).toBe(
      "new clark city philippines",
    );
  });

  it("matches venue-style aliases", () => {
    expect(findCompetitionPlace("UC Davis")?.id).toBe("davis-ca");
    expect(findCompetitionPlace("College of San Mateo")?.id).toBe("san-mateo-ca");
  });

  it("maps a Eugene state typo to Eugene, Oregon", () => {
    const place = findCompetitionPlace("Eugene, CA");

    expect(place?.id).toBe("eugene-or");
    expect(place?.label).toBe("Eugene, OR");
  });
});

describe("aggregateCompetitionPins", () => {
  it("groups repeated venues and calculates upcoming counts", () => {
    const pins = aggregateCompetitionPins(seedMeets, new Date("2026-04-23T12:00:00"));
    const reno = pins.find((pin) => pin.place.id === "reno-nv");
    const santaBarbara = pins.find((pin) => pin.place.id === "santa-barbara-ca");

    expect(reno?.totalCount).toBe(6);
    expect(reno?.bestHeightMeet?.heightCleared).toContain("4.60");
    expect(santaBarbara?.upcomingCount).toBe(1);
  });

  it("covers every current fixture location", () => {
    expect(getUnmappedCompetitionLocations(seedMeets)).toEqual([]);
  });
});
