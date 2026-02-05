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
      <div className="flex items-center border border-white/10 rounded-full overflow-hidden bg-white/5 backdrop-blur">
        <button
          className={`px-4 py-2 text-sm transition-colors ${
            isUpcomingActive
              ? "bg-white/15 text-white"
              : "text-muted-foreground hover:bg-white/5"
          }`}
          onClick={() => onFilterChange("upcoming")}
          aria-pressed={isUpcomingActive}
        >
          Upcoming
        </button>
        <button
          className={`px-4 py-2 text-sm transition-colors border-l border-white/10 ${
            isPastActive
              ? "bg-white/15 text-white"
              : "text-muted-foreground hover:bg-white/5"
          }`}
          onClick={() => onFilterChange("past")}
          aria-pressed={isPastActive}
        >
          Past
        </button>
        <Link
          href="/trends"
          className={`px-4 py-2 text-sm transition-colors border-l border-white/10 ${
            isTrendsActive
              ? "bg-white/15 text-white"
              : "text-muted-foreground hover:bg-white/5"
          }`}
          aria-current={isTrendsActive ? "page" : undefined}
        >
          Trends
        </Link>
      </div>
    </div>
  );
}
