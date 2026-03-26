import { isPastDate } from "@shared/dates";

const TRAILING_EMOJI_PATTERN =
  /\s*(?:[\p{Extended_Pictographic}\uFE0F\u200D]|[\u{1F1E6}-\u{1F1FF}])+$/gu;

type SanctionPrefix = "USATF" | "World Athletics";

type MeetTitleParts = {
  sanction: SanctionPrefix | null;
  title: string;
  full: string;
};

const SANCTION_PREFIXES: SanctionPrefix[] = ["USATF", "World Athletics"];

const sanitizeTitle = (name: string): string => {
  return name
    .replace(TRAILING_EMOJI_PATTERN, "")
    .trim()
    .replace(/\s+/g, " ");
};

const splitSanction = (name: string) => {
  const normalized = name.trim();

  for (const sanction of SANCTION_PREFIXES) {
    const token = `${sanction} `;
    if (normalized.startsWith(token)) {
      return {
        sanction,
        title: normalized.slice(token.length).trim(),
      };
    }
  }

  return {
    sanction: null,
    title: normalized,
  };
};

export const getMeetTitleParts = (
  name: string,
  date?: string | Date | null,
): MeetTitleParts => {
  const titleWithNoEmoji = sanitizeTitle(name);
  const { sanction, title } = splitSanction(titleWithNoEmoji);
  const effectiveSanction =
    sanction ??
    (date && !isPastDate(date) ? "USATF" : null);

  return {
    sanction: effectiveSanction,
    title,
    full: effectiveSanction ? `${effectiveSanction} ${title}` : title,
  };
};

export const formatMeetName = (
  name: string,
  date?: string | Date | null,
): string => {
  return getMeetTitleParts(name, date).full;
};
