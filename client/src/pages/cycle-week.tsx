import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import FilterSection from "@/components/filter-section";
import UserProfile from "@/components/user-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cycleDayLabelById, cycleDayOrder, formatCycleDayLabel, getCycleWeek } from "@/lib/cycle";
import { usePageMeta } from "@/lib/use-page-meta";

export default function CycleWeek() {
  const [, params] = useRoute("/cycle/week/:week");
  const rawWeek = params?.week;
  const week = Number(rawWeek);
  const weekData = Number.isInteger(week) ? getCycleWeek(week) : undefined;
  const pageTitle = Number.isInteger(week)
    ? `Cycle W${week}`
    : "Cycle week";
  const pageDescription = weekData
    ? `Day-by-day view for cycle week ${weekData.week}.`
    : "Open a cycle week and day sessions.";
  usePageMeta(pageTitle || "Cycle Week", pageDescription);

  if (!rawWeek || !weekData) {
    return (
      <div className="min-h-screen bg-background pb-app-nav">
        <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-7 pb-16">
          <section className="sticky top-0 z-30 rounded-b-3xl border-b border-white/10 bg-background/90 px-4 py-3 backdrop-blur-xl sm:px-6 sm:py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <UserProfile name="Enzo Sison" />
              <FilterSection
                currentPage="cycle"
                className="self-start sm:self-auto"
              />
            </div>
          </section>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Week not found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">
                We could not find that cycle week. Open the cycle overview and pick a valid week.
              </p>
              <Link href="/cycle">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to cycle
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const isAvailable = weekData.detailStatus === "available";

  return (
    <div className="min-h-screen bg-background pb-app-nav">
      <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-7 pb-16">
        <section className="sticky top-0 z-30 rounded-b-3xl border-b border-white/10 bg-background/90 px-4 py-3 backdrop-blur-xl sm:px-6 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <UserProfile name="Enzo Sison" />
            <FilterSection
              currentPage="cycle"
              className="self-start sm:self-auto"
            />
          </div>
        </section>

        <Card className="mt-4">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2">
                  <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    W{weekData.week}
                  </span>
                  <span className="text-xs text-muted-foreground">week detail</span>
                </div>
                <CardTitle className="mt-1.5 text-lg sm:text-xl">{weekData.window}</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{weekData.phase}</p>
              </div>
              <Link href="/cycle">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  All weeks
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p
              className={`rounded-md border px-3 py-2 text-xs ${
                isAvailable
                  ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                  : "border-amber-200/20 bg-amber-200/10 text-amber-200"
              }`}
            >
              {isAvailable
                ? "Day-by-day sessions are available for this week."
                : "Day-by-day details are coming soon."}
            </p>

            {isAvailable ? (
              <>
                <div className="overflow-x-auto">
                  <div className="flex min-w-max gap-2 pb-1">
                    {cycleDayOrder.map((dayId) => {
                      const dayEntry = weekData.days?.[dayId];
                      const dayLabel = dayEntry
                        ? formatCycleDayLabel(dayId, dayEntry.dateLabel)
                        : cycleDayLabelById[dayId];

                      return (
                        <Link key={dayId} href={`/cycle/week/${weekData.week}/day/${dayId}`}>
                          <Button variant="outline" size="sm" className="h-10 min-w-max">
                            {dayLabel}
                          </Button>
                        </Link>
                      );
                    })}
                  </div>
                </div>
                <div className="divide-y divide-white/10 rounded-lg border border-white/10">
                  {cycleDayOrder.map((dayId) => {
                    const day = weekData.days?.[dayId];
                    const dayLabel = day
                      ? formatCycleDayLabel(dayId, day.dateLabel)
                      : cycleDayLabelById[dayId];
                    const dayPreview = day?.sessionItems?.[0]?.title ?? "No session listed";

                    return (
                      <Link
                        key={dayId}
                        href={`/cycle/week/${weekData.week}/day/${dayId}`}
                        className="grid min-h-[58px] grid-cols-[1fr_auto] items-center gap-2 px-3 py-3 text-sm transition-colors hover:bg-white/[0.02] sm:px-4 sm:py-3"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{dayLabel}</p>
                          <p className="truncate text-xs text-muted-foreground">{dayPreview}</p>
                        </div>
                        <div className="text-muted-foreground">
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="rounded-md border border-amber-200/20 bg-amber-200/10 px-3 py-3 text-sm text-amber-100">
                Full day-level details for this week are coming soon. Use weeks 1–5 for now.
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
