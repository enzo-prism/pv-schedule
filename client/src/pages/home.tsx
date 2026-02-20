import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useLocation } from "wouter";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Meet } from "@shared/schema";
import { isPastDate, parseDateInput, startOfDay } from "@shared/dates";
import MeetCard from "@/components/meet-card";
import AddMeetForm from "@/components/add-meet-form";
import EditMeetForm from "@/components/edit-meet-form";
import FilterSection from "@/components/filter-section";
import DeleteConfirmation from "@/components/delete-confirmation";
import UserProfile from "@/components/user-profile";
import { Button } from "@/components/ui/button";
import { isReadOnlyMode } from "@/lib/env";

type FilterType = "upcoming" | "past";

const getInitialFilter = (): FilterType => {
  const params = new URLSearchParams(window.location.search);
  return params.get("filter") === "past" ? "past" : "upcoming";
};

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
  const [currentFilter, setCurrentFilter] = useState<FilterType>(getInitialFilter);
  const [editMeet, setEditMeet] = useState<Meet | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [meetToDelete, setMeetToDelete] = useState<number | null>(null);
  const [location] = useLocation();
  const { toast } = useToast();
  const isReadOnly = isReadOnlyMode;

  const { data: meets = [], isLoading } = useQuery<Meet[]>({ 
    queryKey: ["/api/meets"],
  });

  const addMeetMutation = useMutation({
    mutationFn: async (meetData: MeetPayload) => {
      const res = await apiRequest("POST", "/api/meets", meetData);
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/meets"] });
      setIsAddMeetOpen(false);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("pv-add-meet-draft");
        if (variables?.location) {
          window.localStorage.setItem("pv-last-location", variables.location);
        }
      }
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
    if (isReadOnly) {
      return;
    }
    addMeetMutation.mutate(meetData);
  };

  const handleEditMeet = (meetData: MeetPayload) => {
    if (isReadOnly) {
      return;
    }
    if (editMeet) {
      editMeetMutation.mutate({
        id: editMeet.id,
        data: meetData,
      });
    }
  };

  const handleEditClick = (meet: Meet) => {
    if (isReadOnly) {
      return;
    }
    setEditMeet(meet);
  };

  const handleDeleteClick = (meetId: number) => {
    if (isReadOnly) {
      return;
    }
    setMeetToDelete(meetId);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (isReadOnly) {
      return;
    }
    if (meetToDelete !== null) {
      deleteMeetMutation.mutate(meetToDelete);
    }
  };

  const meetsWithMeta = useMemo(() => {
    const today = startOfDay(new Date()).getTime();

    return meets.map((meet) => {
      const parsed = parseDateInput(meet.date);
      const dateValue = parsed ? startOfDay(parsed).getTime() : 0;
      const isPast = parsed ? dateValue < today : false;
      return { meet, dateValue, isPast };
    });
  }, [meets]);

  const upcomingMeets = useMemo(() => {
    return meetsWithMeta
      .filter((item) => !item.isPast)
      .sort((a, b) => a.dateValue - b.dateValue);
  }, [meetsWithMeta]);

  const nextUpcomingMeetId =
    upcomingMeets.length > 0 ? upcomingMeets[0].meet.id : null;

  const filteredMeets = useMemo(() => {
    const filtered = meetsWithMeta.filter((item) => {
      if (currentFilter === "upcoming") {
        return !item.isPast;
      }
      if (currentFilter === "past") {
        return item.isPast;
      }
      return true;
    });

    const sorted = filtered.sort((a, b) => {
      if (currentFilter === "past") {
        return b.dateValue - a.dateValue;
      }
      return a.dateValue - b.dateValue;
    });

    return sorted.map((item) => item.meet);
  }, [currentFilter, meetsWithMeta]);

  const handleFilterChange = (filter: FilterType) => {
    setCurrentFilter(filter);
    const params = new URLSearchParams(window.location.search);
    params.set("filter", filter);
    const search = params.toString();
    window.history.replaceState(null, "", search ? `/?${search}` : "/");
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("add") === "1") {
      setIsAddMeetOpen(true);
      params.delete("add");
      const search = params.toString();
      window.history.replaceState(null, "", search ? `/?${search}` : "/");
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-background relative pb-app-nav">
      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-7 pb-16">
        <section className="sticky top-0 z-30 rounded-b-3xl border-b border-white/10 bg-background/90 px-4 py-3 backdrop-blur-xl sm:px-6 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <UserProfile name="Enzo Sison" />
            <FilterSection
              currentPage="meets"
              currentFilter={currentFilter}
              showFilters
              onFilterChange={handleFilterChange}
              className="self-start sm:self-auto"
            />
          </div>
        </section>

        <div className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-white/5 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : filteredMeets.length > 0 ? (
            <div className="space-y-3">
              {filteredMeets.map((meet: Meet) => (
                <MeetCard 
                  key={meet.id} 
                  meet={meet}
                  onEditClick={isReadOnly ? undefined : handleEditClick}
                  onDeleteClick={isReadOnly ? undefined : handleDeleteClick}
                  isNextUpcoming={meet.id === nextUpcomingMeetId && currentFilter !== "past"}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">
                No {currentFilter} meets found
              </p>
            </div>
          )}
        </div>

        {currentFilter === "upcoming" && !isReadOnly && (
          <div className="mt-8 hidden justify-center sm:flex">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddMeetOpen(true)}
              className="gap-2 text-muted-foreground"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add meet
            </Button>
          </div>
        )}
      </main>

      {/* Add Meet Dialog */}
      {!isReadOnly && isAddMeetOpen && (
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
      {!isReadOnly && editMeet && (
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
      {!isReadOnly && (
        <DeleteConfirmation
          isOpen={deleteConfirmOpen}
          onCancel={() => setDeleteConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Meet"
          description="Are you sure you want to delete this meet? This action cannot be undone."
        />
      )}
      
    </div>
  );
}
