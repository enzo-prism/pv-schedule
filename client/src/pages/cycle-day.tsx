import { ArrowLeft, Check, ChevronDown, ChevronLeft, ChevronRight, ClipboardCopy } from "lucide-react";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import FilterSection from "@/components/filter-section";
import UserProfile from "@/components/user-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import {
  cycleDayOrder,
  cycleDayShortLabelById,
  formatCycleDayLabel,
  formatCycleDayShortLabel,
  getCycleDay,
  getCycleDayNavigation,
  getCycleWeek,
  getNonRedundantSessionDetails,
} from "@/lib/cycle";
import { usePageMeta } from "@/lib/use-page-meta";

function renderSimpleList(lines: string[], emptyFallback: string) {
  const compactLines = lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (compactLines.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyFallback}</p>;
  }

  return (
    <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-foreground">
      {compactLines.map((line, index) => (
        <li key={`${line}-${index}`}>{line}</li>
      ))}
    </ul>
  );
}

export default function CycleDay() {
  const [, params] = useRoute("/cycle/week/:week/day/:day");
  const rawWeek = params?.week;
  const rawDay = params?.day;
  const week = Number(rawWeek);

  const weekData = Number.isInteger(week) ? getCycleWeek(week) : undefined;
  const day = Number.isInteger(week) && rawDay ? getCycleDay(week, rawDay) : undefined;
  const navigation = getCycleDayNavigation(week, rawDay ?? "");
  const canonicalDayId = navigation?.index !== undefined
    ? cycleDayOrder[navigation.index]
    : undefined;
  const isAvailableWeek = weekData?.detailStatus === "available";
  const backWeekHref = weekData ? `/cycle/week/${weekData.week}` : "/cycle";

  const dayTitle = canonicalDayId
    ? formatCycleDayLabel(canonicalDayId, day?.dateLabel)
    : rawDay
      ? rawDay
      : "Day";
  const prevDayLabel = navigation?.prev && weekData?.days
    ? formatCycleDayLabel(navigation.prev, weekData.days[navigation.prev]?.dateLabel)
    : undefined;
  const nextDayLabel = navigation?.next && weekData?.days
    ? formatCycleDayLabel(navigation.next, weekData.days[navigation.next]?.dateLabel)
    : undefined;
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const pageTitle = canonicalDayId
    ? `W${weekData?.week ?? "?"} ${formatCycleDayLabel(canonicalDayId, day?.dateLabel)}`
    : "Cycle day";
  const pageDescription = day
    ? `Workout for ${pageTitle}.`
    : "Open a cycle day for session details.";

  usePageMeta(pageTitle, pageDescription);

  const copyCurrentPage = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyState("copied");
      window.setTimeout(() => {
        setCopyState("idle");
      }, 1800);
    } catch (error) {
      setCopyState("error");
      window.setTimeout(() => {
        setCopyState("idle");
      }, 1800);
      console.error("Could not copy cycle day URL:", error);
    }
  };

  if (!rawWeek || !rawDay || !weekData || !day || !navigation || !canonicalDayId) {
    const emptyMessage = !weekData
      ? "We could not load that cycle week."
      : isAvailableWeek
        ? "That day is not available for this week."
        : "Day details for this week are not available yet.";

    return (
      <div className="min-h-screen bg-background pb-20">
        <main className="app-shell pt-6 sm:pt-8">
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
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Day not found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">{emptyMessage}</p>
              <Link href={backWeekHref}>
                <Button variant="outline" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to week
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const hasReferences = day.detailSections != null && day.detailSections.length > 0;
  return (
    <div className="relative min-h-screen bg-background pb-[calc(env(safe-area-inset-bottom)+112px)]">
      <main className="app-shell pb-6 pt-6 sm:pt-8">
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
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {`W${weekData.week} • ${weekData.window}`}
                  </p>
                  <CardTitle className="text-lg sm:text-xl">{dayTitle}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{weekData.phase}</p>
                </div>
                <Link href={backWeekHref}>
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to week
                  </Button>
                </Link>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Day drill-down</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="flex min-w-max gap-2 pb-1">
                  {cycleDayOrder.map((dayId) => {
                    const dayEntry = weekData.days?.[dayId];
                    const label = dayEntry
                      ? formatCycleDayShortLabel(dayId, dayEntry.dateLabel)
                      : `${cycleDayShortLabelById[dayId]}`;
                    const isCurrent = dayId === canonicalDayId;

                    if (isCurrent) {
                      return (
                        <Button
                          key={dayId}
                          variant="default"
                          size="sm"
                          className="h-10 min-w-max bg-accent text-sm text-foreground"
                          aria-current="page"
                        >
                          {label}
                        </Button>
                      );
                    }

                    return (
                      <Link key={dayId} href={`/cycle/week/${weekData.week}/day/${dayId}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 min-w-max"
                        >
                          {label}
                        </Button>
                      </Link>
                    );
                    })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Session summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {day.sessionItems.map((session) => {
                const details = getNonRedundantSessionDetails(session.summary, session.specifics);
                const hasDetails = details.length > 0;

                return (
                  <section
                    key={session.title}
                    className="rounded-lg border border-border bg-secondary p-3"
                  >
                    <h3 className="text-sm font-medium text-foreground">{session.title}</h3>
                    <div className="mt-2">{renderSimpleList(session.summary, "Session details not available")}</div>
                    {hasDetails ? (
                      <div className="mt-2">
                        <p className="mb-1 text-xs text-muted-foreground">Additional details</p>
                        {renderSimpleList(details, "No additional details")}
                      </div>
                    ) : null}
                  </section>
                );
              })}
            </CardContent>
          </Card>

          {hasReferences ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Reference routines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {day.detailSections?.map((section) => (
                  <details
                    key={section.title}
                    className="rounded-lg border border-border bg-secondary"
                  >
                    <summary className="flex cursor-pointer items-center justify-between px-3 py-3 text-sm font-medium text-foreground">
                      <span>{section.title}</span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </summary>
                    <div className="px-3 pb-3 pt-1">
                      <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-foreground">
                        {section.bullets
                          .map((line) => line.trim())
                          .filter((line) => line.length > 0)
                          .map((line, index) => (
                            <li key={`${section.title}-${line}-${index}`}>{line}</li>
                          ))}
                      </ul>
                    </div>
                  </details>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background px-4 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-3">
        <div className="mx-auto flex max-w-4xl flex-col gap-2">
          <div className="text-center text-xs text-muted-foreground">
            {copyState === "copied"
              ? "Link copied to clipboard"
              : copyState === "error"
                ? "Copy failed, try again"
                : ""}
          </div>
          <div className="mx-auto flex w-full max-w-4xl gap-2">
          {navigation.prev ? (
            <Link
              href={`/cycle/week/${weekData.week}/day/${navigation.prev}`}
              className="flex-1"
            >
              <Button
                variant="outline"
                className="h-12 w-full justify-start overflow-hidden"
                aria-label="Go to previous day"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                <span className="max-w-full truncate text-xs">
                  Prev{prevDayLabel ? `: ${prevDayLabel}` : ""}
                </span>
              </Button>
            </Link>
          ) : (
            <Button
              variant="outline"
              className="h-12 flex-1 justify-start text-xs"
              disabled
              aria-label="No previous day"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Prev
            </Button>
          )}

          {navigation.next ? (
            <Link
              href={`/cycle/week/${weekData.week}/day/${navigation.next}`}
              className="flex-1"
            >
              <Button
                className="h-12 w-full justify-end overflow-hidden"
                aria-label="Go to next day"
              >
                <span className="max-w-full truncate text-xs">
                  Next{nextDayLabel ? `: ${nextDayLabel}` : ""}
                </span>
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          ) : (
              <Button
                className="h-12 flex-1 justify-end text-xs"
                disabled
                aria-label="No next day"
              >
                <span>Next</span>
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
          )}
          </div>
          <Button
            variant="outline"
            className="h-12 w-full justify-center gap-2"
            onClick={copyCurrentPage}
          >
            {copyState === "copied" ? (
              <>
                <Check className="h-4 w-4" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <ClipboardCopy className="h-4 w-4" />
                <span>Copy link</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
