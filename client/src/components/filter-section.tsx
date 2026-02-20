import { CalendarDays, CircleDashed, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export type PageTab = "meets" | "trends" | "cycle";
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
      <div className="inline-flex w-full items-center gap-1 overflow-x-auto rounded-full border border-white/10 bg-card/45 p-1.5 backdrop-blur-sm [scrollbar-width:none]">
        {pageTabs.map(({ key, href, Icon, label, shortLabel }) => {
          const isActive = currentPage === key;
          return (
            <Link
              key={key}
              href={href}
              className={`inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-3 py-2.5 text-sm font-medium transition-colors min-h-[40px] sm:min-w-[88px] ${
                isActive
                  ? "bg-white/10 text-foreground"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap hidden sm:inline">{label}</span>
              <span className="whitespace-nowrap sm:hidden">{shortLabel}</span>
            </Link>
          );
        })}
      </div>

      {showFilters ? (
        <div className="inline-flex w-full items-center gap-1 rounded-full border border-white/10 bg-card/45 p-1.5 backdrop-blur-sm">
          <button
            className={`rounded-full px-4 py-2.5 text-sm font-medium transition-colors min-h-[40px] min-w-[88px] ${
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
            className={`rounded-full px-4 py-2.5 text-sm font-medium transition-colors min-h-[40px] min-w-[88px] ${
              isPastActive
                ? "bg-white/10 text-foreground"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
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
