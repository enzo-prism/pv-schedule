type FeetInches = {
  feet: number;
  inches: number;
};

function normalizeInput(input: string | null | undefined): string {
  if (input === null || input === undefined) {
    return "";
  }

  return String(input).trim();
}

function normalizeQuotes(value: string): string {
  return value.replace(/[’‘]/g, "'").replace(/[“”]/g, "\"");
}

export function normalizeMetricInput(input: string | null | undefined): string | null {
  const raw = normalizeInput(input);
  if (!raw) {
    return null;
  }

  return normalizeQuotes(raw).replace(/\s+/g, " ").trim();
}

function toFiniteNumber(value: string | undefined): number | null {
  if (value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseFeetInches(value: string): FeetInches | null {
  const withInches = value.match(
    /(\d+(?:\.\d+)?)\s*'\s*(\d+(?:\.\d+)?)\s*(?:\"|in\b)/i,
  );

  if (withInches) {
    const feet = toFiniteNumber(withInches[1]);
    const inches = toFiniteNumber(withInches[2]);

    if (feet !== null && inches !== null) {
      return { feet, inches };
    }
  }

  const feetOnly = value.match(/(\d+(?:\.\d+)?)\s*'/);
  if (feetOnly) {
    const feet = toFiniteNumber(feetOnly[1]);
    if (feet !== null) {
      return { feet, inches: 0 };
    }
  }

  return null;
}

export function parseHeightToMeters(input: string | null | undefined): number | null {
  const raw = normalizeInput(input);
  if (!raw) {
    return null;
  }

  const normalized = normalizeQuotes(raw);
  if (/\b(nh|no height)\b/i.test(normalized)) {
    return 0;
  }
  const meterMatch = normalized.match(/(\d+(?:\.\d+)?)\s*m\b/i);
  if (meterMatch) {
    const meters = toFiniteNumber(meterMatch[1]);
    return meters ?? null;
  }

  const feetInches = parseFeetInches(normalized);
  if (!feetInches) {
    return null;
  }

  const totalInches = feetInches.feet * 12 + feetInches.inches;
  if (!Number.isFinite(totalInches)) {
    return null;
  }

  return totalInches * 0.0254;
}

export function parseTakeoffToFeet(input: string | null | undefined): number | null {
  const raw = normalizeInput(input);
  if (!raw) {
    return null;
  }

  const normalized = normalizeQuotes(raw);
  const feetInches = parseFeetInches(normalized);
  if (!feetInches) {
    return null;
  }

  const totalFeet = feetInches.feet + feetInches.inches / 12;
  return Number.isFinite(totalFeet) ? totalFeet : null;
}

export function parsePoleUsed(
  input: string | null | undefined,
): {
  lengthFt?: number;
  ratingLbs?: number;
  flex?: number;
  raw: string;
} {
  const raw = normalizeInput(input);
  if (!raw) {
    return { raw: "" };
  }

  const normalized = normalizeQuotes(raw);
  const usedRanges: Array<[number, number]> = [];

  let lengthFt: number | undefined;
  let ratingLbs: number | undefined;
  let flex: number | undefined;

  const lengthWithInches = normalized.match(
    /(\d+(?:\.\d+)?)\s*'\s*(\d+(?:\.\d+)?)\s*(?:\"|in\b)/i,
  );
  if (lengthWithInches && lengthWithInches.index !== undefined) {
    const feet = toFiniteNumber(lengthWithInches[1]);
    const inches = toFiniteNumber(lengthWithInches[2]);

    if (feet !== null && inches !== null) {
      lengthFt = feet + inches / 12;
      usedRanges.push([
        lengthWithInches.index,
        lengthWithInches.index + lengthWithInches[0].length,
      ]);
    }
  } else {
    const lengthFeetOnly = normalized.match(
      /(\d+(?:\.\d+)?)\s*(?:'|ft\b|feet\b|foot\b)/i,
    );
    if (lengthFeetOnly && lengthFeetOnly.index !== undefined) {
      const feet = toFiniteNumber(lengthFeetOnly[1]);
      if (feet !== null) {
        lengthFt = feet;
        usedRanges.push([
          lengthFeetOnly.index,
          lengthFeetOnly.index + lengthFeetOnly[0].length,
        ]);
      }
    }
  }

  const ratingMatch = normalized.match(/(\d+(?:\.\d+)?)\s*lbs?\b/i);
  if (ratingMatch && ratingMatch.index !== undefined) {
    const rating = toFiniteNumber(ratingMatch[1]);
    if (rating !== null) {
      ratingLbs = rating;
      usedRanges.push([
        ratingMatch.index,
        ratingMatch.index + ratingMatch[0].length,
      ]);
    }
  }

  const flexLabeled =
    normalized.match(/flex\s*(\d+(?:\.\d+)?)/i) ??
    normalized.match(/(\d+(?:\.\d+)?)\s*flex\b/i);

  if (flexLabeled && flexLabeled.index !== undefined) {
    const flexValue = toFiniteNumber(flexLabeled[1]);
    if (flexValue !== null) {
      flex = flexValue;
      usedRanges.push([
        flexLabeled.index,
        flexLabeled.index + flexLabeled[0].length,
      ]);
    }
  }

  if (flex === undefined) {
    const numberMatches = [...normalized.matchAll(/(\d+(?:\.\d+)?)/g)];
    for (let i = numberMatches.length - 1; i >= 0; i -= 1) {
      const match = numberMatches[i];
      const index = match.index ?? -1;
      if (index < 0) {
        continue;
      }

      const isUsed = usedRanges.some(([start, end]) => index >= start && index < end);
      if (isUsed) {
        continue;
      }

      const value = match[1];
      const numeric = toFiniteNumber(value);
      if (numeric === null) {
        continue;
      }

      const hasDecimal = value.includes(".");
      if (hasDecimal || (lengthFt !== undefined && ratingLbs !== undefined)) {
        flex = numeric;
        break;
      }
    }
  }

  const result: {
    lengthFt?: number;
    ratingLbs?: number;
    flex?: number;
    raw: string;
  } = { raw };

  if (lengthFt !== undefined) {
    result.lengthFt = lengthFt;
  }

  if (ratingLbs !== undefined) {
    result.ratingLbs = ratingLbs;
  }

  if (flex !== undefined) {
    result.flex = flex;
  }

  return result;
}

export type MetricValidationResult = {
  normalized: string | null;
  error?: string;
};

export function validateHeightCleared(
  input: string | null | undefined,
): MetricValidationResult & { meters: number | null } {
  const normalized = normalizeMetricInput(input);
  if (!normalized) {
    return { normalized: null, meters: null };
  }

  if (/\b(nh|no height)\b/i.test(normalized)) {
    return { normalized: "NH", meters: 0 };
  }

  const meters = parseHeightToMeters(normalized);
  if (meters === null) {
    return {
      normalized,
      meters: null,
      error: "Height cleared must be in meters (e.g., 4.80m) or feet/inches (e.g., 15' 9\").",
    };
  }

  return { normalized, meters };
}

export function validateTakeoff(
  input: string | null | undefined,
): MetricValidationResult & { takeoffFeet: number | null } {
  const normalized = normalizeMetricInput(input);
  if (!normalized) {
    return { normalized: null, takeoffFeet: null };
  }

  const takeoffFeet = parseTakeoffToFeet(normalized);
  if (takeoffFeet === null) {
    return {
      normalized,
      takeoffFeet: null,
      error: "Deepest takeoff must be in feet/inches (e.g., 12' 6\").",
    };
  }

  return { normalized, takeoffFeet };
}

export function validatePoleUsed(
  input: string | null | undefined,
): MetricValidationResult & { pole: ReturnType<typeof parsePoleUsed> } {
  const normalized = normalizeMetricInput(input);
  if (!normalized) {
    return { normalized: null, pole: { raw: "" } };
  }

  const pole = parsePoleUsed(normalized);
  const hasMetric =
    pole.lengthFt !== undefined || pole.ratingLbs !== undefined || pole.flex !== undefined;

  if (!hasMetric) {
    return {
      normalized,
      pole,
      error: "Pole used should include a length, rating, or flex (e.g., 14' 165 or 13' 8\" 160 flex 15.5).",
    };
  }

  return { normalized, pole };
}

export type NormalizedMeetMetrics = {
  heightCleared?: string | null;
  deepestTakeoff?: string | null;
  poleUsed?: string | null;
};

export function normalizeMeetMetrics(input: NormalizedMeetMetrics): {
  normalized: NormalizedMeetMetrics;
  errors: string[];
} {
  const errors: string[] = [];
  const normalized: NormalizedMeetMetrics = {};

  if (input.heightCleared !== undefined) {
    const height = validateHeightCleared(input.heightCleared);
    if (height.error) {
      errors.push(height.error);
    }
    normalized.heightCleared = height.normalized;
  }

  if (input.deepestTakeoff !== undefined) {
    const takeoff = validateTakeoff(input.deepestTakeoff);
    if (takeoff.error) {
      errors.push(takeoff.error);
    }
    normalized.deepestTakeoff = takeoff.normalized;
  }

  if (input.poleUsed !== undefined) {
    const pole = validatePoleUsed(input.poleUsed);
    if (pole.error) {
      errors.push(pole.error);
    }
    normalized.poleUsed = pole.normalized;
  }

  return { normalized, errors };
}

export function metersToFeetInches(meters: number): FeetInches {
  if (!Number.isFinite(meters)) {
    return { feet: 0, inches: 0 };
  }

  const totalInches = Math.round(meters / 0.0254);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return { feet, inches };
}

export function feetDecimalToFeetInches(feetDecimal: number): FeetInches {
  if (!Number.isFinite(feetDecimal)) {
    return { feet: 0, inches: 0 };
  }

  const totalInches = Math.round(feetDecimal * 12);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return { feet, inches };
}
