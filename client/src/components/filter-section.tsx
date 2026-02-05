import { Link } from "wouter";

export type FilterTab = "upcoming" | "past" | "trends";

interface FilterSectionProps {
  currentFilter: FilterTab;
  onFilterChange: (filter: Exclude<FilterTab, "trends">) => void;
}

export default function FilterSection({ currentFilter, onFilterChange }: FilterSectionProps) {
  const isUpcomingActive = currentFilter === "upcoming";
  const isPastActive = currentFilter === "past";
  const isTrendsActive = currentFilter === "trends";

  return (
    <div className="mb-8 flex justify-center">
      <div className="flex items-center gap-1 rounded-full border border-white/10 bg-card/40 p-1 backdrop-blur-sm">
        <button
          className={`rounded-full px-4 py-2 text-sm transition-colors ${
            isUpcomingActive
              ? "bg-white/10 text-foreground"
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
          }`}
          onClick={() => onFilterChange("upcoming")}
          aria-pressed={isUpcomingActive}
        >
          Upcoming
        </button>
        <button
          className={`rounded-full px-4 py-2 text-sm transition-colors ${
            isPastActive
              ? "bg-white/10 text-foreground"
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
          }`}
          onClick={() => onFilterChange("past")}
          aria-pressed={isPastActive}
        >
          Past
        </button>
        <Link
          href="/trends"
          className={`rounded-full px-4 py-2 text-sm transition-colors ${
            isTrendsActive
              ? "bg-white/10 text-foreground"
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
          }`}
          aria-current={isTrendsActive ? "page" : undefined}
        >
          Trends
        </Link>
      </div>
    </div>
  );
}
