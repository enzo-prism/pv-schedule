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
  const previewUrl =
    firstMedia && firstMedia.type === "photo"
      ? getOptimizedImageUrl(firstMedia.url, { width: 720 })
      : firstMedia
        ? getOptimizedVideoUrl(firstMedia.url, { width: 720 })
        : undefined;
  const focusX = typeof firstMedia?.focusX === "number" ? firstMedia.focusX : 50;
  const focusY = typeof firstMedia?.focusY === "number" ? firstMedia.focusY : 50;
  const objectPosition = `${focusX}% ${focusY}%`;

  return (
    <Link
      href={`/meet/${meet.id}`}
      className="block cursor-pointer transition-transform duration-150 hover:-translate-y-px"
    >
      <Card
        className={`overflow-hidden ${
          isNextUpcoming && !isPast
            ? "border-l-2 border-l-white/25"
            : ""
        } hover:bg-white/5 hover:border-white/15 transition-colors duration-150 relative`}
      >
        {firstMedia && (
          <div className="relative aspect-video bg-white/5 overflow-hidden hidden sm:block">
            {firstMedia.type === "video" ? (
              <video
                src={previewUrl}
                poster={
                  firstMedia.thumbnail
                    ? getOptimizedImageUrl(firstMedia.thumbnail, { width: 720 })
                    : getOptimizedVideoPosterUrl(firstMedia.url, { width: 720 }) ?? undefined
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
                alt={firstMedia.caption || `${titleParts.full} preview`}
                className="w-full h-full object-cover"
                style={{ objectPosition }}
                loading="lazy"
                decoding="async"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        )}
        <CardContent className="p-3 sm:p-5">
          <div className="flex justify-between items-start">
            <div className="flex-grow">
              <div className="flex flex-wrap gap-2 items-center">
                <h3 className="font-medium text-foreground leading-tight line-clamp-2 flex-1 min-w-[160px]">
                  {titleParts.title}
                </h3>
                {titleParts.sanction && (
                  <span className="text-[10px] tracking-[0.08em] uppercase text-muted-foreground border border-white/10 bg-white/5 px-2 py-0.5 rounded-full">
                    {titleParts.sanction}
                  </span>
                )}
              </div>
              <div className="mt-1 text-sm text-muted-foreground space-y-0.5">
                <div>{formatDate(meet.date)}</div>
                <div>{formatLocationWithFlag(meet.location)}</div>
                {!isPast && daysUntil !== null && (
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
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
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
              <div className="mt-2 pt-2 border-t border-white/10 text-xs text-muted-foreground space-y-1 hidden sm:block">
                {meet.heightCleared && <div>Height: {meet.heightCleared}</div>}
                {meet.poleUsed && <div>Pole: {meet.poleUsed}</div>}
                {meet.deepestTakeoff && <div>Takeoff: {meet.deepestTakeoff}</div>}
                {meet.place && <div>Place: #{meet.place}</div>}
              </div>
            )}
            
            {meet.description && (
              <div className="mt-3 pt-3 border-t border-white/10 hidden sm:block">
                <p className="text-sm text-muted-foreground line-clamp-2">{meet.description}</p>
              </div>
            )}
        </CardContent>
      </Card>
    </Link>
  );
}
