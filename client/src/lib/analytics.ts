const ANALYTICS_URL_BASE = "https://pv-schedule.com";

const DYNAMIC_ROUTE_PATTERNS: Array<[RegExp, string]> = [
  [/^\/meet\/[^/]+\/?$/, "/meet/[id]"],
  [/^\/cycle\/week\/[^/]+\/day\/[^/]+\/?$/, "/cycle/week/[week]/day/[day]"],
  [/^\/cycle\/week\/[^/]+\/?$/, "/cycle/week/[week]"],
];

const stripTrailingSlash = (pathname: string) => {
  if (pathname === "/") {
    return pathname;
  }

  return pathname.replace(/\/+$/, "") || "/";
};

export const normalizeAnalyticsPath = (pathOrUrl: string) => {
  const url = new URL(pathOrUrl, ANALYTICS_URL_BASE);
  const pathname = stripTrailingSlash(url.pathname);

  for (const [pattern, replacement] of DYNAMIC_ROUTE_PATTERNS) {
    if (pattern.test(pathname)) {
      return replacement;
    }
  }

  return pathname;
};

export const normalizeAnalyticsUrl = (url: string) => {
  const normalizedUrl = new URL(url, ANALYTICS_URL_BASE);
  normalizedUrl.pathname = normalizeAnalyticsPath(normalizedUrl.pathname);
  normalizedUrl.search = "";
  normalizedUrl.hash = "";
  return normalizedUrl.toString();
};

export const normalizeAnalyticsEvent = <T extends { url: string }>(event: T): T => ({
  ...event,
  url: normalizeAnalyticsUrl(event.url),
});
