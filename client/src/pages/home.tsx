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
import { Button } from "@/components/ui/button";

type FilterType = "upcoming" | "past" | "all";

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

  const editMeetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: { name: string; date: string; location: string; description?: string } }) => {
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

  const handleAddMeet = (meetData: { name: string; date: string; location: string; description?: string }) => {
    addMeetMutation.mutate(meetData);
  };

  const handleEditMeet = (meetData: { name: string; date: string; location: string; description?: string }) => {
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

  const filteredMeets = meets.filter((meet) => {
    if (currentFilter === "upcoming") {
      return !isPastDate(meet.date);
    } else if (currentFilter === "past") {
      return isPastDate(meet.date);
    }
    return true;
  }).sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());

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
              />
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded p-8 text-center mt-6">
            <Clock className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-medium mb-2 text-gray-600">No meets found</h3>
            <p className="text-sm text-gray-500 mb-4">
              No track and field meets are currently {currentFilter === "all" ? "scheduled" : currentFilter === "upcoming" ? "upcoming" : "in the past"}.
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
            &copy; {new Date().getFullYear()} Track & Field Meet Schedule
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
