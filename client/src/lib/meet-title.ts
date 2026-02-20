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

const MEET_EMOJI_BY_TITLE: Record<string, string> = {
  "west coast relays": "🏃‍♀️",
  "jack albiani invitational": "🥇",
  "stanford invite": "🎓",
  "philippine national championship": "🏅",
  "aggie open": "🚀",
  "bulldog invite": "🐶",
  "pat ryan invite": "🎯",
  "patafa pole vault challenge": "🧗",
  "chabot finale": "🌅",
  "johnny mathis invitational": "🎤",
  "atletang ayala world pole vault challenge": "🪂",
  "rta winterfest indoor": "⛷️",
  "reno holiday invite": "🎄",
  "silver state invite": "⛰️",
  "pole vault summit": "🏔️",
  "wolf pack classic": "🐺",
  "battle born invitational": "⚔️",
  "beach opener": "🏖️",
  "ben brown invitational": "🎖️",
  "triton invitational": "🐬",
  "mt. sac relays bronze cont. tour": "🥉",
  "duke invitational": "🦁",
  "bryan clay invitational": "🗽",
  "beach invitational": "🌴",
  "uc santa barbara invitational": "🏄",
  "penn relays silver cont. tour": "🚩",
  "fresno state invitational": "🌾",
  "payton jordan @ stanford": "🎧",
  "titan tuneup": "⚙️",
  "oregon twilight": "🌇",
  "la track festival silver cont. tour": "🎉",
};

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

const getEmojiForTitle = (name: string): string => {
  const normalizedName = name.trim().toLowerCase();

  if (MEET_EMOJI_BY_TITLE[normalizedName]) {
    return MEET_EMOJI_BY_TITLE[normalizedName];
  }

  if (normalizedName.includes("relay")) {
    return "🏁";
  }

  if (normalizedName.includes("invite")) {
    return "🏆";
  }

  if (normalizedName.includes("tournament") || normalizedName.includes("championship")) {
    return "🏅";
  }

  return "🏟️";
};

export const getMeetTitleParts = (
  name: string,
  date?: string | Date | null,
): MeetTitleParts => {
  const titleWithNoEmoji = sanitizeTitle(name);
  const { sanction, title } = splitSanction(titleWithNoEmoji);
  const emoji = getEmojiForTitle(title);
  const effectiveSanction =
    sanction ??
    (date && !isPastDate(date) ? "USATF" : null);
  const decoratedTitle = `${title} ${emoji}`.trim();

  return {
    sanction: effectiveSanction,
    title: decoratedTitle,
    full: effectiveSanction ? `${effectiveSanction} ${decoratedTitle}` : decoratedTitle,
  };
};

export const formatMeetName = (
  name: string,
  date?: string | Date | null,
): string => {
  return getMeetTitleParts(name, date).full;
};
