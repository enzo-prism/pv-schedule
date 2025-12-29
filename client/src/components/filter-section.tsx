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
      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
        <button
          className={`px-4 py-2 text-sm transition-colors ${
            isUpcomingActive ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"
          }`}
          onClick={() => onFilterChange("upcoming")}
          aria-pressed={isUpcomingActive}
        >
          Upcoming
        </button>
        <button
          className={`px-4 py-2 text-sm transition-colors border-l border-gray-200 ${
            isPastActive ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"
          }`}
          onClick={() => onFilterChange("past")}
          aria-pressed={isPastActive}
        >
          Past
        </button>
        <Link
          href="/trends"
          className={`px-4 py-2 text-sm transition-colors border-l border-gray-200 ${
            isTrendsActive ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"
          }`}
          aria-current={isTrendsActive ? "page" : undefined}
        >
          Trends
        </Link>
      </div>
    </div>
  );
}
