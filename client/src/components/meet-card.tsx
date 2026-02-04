import { Card, CardContent } from "@/components/ui/card";
import { Edit2, Trash2, MoreVertical } from "lucide-react";
import { Meet } from "@shared/schema";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { diffInDays, isPastDate, parseDateInput } from "@shared/dates";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface MeetCardProps {
  meet: Meet;
  onEditClick?: (meet: Meet) => void;
  onDeleteClick?: (meetId: number) => void;
  isNextUpcoming?: boolean;
}

export default function MeetCard({ meet, onEditClick, onDeleteClick, isNextUpcoming = false }: MeetCardProps) {
  // This function calculates how many days until the meet
  const getDaysUntil = (dateString: string | Date) => {
    return diffInDays(dateString) ?? 0;
  };

  const formatDate = (dateString: string | Date) => {
    const parsed = parseDateInput(dateString);
    if (!parsed) {
      return "Invalid date";
    }

    return format(parsed, "EEEE, MMMM d, yyyy");
  };

  // We still calculate isPast for internal filtering, but don't display it on home page
  const isPast = isPastDate(meet.date);
  const normalizedStatus = (meet.registrationStatus ?? "").trim().toLowerCase();
  const showRegistrationBadge =
    !isPast &&
    normalizedStatus.length > 0 &&
    normalizedStatus !== "registered" &&
    normalizedStatus !== "not registered";

  const registrationBadge = (() => {
    if (!showRegistrationBadge) {
      return null;
    }

    if (normalizedStatus === "registered") {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100/80">
          Registered
        </Badge>
      );
    }

    if (normalizedStatus === "not registered") {
      return (
        <Badge variant="outline" className="text-gray-600 border-gray-200">
          Not registered
        </Badge>
      );
    }

    return (
      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100/80">
        {meet.registrationStatus}
      </Badge>
    );
  })();

  const handleEditClick = (e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (onEditClick) {
      onEditClick(meet);
    }
  };
  
  const handleDeleteClick = (e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (onDeleteClick) {
      onDeleteClick(meet.id);
    }
  };

  // Calculate days until the meet (for upcoming meets)
  const daysUntil = !isPast ? getDaysUntil(meet.date) : 0;
  const firstMedia = meet.media && meet.media.length > 0 ? meet.media[0] : undefined;
  const focusX = typeof firstMedia?.focusX === "number" ? firstMedia.focusX : 50;
  const focusY = typeof firstMedia?.focusY === "number" ? firstMedia.focusY : 50;
  const objectPosition = `${focusX}% ${focusY}%`;

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
                style={{ objectPosition }}
                loading="lazy"
                decoding="async"
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
              <Drawer>
                <DrawerTrigger
                  asChild
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                >
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                    <MoreVertical className="h-4 w-4 text-gray-500" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Meet Actions</DrawerTitle>
                    <DrawerDescription>Quick actions for this meet.</DrawerDescription>
                  </DrawerHeader>
                  <div className="grid gap-2 px-4 pb-4">
                    <DrawerClose asChild>
                      <Button variant="outline" onClick={handleEditClick}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </DrawerClose>
                    <DrawerClose asChild>
                      <Button variant="destructive" onClick={handleDeleteClick}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </DrawerClose>
                  </div>
                </DrawerContent>
              </Drawer>
            )}
          </div>

          {showRegistrationBadge && (
            <div className="mt-3">
              {registrationBadge}
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
