import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Calendar, Clock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Meet } from "@shared/schema";
import MeetCard from "@/components/meet-card";
import AddMeetForm from "@/components/add-meet-form";
import EditMeetForm from "@/components/edit-meet-form";
import FilterSection from "@/components/filter-section";
import DeleteConfirmation from "@/components/delete-confirmation";
import CountdownTimer from "@/components/countdown-timer";
import UserProfile from "@/components/user-profile";
import { Button } from "@/components/ui/button";

type FilterType = "filam" | "upcoming" | "past" | "all";

// FilAm meets data - major meets to potentially attend
const filamMeets = [
  {
    id: 9999,
    name: "USATF Outdoor Championships",
    date: "2025-06-26",
    location: "Eugene, OR",
    description: "National championship meet featuring the best track and field athletes in the USA",
    heightCleared: null,
    poleUsed: null,
    deepestTakeoff: null,
    place: null,
    link: null,
    driveTime: null,
    registrationStatus: "not registered",
    createdAt: new Date()
  },
  {
    id: 9998,
    name: "Prefontaine Classic",
    date: "2025-05-17",
    location: "Eugene, OR", 
    description: "Premier Diamond League meet attracting world-class athletes",
    heightCleared: null,
    poleUsed: null,
    deepestTakeoff: null,
    place: null,
    link: null,
    driveTime: null,
    registrationStatus: "not registered",
    createdAt: new Date()
  },
  {
    id: 9997,
    name: "Mt. SAC Relays",
    date: "2025-04-18",
    location: "Walnut, CA",
    description: "One of the largest track and field meets in the world",
    heightCleared: null,
    poleUsed: null,
    deepestTakeoff: null,
    place: null,
    link: null,
    driveTime: null,
    registrationStatus: "not registered",
    createdAt: new Date()
  }
];

