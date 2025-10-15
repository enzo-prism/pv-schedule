import { Button } from "@/components/ui/button";

type FilterType = "upcoming" | "past";

interface FilterSectionProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export default function FilterSection({ currentFilter, onFilterChange }: FilterSectionProps) {
  return (
    <div className="mb-8 flex justify-center">
      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
        <button
          className={`px-4 py-2 text-sm transition-colors ${
            currentFilter === "upcoming" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"
          }`}
          onClick={() => onFilterChange("upcoming")}
        >
          Upcoming
        </button>
        <button
          className={`px-4 py-2 text-sm transition-colors border-l border-gray-200 ${
            currentFilter === "past" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"
          }`}
          onClick={() => onFilterChange("past")}
        >
          Past
        </button>
      </div>
    </div>
  );
}
