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
        <Badge className="border-emerald-400/25 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/10">
          Registered
        </Badge>
      );
    }

    if (normalizedStatus === "not registered") {
      return (
        <Badge variant="outline" className="border-border text-muted-foreground">
          Not registered
        </Badge>
      );
    }

    return (
      <Badge className="border-[hsl(var(--athlete-warm))]/25 bg-[hsl(var(--athlete-warm))]/10 text-[hsl(var(--athlete-warm))] hover:bg-[hsl(var(--athlete-warm))]/10">
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
  const parsedDate = parseDateInput(meet.date);
  const monthLabel = parsedDate ? format(parsedDate, "MMM") : "TBD";
  const dayLabel = parsedDate ? format(parsedDate, "d") : "—";
  const yearLabel = parsedDate ? format(parsedDate, "yyyy") : "";
  const metrics = [
    meet.heightCleared ? `Height ${meet.heightCleared}` : null,
    meet.poleUsed ? `Pole ${meet.poleUsed}` : null,
    meet.deepestTakeoff ? `Takeoff ${meet.deepestTakeoff}` : null,
    meet.place ? `Place #${meet.place}` : null,
  ].filter((item): item is string => Boolean(item));

  return (
    <Link
      href={`/meet/${meet.id}`}
      className="block cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card
        className={cn(
          "group relative overflow-hidden transition-[background-color,border-color] duration-150 hover:border-ring/35 hover:bg-accent/35",
          isNextUpcoming && !isPast && "app-warm-border bg-[hsl(var(--athlete-warm))]/[0.035]",
        )}
      >
        <CardContent className="p-0">
          <div className="grid grid-cols-[4.25rem_minmax(0,1fr)_auto] items-start gap-3 p-4 sm:grid-cols-[5.75rem_minmax(0,1fr)_auto] sm:items-center">
            <div>
              <div className="app-section-label">{monthLabel}</div>
              <div className="text-2xl font-semibold leading-none text-foreground sm:mt-2">
                {dayLabel}
              </div>
              {yearLabel ? (
                <div className="text-xs text-muted-foreground sm:mt-1">{yearLabel}</div>
              ) : null}
            </div>

            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                {isNextUpcoming && !isPast ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase text-[hsl(var(--athlete-warm))]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--athlete-warm))]" aria-hidden="true" />
                    Next
                  </span>
                ) : null}
                <h3 className="min-w-0 text-[15px] font-semibold leading-tight text-foreground text-pretty sm:text-base">
                  {titleParts.title}
                </h3>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span>{formatDate(meet.date)}</span>
                {startTimeLabel && <span>{startTimeLabel}</span>}
                <span>{formatLocationWithFlag(meet.location)}</span>
                {!isPast && isNextUpcoming && daysUntil !== null && (
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isMeetCountdownUrgent(daysUntil)
                        ? "text-[hsl(var(--athlete-warm))]"
                        : "text-muted-foreground",
                    )}
                  >
                    {formatDaysUntilLabel(daysUntil)}
                  </span>
                )}
              </div>

              {showRegistrationBadge && <div className="mt-3">{registrationBadge}</div>}

              {isPast && metrics.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {metrics.map((metric) => (
                    <span key={metric}>{metric}</span>
                  ))}
                </div>
              ) : null}

              {meet.description && (
                <p className="mt-3 max-w-3xl text-xs leading-5 text-muted-foreground line-clamp-2 sm:text-sm">
                  {meet.description}
                </p>
              )}
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
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0" aria-label={`Open actions for ${titleParts.full}`}>
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
        </CardContent>
      </Card>
    </Link>
  );
}
