import { Card, CardContent } from "@/components/ui/card";
import { Edit2, Trash2, MoreVertical } from "lucide-react";
import { Meet } from "@shared/schema";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { HeightIcon, PoleIcon, TakeoffIcon, PlaceIcon } from "@/components/pole-vault-icons";
import MediaGallery from "@/components/media-gallery";
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
  const firstMedia = meet.media && meet.media.length > 0 ? meet.media[0] : undefined;

  return (
    <Link href={`/meet/${meet.id}`} className="block cursor-pointer hover:opacity-90 transition-opacity">
      <Card className={`overflow-hidden ${isNextUpcoming && !isPast ? 'border-l-4 border-l-gray-800 border-gray-100' : 'border-gray-100'} bg-white hover:bg-gray-50 transition-colors duration-150 relative`}>
        {firstMedia && (
          <div className="relative aspect-video bg-gray-100 overflow-hidden">
            {firstMedia.type === "video" ? (
              <video
                src={firstMedia.url}
                className="w-full h-full object-cover"
                muted
                loop
                playsInline
                aria-label="Meet video preview"
              />
            ) : (
              <img
                src={firstMedia.url}
                alt={firstMedia.caption || `${meet.name} preview`}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
          </div>
        )}
        <CardContent className="p-5">
          <div className="flex justify-between items-start">
            <div className="flex-grow">
              <h3 className="font-medium text-gray-900 leading-tight">{meet.name}</h3>
              <div className="mt-1 text-sm text-gray-500 space-y-0.5">
                <div>{formatDate(meet.date)}</div>
                <div>{meet.location}</div>
                {isNextUpcoming && !isPast && (
                  <div className="text-xs font-medium text-gray-700">
                    {daysUntil === 0 ? "Today" : `${daysUntil} day${daysUntil !== 1 ? 's' : ''}`}
                  </div>
                )}
              </div>
            </div>
            
            {onEditClick && onDeleteClick && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEditClick}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDeleteClick} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
            
            {/* Show simplified status for upcoming meets */}
            {!isPast && (meet.registrationStatus || meet.driveTime) && (
              <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500 space-y-1">
                {meet.registrationStatus && meet.registrationStatus !== "not registered" && (
                  <div>{meet.registrationStatus === "registered" ? "Registered" : "Contacted"}</div>
                )}
                {meet.driveTime && (
                  <div>{meet.driveTime} drive</div>
                )}
              </div>
            )}
            
            {/* All metrics for past meets */}
            {isPast && (meet.heightCleared || meet.poleUsed || meet.deepestTakeoff || meet.place) && (
              <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500 space-y-1">
                {meet.heightCleared && <div>Height: {meet.heightCleared}</div>}
                {meet.poleUsed && <div>Pole: {meet.poleUsed}</div>}
                {meet.deepestTakeoff && <div>Takeoff: {meet.deepestTakeoff}</div>}
                {meet.place && <div>Place: #{meet.place}</div>}
              </div>
            )}
            
            {/* Media Preview */}
            {meet.media && meet.media.length > 0 && (
              <MediaGallery media={meet.media} showInCard={true} />
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
