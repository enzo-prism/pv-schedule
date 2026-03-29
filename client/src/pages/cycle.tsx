import { ArrowRight, CalendarDays } from "lucide-react";
import { Link } from "wouter";
import FilterSection from "@/components/filter-section";
import UserProfile from "@/components/user-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cycleWeekSummaries, getCycleWeek } from "@/lib/cycle";
import { usePageMeta } from "@/lib/use-page-meta";

export default function Cycle() {
  usePageMeta("Cycle", "Open the weekly cycle plan.");

  return (
    <div className="min-h-screen bg-background relative pb-app-nav">
      <main className="app-shell pt-6 pb-10 sm:pt-8 sm:pb-12">
        <section className="app-header-shell">
          <div className="px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <UserProfile name="Enzo Sison" />
              <FilterSection
                currentPage="cycle"
                className="w-full sm:max-w-[420px]"
              />
            </div>
          </div>
        </section>

        <div className="mt-5 space-y-4 sm:mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">2026 Cycle Plan</CardTitle>
              <p className="text-sm text-muted-foreground">
                Review each week and expand to day-level session details.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Weekly focus blocks from Feb 22 through June 15, 2026
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-white/10">
                {cycleWeekSummaries.map((entry) => {
                  const weekData = getCycleWeek(entry.week);
                  const isAvailable = weekData?.detailStatus === "available";

                  return isAvailable ? (
                    <Link
                      key={entry.week}
                      href={`/cycle/week/${entry.week}`}
                      className="grid min-h-[72px] grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02] sm:py-4"
                    >
                      <div className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
                        W{entry.week}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-foreground">
                          {entry.window}
                        </div>
                        <div className="text-sm text-muted-foreground">{entry.phase}</div>
                      </div>
                      <div className="flex items-center gap-1 pt-0.5 text-sm text-muted-foreground">
                        <span>View</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </Link>
                  ) : (
                    <div
                      key={entry.week}
                      className="grid min-h-[72px] grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 sm:py-4"
                    >
                      <div className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
                        W{entry.week}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-foreground">
                          {entry.window}
                        </div>
                        <div className="text-xs text-muted-foreground">{entry.phase}</div>
                      </div>
                      <div className="inline-flex rounded-full border border-amber-200/30 bg-amber-200/10 px-2 py-1 text-xs text-amber-200/90">
                        Coming soon
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
