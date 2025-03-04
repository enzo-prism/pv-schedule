import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Edit2, Trash2, MoreVertical } from "lucide-react";
import { Meet } from "@shared/schema";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MeetCardProps {
  meet: Meet;
  onEditClick?: (meet: Meet) => void;
  onDeleteClick?: (meetId: number) => void;
}

export default function MeetCard({ meet, onEditClick, onDeleteClick }: MeetCardProps) {
  const isPastDate = (dateString: string | Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Parse date string with the same approach as formatDate to avoid timezone issues
    const meetDate = typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/) 
      ? new Date(`${dateString}T00:00:00`)
      : new Date(dateString);
      
    return meetDate < today;
  };

  const formatDate = (dateString: string | Date) => {
    // Parse date string with date-fns to avoid timezone issues
    // If the input is "YYYY-MM-DD" format, ensure we preserve the date exactly
    const date = typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/) 
      ? new Date(`${dateString}T00:00:00`) 
      : new Date(dateString);
    
    return format(date, "EEEE, MMMM d, yyyy");
  };

  const isPast = isPastDate(meet.date);
  const statusClass = isPast ? "text-gray-400" : "text-green-600";
  const statusText = isPast ? "Past" : "Upcoming";

  const handleEditClick = () => {
    if (onEditClick) {
      onEditClick(meet);
    }
  };
  
  const handleDeleteClick = () => {
    if (onDeleteClick) {
      onDeleteClick(meet.id);
    }
  };

  return (
    <Card className="overflow-hidden border border-accent bg-white shadow-sm meet-transition relative">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg">{meet.name}</h3>
          <div className="flex items-center gap-1">
            {(onEditClick || onDeleteClick) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 rounded-full p-0"
                    aria-label="More options"
                  >
                    <MoreVertical className="h-4 w-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEditClick && (
                    <DropdownMenuItem onClick={handleEditClick} className="cursor-pointer">
                      <Edit2 className="h-4 w-4 mr-2" />
                      <span>Edit</span>
                    </DropdownMenuItem>
                  )}
                  {onDeleteClick && (
                    <DropdownMenuItem 
                      onClick={handleDeleteClick} 
                      className="cursor-pointer text-red-500 focus:text-red-500"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <span className={`${statusClass} text-xs font-medium px-2 py-1 bg-gray-100 rounded ml-1`}>
              {statusText}
            </span>
          </div>
        </div>
        <div className="mt-2 flex items-center text-sm text-gray-600">
          <Calendar className="text-secondary h-4 w-4 mr-1" />
          <span>{formatDate(meet.date)}</span>
        </div>
        <div className="mt-1 flex items-center text-sm text-gray-600">
          <MapPin className="text-secondary h-4 w-4 mr-1" />
          <span>{meet.location}</span>
        </div>
        {meet.description && (
          <div className="mt-3 pt-3 border-t border-accent">
            <p className="text-sm text-gray-600">{meet.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
