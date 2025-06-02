import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Clock } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Meet } from "@shared/schema";
import MeetCard from "@/components/meet-card";
import AddMeetForm from "@/components/add-meet-form";
import EditMeetForm from "@/components/edit-meet-form";
import FilterSection from "@/components/filter-section";
import DeleteConfirmation from "@/components/delete-confirmation";
import CountdownTimer from "@/components/countdown-timer";
import UserProfile from "@/components/user-profile";
import { Button } from "@/components/ui/button";
import { filamMeets } from "@shared/filam-meets";

type FilterType = "filam" | "upcoming" | "past" | "all";

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
      link?: string;
      driveTime?: string;
      registrationStatus?: string;
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
    mutationFn: async ({ id, data }: { id: number, data: { 
      name: string; 
      date: string; 
      location: string; 
      description?: string;
      heightCleared?: string;
      poleUsed?: string;
      deepestTakeoff?: string;
      place?: string;
      link?: string;
      driveTime?: string;
      registrationStatus?: string;
    } }) => {
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
    link?: string;
    driveTime?: string;
    registrationStatus?: string;
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
    link?: string;
    driveTime?: string;
    registrationStatus?: string;
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

  const isPastDate = (dateString: string | Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const meetDate = typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/) 
      ? new Date(`${dateString}T00:00:00`)
      : new Date(dateString);
      
    meetDate.setHours(0, 0, 0, 0);
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
    ? filamMeets.filter(meet => !isPastDate(meet.date)).sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime())
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
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 pb-20">
        {/* User profile */}
        <div className="mb-6">
          <UserProfile name="Enzo Sison" />
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
                onEditClick={handleEditClick}
                onDeleteClick={handleDeleteClick}
                isNextUpcoming={meet.id === nextUpcomingMeetId && currentFilter !== "past"}
                isFilamMeet={currentFilter === "filam"}
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
            {currentFilter !== "past" && currentFilter !== "filam" && (
              <Button 
                onClick={() => setIsAddMeetOpen(true)}
                className="bg-gray-600 hover:bg-gray-700 text-white p-2 h-10 w-10 rounded-full shadow-none transition-all hover:shadow-md flex items-center justify-center mx-auto"
                aria-label="Add your first meet"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Add Meet Dialog */}
      {isAddMeetOpen && (
        <Dialog 
          open={isAddMeetOpen} 
          onOpenChange={(open) => !open && setIsAddMeetOpen(false)}
        >
          <DialogContent className="sm:max-w-md" aria-describedby="add-meet-description">
            <div id="add-meet-description" className="sr-only">Add a new track and field meet to your schedule</div>
            <AddMeetForm 
              onSubmit={handleAddMeet} 
              isLoading={addMeetMutation.isPending} 
            />
          </DialogContent>
        </Dialog>
      )}

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
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Meet"
        description="Are you sure you want to delete this meet? This action cannot be undone."
      />
      
      {/* Floating Add Meet Button */}
      {currentFilter !== "past" && currentFilter !== "filam" && (
        <div className="fixed bottom-6 right-6 z-30">
          <Button 
            onClick={() => setIsAddMeetOpen(true)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 h-14 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-3"
          >
            <Plus className="h-5 w-5" />
            <span className="font-medium">Add Meet</span>
          </Button>
        </div>
      )}
    </div>
  );
}