import { CalendarDays, CircleDashed, MapPin, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export type PageTab = "meets" | "map" | "trends" | "cycle";
export type FilterTab = "upcoming" | "past";

type FilterSectionProps = {
  currentPage: PageTab;
  showFilters?: boolean;
  currentFilter?: FilterTab;
  onFilterChange?: (filter: FilterTab) => void;
  className?: string;
};

type PageTabItem = {
  key: PageTab;
  label: string;
  shortLabel: string;
  href: string;
  Icon: typeof CalendarDays;
};

const pageTabs: PageTabItem[] = [
  {
    key: "meets",
    label: "Meets",
    shortLabel: "Meets",
    href: "/",
    Icon: CalendarDays,
  },
  {
    key: "map",
    label: "Map",
    shortLabel: "Map",
    href: "/map",
    Icon: MapPin,
  },
  {
    key: "trends",
    label: "Trends",
    shortLabel: "Trends",
    href: "/trends",
    Icon: TrendingUp,
  },
  {
    key: "cycle",
    label: "Cycle",
    shortLabel: "Cycle",
    href: "/cycle",
    Icon: CircleDashed,
  },
];

export default function FilterSection({
  currentPage,
  showFilters = false,
  currentFilter = "upcoming",
  onFilterChange = () => undefined,
  className = "",
}: FilterSectionProps) {
  const isUpcomingActive = currentFilter === "upcoming";
  const isPastActive = currentFilter === "past";

  return (
    <div className={`w-full space-y-2 ${className}`}>
      <nav
        className="grid w-full grid-cols-4 gap-1 rounded-lg border border-border bg-secondary p-1 [scrollbar-width:none]"
        aria-label="Primary"
      >
        {pageTabs.map(({ key, href, Icon, label, shortLabel }) => {
          const isActive = currentPage === key;
          return (
            <Link
              key={key}
              href={href}
              className={`inline-flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isActive
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="whitespace-nowrap hidden sm:inline">{label}</span>
              <span className="whitespace-nowrap sm:hidden">{shortLabel}</span>
            </Link>
          );
        })}
      </nav>

      {showFilters ? (
        <div className="grid w-full grid-cols-2 gap-1 rounded-lg border border-border bg-secondary p-1">
          <button
            type="button"
            className={`min-h-10 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isUpcomingActive
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
            }`}
            onClick={() => onFilterChange("upcoming")}
            aria-pressed={isUpcomingActive}
          >
            Upcoming
          </button>
          <button
            type="button"
            className={`min-h-10 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isPastActive
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
            }`}
            onClick={() => onFilterChange("past")}
            aria-pressed={isPastActive}
          >
            Past
          </button>
        </div>
      ) : null}
    </div>
  );
}
