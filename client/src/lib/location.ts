const philippinesKeywordMap: string[] = [
  "philippines",
  "manila",
  "cebu",
  "davao",
  "quezon",
  "makati",
  "pasay",
  "taguig",
  "manila city",
  "bulacan",
  "marikina",
  "mandaue",
  "quezon city",
  "manila metro",
];

const philippinesRegex = new RegExp(philippinesKeywordMap.join("|"), "i");

function stripLocationFlag(location: string): string {
  return location
    .replace(/\s*(?:🇺🇸|🇵🇭)\s*$/u, "")
    .trim()
    .replace(/\s{2,}/g, " ");
}

export function formatLocationWithFlag(location: string | null | undefined): string {
  if (!location) {
    return "—";
  }

  const baseLocation = stripLocationFlag(location.trim());
  if (baseLocation.length === 0) {
    return "—";
  }

  const isPhilippines = philippinesRegex.test(baseLocation);
  return `${baseLocation} ${isPhilippines ? "🇵🇭" : "🇺🇸"}`;
}

