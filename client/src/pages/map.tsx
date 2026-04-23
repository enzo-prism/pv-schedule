import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ArrowRight, Globe2, MapPin, Trophy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  ComposableMap,
  Geographies,
  Geography,
  Graticule,
  Marker,
  Sphere,
} from "react-simple-maps";
import worldGeography from "world-atlas/countries-110m.json";
import FilterSection from "@/components/filter-section";
import UserProfile from "@/components/user-profile";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatMeetName } from "@/lib/meet-title";
import { usePageMeta } from "@/lib/use-page-meta";
import type { Meet } from "@shared/schema";
import { isPastDate, parseDateInput, startOfDay } from "@shared/dates";
import {
  aggregateCompetitionPins,
  type CompetitionMapMeet,
  type CompetitionMapPin,
} from "@shared/competition-map";

type MapFilter = "all" | "us" | "ph" | "upcoming";

type PinMarkerProps = {
  pin: CompetitionMapPin;
  isSelected: boolean;
  onSelect: (placeId: string) => void;
};

type PlacePanelProps = {
  pin: CompetitionMapPin | null;
  referenceDate: Date;
};

const mapFilters: Array<{ value: MapFilter; label: string; shortLabel: string }> = [
  { value: "all", label: "All", shortLabel: "All" },
  { value: "us", label: "US", shortLabel: "US" },
  { value: "ph", label: "Philippines", shortLabel: "PH" },
  { value: "upcoming", label: "Upcoming", shortLabel: "Next" },
];

function getMeetDateValue(meet: CompetitionMapMeet): number {
  const parsed = parseDateInput(meet.date);
  return parsed ? startOfDay(parsed).getTime() : 0;
}

function formatMeetDate(value: string | Date): string {
  const parsed = parseDateInput(value);
  return parsed ? format(parsed, "MMM d, yyyy") : "Date TBD";
}

function formatBestHeight(pin: CompetitionMapPin | null): string {
  const rawHeight = pin?.bestHeightMeet?.heightCleared?.trim();
  return rawHeight || "No mark logged";
}

function getPreferredPin(pins: CompetitionMapPin[]): CompetitionMapPin | null {
  if (pins.length === 0) {
    return null;
  }

  return pins.find((pin) => pin.nextMeet) ?? pins[0];
}

function getPanelMeets(pin: CompetitionMapPin, referenceDate: Date): CompetitionMapMeet[] {
  return [...pin.meets].sort((a, b) => {
    const aPast = isPastDate(a.date, referenceDate);
    const bPast = isPastDate(b.date, referenceDate);

    if (aPast !== bPast) {
      return aPast ? 1 : -1;
    }

    const aDate = getMeetDateValue(a);
    const bDate = getMeetDateValue(b);
    return aPast ? bDate - aDate : aDate - bDate;
  });
}

function PinMarker({ pin, isSelected, onSelect }: PinMarkerProps) {
  const fill = pin.place.countryCode === "PH" ? "#f4cf8f" : "#f4f6f5";
  const hasUpcoming = pin.upcomingCount > 0;
  const markerRadius = isSelected ? 8 : 6;

  const handleKeyDown = (event: React.KeyboardEvent<SVGGElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(pin.place.id);
    }
  };

  return (
    <Marker coordinates={pin.place.coordinates}>
      <g
        role="button"
        tabIndex={0}
        aria-label={`${pin.place.label}, ${pin.totalCount} meet${pin.totalCount === 1 ? "" : "s"}`}
        className="cursor-pointer outline-none transition-opacity focus-visible:opacity-100"
        onClick={() => onSelect(pin.place.id)}
        onKeyDown={handleKeyDown}
      >
        {hasUpcoming ? (
          <circle
            r={18}
            fill="none"
            stroke="#f4cf8f"
            strokeWidth={1.5}
            opacity={0.34}
          />
        ) : null}
        <circle
          r={isSelected ? 14 : 11}
          fill="rgba(7, 9, 12, 0.68)"
          stroke="rgba(255,255,255,0.28)"
          strokeWidth={1}
        />
        <circle
          r={markerRadius}
          fill={fill}
          stroke="rgba(7, 9, 12, 0.88)"
          strokeWidth={1.5}
        />
        {pin.totalCount > 1 ? (
          <text
            y={3.2}
            textAnchor="middle"
            className="select-none text-[7px] font-bold"
            fill="#080a0d"
          >
            {pin.totalCount}
          </text>
        ) : null}
      </g>
    </Marker>
  );
}

