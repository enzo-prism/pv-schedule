import { Button } from "@/components/ui/button";
import { CalendarClock, History, ListFilter, Trophy } from "lucide-react";

type FilterType = "filam" | "upcoming" | "past" | "all";

interface FilterSectionProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export default function FilterSection({ currentFilter, onFilterChange }: FilterSectionProps) {
  return (
    <div className="mb-6 flex justify-center items-center">
      <div className="bg-gray-100 rounded-md inline-flex items-center p-0.5 gap-1">
        <Button
          variant="ghost"
          className={`px-3 py-1.5 h-8 rounded-md text-sm transition-colors flex items-center gap-1.5 ${
            currentFilter === "filam" ? "bg-white text-gray-600 shadow-sm font-medium" : "text-gray-500 hover:text-gray-600 hover:bg-white/80"
          }`}
          onClick={() => onFilterChange("filam")}
          aria-label="Show FilAm meets"
        >
          <Trophy size={14} />
          <span>FilAm</span>
        </Button>
        <Button
          variant="ghost"
          className={`px-3 py-1.5 h-8 rounded-md text-sm transition-colors flex items-center gap-1.5 ${
            currentFilter === "upcoming" ? "bg-white text-gray-600 shadow-sm font-medium" : "text-gray-500 hover:text-gray-600 hover:bg-white/80"
          }`}
          onClick={() => onFilterChange("upcoming")}
          aria-label="Show upcoming meets"
        >
          <CalendarClock size={14} />
          <span>Upcoming</span>
        </Button>
        <Button
          variant="ghost"
          className={`px-3 py-1.5 h-8 rounded-md text-sm transition-colors flex items-center gap-1.5 ${
            currentFilter === "past" ? "bg-white text-gray-600 shadow-sm font-medium" : "text-gray-500 hover:text-gray-600 hover:bg-white/80"
          }`}
          onClick={() => onFilterChange("past")}
          aria-label="Show past meets"
        >
          <History size={14} />
          <span>Past</span>
        </Button>
        <Button
          variant="ghost"
          className={`px-3 py-1.5 h-8 rounded-md text-sm transition-colors flex items-center gap-1.5 ${
            currentFilter === "all" ? "bg-white text-gray-600 shadow-sm font-medium" : "text-gray-500 hover:text-gray-600 hover:bg-white/80"
          }`}
          onClick={() => onFilterChange("all")}
          aria-label="Show all meets"
        >
          <ListFilter size={14} />
          <span>All</span>
        </Button>
      </div>
    </div>
  );
}
