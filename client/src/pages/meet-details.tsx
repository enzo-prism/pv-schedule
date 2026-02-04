import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Meet } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  ArrowLeft,
  Clock,
  Edit2,
  Trash2,
  MoreVertical,
  Camera,
  ImagePlus,
  ArrowUp,
  ArrowDown,
  X,
} from "lucide-react";
import { HeightIcon, PoleIcon, TakeoffIcon, PlaceIcon } from "@/components/pole-vault-icons";
import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EditMeetForm from "@/components/edit-meet-form";
import DeleteConfirmation from "@/components/delete-confirmation";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { diffInDays, isPastDate, parseDateInput } from "@shared/dates";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

const MAX_MEDIA_BYTES = 10 * 1024 * 1024;
type MediaMode = "upload" | "url";
type MediaQueueStatus = "pending" | "uploading" | "uploaded" | "error" | "skipped";
type MediaQueueItem = {
  id: string;
  file: File;
  previewUrl: string;
  type: "photo" | "video";
  status: MediaQueueStatus;
  error?: string;
};

export default function MeetDetails() {
  // Extract meet ID from URL
  const [, params] = useRoute<{ id: string }>("/meet/:id");
  const meetId = params?.id ? parseInt(params.id, 10) : null;
  const { toast } = useToast();
  
  const [editMeet, setEditMeet] = useState<Meet | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [mediaMode, setMediaMode] = useState<MediaMode>("upload");
  const [mediaQueue, setMediaQueue] = useState<MediaQueueItem[]>([]);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaCaption, setMediaCaption] = useState("");
  const [mediaType, setMediaType] = useState<"photo" | "video">("photo");
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [mediaWarning, setMediaWarning] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [mediaActionIndex, setMediaActionIndex] = useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const lastWheelRef = useRef(0);
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const touchStartXRef = useRef<Record<string, number>>({});
  const mediaLongPressRef = useRef<number | null>(null);

