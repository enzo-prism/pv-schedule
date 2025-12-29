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
import PrimaryNav from "@/components/primary-nav";
import { Button } from "@/components/ui/button";

type FilterType = "upcoming" | "past";

type MeetPayload = {
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
};

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
    mutationFn: async (meetData: MeetPayload) => {
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
    mutationFn: async ({ id, data }: { id: number; data: MeetPayload }) => {
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

  const handleAddMeet = (meetData: MeetPayload) => {
    addMeetMutation.mutate(meetData);
  };

  const handleEditMeet = (meetData: MeetPayload) => {
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
  
  const filteredMeets = meets.filter((meet) => {
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
    // For upcoming meets, sort by closest date first (ascending order)
    return parseDate(a.date).getTime() - parseDate(b.date).getTime();
  });

  const handleFilterChange = (filter: FilterType) => {
    setCurrentFilter(filter);
  };

  return (
    <div className="min-h-screen bg-white relative">
      {/* Subtle rainbow gradient bar */}
      <div className="fixed top-0 left-0 right-0 h-0.5 z-50 overflow-hidden">
        <div 
          className="h-full w-[200%] animate-gradient"
          style={{
            background: 'linear-gradient(90deg, #ff6b6b, #feca57, #48dbfb, #00d2d3, #54a0ff, #667eea, #764ba2, #ff6b6b)',
            boxShadow: '0 1px 15px rgba(102, 126, 234, 0.25), 0 1px 8px rgba(255, 107, 107, 0.15)',
            animation: 'slide 8s linear infinite'
          }}
        />
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, #ff6b6b, #feca57, #48dbfb, #00d2d3, #54a0ff, #667eea, #764ba2)',
            filter: 'blur(8px)',
            opacity: 0.4
          }}
        />
      </div>
      <style>{`
        @keyframes slide {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      
      {/* Main content */}
      <main className="max-w-2xl mx-auto px-6 pt-8 pb-24">
        {/* User profile */}
        <div className="mb-8">
          <UserProfile name="Enzo Sison" />
        </div>

        <div className="mb-6">
          <PrimaryNav />
        </div>

        <FilterSection
          currentFilter={currentFilter}
          onFilterChange={handleFilterChange}
        />

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : filteredMeets.length > 0 ? (
          <div className="space-y-3">
            {filteredMeets.map((meet: Meet) => (
              <MeetCard 
                key={meet.id} 
                meet={meet}
                onEditClick={handleEditClick}
                onDeleteClick={handleDeleteClick}
                isNextUpcoming={meet.id === nextUpcomingMeetId && currentFilter !== "past"}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">
              No {currentFilter} meets found
            </p>
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
      {currentFilter === "upcoming" && (
        <button
          onClick={() => setIsAddMeetOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors flex items-center justify-center shadow-lg z-30"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
