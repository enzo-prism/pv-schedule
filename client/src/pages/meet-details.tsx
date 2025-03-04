import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Meet } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, ArrowLeft, Clock, Edit2, Trash2, MoreVertical } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import EditMeetForm from "@/components/edit-meet-form";
import DeleteConfirmation from "@/components/delete-confirmation";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MeetDetails() {
  // Extract meet ID from URL
  const [, params] = useRoute<{ id: string }>("/meet/:id");
  const meetId = params?.id ? parseInt(params.id, 10) : null;
  const { toast } = useToast();
  
  const [editMeet, setEditMeet] = useState<Meet | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Fetch meet details
  const { data: meet, isLoading, isError } = useQuery<Meet>({
    queryKey: ["/api/meets", meetId],
    enabled: meetId !== null,
    select: (data) => Array.isArray(data) ? data[0] : data,
  });

  const editMeetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: { name: string; date: string; location: string; description?: string } }) => {
      const res = await apiRequest("PUT", `/api/meets/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meets", meetId] });
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
      setDeleteConfirmOpen(false);
      toast({
        title: "Meet deleted",
        description: "The meet has been successfully removed from the schedule.",
      });
      // Navigate back to home after deletion
      window.location.href = "/";
    },
    onError: (error) => {
      toast({
        title: "Failed to delete meet",
        description: error.message || "There was an error deleting the meet. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEditMeet = (meetData: { name: string; date: string; location: string; description?: string }) => {
    if (meetId) {
      editMeetMutation.mutate({
        id: meetId,
        data: meetData,
      });
    }
  };
  
  const handleConfirmDelete = () => {
    if (meetId !== null) {
      deleteMeetMutation.mutate(meetId);
    }
  };

  const formatDate = (dateString: string | Date) => {
    // Parse date string with date-fns to avoid timezone issues
    // If the input is "YYYY-MM-DD" format, ensure we preserve the date exactly
    const date = typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/) 
      ? new Date(`${dateString}T00:00:00`) 
      : new Date(dateString);
    
    return format(date, "EEEE, MMMM d, yyyy");
  };

  const isPastDate = (dateString: string | Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Parse date string to avoid timezone issues
    const meetDate = typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/) 
      ? new Date(`${dateString}T00:00:00`)
      : new Date(dateString);
      
    return meetDate < today;
  };

  // Calculate days left or days passed
  const getDayDifference = (dateString: string | Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const meetDate = typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/) 
      ? new Date(`${dateString}T00:00:00`)
      : new Date(dateString);
    
    const diffTime = Math.abs(meetDate.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (isPastDate(dateString)) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else if (diffDays === 0) {
      return 'Today';
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} left`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-700"></div>
      </div>
    );
  }

  if (isError || !meet) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <h1 className="text-2xl font-bold text-gray-800">Meet not found</h1>
        <p className="text-gray-600 text-center">The meet you're looking for doesn't exist or has been removed.</p>
        <Link href="/">
          <Button className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  const isPast = isPastDate(meet.date);
  const statusClass = isPast ? "bg-gray-200 text-gray-700" : "bg-green-100 text-green-800";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with back button */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center">
          <Link href="/">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-5 w-5 text-gray-500" />
              <span className="sr-only">Back</span>
            </Button>
          </Link>
          <span className="text-sm text-gray-500 ml-2">Back</span>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Meet header */}
          <div className="p-5 border-b border-gray-100 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">{meet.name}</h1>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`${statusClass} font-normal text-xs px-2 py-0.5`}>
                  {isPast ? 'Past' : 'Upcoming'}
                </Badge>
                <div className="flex items-center text-gray-500">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  <span className="text-xs">{getDayDifference(meet.date)}</span>
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 rounded-full p-0"
                  aria-label="More options"
                >
                  <MoreVertical className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditMeet(meet)} className="cursor-pointer">
                  <Edit2 className="h-4 w-4 mr-2" />
                  <span>Edit</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setDeleteConfirmOpen(true)} 
                  className="cursor-pointer text-red-500 focus:text-red-500"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Meet details */}
          <div className="p-5 space-y-5">
            <div>
              <h2 className="text-xs uppercase font-medium text-gray-500 mb-2">DATE & TIME</h2>
              <div className="flex items-center text-gray-800">
                <Calendar className="h-4 w-4 mr-2 text-gray-600" />
                <span className="text-base">{formatDate(meet.date)}</span>
              </div>
            </div>
            
            <div>
              <h2 className="text-xs uppercase font-medium text-gray-500 mb-2">LOCATION</h2>
              <div className="flex items-center text-gray-800">
                <MapPin className="h-4 w-4 mr-2 text-gray-600" />
                <span className="text-base">{meet.location}</span>
              </div>
            </div>
            
            {meet.description && (
              <div>
                <h2 className="text-xs uppercase font-medium text-gray-500 mb-2">DESCRIPTION</h2>
                <p className="text-gray-700 whitespace-pre-line text-sm">{meet.description}</p>
              </div>
            )}
          </div>
        </div>
      </main>

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
    </div>
  );
}