import { parseDateInput, startOfDay } from "@shared/dates";
import { parseHeightToMeters } from "@shared/metrics";

export type CompetitionCountryCode = "US" | "PH";

export type CompetitionPlace = {
  id: string;
  label: string;
  shortLabel: string;
  city: string;
  region: string;
  country: string;
  countryCode: CompetitionCountryCode;
  coordinates: [number, number];
  aliases: string[];
  venue?: string;
  precision: "venue" | "city" | "area";
};

export type CompetitionMapMeet = {
  id: number;
  name: string;
  date: string | Date;
  location: string;
  heightCleared?: string | null;
  place?: string | null;
};

export type CompetitionMapPin = {
  place: CompetitionPlace;
  meets: CompetitionMapMeet[];
  totalCount: number;
  pastCount: number;
  upcomingCount: number;
  latestMeet: CompetitionMapMeet | null;
  nextMeet: CompetitionMapMeet | null;
  bestHeightMeters: number | null;
  bestHeightMeet: CompetitionMapMeet | null;
};

const FLAG_REGEX = /[\u{1F1E6}-\u{1F1FF}]/gu;
const PUNCTUATION_REGEX = /[^a-z0-9\s]/g;
const WHITESPACE_REGEX = /\s+/g;

export const competitionPlaces: CompetitionPlace[] = [
  {
    id: "fresno-ca",
    label: "Fresno, CA",
    shortLabel: "Fresno",
    city: "Fresno",
    region: "California",
    country: "United States",
    countryCode: "US",
    coordinates: [-119.7871, 36.7378],
    aliases: ["Fresno, CA"],
    precision: "city",
  },
  {
    id: "modesto-ca",
    label: "Modesto, CA",
    shortLabel: "Modesto",
    city: "Modesto",
    region: "California",
    country: "United States",
    countryCode: "US",
    coordinates: [-120.9969, 37.6391],
    aliases: ["Modesto, CA"],
    precision: "city",
  },
  {
    id: "palo-alto-ca",
    label: "Palo Alto, CA",
    shortLabel: "Palo Alto",
    city: "Palo Alto",
    region: "California",
    country: "United States",
    countryCode: "US",
    coordinates: [-122.143, 37.4419],
    aliases: ["Palo Alto, CA", "Stanford", "Stanford Invite"],
    venue: "Stanford",
    precision: "city",
  },
  {
    id: "new-clark-city-ph",
    label: "New Clark City, Philippines",
    shortLabel: "New Clark City",
    city: "Capas",
    region: "Tarlac",
    country: "Philippines",
    countryCode: "PH",
    coordinates: [120.5276, 15.1746],
    aliases: ["New Clark City, Philippines", "New Clark City"],
    venue: "New Clark City Athletics Stadium",
    precision: "area",
  },
  {
    id: "davis-ca",
    label: "Davis, CA",
    shortLabel: "Davis",
    city: "Davis",
    region: "California",
    country: "United States",
    countryCode: "US",
    coordinates: [-121.7405, 38.5449],
    aliases: ["UC Davis", "Davis, CA"],
    venue: "UC Davis",
    precision: "venue",
  },
  {
    id: "san-mateo-ca",
    label: "San Mateo, CA",
    shortLabel: "San Mateo",
    city: "San Mateo",
    region: "California",
    country: "United States",
    countryCode: "US",
    coordinates: [-122.3361, 37.5349],
    aliases: ["College of San Mateo", "San Mateo, CA"],
    venue: "College of San Mateo",
    precision: "venue",
  },
  {
    id: "santa-rosa-ca",
    label: "Santa Rosa, CA",
    shortLabel: "Santa Rosa",
    city: "Santa Rosa",
    region: "California",
    country: "United States",
    countryCode: "US",
    coordinates: [-122.7141, 38.4404],
    aliases: ["Santa Rosa, CA"],
    precision: "city",
  },
  {
    id: "cavite-ph",
    label: "Cavite, Philippines",
    shortLabel: "Cavite",
    city: "Cavite",
    region: "Calabarzon",
    country: "Philippines",
    countryCode: "PH",
    coordinates: [120.896, 14.4791],
    aliases: ["Cavite, Philippines", "Cavite"],
    precision: "area",
  },
  {
    id: "hayward-ca",
    label: "Hayward, CA",
    shortLabel: "Hayward",
    city: "Hayward",
    region: "California",
    country: "United States",
    countryCode: "US",
    coordinates: [-122.0808, 37.6688],
    aliases: ["Hayward, CA"],
    precision: "city",
  },
  {
    id: "san-francisco-ca",
    label: "San Francisco, CA",
    shortLabel: "San Francisco",
    city: "San Francisco",
    region: "California",
    country: "United States",
    countryCode: "US",
    coordinates: [-122.4194, 37.7749],
    aliases: ["San Francisco, CA"],
    precision: "city",
  },
  {
    id: "makati-ph",
    label: "Makati, Philippines",
    shortLabel: "Makati",
    city: "Makati",
    region: "Metro Manila",
    country: "Philippines",
    countryCode: "PH",
    coordinates: [121.0244, 14.5547],
    aliases: ["Makati, Philippines", "Makati"],
    precision: "city",
  },
  {
    id: "reno-nv",
    label: "Reno, NV",
    shortLabel: "Reno",
    city: "Reno",
    region: "Nevada",
    country: "United States",
    countryCode: "US",
    coordinates: [-119.8138, 39.5296],
    aliases: ["Reno, NV"],
    precision: "city",
  },
  {
    id: "claremont-ca",
    label: "Claremont, CA",
    shortLabel: "Claremont",
    city: "Claremont",
    region: "California",
    country: "United States",
    countryCode: "US",
    coordinates: [-117.7198, 34.0967],
    aliases: ["Claremont, CA", "Pomona-Pitzer"],
    venue: "Pomona-Pitzer",
    precision: "city",
  },
  {
    id: "long-beach-ca",
    label: "Long Beach, CA",
    shortLabel: "Long Beach",
    city: "Long Beach",
    region: "California",
    country: "United States",
    countryCode: "US",
    coordinates: [-118.1937, 33.7701],
    aliases: ["Long Beach, CA"],
    precision: "city",
  },
  {
    id: "santa-barbara-ca",
    label: "Santa Barbara, CA",
    shortLabel: "Santa Barbara",
    city: "Santa Barbara",
    region: "California",
    country: "United States",
    countryCode: "US",
    coordinates: [-119.6982, 34.4208],
    aliases: ["Santa Barbara, CA", "UC Santa Barbara"],
    venue: "UC Santa Barbara",
    precision: "city",
  },
  {
    id: "eugene-or",
    label: "Eugene, OR",
    shortLabel: "Eugene",
    city: "Eugene",
    region: "Oregon",
    country: "United States",
    countryCode: "US",
    coordinates: [-123.0868, 44.0521],
    aliases: ["Eugene, OR", "Eugene, CA", "Oregon Twilight"],
    precision: "city",
  },
  {
    id: "los-angeles-ca",
    label: "Los Angeles, CA",
    shortLabel: "Los Angeles",
    city: "Los Angeles",
    region: "California",
    country: "United States",
    countryCode: "US",
    coordinates: [-118.2437, 34.0522],
    aliases: ["Los Angeles, CA", "LA Track Festival"],
    precision: "city",
  },
];

