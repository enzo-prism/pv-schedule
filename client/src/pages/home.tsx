import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Calendar, Clock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Meet } from "@shared/schema";
import MeetCard from "@/components/meet-card";
import AddMeetForm from "@/components/add-meet-form";
import FilterSection from "@/components/filter-section";
import { Button } from "@/components/ui/button";

type FilterType = "upcoming" | "past" | "all";

export default function Home() {
  const [isAddMeetOpen, setIsAddMeetOpen] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<FilterType>("upcoming");
  const { toast } = useToast();

  const { data: meets = [], isLoading } = useQuery<Meet[]>({ 
    queryKey: ["/api/meets"],
  });

  const addMeetMutation = useMutation({
    mutationFn: async (meetData: { name: string; date: string; location: string; description?: string }) => {
      const res = await apiRequest("POST", "/api/meets", meetData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meets"] });
      setIsAddMeetOpen(false);
      toast({
        title: "Meet added",
        description: "The meet has been successfully added to the schedule.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add meet",
        description: error.message || "There was an error adding the meet. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddMeet = (meetData: { name: string; date: string; location: string; description?: string }) => {
    addMeetMutation.mutate(meetData);
  };

  const isPastDate = (dateString: string | Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const meetDate = new Date(dateString);
    return meetDate < today;
  };

  const filteredMeets = meets.filter((meet) => {
    if (currentFilter === "upcoming") {
      return !isPastDate(meet.date);
    } else if (currentFilter === "past") {
      return isPastDate(meet.date);
    }
    return true;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleFilterChange = (filter: FilterType) => {
    setCurrentFilter(filter);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-accent/50 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-lg font-medium flex items-center">
            <Calendar className="mr-2 text-primary h-5 w-5" />
            Track & Field Schedule
          </h1>
          <Button 
            onClick={() => setIsAddMeetOpen(true)}
            className="bg-secondary hover:bg-secondary/90 text-white text-sm font-medium px-4 py-1.5 h-auto rounded shadow-sm transition-all hover:shadow-md"
            aria-label="Add a new track and field meet"
          >
            Add Meet
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow max-w-3xl mx-auto w-full px-4 py-5">
        <FilterSection 
          currentFilter={currentFilter}
          onFilterChange={handleFilterChange}
        />

        {isLoading ? (
          <div className="space-y-4 mt-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-accent/30 animate-pulse rounded" />
            ))}
          </div>
        ) : filteredMeets.length > 0 ? (
          <div className="space-y-4 mt-6">
            {filteredMeets.map((meet: Meet) => (
              <MeetCard key={meet.id} meet={meet} />
            ))}
          </div>
        ) : (
          <div className="bg-accent/20 rounded p-8 text-center mt-6">
            <Clock className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-medium mb-2 text-primary">No meets found</h3>
            <p className="text-sm text-gray-500 mb-4">
              No track and field meets are currently {currentFilter === "all" ? "scheduled" : currentFilter === "upcoming" ? "upcoming" : "in the past"}.
            </p>
            {currentFilter !== "past" && (
              <Button 
                onClick={() => setIsAddMeetOpen(true)}
                className="bg-secondary hover:bg-secondary/90 text-white text-sm font-medium px-4 py-1.5 h-auto rounded shadow-sm transition-all hover:shadow-md"
              >
                Add Your First Meet
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-accent/20 border-t border-accent/30 py-4">
        <div className="max-w-3xl mx-auto px-4 text-xs text-center text-gray-500">
          &copy; {new Date().getFullYear()} Track & Field Meet Schedule
        </div>
      </footer>

      {/* Add Meet Dialog */}
      <Dialog open={isAddMeetOpen} onOpenChange={setIsAddMeetOpen}>
        <DialogContent className="sm:max-w-md" aria-describedby="add-meet-description">
          <div id="add-meet-description" className="sr-only">Add a new track and field meet to the schedule</div>
          <AddMeetForm onSubmit={handleAddMeet} isLoading={addMeetMutation.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
