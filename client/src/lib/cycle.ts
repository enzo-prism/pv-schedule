export type CycleDayId = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export type CycleSessionRow = {
  title: string;
  summary: string[];
  specifics: string[];
};

export type CycleDayDetail = {
  title: string;
  bullets: string[];
};

export type CycleDay = {
  id: CycleDayId;
  label: string;
  dateLabel?: string;
  sessionItems: CycleSessionRow[];
  detailSections?: CycleDayDetail[];
};

export type CycleWeekSummary = {
  week: number;
  window: string;
  phase: string;
};

export type CycleWeekDetails = CycleWeekSummary & {
  detailStatus: "available" | "coming-soon";
  days?: Record<CycleDayId, CycleDay>;
};

export type CycleDayNavigation = {
  prev?: CycleDayId;
  next?: CycleDayId;
  index: number;
  total: number;
};

export const cycleDayOrder = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export const cycleDayLabelById: Record<CycleDayId, string> = {
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
};

export const cycleDayShortLabelById: Record<CycleDayId, string> = {
  sun: "sun",
  mon: "mon",
  tue: "tue",
  wed: "wed",
  thu: "thu",
  fri: "fri",
  sat: "sat",
};

const sharedRoutineReferenceSections: Record<string, CycleDayDetail[]> = {
  friday: [
    {
      title: "Lift A/B",
      bullets: [
        'Lift "A"',
        "1 set = 3 reps",
        "Clean x3 @95% of max",
        "Snatch x3 @95% of max",
        "Back squat x3 @95% of max",
        "",
        "1 set = 8 reps",
        "Bench x8 @75% of max",
        "",
        'Lift "B"',
        "1 set = 3 reps",
        "Clean x3 @95% of max",
        "Incline x3 @95% of max",
        "Front squat x3 @95% of max",
      ],
    },
    {
      title: "Neuromuscular",
      bullets: [
        "Neuromuscular: 1 set = 3 reps of each @60m.",
        "Order: ex. 1 set",
        "(1) Sprint/high knees 60m.",
        "Walk back recovery",
        "(2) Sprint/high knees 60m.",
        "Walk back recovery",
        "(3) Sprint/high knees 60m.",
        "Walk one (1) full lap recovery",
        "(1) Sprint/high knees w/arm drive 60m.",
        "Walk back recovery",
        "(2) Sprint/high knees w/arm drive 60m.",
        "Walk back recovery",
        "(3) Sprint/high knees w/arm drive 60m.",
        "Walk one (1) full lap recovery",
        "(1) Wickets 60m.",
        "Walk back recovery",
        "(2) Wickets 60m.",
        "Walk back recovery",
        "(3) Wickets 60m.",
        "Walk one (1) full lap recovery",
      ],
    },
    {
      title: "Speed Drills",
      bullets: [
        "1. 2x50m uphill (Flats)",
        "2. 2x50m downhill (Flats)",
        "3. Speed Bounds (Spikes) (Each drill is 30m)",
        "First 10m is acceleration",
        "Next 20m is Speed Bounds x2",
        "4. Straight Leg Bounds (Spikes) (Each drill is 30m)",
        "First 10m is acceleration",
        "Next 20m is Straight Leg Bounds x2",
        "5. 2x50m on track (Spikes)",
      ],
    },
  ],
  saturday: [
    {
      title: "Bounding",
      bullets: [
        "1 set = 3 reps",
        "3 Step Bounds",
        "5 Step Bounds",
        "Single-leg bounds (right) 20m.",
        "Single-leg bounds (left) 20m.",
        "Use flats on a soft surface",
      ],
    },
  ],
};

