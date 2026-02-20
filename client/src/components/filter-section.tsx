import { Link } from "wouter";

export type FilterTab = "upcoming" | "past" | "trends";

interface FilterSectionProps {
  currentFilter: FilterTab;
  onFilterChange: (filter: Exclude<FilterTab, "trends">) => void;
  className?: string;
}

export default function FilterSection({
  currentFilter,
  onFilterChange,
  className = "",
}: FilterSectionProps) {
  const isUpcomingActive = currentFilter === "upcoming";
  const isPastActive = currentFilter === "past";
  const isTrendsActive = currentFilter === "trends";

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border border-white/10 bg-card/45 p-1.5 backdrop-blur-sm ${className}`}
    >
      <button
        className={`rounded-full px-4 py-2.5 text-sm font-medium transition-colors min-h-[42px] min-w-[88px] ${
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
        className={`rounded-full px-4 py-2.5 text-sm font-medium transition-colors min-h-[42px] min-w-[88px] ${
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
        className={`rounded-full px-4 py-2.5 text-sm font-medium transition-colors min-h-[42px] min-w-[88px] ${
          isTrendsActive
            ? "bg-white/10 text-foreground"
            : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
        }`}
        aria-current={isTrendsActive ? "page" : undefined}
      >
        Trends
      </Link>
    </div>
  );
}
