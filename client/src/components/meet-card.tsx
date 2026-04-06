import { Card, CardContent } from "@/components/ui/card";
import { Edit2, Trash2, MoreVertical } from "lucide-react";
import { Meet } from "@shared/schema";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { diffInDays, isPastDate, parseDateInput } from "@shared/dates";
import { formatDaysUntilLabel, isMeetCountdownUrgent } from "@/lib/meet-countdown";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { getOptimizedImageUrl, getOptimizedVideoPosterUrl, getOptimizedVideoUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { formatLocationWithFlag } from "@/lib/location";
import { getMeetTitleParts } from "@/lib/meet-title";

interface MeetCardProps {
  meet: Meet;
  onEditClick?: (meet: Meet) => void;
  onDeleteClick?: (meetId: number) => void;
  isNextUpcoming?: boolean;
}

export default function MeetCard({ meet, onEditClick, onDeleteClick, isNextUpcoming = false }: MeetCardProps) {
  const formatDate = (dateString: string | Date) => {
    const parsed = parseDateInput(dateString);
    if (!parsed) {
      return "Invalid date";
    }

    return format(parsed, "EEEE, MMMM d, yyyy");
  };
  const startTimeLabel = meet.startTime?.trim() || null;

  // We still calculate isPast for internal filtering, but don't display it on home page
  const isPast = isPastDate(meet.date);
  const titleParts = getMeetTitleParts(meet.name, meet.date);
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
        <Badge className="bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/20">
          Registered
        </Badge>
      );
    }

    if (normalizedStatus === "not registered") {
      return (
        <Badge variant="outline" className="text-muted-foreground border-white/15">
          Not registered
        </Badge>
      );
    }

    return (
      <Badge className="bg-amber-500/15 text-amber-200 hover:bg-amber-500/20">
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
  const daysUntil = !isPast ? diffInDays(meet.date) : null;
  const firstMedia = meet.media && meet.media.length > 0 ? meet.media[0] : undefined;
  const showCardMedia = !isPast ? firstMedia : undefined;
  const previewUrl =
    showCardMedia && showCardMedia.type === "photo"
      ? getOptimizedImageUrl(showCardMedia.url, { width: 720 })
      : showCardMedia
        ? getOptimizedVideoUrl(showCardMedia.url, { width: 720 })
        : undefined;
  const focusX = typeof showCardMedia?.focusX === "number" ? showCardMedia.focusX : 50;
  const focusY = typeof showCardMedia?.focusY === "number" ? showCardMedia.focusY : 50;
  const objectPosition = `${focusX}% ${focusY}%`;

  return (
    <Link
      href={`/meet/${meet.id}`}
      className="block cursor-pointer rounded-[1.5rem] transition-transform duration-150 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15 focus-visible:ring-offset-0"
    >
      <Card
        className={cn(
          "group relative overflow-hidden border-white/[0.08] bg-white/[0.03] transition-[transform,background-color,border-color] duration-200 hover:border-white/[0.14] hover:bg-white/[0.045]",
          isNextUpcoming && !isPast && "border-white/[0.14] bg-white/[0.05]",
        )}
      >
        {showCardMedia && (
          <div className="relative aspect-video bg-white/5 overflow-hidden hidden sm:block">
            {showCardMedia.type === "video" ? (
              <video
                src={previewUrl}
                poster={
                  showCardMedia.thumbnail
                    ? getOptimizedImageUrl(showCardMedia.thumbnail, { width: 720 })
                    : getOptimizedVideoPosterUrl(showCardMedia.url, { width: 720 }) ?? undefined
                }
                className="w-full h-full object-cover"
                muted
                loop
                playsInline
                preload="metadata"
                aria-label="Meet video preview"
              />
            ) : (
              <img
                src={previewUrl}
                alt={showCardMedia.caption || `${titleParts.full} preview`}
                className="w-full h-full object-cover"
                style={{ objectPosition }}
                loading="lazy"
                decoding="async"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        )}
        <CardContent className="p-4 sm:p-5">
          <div className="flex justify-between items-start">
            <div className="flex-grow">
              <div className="flex flex-wrap gap-2 items-center">
                <h3 className="min-w-[160px] flex-1 text-[15px] font-semibold leading-tight text-foreground text-pretty sm:text-base">
                  {titleParts.title}
                </h3>
                {isNextUpcoming && !isPast && (
                  <Badge variant="outline" className="border-white/12 bg-white/[0.05] text-[11px] text-white/80">
                    Next Up
                  </Badge>
                )}
              </div>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <div>{formatDate(meet.date)}</div>
                {startTimeLabel && <div>{startTimeLabel}</div>}
                <div className="text-muted-foreground/90">{formatLocationWithFlag(meet.location)}</div>
                {!isPast && isNextUpcoming && daysUntil !== null && (
                  <div
                    className={cn(
                      "text-xs font-medium",
                      isMeetCountdownUrgent(daysUntil)
                        ? "text-emerald-300 font-semibold drop-shadow-[0_0_10px_rgba(16,185,129,0.85)] motion-safe:animate-[pulse_1s_ease-in-out_infinite]"
                        : "text-muted-foreground",
                    )}
                  >
                    {formatDaysUntilLabel(daysUntil)}
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
                  <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full p-0" aria-label={`Open actions for ${titleParts.full}`}>
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
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
              <div className="mt-2 pt-2 border-t border-white/10 text-xs text-muted-foreground grid grid-cols-2 gap-x-3 gap-y-1 sm:block sm:space-y-1">
                {meet.heightCleared && <div className="truncate">Height: {meet.heightCleared}</div>}
                {meet.poleUsed && <div className="truncate">Pole: {meet.poleUsed}</div>}
                {meet.deepestTakeoff && <div className="truncate">Takeoff: {meet.deepestTakeoff}</div>}
                {meet.place && <div className="truncate">Place: #{meet.place}</div>}
              </div>
            )}
            
            {meet.description && (
              <div className="mt-2 pt-2 border-t border-white/10 sm:mt-3 sm:pt-3">
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{meet.description}</p>
              </div>
            )}
        </CardContent>
      </Card>
    </Link>
  );
}