export default function Home() {
  const [isAddMeetOpen, setIsAddMeetOpen] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<FilterType>("upcoming");
  const [editMeet, setEditMeet] = useState<Meet | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [meetToDelete, setMeetToDelete] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: meets = [], isLoading } = useQuery<Meet[]>({ 
    queryKey: ["/api/meets"],
  });

  const addMeetMutation = useMutation({
    mutationFn: async (meetData: { 
      name: string; 
      date: string; 
      location: string; 
      description?: string;
      heightCleared?: string;
      poleUsed?: string;
      deepestTakeoff?: string;
      place?: string;
    }) => {
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

  const editMeetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: { name: string; date: string; location: string; description?: string; heightCleared?: string; poleUsed?: string; deepestTakeoff?: string; place?: string } }) => {
      const res = await apiRequest("PUT", `/api/meets/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meets"] });
      setEditMeet(null);
      toast({
        title: "Meet updated",
        description: "The meet has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update meet",
        description: error.message || "There was an error updating the meet. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const deleteMeetMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/meets/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meets"] });
      setMeetToDelete(null);
      setDeleteConfirmOpen(false);
      toast({
        title: "Meet deleted",
        description: "The meet has been successfully removed from the schedule.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete meet",
        description: error.message || "There was an error deleting the meet. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddMeet = (meetData: { 
    name: string; 
    date: string; 
    location: string; 
    description?: string;
    heightCleared?: string;
    poleUsed?: string;
    deepestTakeoff?: string;
    place?: string;
  }) => {
    addMeetMutation.mutate(meetData);
  };

  const handleEditMeet = (meetData: { 
    name: string; 
    date: string; 
    location: string; 
    description?: string;
    heightCleared?: string;
    poleUsed?: string;
    deepestTakeoff?: string;
    place?: string;
  }) => {
    if (editMeet) {
      editMeetMutation.mutate({
        id: editMeet.id,
        data: meetData,
      });
    }
  };

  const handleEditClick = (meet: Meet) => {
    setEditMeet(meet);
  };
  
  const handleDeleteClick = (meetId: number) => {
    setMeetToDelete(meetId);
    setDeleteConfirmOpen(true);
  };
  
  const handleConfirmDelete = () => {
    if (meetToDelete !== null) {
      deleteMeetMutation.mutate(meetToDelete);
    }
  };
  
  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setMeetToDelete(null);
  };

  const isPastDate = (dateString: string | Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Parse date string consistently to avoid timezone issues
    const meetDate = typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/) 
      ? new Date(`${dateString}T00:00:00`)
      : new Date(dateString);
      
    return meetDate < today;
  };

  // Helper function for consistent date parsing
  const parseDate = (dateString: string | Date) => {
    return typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/) 
      ? new Date(`${dateString}T00:00:00`)
      : new Date(dateString);
  };

  // Find all upcoming meets
  const upcomingMeets = meets.filter(meet => !isPastDate(meet.date))
    .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());
  
  // Get the ID of the next upcoming meet (first in the sorted list)
  const nextUpcomingMeetId = upcomingMeets.length > 0 ? upcomingMeets[0].id : null;
  
  const filteredMeets = currentFilter === "filam" 
    ? filamMeets.sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime())
    : meets.filter((meet) => {
        if (currentFilter === "upcoming") {
          return !isPastDate(meet.date);
        } else if (currentFilter === "past") {
          return isPastDate(meet.date);
        }
        return true;
      }).sort((a, b) => {
        // For past meets, sort by most recent to oldest (descending order)
        if (currentFilter === "past") {
          return parseDate(b.date).getTime() - parseDate(a.date).getTime();
        }
        // For upcoming meets and all meets, sort by closest date first (ascending order)
        return parseDate(a.date).getTime() - parseDate(b.date).getTime();
      });

  const handleFilterChange = (filter: FilterType) => {
    setCurrentFilter(filter);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Countdown Timer */}
      <div className="sticky top-0 z-20 w-full bg-white shadow-sm">
        {!isLoading && <CountdownTimer meets={meets} />}
      </div>

      {/* Main content */}
      <main className="flex-grow max-w-3xl mx-auto w-full px-4 py-5">
        <UserProfile name="Enzo Sison" />
        
        {/* External Meet Resources */}
        <div className="flex gap-3 mt-4 mb-6">
          <a 
            href="https://www.athletic.net/events/usa/oregon/2025-06-02" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors text-sm text-gray-700 hover:text-gray-800"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15,3 21,3 21,9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            Athletic.net
          </a>
          
          <a 
            href="https://www.directathletics.com/upcoming_meets.html" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors text-sm text-gray-700 hover:text-gray-800"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15,3 21,3 21,9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            DirectAthletics
          </a>
        </div>
        
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
              <MeetCard 
                key={meet.id} 
                meet={meet}
                onEditClick={currentFilter === "filam" ? undefined : handleEditClick}
                onDeleteClick={currentFilter === "filam" ? undefined : handleDeleteClick}
                isNextUpcoming={meet.id === nextUpcomingMeetId && currentFilter !== "past"}
              />
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded p-8 text-center mt-6">
            <Clock className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-medium mb-2 text-gray-600">No meets found</h3>
            <p className="text-sm text-gray-500 mb-4">
              No track and field meets are currently {currentFilter === "all" ? "scheduled" : currentFilter === "upcoming" ? "upcoming" : currentFilter === "past" ? "in the past" : "available in FilAm"}.
            </p>
            {currentFilter !== "past" && (
              <Button 
                onClick={() => setIsAddMeetOpen(true)}
                className="bg-gray-600 hover:bg-gray-700 text-white p-2 h-10 w-10 rounded-full shadow-none transition-all hover:shadow-md flex items-center justify-center mx-auto"
                aria-label="Add your first meet"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span className="sr-only">Add Your First Meet</span>
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-100 py-4">
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Design Prism LLC
          </div>
          <Button 
            onClick={() => setIsAddMeetOpen(true)}
            className="bg-gray-600 hover:bg-gray-700 text-white p-2 h-auto w-auto rounded-full shadow-none transition-all hover:shadow-md"
            aria-label="Add a new track and field meet"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span className="sr-only">Add Meet</span>
          </Button>
        </div>
      </footer>

      {/* Add Meet Dialog */}
      <Dialog open={isAddMeetOpen} onOpenChange={setIsAddMeetOpen}>
        <DialogContent className="sm:max-w-md" aria-describedby="add-meet-description">
          <div id="add-meet-description" className="sr-only">Add a new track and field meet to the schedule</div>
          <AddMeetForm onSubmit={handleAddMeet} isLoading={addMeetMutation.isPending} />
        </DialogContent>
      </Dialog>

      {/* Edit Meet Dialog */}
      {editMeet && (
        <Dialog 
          open={editMeet !== null} 
          onOpenChange={(open) => !open && setEditMeet(null)}
        >
          <DialogContent className="sm:max-w-md" aria-describedby="edit-meet-description">
            <div id="edit-meet-description" className="sr-only">Edit track and field meet details</div>
            <EditMeetForm 
              meet={editMeet} 
              onSubmit={handleEditMeet} 
              isLoading={editMeetMutation.isPending} 
            />
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmation
        isOpen={deleteConfirmOpen}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Meet"
        description="Are you sure you want to delete this meet? This action cannot be undone."
      />
    </div>
  );
}
