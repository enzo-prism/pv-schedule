import { Button } from "@/components/ui/button";

type FilterType = "upcoming" | "past" | "all";

interface FilterSectionProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export default function FilterSection({ currentFilter, onFilterChange }: FilterSectionProps) {
  return (
    <div className="mb-6 flex justify-between items-center">
      <div className="text-lg font-medium text-primary">Meet Schedule</div>
      <div className="bg-accent/50 rounded inline-flex items-center p-0.5">
        <Button
          variant="ghost"
          className={`px-3 py-1 h-auto rounded text-sm font-medium transition-colors ${
            currentFilter === "upcoming" ? "bg-white text-primary shadow-none hover:shadow-sm" : "text-gray-600 hover:text-primary hover:bg-white/50"
          }`}
          onClick={() => onFilterChange("upcoming")}
        >
          Upcoming
        </Button>
        <Button
          variant="ghost"
          className={`px-3 py-1 h-auto rounded text-sm font-medium transition-colors ${
            currentFilter === "past" ? "bg-white text-primary shadow-none hover:shadow-sm" : "text-gray-600 hover:text-primary hover:bg-white/50"
          }`}
          onClick={() => onFilterChange("past")}
        >
          Past
        </Button>
        <Button
          variant="ghost"
          className={`px-3 py-1 h-auto rounded text-sm font-medium transition-colors ${
            currentFilter === "all" ? "bg-white text-primary shadow-none hover:shadow-sm" : "text-gray-600 hover:text-primary hover:bg-white/50"
          }`}
          onClick={() => onFilterChange("all")}
        >
          All
        </Button>
      </div>
    </div>
  );
}
