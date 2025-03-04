import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Meet } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, ArrowLeft, Clock, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import EditMeetForm from "@/components/edit-meet-form";
import DeleteConfirmation from "@/components/delete-confirmation";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

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
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center">
          <Link href="/">
            <Button variant="ghost" className="p-2">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
              <span className="ml-2 text-gray-800">Back</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Meet header */}
          <div className="p-6 border-b border-gray-100 flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-800">{meet.name}</h1>
                <Badge variant="outline" className={`${statusClass}`}>
                  {isPast ? 'Past' : 'Upcoming'}
                </Badge>
              </div>
              <div className="flex items-center text-gray-600">
                <Clock className="h-4 w-4 mr-2" />
                <span>{getDayDifference(meet.date)}</span>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={() => setEditMeet(meet)}
              >
                <Edit2 className="h-4 w-4" />
                <span>Edit</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </Button>
            </div>
          </div>
          
          {/* Meet details */}
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-sm uppercase font-semibold text-gray-500 mb-2">Date & Time</h2>
              <div className="flex items-center text-gray-800">
                <Calendar className="h-5 w-5 mr-2 text-gray-600" />
                <span className="text-lg">{formatDate(meet.date)}</span>
              </div>
            </div>
            
            <div>
              <h2 className="text-sm uppercase font-semibold text-gray-500 mb-2">Location</h2>
              <div className="flex items-center text-gray-800">
                <MapPin className="h-5 w-5 mr-2 text-gray-600" />
                <span className="text-lg">{meet.location}</span>
              </div>
            </div>
            
            {meet.description && (
              <div>
                <h2 className="text-sm uppercase font-semibold text-gray-500 mb-2">Description</h2>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-gray-700 whitespace-pre-line">{meet.description}</p>
                </div>
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