import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Edit2, Trash2, MoreVertical } from "lucide-react";
import { Meet } from "@shared/schema";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { HeightIcon, PoleIcon, TakeoffIcon, PlaceIcon } from "@/components/pole-vault-icons";
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

  // We still calculate isPast for internal filtering, but don't display it on home page
  const isPast = isPastDate(meet.date);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onEditClick) {
      onEditClick(meet);
    }
  };
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onDeleteClick) {
      onDeleteClick(meet.id);
    }
  };

  return (
    <Link href={`/meet/${meet.id}`}>
      <a className="block cursor-pointer hover:opacity-95 transition-opacity">
        <Card className="overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 relative">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-lg text-gray-800">{meet.name}</h3>
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-600">
              <Calendar className="text-gray-500 h-4 w-4 mr-1" />
              <span>{formatDate(meet.date)}</span>
            </div>
            <div className="mt-1 flex items-center text-sm text-gray-600">
              <MapPin className="text-gray-500 h-4 w-4 mr-1" />
              <span>{meet.location}</span>
            </div>
            
            {/* Only show metrics for past meets and if at least one metric exists */}
            {isPast && (meet.heightCleared || meet.poleUsed || meet.deepestTakeoff || meet.place) && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <h4 className="text-xs uppercase font-medium text-gray-500 mb-2">Performance</h4>
                <div className="grid grid-cols-2 gap-x-2 gap-y-2">
                  {meet.heightCleared && (
                    <div className="flex items-center">
                      <HeightIcon className="h-3.5 w-3.5 mr-1.5 text-gray-500 flex-shrink-0" />
                      <span className="text-xs text-gray-600 truncate">{meet.heightCleared}</span>
                    </div>
                  )}
                  
                  {meet.poleUsed && (
                    <div className="flex items-center">
                      <PoleIcon className="h-3.5 w-3.5 mr-1.5 text-gray-500 flex-shrink-0" />
                      <span className="text-xs text-gray-600 truncate">{meet.poleUsed}</span>
                    </div>
                  )}
                  
                  {meet.deepestTakeoff && (
                    <div className="flex items-center">
                      <TakeoffIcon className="h-3.5 w-3.5 mr-1.5 text-gray-500 flex-shrink-0" />
                      <span className="text-xs text-gray-600 truncate">{meet.deepestTakeoff}</span>
                    </div>
                  )}
                  
                  {meet.place && (
                    <div className="flex items-center">
                      <PlaceIcon className="h-3.5 w-3.5 mr-1.5 text-gray-500 flex-shrink-0" />
                      <span className="text-xs text-gray-600 truncate">{meet.place}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {meet.description && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-600 line-clamp-2">{meet.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </a>
    </Link>
  );
}
