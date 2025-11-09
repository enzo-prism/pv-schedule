const DRIVE_TIME_MAP: Record<string, string> = {
  "modestoca": "~1h 25m",
  "santarosaca": "~2h 5m",
  "ucdavisca": "~2h 20m",
  "collegesanmateoca": "~35m",
  "fresnoca": "~2h 45m",
  "paloaltoca": "~25m",
  "haywardca": "~40m",
  "sanfranciscoca": "~1h",
  "hayward": "~40m",
  "paloalto": "~25m",
  "sanmateo": "~35m",
  "modesto": "~1h 25m",
  "santarosa": "~2h 5m",
  "fresno": "~2h 45m",
  "ucdavis": "~2h 20m",
  "newclarkcityphilippines": "Flight required",
  "renonv": "~3h 45m",
  "reno": "~3h 45m",
  "spokanewa": "Flight required",
  "spokane": "Flight required",
  "chicoca": "~3h 5m",
  "chico": "~3h 5m",
  "montereyca": "~1h 30m",
  "monterey": "~1h 30m",
  "azusaca": "~5h 45m",
  "azusa": "~5h 45m",
  "pleasantvalley": "~3h 5m",
  "pleasantvalleyca": "~3h 5m",
};

function normalizeLocation(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

export function getDriveTimeEstimate(location: string): string | null {
  const normalized = normalizeLocation(location);
  if (normalized in DRIVE_TIME_MAP) {
    return DRIVE_TIME_MAP[normalized];
  }

  // Try removing trailing state abbreviations like "ca"
  const withoutState = normalized.replace(/(california|ca|nevada|nv|washington|wa|usa)$/, "");
  if (withoutState && withoutState in DRIVE_TIME_MAP) {
    return DRIVE_TIME_MAP[withoutState];
  }

  return null;
}