const cycleDayTemplates: Record<CycleDayId, Omit<CycleDay, "id" | "dateLabel">> = {
  sun: {
    label: "Sunday",
    sessionItems: [
      {
        title: "Rest",
        summary: ["Rest"],
        specifics: ["Enjoy your day"],
      },
    ],
  },
  mon: {
    label: "Monday",
    sessionItems: [
      {
        title: "Warm up",
        summary: ["Daily warm-up order"],
        specifics: [],
      },
      {
        title: "Wickets (1 set)",
        summary: ["Wickets (1 set)"],
        specifics: ["Wickets (1 set) — 1 set = 3 x 18 wickets"],
      },
      {
        title: "Speed belt",
        summary: ["Speed belt"],
        specifics: [],
      },
      {
        title: "Wicket pole runs (1 set)",
        summary: ["Wicket pole runs (1 set)"],
        specifics: ["Wicket pole runs (1 set) — 1 set = 3 x 10 wickets"],
      },
      {
        title: "Pole runs (7 step)",
        summary: ["Pole runs (7 step)"],
        specifics: ["Pole runs (7 step), 10 reps (video)"],
      },
      {
        title: "Bar work/rings (2 sets)",
        summary: ["Bar work/rings (2 sets)"],
        specifics: ["Bar work/rings - (2x10)"],
      },
      {
        title: "Cool down",
        summary: ["- Pull ups", "- L, V, J, I", "Cool down"],
        specifics: [],
      },
    ],
  },
  tue: {
    label: "Tuesday",
    sessionItems: [
      {
        title: "Warm up",
        summary: ["Daily warm-up order"],
        specifics: [],
      },
      {
        title: "Vault tech jump (video)",
        summary: ["Vault tech jump (video)"],
        specifics: [],
      },
      {
        title: "Bar work/rings (2 sets)",
        summary: ["Bar work/rings (2 sets)"],
        specifics: ["Bar work - (2x10)"],
      },
      {
        title: "Cool down",
        summary: ["- Pull ups", "- L, V, J, I", "Cool down"],
        specifics: [],
      },
    ],
  },
  wed: {
    label: "Wednesday",
    sessionItems: [
      {
        title: "Rest",
        summary: ["Rest"],
        specifics: ["Enjoy your day"],
      },
    ],
  },
  thu: {
    label: "Thursday",
    sessionItems: [
      {
        title: "Warm up",
        summary: ["Daily warm-up order"],
        specifics: [],
      },
      {
        title: "Vault tech jump (video)",
        summary: ["Vault tech jump (video)"],
        specifics: [],
      },
      {
        title: "Bar work/rings (2 sets)",
        summary: ["Bar work/rings (2 sets)"],
        specifics: ["Bar work - (2x10)"],
      },
      {
        title: "Cool down",
        summary: ["- Pull ups", "- L, V, J, I", "Cool down"],
        specifics: [],
      },
    ],
  },
  fri: {
    label: "Friday",
    detailSections: sharedRoutineReferenceSections.friday,
    sessionItems: [
      {
        title: 'Lift "A/B" (1 set)',
        summary: ['Lift "A/B" (1 set)'],
        specifics: [],
      },
      {
        title: "Abdominals",
        summary: ["Abdominals"],
        specifics: ["Abdominals - your choice"],
      },
      {
        title: "Warm up",
        summary: ["Daily warm-up order"],
        specifics: [],
      },
      {
        title: "Speed drills (x2)",
        summary: ["Speed drills (x2), no uphills"],
        specifics: [],
      },
      {
        title: "Cool down",
        summary: ["Cool down"],
        specifics: [],
      },
    ],
  },
  sat: {
    label: "Saturday",
    detailSections: sharedRoutineReferenceSections.saturday,
    sessionItems: [
      {
        title: "Warm up",
        summary: ["Daily warm-up order"],
        specifics: [],
      },
      {
        title: "Plyometric (1 set)",
        summary: ["Plyometric (1 set)"],
        specifics: ["Plyometric - (1 set) Hurdle hops 1 set = 9 hops"],
      },
      {
        title: "Bounding (1 set)",
        summary: ["Bounding (1 set)"],
        specifics: ["9 hurdles (set height should be challenging)"],
      },
      {
        title: "Cool down",
        summary: ["Cool down"],
        specifics: [],
      },
    ],
  },
};