export function normalizeCompetitionLocation(location: string | null | undefined): string {
  if (!location) {
    return "";
  }

  return location
    .replace(FLAG_REGEX, "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(PUNCTUATION_REGEX, " ")
    .replace(WHITESPACE_REGEX, " ")
    .trim();
}

const competitionPlaceByAlias = new Map(
  competitionPlaces.flatMap((place) => [
    [normalizeCompetitionLocation(place.label), place] as const,
    [normalizeCompetitionLocation(place.shortLabel), place] as const,
    ...place.aliases.map((alias) => [normalizeCompetitionLocation(alias), place] as const),
  ]),
);

export function findCompetitionPlace(
  location: string | null | undefined,
): CompetitionPlace | null {
  const normalized = normalizeCompetitionLocation(location);
  if (!normalized) {
    return null;
  }

  return competitionPlaceByAlias.get(normalized) ?? null;
}

function compareMeetDates(a: CompetitionMapMeet, b: CompetitionMapMeet): number {
  const aDate = parseDateInput(a.date)?.getTime() ?? 0;
  const bDate = parseDateInput(b.date)?.getTime() ?? 0;
  return aDate - bDate;
}

export function aggregateCompetitionPins(
  meets: CompetitionMapMeet[],
  referenceDate: Date = new Date(),
): CompetitionMapPin[] {
  const today = startOfDay(referenceDate).getTime();
  const pinsByPlaceId = new Map<string, CompetitionMapPin>();

  meets.forEach((meet) => {
    const place = findCompetitionPlace(meet.location);
    if (!place) {
      return;
    }

    const existing = pinsByPlaceId.get(place.id);
    if (existing) {
      existing.meets.push(meet);
      return;
    }

    pinsByPlaceId.set(place.id, {
      place,
      meets: [meet],
      totalCount: 0,
      pastCount: 0,
      upcomingCount: 0,
      latestMeet: null,
      nextMeet: null,
      bestHeightMeters: null,
      bestHeightMeet: null,
    });
  });

  return Array.from(pinsByPlaceId.values())
    .map((pin) => {
      const sortedMeets = [...pin.meets].sort(compareMeetDates);
      let pastCount = 0;
      let upcomingCount = 0;
      let latestMeet: CompetitionMapMeet | null = null;
      let nextMeet: CompetitionMapMeet | null = null;
      let bestHeightMeters: number | null = null;
      let bestHeightMeet: CompetitionMapMeet | null = null;

      sortedMeets.forEach((meet) => {
        const parsedDate = parseDateInput(meet.date);
        const dateValue = parsedDate ? startOfDay(parsedDate).getTime() : 0;
        const isUpcoming = dateValue >= today;

        if (isUpcoming) {
          upcomingCount += 1;
          if (!nextMeet || dateValue < (parseDateInput(nextMeet.date)?.getTime() ?? Infinity)) {
            nextMeet = meet;
          }
        } else {
          pastCount += 1;
          latestMeet = meet;
        }

        const heightMeters = parseHeightToMeters(meet.heightCleared);
        if (heightMeters !== null && heightMeters > 0) {
          if (bestHeightMeters === null || heightMeters > bestHeightMeters) {
            bestHeightMeters = heightMeters;
            bestHeightMeet = meet;
          }
        }
      });

      return {
        ...pin,
        meets: sortedMeets,
        totalCount: sortedMeets.length,
        pastCount,
        upcomingCount,
        latestMeet: nextMeet ?? latestMeet,
        nextMeet,
        bestHeightMeters,
        bestHeightMeet,
      };
    })
    .sort((a, b) => {
      if (a.upcomingCount !== b.upcomingCount) {
        return b.upcomingCount - a.upcomingCount;
      }

      if (a.totalCount !== b.totalCount) {
        return b.totalCount - a.totalCount;
      }

      return a.place.label.localeCompare(b.place.label);
    });
}

export function getUnmappedCompetitionLocations(meets: CompetitionMapMeet[]): string[] {
  const unknown = new Set<string>();

  meets.forEach((meet) => {
    if (!findCompetitionPlace(meet.location)) {
      unknown.add(meet.location);
    }
  });

  return Array.from(unknown).sort((a, b) => a.localeCompare(b));
}