type MeetPayload = {
  name: string;
  date: string;
  location: string;
  description?: string;
  heightCleared?: string;
  poleUsed?: string;
  deepestTakeoff?: string;
  place?: string;
  link?: string;
  driveTime?: string;
  registrationStatus?: string;
};

  const { data: meet, isLoading, isError } = useQuery<Meet>({
    queryKey: [`/api/meets/${meetId}`],
    enabled: meetId !== null,
  });

  const clearMediaQueue = () => {
    mediaQueue.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setMediaQueue([]);
  };

  const resetMediaForm = () => {
    clearMediaQueue();
    setMediaUrl("");
    setMediaCaption("");
    setMediaType("photo");
    setMediaError(null);
    setMediaWarning(null);
    setUploadProgress(null);
    setIsUploading(false);
    setMediaMode("upload");
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read file."));
      reader.readAsDataURL(file);
    });

  const appendMediaFiles = (files: File[]) => {
    if (files.length === 0) {
      return;
    }
    setMediaQueue((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        type: file.type.startsWith("video/") ? "video" : "photo",
        status: "pending" as MediaQueueStatus,
      })),
    ]);
  };

  const updateQueueItem = (id: string, updates: Partial<MediaQueueItem>) => {
    setMediaQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  };

  const moveQueueItem = (id: string, direction: "up" | "down") => {
    setMediaQueue((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index < 0) {
        return prev;
      }
      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= prev.length) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(nextIndex, 0, moved);
      return next;
    });
  };

  const removeQueueItem = (id: string) => {
    setMediaQueue((prev) => {
      const item = prev.find((entry) => entry.id === id);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((entry) => entry.id !== id);
    });
  };

  const startMediaLongPress = (index: number) => {
    if (mediaLongPressRef.current) {
      window.clearTimeout(mediaLongPressRef.current);
    }
    mediaLongPressRef.current = window.setTimeout(() => {
      setMediaActionIndex(index);
      vibrate(6);
    }, 600);
  };

  const cancelMediaLongPress = () => {
    if (mediaLongPressRef.current) {
      window.clearTimeout(mediaLongPressRef.current);
      mediaLongPressRef.current = null;
    }
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const editMeetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: MeetPayload }) => {
      const res = await apiRequest("PUT", `/api/meets/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meets"] });
      queryClient.invalidateQueries({ queryKey: [`/api/meets/${meetId}`] });
      setEditMeet(null);
      vibrate();
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
      vibrate();
      toast({
        title: "Meet deleted",
        description: "The meet has been successfully removed from the schedule.",
      });
      // Navigate back to home after deletion
      window.location.href = "/";
    },
    onError: (error) => {
      toast({
        title: "Cannot delete meet",
        description: error.message || "There was an error deleting the meet.",
        variant: "destructive",
      });
    },
  });

  const deleteMediaMutation = useMutation({
    mutationFn: async (mediaId: string) => {
      if (!meetId) {
        throw new Error("Meet ID is missing.");
      }
      await apiRequest("DELETE", `/api/meets/${meetId}/media/${mediaId}`);
      return mediaId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meets"] });
      queryClient.invalidateQueries({ queryKey: [`/api/meets/${meetId}`] });
      vibrate();
      toast({
        title: "Media removed",
        description: "The media item has been deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message || "Unable to delete media.",
        variant: "destructive",
      });
    },
  });

  const handleEditMeet = (meetData: MeetPayload) => {
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

  const handleMediaSubmit = async () => {
    if (isUploading) {
      return;
    }
    setMediaError(null);
    setMediaWarning(null);
    if (!meetId) {
      setMediaError("Meet ID is missing.");
      return;
    }

    if (mediaMode === "upload") {
      const queueSnapshot = mediaQueue.filter((item) => item.status !== "uploaded");
      if (queueSnapshot.length === 0) {
        setMediaError("Please select one or more files to upload.");
        return;
      }

      let skippedType = 0;
      let skippedSize = 0;
      const validItems: MediaQueueItem[] = [];

      const nextQueue = queueSnapshot.map((item) => {
        if (!item.file.type.startsWith("image/") && !item.file.type.startsWith("video/")) {
          skippedType += 1;
          return { ...item, status: "skipped", error: "Unsupported file type." };
        }
        if (item.file.size > MAX_MEDIA_BYTES) {
          skippedSize += 1;
          return { ...item, status: "skipped", error: "File too large." };
        }
        validItems.push(item);
        return { ...item, status: "pending", error: undefined };
      });

      setMediaQueue((prev) =>
        prev.map((item) => nextQueue.find((next) => next.id === item.id) ?? item),
      );

      if (skippedType || skippedSize) {
        const parts = [];
        if (skippedType) {
          parts.push(`${skippedType} unsupported`);
        }
        if (skippedSize) {
          parts.push(`${skippedSize} over 10MB`);
        }
        setMediaWarning(`Skipped ${parts.join(" and ")}.`);
      }

      if (validItems.length === 0) {
        setMediaError("No valid files to upload.");
        return;
      }

      setIsUploading(true);
      setUploadProgress({ current: 0, total: validItems.length });
      let successCount = 0;
      let failureCount = 0;

      for (let index = 0; index < validItems.length; index++) {
        const item = validItems[index];
        updateQueueItem(item.id, { status: "uploading", error: undefined });
        try {
          const dataUrl = await readFileAsDataUrl(item.file);
          await apiRequest("POST", `/api/meets/${meetId}/media`, {
            mode: "upload",
            filename: item.file.name,
            contentType: item.file.type,
            data: dataUrl,
            caption: mediaCaption || undefined,
          });
          successCount += 1;
          updateQueueItem(item.id, { status: "uploaded" });
        } catch (error) {
          failureCount += 1;
          updateQueueItem(item.id, {
            status: "error",
            error: error instanceof Error ? error.message : "Upload failed.",
          });
        } finally {
          setUploadProgress({ current: index + 1, total: validItems.length });
        }
      }

      setIsUploading(false);
      if (successCount > 0) {
        queryClient.invalidateQueries({ queryKey: ["/api/meets"] });
        queryClient.invalidateQueries({ queryKey: [`/api/meets/${meetId}`] });
      }

      if (failureCount === 0) {
        setMediaDialogOpen(false);
        resetMediaForm();
        vibrate();
        toast({
          title: "Media added",
          description:
            successCount === 1
              ? "Your media has been uploaded."
              : `Uploaded ${successCount} items to this meet.`,
        });
      } else {
        setMediaError(`${failureCount} file${failureCount === 1 ? "" : "s"} failed to upload.`);
        toast({
          title: "Upload incomplete",
          description: `${successCount} uploaded, ${failureCount} failed.`,
          variant: "destructive",
        });
      }

      return;
    }

    if (!mediaUrl.trim()) {
      setMediaError("Please provide a media URL.");
      return;
    }

    setIsUploading(true);
    try {
      await apiRequest("POST", `/api/meets/${meetId}/media`, {
        mode: "url",
        url: mediaUrl.trim(),
        type: mediaType,
        caption: mediaCaption || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/meets"] });
      queryClient.invalidateQueries({ queryKey: [`/api/meets/${meetId}`] });
      setMediaDialogOpen(false);
      resetMediaForm();
      vibrate();
      toast({
        title: "Media added",
        description: "Your media link has been saved.",
      });
    } catch (error) {
      setMediaError(error instanceof Error ? error.message : "Unable to upload media.");
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unable to upload media.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (!carouselApi || !lightboxOpen) {
      return;
    }
    carouselApi.scrollTo(lightboxIndex);
  }, [carouselApi, lightboxIndex, lightboxOpen]);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    const handleSelect = () => {
      const selected = carouselApi.selectedScrollSnap();
      setLightboxIndex(selected);
    };

    carouselApi.on("select", handleSelect);
    handleSelect();

    return () => {
      carouselApi.off("select", handleSelect);
    };
  }, [carouselApi]);

  const handleLightboxWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!carouselApi) {
      return;
    }

    const absX = Math.abs(event.deltaX);
    const absY = Math.abs(event.deltaY);
    const primaryDelta = absX > absY ? event.deltaX : event.deltaY;

    if (Math.abs(primaryDelta) < 20) {
      return;
    }

    const now = Date.now();
    if (now - lastWheelRef.current < 250) {
      return;
    }

    lastWheelRef.current = now;
    if (primaryDelta > 0) {
      carouselApi.scrollNext();
    } else {
      carouselApi.scrollPrev();
    }

    event.preventDefault();
  };

  const formatQueueStatus = (status: MediaQueueStatus) => {
    switch (status) {
      case "uploading":
        return "Uploading";
      case "uploaded":
        return "Uploaded";
      case "error":
        return "Failed";
      case "skipped":
        return "Skipped";
      default:
        return "Ready";
    }
  };

  const vibrate = (duration = 8) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(duration);
    }
  };

  // Calculate days left or days passed
  const getDayDifference = (dateString: string | Date) => {
    const diffDays = diffInDays(dateString);
    if (diffDays === null) {
      return "";
    }

    if (isPastDate(dateString)) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    }
    if (diffDays === 0) {
      return "Today";
    }
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} left`;
  };

  const formatDate = (dateString: string | Date) => {
    const parsed = parseDateInput(dateString);
    if (!parsed) {
      return "Invalid date";
    }

    return format(parsed, "EEEE, MMMM d, yyyy");
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
  const showRegistrationStatus = !isPast && meet.registrationStatus;
  const hasMetrics = Boolean(
    meet.heightCleared || meet.poleUsed || meet.deepestTakeoff || meet.place,
  );
  const hasLogistics = Boolean(meet.link || meet.driveTime);
  const hasNotes = Boolean(meet.description && meet.description.trim().length > 0);
  const mediaActionItem =
    mediaActionIndex !== null ? meet.media?.[mediaActionIndex] : null;
  const canSaveMedia =
    mediaMode === "upload"
      ? mediaQueue.length > 0
      : mediaUrl.trim().length > 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-app-nav">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <ArrowLeft className="h-5 w-5 text-gray-500" />
              <span className="sr-only">Back</span>
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">{meet.name}</p>
            <p className="text-xs text-gray-500">{formatDate(meet.date)}</p>
          </div>
          <Drawer>
            <DrawerTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 rounded-full p-0"
                aria-label="Meet actions"
              >
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
                  <Button onClick={() => setMediaDialogOpen(true)}>Add media</Button>
                </DrawerClose>
                <DrawerClose asChild>
                  <Button variant="outline" onClick={() => setEditMeet(meet)}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit meet
                  </Button>
                </DrawerClose>
                <DrawerClose asChild>
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteConfirmOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete meet
                  </Button>
                </DrawerClose>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-4 pb-32">
        <Accordion
          type="multiple"
          defaultValue={["overview", "media"]}
          className="space-y-3"
        >
          <AccordionItem
            value="overview"
            className="rounded-xl border border-gray-100 bg-white shadow-sm"
          >
            <AccordionTrigger className="px-4 text-sm font-semibold">
              Overview
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={`${statusClass} font-normal text-xs px-2 py-0.5`}
                >
                  {isPast ? "Past" : "Upcoming"}
                </Badge>
                <div className="flex items-center text-gray-500">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  <span className="text-xs">{getDayDifference(meet.date)}</span>
                </div>
                {showRegistrationStatus && (
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
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-600" />
                  <span>{formatDate(meet.date)}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-gray-600" />
                  <span>{meet.location}</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="metrics"
            className="rounded-xl border border-gray-100 bg-white shadow-sm"
          >
            <AccordionTrigger className="px-4 text-sm font-semibold">
              Vault Metrics
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-3 text-sm">
              {hasMetrics ? (
                <>
                  {meet.heightCleared && (
                    <div className="flex items-center text-gray-800">
                      <HeightIcon className="h-5 w-5 mr-2 text-gray-600 flex-shrink-0" />
                      <div>
                        <span className="text-xs text-gray-500 block">
                          Height Cleared
                        </span>
                        <span className="text-base">{meet.heightCleared}</span>
                      </div>
                    </div>
                  )}
                  {meet.poleUsed && (
                    <div className="flex items-center text-gray-800">
                      <PoleIcon className="h-5 w-5 mr-2 text-gray-600 flex-shrink-0" />
                      <div>
                        <span className="text-xs text-gray-500 block">
                          Pole Used
                        </span>
                        <span className="text-base">{meet.poleUsed}</span>
                      </div>
                    </div>
                  )}
                  {meet.deepestTakeoff && (
                    <div className="flex items-center text-gray-800">
                      <TakeoffIcon className="h-5 w-5 mr-2 text-gray-600 flex-shrink-0" />
                      <div>
                        <span className="text-xs text-gray-500 block">
                          Deepest Takeoff
                        </span>
                        <span className="text-base">{meet.deepestTakeoff}</span>
                      </div>
                    </div>
                  )}
                  {meet.place && (
                    <div className="flex items-center text-gray-800">
                      <PlaceIcon className="h-5 w-5 mr-2 text-gray-600 flex-shrink-0" />
                      <div>
                        <span className="text-xs text-gray-500 block">
                          Place/Ranking
                        </span>
                        <span className="text-base">{meet.place}</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-500">No vault metrics yet.</p>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="logistics"
            className="rounded-xl border border-gray-100 bg-white shadow-sm"
          >
            <AccordionTrigger className="px-4 text-sm font-semibold">
              Logistics
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-3 text-sm">
              {hasLogistics ? (
                <>
                  {meet.link && (
                    <div className="flex items-center text-gray-800">
                      <svg
                        className="h-4 w-4 mr-2 text-gray-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                      <a
                        href={meet.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline break-all"
                      >
                        {meet.link}
                      </a>
                    </div>
                  )}
                  {meet.driveTime && (
                    <div className="flex items-center text-gray-800">
                      <svg
                        className="h-4 w-4 mr-2 text-gray-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12,6 12,12 16,14" />
                      </svg>
                      <span>{meet.driveTime}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-500">No logistics details yet.</p>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="notes"
            className="rounded-xl border border-gray-100 bg-white shadow-sm"
          >
            <AccordionTrigger className="px-4 text-sm font-semibold">
              Notes
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 text-sm text-gray-700">
              {hasNotes ? (
                <p className="whitespace-pre-line">{meet.description}</p>
              ) : (
                <p className="text-gray-500">No notes yet.</p>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="media"
            className="rounded-xl border border-gray-100 bg-white shadow-sm"
          >
            <AccordionTrigger className="px-4 text-sm font-semibold">
              Media
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase font-medium text-gray-500">
                  Attached media
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMediaDialogOpen(true)}
                  className="h-8"
                >
                  Add media
                </Button>
              </div>

              {meet.media && meet.media.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {meet.media.map((item, index) => {
                    const isPhoto = item.type === "photo";
                    return (
                      <div
                        key={item.id}
                        className="overflow-hidden rounded-lg border border-gray-100 bg-gray-50"
                        role={isPhoto ? "button" : undefined}
                        tabIndex={isPhoto ? 0 : undefined}
                        onClick={isPhoto ? () => openLightbox(index) : undefined}
                        onTouchStart={() => startMediaLongPress(index)}
                        onTouchEnd={cancelMediaLongPress}
                        onTouchMove={cancelMediaLongPress}
                        onTouchCancel={cancelMediaLongPress}
                        onKeyDown={
                          isPhoto
                            ? (event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  openLightbox(index);
                                }
                              }
                            : undefined
                        }
                      >
                        {item.type === "video" ? (
                          <video
                            src={item.url}
                            className="h-48 w-full object-cover"
                            controls
                            preload="metadata"
                          />
                        ) : (
                          <img
                            src={item.url}
                            alt={item.caption || `${meet.name} media`}
                            className="h-48 w-full object-cover"
                            loading="lazy"
                          />
                        )}
                        <div className="flex items-start justify-between gap-2 p-3">
                          <div className="min-w-0">
                            {item.caption ? (
                              <p className="text-xs text-gray-600 line-clamp-2">
                                {item.caption}
                              </p>
                            ) : (
                              <p className="text-xs text-gray-400">No caption</p>
                            )}
                            {item.originalFilename && (
                              <p className="text-[11px] text-gray-400 mt-1 truncate">
                                {item.originalFilename}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                openLightbox(index);
                              }}
                              className="h-9 px-3 text-gray-600 hover:text-gray-800"
                            >
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                deleteMediaMutation.mutate(item.id);
                              }}
                              disabled={deleteMediaMutation.isPending}
                              className="h-9 px-3 text-red-500 hover:text-red-600"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No media yet.</p>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </main>

      <div className="fixed inset-x-0 z-30 px-4 bottom-app-nav">
        <div className="mx-auto flex max-w-3xl items-center gap-2 rounded-2xl border border-gray-200 bg-white/95 p-2 shadow-lg">
          <Button
            className="flex-1"
            onClick={() => setMediaDialogOpen(true)}
          >
            Add media
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setEditMeet(meet)}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => setDeleteConfirmOpen(true)}
          >
            Delete
          </Button>
        </div>
      </div>

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

      {/* Media Upload Dialog */}
      {mediaDialogOpen && (
        <Dialog
          open={mediaDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setMediaDialogOpen(false);
              resetMediaForm();
            }
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Media</DialogTitle>
              <DialogDescription>
                Upload a photo or video, or add a link to hosted media.
              </DialogDescription>
            </DialogHeader>

            <Tabs
              value={mediaMode}
              onValueChange={(value) => {
                setMediaMode(value as MediaMode);
                setMediaError(null);
                setMediaWarning(null);
                if (value === "upload") {
                  setMediaUrl("");
                } else {
                  clearMediaQueue();
                }
              }}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="url">Link</TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-3 pt-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Choose Media</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 justify-center gap-2"
                      onClick={() => libraryInputRef.current?.click()}
                    >
                      <ImagePlus className="h-4 w-4" />
                      Choose Media
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 justify-center gap-2"
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      <Camera className="h-4 w-4" />
                      Camera
                    </Button>
                  </div>
                  <input
                    ref={libraryInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      const files = Array.from(event.target.files ?? []);
                      appendMediaFiles(files);
                      event.currentTarget.value = "";
                    }}
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*,video/*"
                    capture="environment"
                    className="hidden"
                    onChange={(event) => {
                      const files = Array.from(event.target.files ?? []);
                      appendMediaFiles(files);
                      event.currentTarget.value = "";
                    }}
                  />
                  <p className="text-xs text-gray-400">
                    Select multiple photos or videos. Max file size: 10MB each. Swipe left on a file to remove.
                  </p>
                </div>

                {mediaQueue.length > 0 ? (
                  <div className="space-y-2">
                    {mediaQueue.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-2 shadow-sm"
                        onTouchStart={(event) => {
                          touchStartXRef.current[item.id] =
                            event.touches[0]?.clientX ?? 0;
                        }}
                        onTouchEnd={(event) => {
                          const startX = touchStartXRef.current[item.id] ?? 0;
                          const endX = event.changedTouches[0]?.clientX ?? 0;
                          if (startX - endX > 80) {
                            removeQueueItem(item.id);
                          }
                        }}
                      >
                        <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                          {item.type === "video" ? (
                            <video
                              src={item.previewUrl}
                              className="h-full w-full object-cover"
                              muted
                              playsInline
                            />
                          ) : (
                            <img
                              src={item.previewUrl}
                              alt={item.file.name}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <p className="truncate text-sm text-gray-700">
                            {item.file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(item.file.size / (1024 * 1024)).toFixed(2)} MB ·{" "}
                            {formatQueueStatus(item.status)}
                          </p>
                          {item.error && (
                            <p className="text-[11px] text-red-500 truncate">
                              {item.error}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={index === 0}
                            onClick={() => moveQueueItem(item.id, "up")}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={index === mediaQueue.length - 1}
                            onClick={() => moveQueueItem(item.id, "down")}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeQueueItem(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No files selected yet.</p>
                )}
              </TabsContent>

              <TabsContent value="url" className="space-y-3 pt-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Media URL</label>
                  <Input
                    placeholder="https://example.com/media.jpg"
                    value={mediaUrl}
                    onChange={(event) => setMediaUrl(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Type</label>
                  <Select value={mediaType} onValueChange={(value) => setMediaType(value as "photo" | "video")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select media type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="photo">Photo</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Caption (optional)</label>
              <Textarea
                value={mediaCaption}
                onChange={(event) => setMediaCaption(event.target.value)}
                rows={3}
                placeholder="Add a short note about this media"
              />
              {mediaMode === "upload" && mediaQueue.length > 1 && (
                <p className="text-xs text-gray-400">Caption will apply to all selected files.</p>
              )}
            </div>

            {uploadProgress && isUploading && (
              <p className="text-xs text-gray-500">
                Uploading {uploadProgress.current} of {uploadProgress.total}...
              </p>
            )}
            {mediaWarning && <p className="text-xs text-amber-600">{mediaWarning}</p>}
            {mediaError && <p className="text-xs text-red-500">{mediaError}</p>}

            <Button
              onClick={handleMediaSubmit}
              disabled={isUploading || !canSaveMedia}
            >
              {isUploading ? "Uploading..." : "Save to meet"}
            </Button>
          </DialogContent>
        </Dialog>
      )}

      <Drawer
        open={mediaActionIndex !== null}
        onOpenChange={(open) => {
          if (!open) {
            setMediaActionIndex(null);
          }
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Media Actions</DrawerTitle>
            <DrawerDescription>
              {mediaActionItem?.originalFilename || mediaActionItem?.caption || "Quick actions"}
            </DrawerDescription>
          </DrawerHeader>
          <div className="grid gap-2 px-4 pb-4">
            <DrawerClose asChild>
              <Button
                onClick={() => {
                  if (mediaActionIndex !== null) {
                    openLightbox(mediaActionIndex);
                  }
                  setMediaActionIndex(null);
                }}
              >
                View
              </Button>
            </DrawerClose>
            {mediaActionItem && (
              <DrawerClose asChild>
                <Button
                  variant="destructive"
                  onClick={() => {
                    deleteMediaMutation.mutate(mediaActionItem.id);
                    setMediaActionIndex(null);
                  }}
                >
                  Delete
                </Button>
              </DrawerClose>
            )}
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Media Lightbox */}
      {lightboxOpen && meet?.media?.length ? (
        <Dialog
          open={lightboxOpen}
          onOpenChange={(open) => setLightboxOpen(open)}
        >
          <DialogContent className="sm:max-w-4xl bg-gray-950 border-gray-800">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-gray-200 text-sm">
                <span>
                  Media {lightboxIndex + 1} of {meet.media.length}
                </span>
                <span className="text-gray-400">
                  {meet.media[lightboxIndex]?.caption || "No caption"}
                </span>
              </div>
              <div onWheel={handleLightboxWheel}>
                <Carousel
                  setApi={setCarouselApi}
                  className="w-full touch-pan-y"
                  opts={{ loop: false }}
                >
                <CarouselContent>
                  {meet.media.map((item, index) => (
                    <CarouselItem key={item.id}>
                      <div className="flex h-[70vh] items-center justify-center">
                        {item.type === "video" ? (
                          <video
                            src={item.url}
                            controls
                            preload="metadata"
                            className="max-h-[70vh] w-full object-contain"
                          />
                        ) : (
                          <img
                            src={item.url}
                            alt={item.caption || `${meet.name} media`}
                            className="max-h-[70vh] w-full object-contain"
                          />
                        )}
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-2 text-gray-100 border-gray-700 hover:bg-gray-800" />
                <CarouselNext className="right-2 text-gray-100 border-gray-700 hover:bg-gray-800" />
                </Carousel>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{meet.media[lightboxIndex]?.originalFilename || ""}</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setLightboxOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
      
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