const weekDateLabels: Record<number, Record<CycleDayId, string>> = {
  1: {
    sun: "22",
    mon: "23",
    tue: "24",
    wed: "25",
    thu: "26",
    fri: "27",
    sat: "28",
  },
  2: {
    sun: "1",
    mon: "2",
    tue: "3",
    wed: "4",
    thu: "5",
    fri: "6",
    sat: "7",
  },
  3: {
    sun: "8",
    mon: "9",
    tue: "10",
    wed: "11",
    thu: "12",
    fri: "13",
    sat: "14",
  },
  4: {
    sun: "15",
    mon: "16",
    tue: "17",
    wed: "18",
    thu: "19",
    fri: "20",
    sat: "21",
  },
  5: {
    sun: "22",
    mon: "23",
    tue: "24",
    wed: "25",
    thu: "26",
    fri: "27",
    sat: "28",
  },
};

export function getCycleDayId(day: string): CycleDayId | undefined {
  const lower = day.toLowerCase();

  if (lower === "sun" || lower === "sunday") {
    return "sun";
  }

  if (lower === "mon" || lower === "monday") {
    return "mon";
  }

  if (lower === "tue" || lower === "tues" || lower === "tuesday") {
    return "tue";
  }

  if (lower === "wed" || lower === "wednesday") {
    return "wed";
  }

  if (lower === "thu" || lower === "thurs" || lower === "thursday") {
    return "thu";
  }

  if (lower === "fri" || lower === "friday") {
    return "fri";
  }

  if (lower === "sat" || lower === "saturday") {
    return "sat";
  }

  return undefined;
}

export function formatCycleDayLabel(dayId: CycleDayId, dateLabel?: string): string {
  return `${cycleDayLabelById[dayId]}${dateLabel ? ` ${dateLabel}` : ""}`.trim();
}

export function formatCycleDayShortLabel(dayId: CycleDayId, dateLabel?: string): string {
  return `${cycleDayShortLabelById[dayId]}${dateLabel ? ` ${dateLabel}` : ""}`.trim();
}

export function getCycleDayPreviewLabel(day: CycleDay | undefined): string {
  if (!day) {
    return "No session listed";
  }

  const isGenericDayStarter = (title: string) => {
    const normalized = title.toLowerCase();
    return (
      normalized.includes("warm up") ||
      normalized.includes("warmup") ||
      normalized.includes("cool down") ||
      normalized.includes("cooldown")
    );
  };

  const summarizeSessionLabel = (title: string) => {
    const normalized = title.toLowerCase();
    if (normalized.includes("vault tech") || normalized.includes("vault jump")) {
      return "Jump day";
    }
    if (normalized.includes("plyometric")) {
      return "Plyometrics";
    }
    if (normalized.includes("lift")) {
      return "Lift day";
    }
    if (normalized.includes("wickets")) {
      return "Wickets";
    }
    if (normalized.includes("bounding")) {
      return "Bounding";
    }
    if (normalized.includes("speed drills") || normalized.includes("speed")) {
      return "Speed work";
    }
    if (normalized.includes("abdominals")) {
      return "Abdominals";
    }
    if (normalized.includes("bar work") || normalized.includes("rings")) {
      return "Bar work";
    }
    if (normalized.includes("pole runs") || normalized.includes("pole")) {
      return "Pole runs";
    }
    return title;
  };

  const meaningfulSessionItems = day.sessionItems
    .map((item) => item.title)
    .filter((title) => !isGenericDayStarter(title.toLowerCase()));

  const focusSession = meaningfulSessionItems[0];

  if (!focusSession) {
    return "Cool-down flow";
  }

  const hasVaultFocus = day.sessionItems.some((item) =>
    item.title.toLowerCase().includes("vault tech") ||
    item.title.toLowerCase().includes("vault jump") ||
    item.summary.some((line) => line.toLowerCase().includes("vault tech")),
  );

  if (hasVaultFocus) {
    return "Jump day";
  }

  return summarizeSessionLabel(focusSession);
}

export function normalizeSessionLineForDedupe(line: string): string {
  return line
    .trim()
    .toLowerCase()
    .replace(/[().;,:!]/g, "")
    .replace(/\s+/g, " ");
}

