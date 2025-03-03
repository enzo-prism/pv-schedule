import { Button } from "@/components/ui/button";

type FilterType = "upcoming" | "past" | "all";

interface FilterSectionProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export default function FilterSection({ currentFilter, onFilterChange }: FilterSectionProps) {
  return (
    <div className="mb-6 flex justify-between items-center">
      <div className="text-lg font-medium">Meet Schedule</div>
      <div className="bg-accent p-1 rounded-lg inline-flex items-center">
        <Button
          variant={currentFilter === "upcoming" ? "default" : "ghost"}
          className={`px-3 py-1 h-auto rounded text-sm font-medium ${
            currentFilter === "upcoming" ? "bg-white text-primary" : "text-gray-700"
          }`}
          onClick={() => onFilterChange("upcoming")}
        >
          Upcoming
        </Button>
        <Button
          variant={currentFilter === "past" ? "default" : "ghost"}
          className={`px-3 py-1 h-auto rounded text-sm font-medium ${
            currentFilter === "past" ? "bg-white text-primary" : "text-gray-700"
          }`}
          onClick={() => onFilterChange("past")}
        >
          Past
        </Button>
        <Button
          variant={currentFilter === "all" ? "default" : "ghost"}
          className={`px-3 py-1 h-auto rounded text-sm font-medium ${
            currentFilter === "all" ? "bg-white text-primary" : "text-gray-700"
          }`}
          onClick={() => onFilterChange("all")}
        >
          All
        </Button>
      </div>
    </div>
  );
}
