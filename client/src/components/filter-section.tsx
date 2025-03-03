import { Button } from "@/components/ui/button";
import { CalendarClock, History, ListFilter } from "lucide-react";

type FilterType = "upcoming" | "past" | "all";

interface FilterSectionProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export default function FilterSection({ currentFilter, onFilterChange }: FilterSectionProps) {
  return (
    <div className="mb-6 flex justify-center items-center">
      <div className="bg-accent/40 rounded-full inline-flex items-center p-1">
        <Button
          variant="ghost"
          className={`p-2 h-9 w-9 rounded-full transition-colors ${
            currentFilter === "upcoming" ? "bg-white text-primary shadow-sm" : "text-gray-600 hover:text-primary hover:bg-white/50"
          }`}
          onClick={() => onFilterChange("upcoming")}
          aria-label="Show upcoming meets"
          title="Upcoming"
        >
          <CalendarClock size={18} />
          <span className="sr-only">Upcoming</span>
        </Button>
        <Button
          variant="ghost"
          className={`p-2 h-9 w-9 rounded-full transition-colors ${
            currentFilter === "past" ? "bg-white text-primary shadow-sm" : "text-gray-600 hover:text-primary hover:bg-white/50"
          }`}
          onClick={() => onFilterChange("past")}
          aria-label="Show past meets"
          title="Past"
        >
          <History size={18} />
          <span className="sr-only">Past</span>
        </Button>
        <Button
          variant="ghost"
          className={`p-2 h-9 w-9 rounded-full transition-colors ${
            currentFilter === "all" ? "bg-white text-primary shadow-sm" : "text-gray-600 hover:text-primary hover:bg-white/50"
          }`}
          onClick={() => onFilterChange("all")}
          aria-label="Show all meets"
          title="All"
        >
          <ListFilter size={18} />
          <span className="sr-only">All</span>
        </Button>
      </div>
    </div>
  );
}
