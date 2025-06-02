import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Edit2, Trash2, MoreVertical, Car } from "lucide-react";
import { Meet } from "@shared/schema";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  isNextUpcoming?: boolean;
}

export default function MeetCard({ meet, onEditClick, onDeleteClick, isNextUpcoming = false }: MeetCardProps) {
  const isPastDate = (dateString: string | Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Parse date string with the same approach as formatDate to avoid timezone issues
    const meetDate = typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/) 
      ? new Date(`${dateString}T00:00:00`)
      : new Date(dateString);
      
    return meetDate < today;
  };
  
  // This function calculates how many days until the meet
  const getDaysUntil = (dateString: string | Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const meetDate = typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/) 
      ? new Date(`${dateString}T00:00:00`)
      : new Date(dateString);
    
    const diffTime = Math.abs(meetDate.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
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

  // Calculate days until the meet (for upcoming meets)
  const daysUntil = !isPast ? getDaysUntil(meet.date) : 0;

  return (
    <Link href={`/meet/${meet.id}`} className="block cursor-pointer hover:opacity-95 transition-opacity">
      <Card className={`overflow-hidden border ${isNextUpcoming && !isPast ? 'border-gray-400 bg-gray-50' : 'border-gray-200 bg-white'} shadow-sm hover:shadow-md transition-shadow duration-200 relative ${isNextUpcoming && !isPast ? 'ring-1 ring-gray-300' : ''}`}>
        <CardContent className={`p-4 ${isNextUpcoming && !isPast ? 'pb-5' : ''}`}>
          {isNextUpcoming && !isPast && (
              <div className="absolute top-0 right-0 bg-gray-600 text-white text-xs px-2 py-1 rounded-bl font-medium">
                {daysUntil === 0 ? "Today" : `${daysUntil} day${daysUntil !== 1 ? 's' : ''}`}
              </div>
            )}
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
            
            {/* Show registration status and drive time for upcoming meets */}
            {!isPast && (
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center">
                  {meet.registrationStatus && (
                    <Badge 
                      variant="secondary"
                      className={`text-xs font-medium ${
                        meet.registrationStatus === "registered" 
                          ? "bg-green-100 text-green-800 border-green-200" 
                          : meet.registrationStatus === "contacted director"
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : "bg-orange-100 text-orange-800 border-orange-200"
                      }`}
                    >
                      {meet.registrationStatus === "registered" 
                        ? "Registered" 
                        : meet.registrationStatus === "contacted director"
                        ? "Contacted Director"
                        : "Not Registered"}
                    </Badge>
                  )}
                </div>
                
                {meet.driveTime && (
                  <div className="flex items-center text-xs text-gray-500">
                    <Car className="h-3 w-3 mr-1" />
                    <span>{meet.driveTime}</span>
                  </div>
                )}
              </div>
            )}
            
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
    </Link>
  );
}
