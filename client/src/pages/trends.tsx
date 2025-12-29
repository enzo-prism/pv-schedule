import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import type { Meet } from "@shared/schema";
import type { MeetTrendRow } from "@shared/trends";
import {
  feetDecimalToFeetInches,
  metersToFeetInches,
  parseHeightToMeters,
  parsePoleUsed,
  parseTakeoffToFeet,
} from "@shared/metrics";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserProfile from "@/components/user-profile";

type TrendRow = MeetTrendRow & {
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

function parseMeetDate(dateString: string | Date): Date | null {
  const parsed =
    typeof dateString === "string" && dateString.match(/^\d{4}-\d{2}-\d{2}$/)
      ? new Date(`${dateString}T00:00:00`)
      : new Date(dateString);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeDate(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
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
        <Skeleton className="h-[240px] w-full" />
      </CardContent>
    </Card>
  );
}

export default function Trends() {
  const [, setLocation] = useLocation();
  const [range, setRange] = useState("90");
  const [poleMetric, setPoleMetric] = useState<PoleMetric>("lengthFt");

  const { data: meets = [], isLoading, isError } = useQuery<Meet[]>({
    queryKey: ["/api/meets"],
  });

  const trendRows = useMemo<TrendRow[]>(() => {
    const today = normalizeDate(new Date());

    return meets
      .map((meet) => {
        const meetDate = parseMeetDate(meet.date);
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
          name: meet.name ?? null,
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

  const heightPr = heightPoints.reduce<HeightPoint | null>((best, point) => {
    if (!best || point.meters > (best.meters ?? 0)) {
      return point;
    }
    return best;
  }, null);

  const heightLatest = heightPoints.length > 0 ? heightPoints[heightPoints.length - 1] : null;

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

  const takeoffBest = takeoffPoints.reduce<TakeoffPoint | null>((best, point) => {
    if (!best || point.takeoffFeet > (best.takeoffFeet ?? 0)) {
      return point;
    }
    return best;
  }, null);

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

  const handlePointClick = (id: number | string | undefined) => {
    if (id === undefined || id === null) {
      return;
    }
    setLocation(`/meet/${id}`);
  };

  const handleFilterChange = (filter: "upcoming" | "past") => {
    setLocation(`/?filter=${filter}`);
  };

  const renderHeightDot = ({ cx, cy, payload }: DotProps) => {
    if (
      cx === undefined ||
      cy === undefined ||
      !payload ||
      !("meters" in payload) ||
      payload.meters === null
    ) {
      return null;
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
      return null;
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
      return null;
    }

    if (payload.value === null) {
      return null;
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

  return (
    <div className="min-h-screen bg-white relative">
      <div className="fixed top-0 left-0 right-0 h-0.5 z-50 overflow-hidden">
        <div
          className="h-full w-[200%] animate-gradient"
          style={{
            background:
              "linear-gradient(90deg, #ff6b6b, #feca57, #48dbfb, #00d2d3, #54a0ff, #667eea, #764ba2, #ff6b6b)",
            boxShadow:
              "0 1px 15px rgba(102, 126, 234, 0.25), 0 1px 8px rgba(255, 107, 107, 0.15)",
            animation: "slide 8s linear infinite",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, #ff6b6b, #feca57, #48dbfb, #00d2d3, #54a0ff, #667eea, #764ba2)",
            filter: "blur(8px)",
            opacity: 0.4,
          }}
        />
      </div>
      <style>{`
        @keyframes slide {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-24 space-y-6">
        <div className="mb-2">
          <UserProfile name="Enzo Sison" />
        </div>

        <FilterSection currentFilter="trends" onFilterChange={handleFilterChange} />

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900">Trends</h1>
        </div>

        <Tabs value={range} onValueChange={setRange}>
          <TabsList
            aria-label="Date range"
            className="h-auto w-full flex-wrap justify-center gap-1 sm:h-10 sm:w-auto sm:flex-nowrap"
          >
            {rangeOptions.map((option) => (
              <TabsTrigger
                key={option.value}
                value={option.value}
                className="px-2.5 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm"
              >
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <TrendCardSkeleton />
            <TrendCardSkeleton />
            <TrendCardSkeleton />
          </div>
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
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
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
                  <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
                    No height data to chart yet.
                  </div>
                ) : (
                  <ChartContainer
                    config={heightChartConfig}
                    className="min-h-[240px] w-full"
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

            <Card>
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
                  <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
                    No takeoff data to chart yet.
                  </div>
                ) : (
                  <ChartContainer
                    config={takeoffChartConfig}
                    className="min-h-[240px] w-full"
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

            <Card className="lg:col-span-2">
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
                    className="min-h-[260px] w-full"
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
                            <div className="grid min-w-[14rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
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
        )}
      </main>
    </div>
  );
}
