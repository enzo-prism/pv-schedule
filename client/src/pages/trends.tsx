import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { formatLocationWithFlag } from "@/lib/location";
import { formatMeetName } from "@/lib/meet-title";
import type { Meet } from "@shared/schema";
import type { MeetTrendRow } from "@shared/trends";
import {
  feetDecimalToFeetInches,
  metersToFeetInches,
  parseHeightToMeters,
  parsePoleUsed,
  parseTakeoffToFeet,
} from "@shared/metrics";
import { parseDateInput, startOfDay } from "@shared/dates";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import FilterSection from "@/components/filter-section";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import UserProfile from "@/components/user-profile";
import PrismAnimation from "@/components/prism-animation";
import { usePageMeta } from "@/lib/use-page-meta";

type TrendRow = Omit<MeetTrendRow, "id" | "name" | "location"> & {
  id: number;
  name: string;
  location: string;
  date: Date;
  dateValue: number;
};

type HeightPoint = TrendRow & {
  meters: number | null;
};

type TakeoffPoint = TrendRow & {
  takeoffFeet: number | null;
};

type PoleMetric = "lengthFt" | "ratingLbs" | "flex";

type PolePoint = TrendRow & {
  pole: ReturnType<typeof parsePoleUsed>;
  value: number | null;
};

type DotProps = {
  cx?: number;
  cy?: number;
  payload?: HeightPoint | TakeoffPoint | PolePoint;
};

const heightChartConfig = {
  height: {
    label: "Height cleared",
    color: "hsl(var(--chart-1))",
  },
};

const takeoffChartConfig = {
  takeoff: {
    label: "Deepest takeoff",
    color: "hsl(var(--chart-2))",
  },
};

const poleChartConfig = {
  pole: {
    label: "Pole used",
    color: "hsl(var(--chart-3))",
  },
};

const rangeOptions = [
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" },
  { label: "All time", value: "all" },
];

const mobileTrendCharts = [
  { id: "height", label: "Height" },
  { id: "takeoff", label: "Takeoff" },
  { id: "pole", label: "Pole" },
];

function normalizeDate(date: Date): Date {
  return startOfDay(date);
}

function formatFeetInches(feet: number, inches: number): string {
  if (!Number.isFinite(feet) || !Number.isFinite(inches)) {
    return "";
  }

  if (inches === 0) {
    return `${feet}'`;
  }

  return `${feet}' ${inches}"`;
}

function formatMetersValue(meters: number): string {
  const formatted = meters.toFixed(2);
  const { feet, inches } = metersToFeetInches(meters);
  const imperial = formatFeetInches(feet, inches);
  return imperial ? `${formatted} m (${imperial})` : `${formatted} m`;
}

function formatMetersShort(meters: number): string {
  return `${meters.toFixed(2)} m`;
}

function formatDeltaMeters(delta: number): string {
  const abs = Math.abs(delta);
  const { feet, inches } = metersToFeetInches(abs);
  const imperial = formatFeetInches(feet, inches);
  return imperial ? `${abs.toFixed(2)} m (${imperial})` : `${abs.toFixed(2)} m`;
}

function formatTakeoffValue(feetDecimal: number): string {
  const { feet, inches } = feetDecimalToFeetInches(feetDecimal);
  return formatFeetInches(feet, inches);
}

function roundToHalfFoot(value: number): number {
  return Math.round(value * 2) / 2;
}

function formatPoleMetricValue(metric: PoleMetric, value: number): string {
  if (!Number.isFinite(value)) {
    return "";
  }

  if (metric === "lengthFt") {
    return formatTakeoffValue(roundToHalfFoot(value));
  }

  if (metric === "ratingLbs") {
    return `${value} lbs`;
  }

  return `${value} flex`;
}

function formatDateLabel(value: number, pattern: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return format(date, pattern);
}

function TrendCardSkeleton() {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-3 w-32" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[260px] w-full" />
      </CardContent>
    </Card>
  );
}