function PlacePanel({ pin, referenceDate }: PlacePanelProps) {
  if (!pin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Competition Places</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No mapped meets yet.</p>
        </CardContent>
      </Card>
    );
  }

  const panelMeets = getPanelMeets(pin, referenceDate);
  const featuredMeet = pin.nextMeet ?? pin.latestMeet;
  const featuredLabel = pin.nextMeet ? "Next meet" : "Most recent";

  return (
    <aside className="app-panel p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="app-section-label">
            {pin.place.country}
          </p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight text-foreground">
            {pin.place.label}
          </h2>
          {pin.place.venue ? (
            <p className="mt-1 text-sm text-muted-foreground">{pin.place.venue}</p>
          ) : null}
        </div>
        {pin.nextMeet ? (
          <Badge className="border-[hsl(var(--athlete-warm))]/30 bg-[hsl(var(--athlete-warm))]/10 text-[hsl(var(--athlete-warm))] hover:bg-[hsl(var(--athlete-warm))]/10">
            Upcoming
          </Badge>
        ) : null}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <div className="app-muted-panel p-3">
          <p className="app-section-label">Meets</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{pin.totalCount}</p>
        </div>
        <div className="app-muted-panel p-3">
          <p className="app-section-label">Past</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{pin.pastCount}</p>
        </div>
        <div className="app-muted-panel p-3">
          <p className="app-section-label">Future</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{pin.upcomingCount}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3 rounded-lg border border-border bg-background p-4">
        <div>
          <p className="app-section-label">Best mark</p>
          <p className="mt-1 text-sm font-medium text-foreground">{formatBestHeight(pin)}</p>
        </div>
        {featuredMeet ? (
          <div>
            <p className="app-section-label">{featuredLabel}</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {formatMeetName(featuredMeet.name, featuredMeet.date)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatMeetDate(featuredMeet.date)}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-4 space-y-2">
        {panelMeets.map((meet) => {
          const isUpcoming = !isPastDate(meet.date, referenceDate);
          return (
            <Link
              key={meet.id}
              href={`/meet/${meet.id}`}
              className="group grid min-h-[64px] grid-cols-[1fr_auto] items-center gap-3 rounded-lg border border-border bg-card px-3 py-3 transition-colors hover:border-ring/35 hover:bg-accent/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-foreground">
                    {formatMeetName(meet.name, meet.date)}
                  </span>
                  {isUpcoming ? (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--athlete-warm))]" />
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatMeetDate(meet.date)}
                  {meet.heightCleared ? ` - ${meet.heightCleared}` : ""}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

export default function CompetitionMap() {
  usePageMeta("Competition Map", "See competition places around the world.");

  const referenceDate = useMemo(() => new Date(), []);
  const [activeFilter, setActiveFilter] = useState<MapFilter>("all");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  const { data: meets = [], isLoading, isError } = useQuery<Meet[]>({
    queryKey: ["/api/meets"],
  });

  const pins = useMemo(() => aggregateCompetitionPins(meets, referenceDate), [meets, referenceDate]);

  const filteredPins = useMemo(() => {
    return pins.filter((pin) => {
      if (activeFilter === "us") {
        return pin.place.countryCode === "US";
      }

      if (activeFilter === "ph") {
        return pin.place.countryCode === "PH";
      }

      if (activeFilter === "upcoming") {
        return pin.upcomingCount > 0;
      }

      return true;
    });
  }, [activeFilter, pins]);

  useEffect(() => {
    if (filteredPins.length === 0) {
      setSelectedPlaceId(null);
      return;
    }

    const selectedIsVisible = filteredPins.some((pin) => pin.place.id === selectedPlaceId);
    if (!selectedIsVisible) {
      setSelectedPlaceId(getPreferredPin(filteredPins)?.place.id ?? null);
    }
  }, [filteredPins, selectedPlaceId]);

  const selectedPin =
    filteredPins.find((pin) => pin.place.id === selectedPlaceId) ?? getPreferredPin(filteredPins);

  const totalMappedMeets = pins.reduce((total, pin) => total + pin.totalCount, 0);
  const totalCountries = new Set(pins.map((pin) => pin.place.countryCode)).size;
  const nextPin = pins.find((pin) => pin.nextMeet) ?? null;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background pb-app-nav">
      <main className="app-shell space-y-5 pt-6 pb-10 sm:pt-8 sm:pb-12">
        <section className="app-header-shell">
          <div className="px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <UserProfile name="Enzo Sison" />
              <FilterSection currentPage="map" className="w-full sm:max-w-[520px]" />
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold text-foreground text-pretty sm:text-[2rem]">
                  Competition Map
                </h1>
                <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                  Places around the world where the runway has left a record.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
                <div className="app-muted-panel p-3">
                  <p className="app-section-label">Places</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">{pins.length}</p>
                </div>
                <div className="app-muted-panel p-3">
                  <p className="app-section-label">Meets</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">{totalMappedMeets}</p>
                </div>
                <div className="app-muted-panel p-3">
                  <p className="app-section-label">Countries</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">{totalCountries}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid w-full grid-cols-4 gap-1 rounded-lg border border-border bg-secondary p-1 [scrollbar-width:none]">
              {mapFilters.map((option) => {
                const isActive = activeFilter === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setActiveFilter(option.value)}
                    className={cn(
                      "inline-flex min-h-10 min-w-0 items-center justify-center rounded-md px-2 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3",
                      isActive
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent/70 hover:text-foreground",
                    )}
                    aria-pressed={isActive}
                  >
                    <span className="hidden sm:inline">{option.label}</span>
                    <span className="sm:hidden">{option.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <Skeleton className="min-h-[360px] rounded-lg sm:min-h-[480px]" />
            <Skeleton className="min-h-[360px] rounded-lg" />
          </div>
        ) : isError ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Unable to load map</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Refresh the page to try the meet data again.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <section className="relative overflow-hidden rounded-lg border border-border bg-card">
              <div className="relative aspect-[0.92] min-h-[360px] sm:aspect-[1.72] sm:min-h-[460px] lg:aspect-[1.45]">
                <ComposableMap
                  width={920}
                  height={560}
                  projection="geoEqualEarth"
                  projectionConfig={{ scale: 170 }}
                  className="h-full w-full"
                  aria-label="World map of competition places"
                >
                  <Sphere
                    id="competition-map-sphere"
                    fill="rgba(255,255,255,0.018)"
                    stroke="rgba(255,255,255,0.16)"
                    strokeWidth={0.7}
                  />
                  <Graticule
                    step={[30, 30]}
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth={0.5}
                  />
                  <Geographies geography={worldGeography}>
                    {({ geographies }) =>
                      geographies.map((geo) => (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill="rgba(255,255,255,0.075)"
                          stroke="rgba(255,255,255,0.105)"
                          strokeWidth={0.35}
                          tabIndex={-1}
                          style={{
                            default: { outline: "none" },
                            hover: { fill: "rgba(255,255,255,0.095)", outline: "none" },
                            pressed: { fill: "rgba(255,255,255,0.12)", outline: "none" },
                          }}
                        />
                      ))
                    }
                  </Geographies>
                  {filteredPins.map((pin) => (
                    <PinMarker
                      key={pin.place.id}
                      pin={pin}
                      isSelected={selectedPin?.place.id === pin.place.id}
                      onSelect={setSelectedPlaceId}
                    />
                  ))}
                </ComposableMap>
              </div>

              <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground">
                  <Globe2 className="h-3.5 w-3.5" />
                  {filteredPins.length} place{filteredPins.length === 1 ? "" : "s"}
                </div>
                {nextPin?.nextMeet ? (
                  <div className="inline-flex items-center gap-2 rounded-md border border-[hsl(var(--athlete-warm))]/25 bg-[hsl(var(--athlete-warm))]/10 px-3 py-2 text-xs text-[hsl(var(--athlete-warm))]">
                    <Trophy className="h-3.5 w-3.5" />
                    Next: {nextPin.place.shortLabel}
                  </div>
                ) : null}
              </div>

              <div className="pointer-events-none absolute bottom-4 left-4 flex flex-wrap items-center gap-3 text-[11px] text-white/55">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#f4f6f5]" />
                  US
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#f4cf8f]" />
                  Philippines
                </span>
              </div>
            </section>

            <PlacePanel pin={selectedPin} referenceDate={referenceDate} />
          </div>
        )}

        {!isLoading && !isError && filteredPins.length === 0 ? (
          <Card>
            <CardContent className="flex min-h-[120px] items-center justify-center p-6 text-center">
              <div>
                <MapPin className="mx-auto h-5 w-5 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No competition places match this view.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </main>
    </div>
  );
}