export function getNonRedundantSessionDetails(summary: string[], specifics: string[]): string[] {
  const summarySet = new Set(summary.map((line) => normalizeSessionLineForDedupe(line)));

  return specifics.filter((line) => {
    const normalizedLine = normalizeSessionLineForDedupe(line);
    return !summarySet.has(normalizedLine);
  });
}

export function getCycleDayNavigation(
  week: number,
  day: string,
): CycleDayNavigation | undefined {
  const weekData = getCycleWeek(week);
  const dayId = getCycleDayId(day);

  if (
    !Number.isInteger(week) ||
    !dayId ||
    !weekData ||
    weekData.detailStatus !== "available" ||
    !weekData.days
  ) {
    return undefined;
  }

  const index = cycleDayOrder.indexOf(dayId);
  if (index === -1) {
    return undefined;
  }

  return {
    index,
    total: cycleDayOrder.length,
    prev: index > 0 ? cycleDayOrder[index - 1] : undefined,
    next: index < cycleDayOrder.length - 1 ? cycleDayOrder[index + 1] : undefined,
  };
}

const createWeekDays = (dateLabels: Record<CycleDayId, string>): Record<CycleDayId, CycleDay> => {
  return cycleDayOrder.reduce((acc, dayId) => {
    const template = cycleDayTemplates[dayId];
    acc[dayId] = {
      id: dayId,
      label: template.label,
      dateLabel: dateLabels[dayId],
      sessionItems: template.sessionItems,
      detailSections: template.detailSections,
    };
    return acc;
  }, {} as Record<CycleDayId, CycleDay>);
};

export const cycleWeekSummaries: CycleWeekSummary[] = [
  { week: 1, window: "Feb 22 - 28", phase: "Speed/Comp Phase (emphasis Speed)" },
  { week: 2, window: "March 1 - 7", phase: "Speed/Comp Phase (emphasis Speed)" },
  { week: 3, window: "March 8 - 14", phase: "Speed/Comp Phase (emphasis Speed)" },
  { week: 4, window: "March 15 - 21", phase: "Comp/Speed Phase (emphasis Comps)" },
  { week: 5, window: "March 22 – 28", phase: "Comp/Speed Phase (emphasis Comps)" },
  { week: 6, window: "March 29 – April 4", phase: "Active Rest" },
  { week: 7, window: "April 5 – 11", phase: "Load week 1" },
  { week: 8, window: "April 12 – 18", phase: "Load week 2" },
  { week: 9, window: "April 19 – 25", phase: "Load week 3" },
  { week: 10, window: "April 26 – May 2", phase: "Active Rest" },
  { week: 11, window: "May 3 - 9", phase: "Transition" },
  { week: 12, window: "May 10 - 16", phase: "Transition" },
  { week: 13, window: "May 17 – 23", phase: "Speed/Peak" },
  { week: 14, window: "May 24-30", phase: "Speed/Peak" },
  { week: 15, window: "June 1 – 6", phase: "Speed/Peak" },
  { week: 16, window: "June 7 – 15", phase: "National Champs" },
];

export const cycleWeekDetailsByNumber: Record<number, CycleWeekDetails> = cycleWeekSummaries.reduce(
  (acc, weekSummary) => {
    const dates = weekDateLabels[weekSummary.week];

    if (dates) {
      acc[weekSummary.week] = {
        ...weekSummary,
        detailStatus: "available",
        days: createWeekDays(dates),
      };
      return acc;
    }

    acc[weekSummary.week] = {
      ...weekSummary,
      detailStatus: "coming-soon",
    };

    return acc;
  },
  {} as Record<number, CycleWeekDetails>,
);

export function getCycleWeek(week: number): CycleWeekDetails | undefined {
  return cycleWeekDetailsByNumber[week];
}

export function getCycleDay(week: number, day: string): CycleDay | undefined {
  const weekData = getCycleWeek(week);
  const dayId = getCycleDayId(day);

  if (!weekData || weekData.detailStatus !== "available" || !dayId || !weekData.days) {
    return undefined;
  }

  return weekData.days[dayId];
}

export const getWeekByNumber = getCycleWeek;
export const getWeekDay = getCycleDay;