export default function Trends() {
  usePageMeta("Trends", "Review performance trends.");

  const [, setLocation] = useLocation();
  const [range, setRange] = useState("90");
  const [poleMetric, setPoleMetric] = useState<PoleMetric>("lengthFt");
  const [activeMobileChart, setActiveMobileChart] = useState(0);
  const mobileChartScrollerRef = useRef<HTMLDivElement>(null);
  const mobileChartSlideRefs = useRef<(HTMLDivElement | null)[]>([]);

  const { data: meets = [], isLoading, isError } = useQuery<Meet[]>({
    queryKey: ["/api/meets"],
  });

  const trendRows = useMemo<TrendRow[]>(() => {
    const today = normalizeDate(new Date());

    return meets
      .map((meet) => {
        const meetDate = parseDateInput(meet.date);
        if (!meetDate) {
          return null;
        }

        const normalizedDate = normalizeDate(meetDate);
        const hasMetrics = Boolean(
          meet.heightCleared || meet.poleUsed || meet.deepestTakeoff || meet.place,
        );
        const isPast = normalizedDate < today;

        if (!isPast && !hasMetrics) {
          return null;
        }

        return {
          id: meet.id,
          name: formatMeetName(meet.name ?? "", meet.date),
          location: meet.location ?? null,
          startAt: normalizedDate.toISOString(),
          date: normalizedDate,
          dateValue: normalizedDate.getTime(),
          heightClearedRaw: meet.heightCleared ?? null,
          deepestTakeoffRaw: meet.deepestTakeoff ?? null,
          poleUsedRaw: meet.poleUsed ?? null,
        };
      })
      .filter((row): row is TrendRow => row !== null)
      .sort((a, b) => a.dateValue - b.dateValue);
  }, [meets]);

  const rangedRows = useMemo(() => {
    if (range === "all") {
      return trendRows;
    }

    const days = range === "30" ? 30 : 90;
    const today = normalizeDate(new Date());
    const start = new Date(today);
    start.setDate(start.getDate() - days);

    return trendRows.filter((row) => row.date >= start && row.date <= today);
  }, [range, trendRows]);

  const heightSeries = useMemo<HeightPoint[]>(() => {
    return rangedRows.map((row) => ({
      ...row,
      meters: parseHeightToMeters(row.heightClearedRaw),
    }));
  }, [rangedRows]);

  const heightPoints = heightSeries.filter(
    (point): point is HeightPoint & { meters: number } => point.meters !== null,
  );

  const heightPr = heightPoints.reduce<(HeightPoint & { meters: number }) | null>(
    (best, point) => {
      if (!best || point.meters > best.meters) {
        return point;
      }
      return best;
    },
    null,
  );

  const heightLatest =
    heightPoints.length > 0 ? heightPoints[heightPoints.length - 1] : null;

  const takeoffSeries = useMemo<TakeoffPoint[]>(() => {
    return rangedRows.map((row) => ({
      ...row,
      takeoffFeet: parseTakeoffToFeet(row.deepestTakeoffRaw),
    }));
  }, [rangedRows]);

  const takeoffPoints = takeoffSeries.filter(
    (point): point is TakeoffPoint & { takeoffFeet: number } =>
      point.takeoffFeet !== null,
  );

  const takeoffBest = takeoffPoints.reduce<(TakeoffPoint & { takeoffFeet: number }) | null>(
    (best, point) => {
      if (!best || point.takeoffFeet > best.takeoffFeet) {
        return point;
      }
      return best;
    },
    null,
  );

  const takeoffLatest =
    takeoffPoints.length > 0 ? takeoffPoints[takeoffPoints.length - 1] : null;

  const poleSeries = useMemo<PolePoint[]>(() => {
    return rangedRows.map((row) => {
      const pole = parsePoleUsed(row.poleUsedRaw);
      const value = (() => {
        if (poleMetric === "lengthFt") {
          return pole.lengthFt !== undefined ? roundToHalfFoot(pole.lengthFt) : null;
        }

        if (poleMetric === "ratingLbs") {
          return pole.ratingLbs ?? null;
        }

        return pole.flex ?? null;
      })();

      return {
        ...row,
        pole,
        value,
      };
    });
  }, [poleMetric, rangedRows]);

  const polePoints = poleSeries.filter(
    (point): point is PolePoint & { value: number } => point.value !== null,
  );

  const poleLatest = polePoints.length > 0 ? polePoints[polePoints.length - 1] : null;

  const rangeLabel =
    rangeOptions.find((option) => option.value === range)?.label ?? "Selected range";
  const meetsInRange = rangedRows.length;
  const heightTrend =
    heightPoints.length >= 2
      ? {
          first: heightPoints[0],
          last: heightPoints[heightPoints.length - 1],
          delta: heightPoints[heightPoints.length - 1].meters - heightPoints[0].meters,
        }
      : null;
  const topVenue = useMemo<{ location: string; count: number } | null>(() => {
    const counts = new Map<string, number>();
    rangedRows.forEach((row) => {
      const location = row.location?.trim();
      if (!location) {
        return;
      }
      counts.set(location, (counts.get(location) ?? 0) + 1);
    });

    let top: { location: string; count: number } | null = null;
    counts.forEach((count, location) => {
      if (!top || count > top.count) {
        top = { location, count };
      }
    });

    return top;
  }, [rangedRows]);

  const handlePointClick = (id: number | string | undefined) => {
    if (id === undefined || id === null) {
      return;
    }
    setLocation(`/meet/${id}`);
  };

  const handleMobileChartScroll = () => {
    const scroller = mobileChartScrollerRef.current;
    if (!scroller) {
      return;
    }

    const chartWidth = scroller.clientWidth;
    if (chartWidth <= 0) {
      return;
    }

    const next = Math.min(
      mobileTrendCharts.length - 1,
      Math.max(0, Math.round(scroller.scrollLeft / chartWidth)),
    );
    setActiveMobileChart((current) => (current === next ? current : next));
  };

  const scrollToMobileChart = (index: number) => {
    const chartCard = mobileChartSlideRefs.current[index];
    if (!chartCard) {
      return;
    }

    chartCard.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    setActiveMobileChart(index);
  };

  const renderHeightDot = ({ cx, cy, payload }: DotProps) => {
    if (
      cx === undefined ||
      cy === undefined ||
      !payload ||
      !("meters" in payload) ||
      payload.meters === null
    ) {
      return <circle cx={0} cy={0} r={0} fill="transparent" pointerEvents="none" />;
    }

    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill="var(--color-height)"
        stroke="hsl(var(--background))"
        strokeWidth={2}
        className="cursor-pointer"
        onClick={() => handlePointClick(payload.id)}
      />
    );
  };

  const renderTakeoffDot = ({ cx, cy, payload }: DotProps) => {
    if (
      cx === undefined ||
      cy === undefined ||
      !payload ||
      !("takeoffFeet" in payload) ||
      payload.takeoffFeet === null
    ) {
      return <circle cx={0} cy={0} r={0} fill="transparent" pointerEvents="none" />;
    }

    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill="var(--color-takeoff)"
        stroke="hsl(var(--background))"
        strokeWidth={2}
        className="cursor-pointer"
        onClick={() => handlePointClick(payload.id)}
      />
    );
  };

  const renderPoleDot = ({ cx, cy, payload }: DotProps) => {
    if (cx === undefined || cy === undefined || !payload || !("value" in payload)) {
      return <circle cx={0} cy={0} r={0} fill="transparent" pointerEvents="none" />;
    }

    if (payload.value === null) {
      return <circle cx={0} cy={0} r={0} fill="transparent" pointerEvents="none" />;
    }

    return (
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill="var(--color-pole)"
        stroke="hsl(var(--background))"
        strokeWidth={2}
        className="cursor-pointer"
        onClick={() => handlePointClick(payload.id)}
      />
    );
  };

  const heightSummary =
    heightLatest && heightPr
      ? `Latest ${formatMetersValue(heightLatest.meters)} · PR ${formatMetersValue(heightPr.meters)}`
      : "No height data yet";

  const takeoffSummary =
    takeoffLatest && takeoffBest
      ? `Latest ${formatTakeoffValue(takeoffLatest.takeoffFeet)} · Best ${formatTakeoffValue(
          takeoffBest.takeoffFeet,
        )}`
      : "No takeoff data yet";

  const poleSummary =
    poleLatest && poleLatest.value !== null
      ? `Latest ${formatPoleMetricValue(poleMetric, poleLatest.value)}`
      : "No pole data yet";
  const heightPrValue = heightPr ? formatMetersShort(heightPr.meters) : "—";
  const heightPrImperial = heightPr
    ? (() => {
        const { feet, inches } = metersToFeetInches(heightPr.meters);
        return formatFeetInches(feet, inches);
      })()
    : null;
  const takeoffBestValue = takeoffBest ? formatTakeoffValue(takeoffBest.takeoffFeet) : "—";

  const heightTrendLabel = (() => {
    if (!heightTrend) {
      return "Add at least two height entries to see a trend.";
    }
    if (Math.abs(heightTrend.delta) < 0.01) {
      return "Flat since the first height in range.";
    }
    const direction = heightTrend.delta > 0 ? "Up" : "Down";
    return `${direction} ${formatDeltaMeters(heightTrend.delta)} since the first height in range.`;
  })();

  const venueInsightLabel = topVenue
    ? `${formatLocationWithFlag(topVenue.location)} (${topVenue.count} meet${topVenue.count !== 1 ? "s" : ""})`
    : "Add more meets for venue insights.";

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden pb-app-nav">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-7 pb-24 space-y-6">
        <section className="sticky top-0 z-30 rounded-b-3xl border-b border-white/10 bg-background/90 px-4 py-3 backdrop-blur-xl sm:px-6 sm:py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <UserProfile name="Enzo Sison" />
            </div>
            <FilterSection
              currentPage="trends"
              className="self-start sm:self-end"
            />
          </div>
          <div className="mt-4 flex justify-center">
            <PrismAnimation className="h-28 w-28 sm:h-32 sm:w-32" />
          </div>

          <div className="mt-4">
            <h1 className="text-2xl font-semibold text-foreground">Trends</h1>
          </div>

          <div className="mt-4">
            <div
              aria-label="Date range"
              className="inline-flex w-full items-center gap-1 overflow-x-auto whitespace-nowrap rounded-full border border-white/10 bg-card/45 p-1.5 backdrop-blur-sm [scrollbar-width:none]"
            >
              {rangeOptions.map((option) => {
                const isActive = range === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRange(option.value)}
                    className={`inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-3 py-2.5 text-sm font-medium transition-colors min-h-[40px] whitespace-nowrap ${
                      isActive
                        ? "bg-white/10 text-foreground"
                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    }`}
                    aria-pressed={isActive}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        ) : isError ? null : (
          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Meets</p>
                <div className="mt-2 text-2xl font-semibold text-foreground">{meetsInRange}</div>
                <p className="mt-1 text-xs text-muted-foreground">{rangeLabel}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Height PR</p>
                <div className="mt-2 text-2xl font-semibold text-foreground">{heightPrValue}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {heightPrImperial || "No height data"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Best Takeoff</p>
                <div className="mt-2 text-2xl font-semibold text-foreground">{takeoffBestValue}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {takeoffBest ? "Best in range" : "No takeoff data"}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {isLoading ? (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            </CardContent>
          </Card>
        ) : isError ? null : (
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Insights</p>
              <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300/70" />
                  <span>
                    <span className="text-foreground">Height trend:</span> {heightTrendLabel}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-300/70" />
                  <span>
                    <span className="text-foreground">Most visited venue:</span>{" "}
                    {venueInsightLabel}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <>
            <div className="mb-3 flex gap-2 overflow-x-auto px-4 -mx-4 pb-1 sm:hidden">
              {mobileTrendCharts.map((chart) => (
                <button
                  type="button"
                  key={chart.id}
                  className="rounded-full border border-border/80 bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground"
                  disabled
                >
                  {chart.label}
                </button>
              ))}
            </div>

            <div className="sm:hidden">
              <div
                ref={mobileChartScrollerRef}
                onScroll={handleMobileChartScroll}
                className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 [scroll-snap-type:x_mandatory]"
              >
                <div
                  ref={(element) => {
                    mobileChartSlideRefs.current[0] = element;
                  }}
                  className="min-w-full snap-start"
                >
                  <TrendCardSkeleton />
                </div>
                <div
                  ref={(element) => {
                    mobileChartSlideRefs.current[1] = element;
                  }}
                  className="min-w-full snap-start"
                >
                  <TrendCardSkeleton />
                </div>
                <div
                  ref={(element) => {
                    mobileChartSlideRefs.current[2] = element;
                  }}
                  className="min-w-full snap-start"
                >
                  <TrendCardSkeleton />
                </div>
              </div>
            </div>

            <div className="hidden sm:grid sm:grid-cols-1 gap-6 lg:grid-cols-2">
              <TrendCardSkeleton />
              <TrendCardSkeleton />
              <TrendCardSkeleton />
            </div>
          </>
        ) : isError ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Unable to load trends</CardTitle>
              <CardDescription>
                Please refresh the page or try again later.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <>
            <div className="mb-3 flex gap-2 overflow-x-auto px-4 -mx-4 pb-1 sm:hidden">
              {mobileTrendCharts.map((chart, index) => (
                <button
                  type="button"
                  key={chart.id}
                  onClick={() => scrollToMobileChart(index)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    activeMobileChart === index
                      ? "border-primary/70 bg-primary text-primary-foreground"
                      : "border-border/80 bg-background text-muted-foreground"
                  }`}
                >
                  {chart.label}
                </button>
              ))}
            </div>

            <div className="sm:hidden">
              <div
                ref={mobileChartScrollerRef}
                onScroll={handleMobileChartScroll}
                className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 [scroll-snap-type:x_mandatory]"
              >
                <div
                  ref={(element) => {
                    mobileChartSlideRefs.current[0] = element;
                  }}
                  className="min-w-full snap-start"
                >
                  <Card className="min-w-0">
                    <CardHeader className="pb-4 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg">Height Cleared</CardTitle>
                        </div>
                        {heightPr && (
                          <Badge variant="secondary">PR {heightPr.meters.toFixed(2)}m</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{heightSummary}</p>
                    </CardHeader>
                    <CardContent>
                      {heightSeries.length === 0 || heightPoints.length === 0 ? (
                        <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                          No height data to chart yet.
                        </div>
                      ) : (
                        <ChartContainer
                          config={heightChartConfig}
                          className="h-[260px] w-full overflow-hidden sm:h-[320px] sm:aspect-video sm:overflow-visible"
                        >
                          <AreaChart data={heightSeries} margin={{ left: 12, right: 12 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                              dataKey="dateValue"
                              type="number"
                              domain={["dataMin", "dataMax"]}
                              tickLine={false}
                              axisLine={false}
                              tickMargin={8}
                              tickFormatter={(value) => formatDateLabel(Number(value), "MMM d")}
                              interval="preserveStartEnd"
                            />
                            <YAxis
                              tickLine={false}
                              axisLine={false}
                              tickMargin={8}
                              width={36}
                              tickFormatter={(value) => Number(value).toFixed(2)}
                            />
                            <ChartTooltip
                              cursor={false}
                              content={
                                <ChartTooltipContent
                                  className="max-w-[calc(100vw-2rem)] sm:max-w-none"
                                  labelFormatter={(value) =>
                                    formatDateLabel(Number(value), "MMM d, yyyy")
                                  }
                                  formatter={(value) => {
                                    if (typeof value !== "number") {
                                      return null;
                                    }
                                    const { feet, inches } = metersToFeetInches(value);
                                    return (
                                      <div className="flex flex-col gap-1">
                                        <span className="font-mono text-foreground">
                                          {value.toFixed(2)} m
                                        </span>
                                        <span className="text-muted-foreground">
                                          {formatFeetInches(feet, inches)}
                                        </span>
                                      </div>
                                    );
                                  }}
                                />
                              }
                            />
                            <Area
                              type="monotone"
                              dataKey="meters"
                              stroke="var(--color-height)"
                              fill="var(--color-height)"
                              fillOpacity={0.2}
                              strokeWidth={2}
                              dot={renderHeightDot}
                              activeDot={{ r: 6 }}
                            />
                            {heightPr && (
                              <ReferenceDot
                                x={heightPr.dateValue}
                                y={heightPr.meters ?? 0}
                                r={6}
                                fill="var(--color-height)"
                                stroke="hsl(var(--background))"
                                strokeWidth={2}
                                isFront
                              />
                            )}
                          </AreaChart>
                        </ChartContainer>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div
                  ref={(element) => {
                    mobileChartSlideRefs.current[1] = element;
                  }}
                  className="min-w-full snap-start"
                >
                  <Card className="min-w-0">
                    <CardHeader className="pb-4 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg">Deepest Takeoff</CardTitle>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{takeoffSummary}</p>
                    </CardHeader>
                    <CardContent>
                      {takeoffSeries.length === 0 || takeoffPoints.length === 0 ? (
                        <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                          No takeoff data to chart yet.
                        </div>
                      ) : (
                        <ChartContainer
                          config={takeoffChartConfig}
                          className="h-[260px] w-full overflow-hidden sm:h-[320px] sm:aspect-video sm:overflow-visible"
                        >
                          <LineChart data={takeoffSeries} margin={{ left: 12, right: 12 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                              dataKey="dateValue"
                              type="number"
                              domain={["dataMin", "dataMax"]}
                              tickLine={false}
                              axisLine={false}
                              tickMargin={8}
                              tickFormatter={(value) => formatDateLabel(Number(value), "MMM d")}
                              interval="preserveStartEnd"
                            />
                            <YAxis
                              tickLine={false}
                              axisLine={false}
                              tickMargin={8}
                              width={36}
                              tickFormatter={(value) => Number(value).toFixed(2)}
                            />
                            <ChartTooltip
                              cursor={false}
                              content={
                                <ChartTooltipContent
                                  className="max-w-[calc(100vw-2rem)] sm:max-w-none"
                                  labelFormatter={(value) =>
                                    formatDateLabel(Number(value), "MMM d, yyyy")
                                  }
                                  formatter={(value) => {
                                    if (typeof value !== "number") {
                                      return null;
                                    }
                                    const { feet, inches } = feetDecimalToFeetInches(value);
                                    return (
                                      <div className="flex flex-col gap-1">
                                        <span className="font-mono text-foreground">
                                          {value.toFixed(2)} ft
                                        </span>
                                        <span className="text-muted-foreground">
                                          {formatFeetInches(feet, inches)}
                                        </span>
                                      </div>
                                    );
                                  }}
                                />
                              }
                            />
                            <Line
                              type="monotone"
                              dataKey="takeoffFeet"
                              stroke="var(--color-takeoff)"
                              strokeWidth={2}
                              dot={renderTakeoffDot}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ChartContainer>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div
                  ref={(element) => {
                    mobileChartSlideRefs.current[2] = element;
                  }}
                  className="min-w-full snap-start"
                >
                  <Card className="min-w-0">
                    <CardHeader className="pb-4 space-y-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <CardTitle className="text-lg">Pole Used</CardTitle>
                        </div>
                        <Select
                          value={poleMetric}
                          onValueChange={(value) => setPoleMetric(value as PoleMetric)}
                        >
                          <SelectTrigger
                            className="w-full sm:w-[200px]"
                            aria-label="Select pole metric"
                          >
                            <SelectValue placeholder="Select metric" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lengthFt">Pole Length (ft)</SelectItem>
                            <SelectItem value="ratingLbs">Rating (lbs)</SelectItem>
                            <SelectItem value="flex">Flex</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-xs text-muted-foreground">{poleSummary}</p>
                    </CardHeader>
                    <CardContent>
                      {poleSeries.length === 0 || polePoints.length === 0 ? (
                        <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                          No pole data to chart yet.
                        </div>
                      ) : (
                        <ChartContainer
                          config={poleChartConfig}
                          className="h-[260px] w-full overflow-hidden sm:h-[320px] sm:aspect-video sm:overflow-visible"
                        >
                          <LineChart data={poleSeries} margin={{ left: 12, right: 12 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                              dataKey="dateValue"
                              type="number"
                              domain={["dataMin", "dataMax"]}
                              tickLine={false}
                              axisLine={false}
                              tickMargin={8}
                              tickFormatter={(value) => formatDateLabel(Number(value), "MMM d")}
                              interval="preserveStartEnd"
                            />
                            <YAxis
                              dataKey="value"
                              type="number"
                              domain={["dataMin", "dataMax"]}
                              reversed={poleMetric === "flex"}
                              tickLine={false}
                              axisLine={false}
                              tickMargin={8}
                              width={36}
                              tickFormatter={(value) => formatPoleMetricValue(poleMetric, Number(value))}
                            />
                            <ChartTooltip
                              cursor={false}
                              content={({ active, payload }) => {
                                if (!active || !payload?.length) {
                                  return null;
                                }

                                const data = payload[0]?.payload as PolePoint | undefined;
                                if (!data) {
                                  return null;
                                }

                                const label = format(data.date, "MMM d, yyyy");
                                const length =
                                  data.pole.lengthFt !== undefined
                                    ? formatTakeoffValue(roundToHalfFoot(data.pole.lengthFt))
                                    : "—";
                                const rating =
                                  data.pole.ratingLbs !== undefined
                                    ? `${data.pole.ratingLbs} lbs`
                                    : "—";
                                const flexValue =
                                  data.pole.flex !== undefined ? `${data.pole.flex} flex` : "—";

                                return (
                                  <div className="grid w-full min-w-[14rem] max-w-[calc(100vw-2rem)] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-none sm:max-w-none">
                                    <div className="font-medium text-foreground">
                                      {data.name || "Meet"} · {label}
                                    </div>
                                    <div className="text-muted-foreground break-words">
                                      {data.pole.raw || "No pole details recorded"}
                                    </div>
                                    <div className="grid gap-1 pt-1">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Length</span>
                                        <span className="font-mono text-foreground">{length}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Rating</span>
                                        <span className="font-mono text-foreground">{rating}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Flex</span>
                                        <span className="font-mono text-foreground">{flexValue}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="var(--color-pole)"
                              strokeWidth={2}
                              dot={renderPoleDot}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ChartContainer>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            <div className="hidden sm:grid sm:grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="min-w-0">
                <CardHeader className="pb-4 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">Height Cleared</CardTitle>
                    </div>
                    {heightPr && (
                      <Badge variant="secondary">PR {heightPr.meters.toFixed(2)}m</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{heightSummary}</p>
                </CardHeader>
                <CardContent>
                  {heightSeries.length === 0 || heightPoints.length === 0 ? (
                    <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                      No height data to chart yet.
                    </div>
                  ) : (
                    <ChartContainer
                      config={heightChartConfig}
                      className="h-[260px] w-full overflow-hidden sm:h-[320px] sm:aspect-video sm:overflow-visible"
                    >
                      <AreaChart data={heightSeries} margin={{ left: 12, right: 12 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="dateValue"
                          type="number"
                          domain={["dataMin", "dataMax"]}
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          tickFormatter={(value) => formatDateLabel(Number(value), "MMM d")}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          width={36}
                          tickFormatter={(value) => Number(value).toFixed(2)}
                        />
                        <ChartTooltip
                          cursor={false}
                          content={
                            <ChartTooltipContent
                              className="max-w-[calc(100vw-2rem)] sm:max-w-none"
                              labelFormatter={(value) =>
                                formatDateLabel(Number(value), "MMM d, yyyy")
                              }
                              formatter={(value) => {
                                if (typeof value !== "number") {
                                  return null;
                                }
                                const { feet, inches } = metersToFeetInches(value);
                                return (
                                  <div className="flex flex-col gap-1">
                                    <span className="font-mono text-foreground">
                                      {value.toFixed(2)} m
                                    </span>
                                    <span className="text-muted-foreground">
                                      {formatFeetInches(feet, inches)}
                                    </span>
                                  </div>
                                );
                              }}
                            />
                          }
                        />
                        <Area
                          type="monotone"
                          dataKey="meters"
                          stroke="var(--color-height)"
                          fill="var(--color-height)"
                          fillOpacity={0.2}
                          strokeWidth={2}
                          dot={renderHeightDot}
                          activeDot={{ r: 6 }}
                        />
                        {heightPr && (
                          <ReferenceDot
                            x={heightPr.dateValue}
                            y={heightPr.meters ?? 0}
                            r={6}
                            fill="var(--color-height)"
                            stroke="hsl(var(--background))"
                            strokeWidth={2}
                            isFront
                          />
                        )}
                      </AreaChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="min-w-0">
                <CardHeader className="pb-4 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">Deepest Takeoff</CardTitle>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{takeoffSummary}</p>
                </CardHeader>
                <CardContent>
                  {takeoffSeries.length === 0 || takeoffPoints.length === 0 ? (
                    <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                      No takeoff data to chart to chart yet.
                    </div>
                  ) : (
                    <ChartContainer
                      config={takeoffChartConfig}
                      className="h-[260px] w-full overflow-hidden sm:h-[320px] sm:aspect-video sm:overflow-visible"
                    >
                      <LineChart data={takeoffSeries} margin={{ left: 12, right: 12 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="dateValue"
                          type="number"
                          domain={["dataMin", "dataMax"]}
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          tickFormatter={(value) => formatDateLabel(Number(value), "MMM d")}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          width={36}
                          tickFormatter={(value) => Number(value).toFixed(2)}
                        />
                        <ChartTooltip
                          cursor={false}
                          content={
                            <ChartTooltipContent
                              className="max-w-[calc(100vw-2rem)] sm:max-w-none"
                              labelFormatter={(value) =>
                                formatDateLabel(Number(value), "MMM d, yyyy")
                              }
                              formatter={(value) => {
                                if (typeof value !== "number") {
                                  return null;
                                }
                                const { feet, inches } = feetDecimalToFeetInches(value);
                                return (
                                  <div className="flex flex-col gap-1">
                                    <span className="font-mono text-foreground">
                                      {value.toFixed(2)} ft
                                    </span>
                                    <span className="text-muted-foreground">
                                      {formatFeetInches(feet, inches)}
                                    </span>
                                  </div>
                                );
                              }}
                            />
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey="takeoffFeet"
                          stroke="var(--color-takeoff)"
                          strokeWidth={2}
                          dot={renderTakeoffDot}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="min-w-0 lg:col-span-2">
                <CardHeader className="pb-4 space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-lg">Pole Used</CardTitle>
                    </div>
                    <Select
                      value={poleMetric}
                      onValueChange={(value) => setPoleMetric(value as PoleMetric)}
                    >
                      <SelectTrigger
                        className="w-full sm:w-[200px]"
                        aria-label="Select pole metric"
                      >
                        <SelectValue placeholder="Select metric" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lengthFt">Pole Length (ft)</SelectItem>
                        <SelectItem value="ratingLbs">Rating (lbs)</SelectItem>
                        <SelectItem value="flex">Flex</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">{poleSummary}</p>
                </CardHeader>
                <CardContent>
                  {poleSeries.length === 0 || polePoints.length === 0 ? (
                    <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                      No pole data to chart yet.
                    </div>
                  ) : (
                    <ChartContainer
                      config={poleChartConfig}
                      className="h-[260px] w-full overflow-hidden sm:h-[320px] sm:aspect-video sm:overflow-visible"
                    >
                      <LineChart data={poleSeries} margin={{ left: 12, right: 12 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="dateValue"
                          type="number"
                          domain={["dataMin", "dataMax"]}
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          tickFormatter={(value) => formatDateLabel(Number(value), "MMM d")}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          dataKey="value"
                          type="number"
                          domain={["dataMin", "dataMax"]}
                          reversed={poleMetric === "flex"}
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          width={36}
                          tickFormatter={(value) => formatPoleMetricValue(poleMetric, Number(value))}
                        />
                        <ChartTooltip
                          cursor={false}
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) {
                              return null;
                            }

                            const data = payload[0]?.payload as PolePoint | undefined;
                            if (!data) {
                              return null;
                            }

                            const label = format(data.date, "MMM d, yyyy");
                            const length =
                              data.pole.lengthFt !== undefined
                                ? formatTakeoffValue(roundToHalfFoot(data.pole.lengthFt))
                                : "—";
                            const rating =
                              data.pole.ratingLbs !== undefined
                                ? `${data.pole.ratingLbs} lbs`
                                : "—";
                            const flexValue =
                              data.pole.flex !== undefined ? `${data.pole.flex} flex` : "—";

                            return (
                              <div className="grid w-full min-w-[14rem] max-w-[calc(100vw-2rem)] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-none sm:max-w-none">
                                <div className="font-medium text-foreground">
                                  {data.name || "Meet"} · {label}
                                </div>
                                <div className="text-muted-foreground break-words">
                                  {data.pole.raw || "No pole details recorded"}
                                </div>
                                <div className="grid gap-1 pt-1">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Length</span>
                                    <span className="font-mono text-foreground">{length}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Rating</span>
                                    <span className="font-mono text-foreground">{rating}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Flex</span>
                                    <span className="font-mono text-foreground">{flexValue}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="var(--color-pole)"
                          strokeWidth={2}
                          dot={renderPoleDot}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
