import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Meet } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  ArrowLeft,
  Clock,
  Link2,
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
import { useEffect, useRef, useState, type DragEvent } from "react";
import {
  Dialog,
  DialogClose,
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
import MinimalVideo from "@/components/minimal-video";
import { getOptimizedImageUrl, getOptimizedVideoPosterUrl, getOptimizedVideoUrl } from "@/lib/media";
import { diffInDays, isPastDate, parseDateInput } from "@shared/dates";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
import { Slider } from "@/components/ui/slider";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { MAX_MEDIA_BYTES, MAX_MEDIA_LABEL } from "@shared/media";
import { isReadOnlyMode, uploadsEnabled as uploadsEnabledFlag } from "@/lib/env";
import { formatLocationWithFlag } from "@/lib/location";
import { formatMeetName } from "@/lib/meet-title";
import { usePageMeta } from "@/lib/use-page-meta";

type MediaMode = "upload" | "url";
type MediaQueueStatus = "pending" | "uploading" | "uploaded" | "error" | "skipped";
type MediaQueueItem = {
  id: string;
  file: File;
  previewUrl: string;
  type: "photo" | "video";
  status: MediaQueueStatus;
  error?: string;
  caption?: string;
  errorType?: "validation" | "upload";
};

export default function MeetDetails() {
  // Extract meet ID from URL
  const [, params] = useRoute<{ id: string }>("/meet/:id");
  const meetId = params?.id ? parseInt(params.id, 10) : null;
  const { toast } = useToast();
  const uploadsEnabled = uploadsEnabledFlag;
  const isReadOnly = isReadOnlyMode;
  const initialMediaMode: MediaMode = uploadsEnabled ? "upload" : "url";
  
  const [editMeet, setEditMeet] = useState<Meet | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [mediaMode, setMediaMode] = useState<MediaMode>(initialMediaMode);
  const [mediaQueue, setMediaQueue] = useState<MediaQueueItem[]>([]);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaCaption, setMediaCaption] = useState("");
  const [mediaType, setMediaType] = useState<"photo" | "video">("photo");
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [mediaWarning, setMediaWarning] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [mediaActionIndex, setMediaActionIndex] = useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [framingDialogOpen, setFramingDialogOpen] = useState(false);
  const [framingDraftX, setFramingDraftX] = useState(50);
  const [framingDraftY, setFramingDraftY] = useState(50);
  const [framingMediaId, setFramingMediaId] = useState<string | null>(null);
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
  const meetMetaTitle = meet
    ? `${formatMeetName(meet.name ?? "", meet.date)} | Meet`
    : meetId
      ? `Meet ${meetId}`
      : "Meet details";
  const meetMetaDescription = meet
    ? `${formatMeetName(meet.name ?? "", meet.date)} workout day.`
    : "Open one meet’s workout day page.";

  usePageMeta(meetMetaTitle, meetMetaDescription);

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
    setIsDragActive(false);
    setMediaMode(initialMediaMode);
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read file."));
      reader.readAsDataURL(file);
    });

  const validateMediaFile = (file: File) => {
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    const type: "photo" | "video" = isVideo ? "video" : "photo";

    if (!isImage && !isVideo) {
      return {
        status: "error" as MediaQueueStatus,
        error: "Unsupported file type.",
        type,
        errorType: "validation" as const,
      };
    }

    if (file.size > MAX_MEDIA_BYTES) {
      return {
        status: "error" as MediaQueueStatus,
        error: `File too large. Max ${MAX_MEDIA_LABEL}.`,
        type,
        errorType: "validation" as const,
      };
    }

    return { status: "pending" as MediaQueueStatus, error: undefined, type };
  };

  const appendMediaFiles = (files: File[]) => {
    if (files.length === 0) {
      return;
    }
    setMediaError(null);

    const nextItems = files.map((file) => {
      const validation = validateMediaFile(file);
      return {
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        type: validation.type,
        status: validation.status,
        error: validation.error,
        errorType: validation.errorType,
        caption: "",
      };
    });

    const invalidCount = nextItems.filter((item) => item.status === "error").length;
    if (invalidCount > 0) {
      setMediaWarning(
        `${invalidCount} file${invalidCount === 1 ? "" : "s"} needs attention before uploading.`,
      );
    } else {
      setMediaWarning(null);
    }

    setMediaQueue((prev) => [...prev, ...nextItems]);
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
      const next = prev.filter((entry) => entry.id !== id);
      const invalidCount = next.filter((entry) => entry.status === "error").length;
      if (invalidCount === 0) {
        setMediaWarning(null);
      }
      return next;
    });
  };

  const updateQueueCaption = (id: string, caption: string) => {
    updateQueueItem(id, { caption });
  };

  const handleDropFiles = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }
    appendMediaFiles(Array.from(files));
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    handleDropFiles(event.dataTransfer.files);
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

  const openFramingDialog = (item: Meet["media"][number]) => {
    setFramingMediaId(item.id);
    setFramingDraftX(typeof item.focusX === "number" ? item.focusX : 50);
    setFramingDraftY(typeof item.focusY === "number" ? item.focusY : 50);
    setFramingDialogOpen(true);
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

  const updateMediaMutation = useMutation({
    mutationFn: async ({
      mediaId,
      focusX,
      focusY,
    }: {
      mediaId: string;
      focusX: number;
      focusY: number;
    }) => {
      if (!meetId) {
        throw new Error("Meet ID is missing.");
      }
      await apiRequest("PATCH", `/api/meets/${meetId}/media/${mediaId}`, {
        focusX,
        focusY,
      });
      return mediaId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meets"] });
      queryClient.invalidateQueries({ queryKey: [`/api/meets/${meetId}`] });
      setFramingDialogOpen(false);
      setFramingMediaId(null);
      vibrate();
      toast({
        title: "Framing saved",
        description: "The featured image framing has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Framing update failed",
        description: error.message || "Unable to update framing.",
        variant: "destructive",
      });
    },
  });

  const handleEditMeet = (meetData: MeetPayload) => {
    if (isReadOnly) {
      return;
    }
    if (meetId) {
      editMeetMutation.mutate({
        id: meetId,
        data: meetData,
      });
    }
  };
  
  const handleConfirmDelete = () => {
    if (isReadOnly) {
      return;
    }
    if (meetId !== null) {
      deleteMeetMutation.mutate(meetId);
    }
  };

  const handleFramingSave = () => {
    if (!framingMediaId) {
      return;
    }
    updateMediaMutation.mutate({
      mediaId: framingMediaId,
      focusX: framingDraftX,
      focusY: framingDraftY,
    });
  };

  const handleMediaSubmit = async () => {
    if (isUploading) {
      return;
    }
    if (isReadOnly) {
      setMediaError("This app is read-only.");
      return;
    }
    if (mediaMode === "upload" && !uploadsEnabled) {
      setMediaError("File uploads are disabled on this deployment. Please add a link instead.");
      return;
    }
    setMediaError(null);
    setMediaWarning(null);
    if (!meetId) {
      setMediaError("Meet ID is missing.");
      return;
    }

    if (mediaMode === "upload") {
      const queueSnapshot = mediaQueue.filter(
        (item) =>
          item.status === "pending" ||
          (item.status === "error" && item.errorType === "upload"),
      );
      if (queueSnapshot.length === 0) {
        setMediaError("Please select at least one valid file to upload.");
        return;
      }

      setIsUploading(true);
      setUploadProgress({ current: 0, total: queueSnapshot.length });
      let successCount = 0;
      let failureCount = 0;

      for (let index = 0; index < queueSnapshot.length; index++) {
        const item = queueSnapshot[index];
        updateQueueItem(item.id, { status: "uploading", error: undefined, errorType: undefined });
        try {
          const dataUrl = await readFileAsDataUrl(item.file);
          await apiRequest("POST", `/api/meets/${meetId}/media`, {
            mode: "upload",
            filename: item.file.name,
            contentType: item.file.type,
            data: dataUrl,
            caption: item.caption?.trim() || undefined,
          });
          successCount += 1;
          updateQueueItem(item.id, { status: "uploaded", error: undefined, errorType: undefined });
        } catch (error) {
          failureCount += 1;
          updateQueueItem(item.id, {
            status: "error",
            error: error instanceof Error ? error.message : "Upload failed.",
            errorType: "upload",
          });
        } finally {
          setUploadProgress({ current: index + 1, total: queueSnapshot.length });
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

    const trimmedUrl = mediaUrl.trim();
    if (!trimmedUrl) {
      setMediaError("Please provide a media URL.");
      return;
    }
    if (!isValidRemoteUrl(trimmedUrl)) {
      setMediaError("Please enter a valid http(s) URL.");
      return;
    }

    setIsUploading(true);
    try {
      await apiRequest("POST", `/api/meets/${meetId}/media`, {
        mode: "url",
        url: trimmedUrl,
        type: mediaType,
        caption: mediaCaption.trim() || undefined,
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

  const formatQueueStatus = (item: MediaQueueItem) => {
    switch (item.status) {
      case "uploading":
        return "Uploading";
      case "uploaded":
        return "Uploaded";
      case "error":
        return item.errorType === "upload" ? "Upload failed" : "Needs attention";
      case "skipped":
        return "Skipped";
      default:
        return "Ready";
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizeInMb = bytes / (1024 * 1024);
    return `${sizeInMb.toFixed(2)} MB`;
  };

  const getUploadCtaLabel = (mode: MediaMode, pendingCount: number, uploading: boolean) => {
    if (uploading) {
      return "Uploading...";
    }
    if (mode === "upload") {
      if (pendingCount === 0) {
        return "Upload items";
      }
      return pendingCount === 1 ? "Upload 1 item" : `Upload ${pendingCount} items`;
    }
    return "Save link";
  };

  const isValidRemoteUrl = (input: string) => {
    try {
      const url = new URL(input);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white/30"></div>
      </div>
    );
  }

  if (isError || !meet) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <h1 className="text-2xl font-bold text-foreground">Meet not found</h1>
        <p className="text-muted-foreground text-center">The meet you're looking for doesn't exist or has been removed.</p>
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
  const showMedia = !isPast;
  const statusClass = isPast
    ? "bg-white/10 text-muted-foreground"
    : "bg-emerald-500/15 text-emerald-200";
  const showRegistrationStatus = !isPast && meet.registrationStatus;
  const framingMedia = framingMediaId
    ? meet.media?.find((item) => item.id === framingMediaId)
    : null;
  const hasNotes = Boolean(meet.description && meet.description.trim().length > 0);
  const mediaActionItem =
    mediaActionIndex !== null ? meet.media?.[mediaActionIndex] : null;
  const isFeaturedAction =
    mediaActionIndex !== null &&
    mediaActionIndex === 0 &&
    mediaActionItem?.type === "photo";
  const trimmedMediaUrl = mediaUrl.trim();
  const uploadableItems = mediaQueue.filter(
    (item) =>
      item.status === "pending" ||
      (item.status === "error" && item.errorType === "upload"),
  );
  const pendingQueueCount = uploadableItems.length;
  const hasQueueErrors = mediaQueue.some((item) => item.status === "error");
  const hasValidationErrors = mediaQueue.some(
    (item) => item.status === "error" && item.errorType === "validation",
  );
  const isValidLink = trimmedMediaUrl.length > 0 && isValidRemoteUrl(trimmedMediaUrl);
  const canSaveMedia = mediaMode === "upload" ? pendingQueueCount > 0 : isValidLink;
  const uploadCtaLabel = getUploadCtaLabel(mediaMode, pendingQueueCount, isUploading);
  const uploadPercent = uploadProgress
    ? Math.round((uploadProgress.current / uploadProgress.total) * 100)
    : 0;
  const showLinkPreview = mediaMode === "url" && isValidLink;
  const heroMedia = showMedia ? meet.media?.[0] ?? null : null;
  const heroIsVideo = heroMedia?.type === "video";
  const heroImageUrl =
    heroMedia && heroMedia.type === "photo"
      ? getOptimizedImageUrl(heroMedia.url, { width: 1600 })
      : null;
  const heroVideoUrl =
    heroMedia && heroMedia.type === "video"
      ? getOptimizedVideoUrl(heroMedia.url, { width: 1600 })
      : null;
  const heroPosterUrl =
    heroMedia && heroMedia.type === "video"
      ? heroMedia.thumbnail
        ? getOptimizedImageUrl(heroMedia.thumbnail, { width: 1600 })
        : getOptimizedVideoPosterUrl(heroMedia.url, { width: 1600 })
      : null;
  const heroFocusX = typeof heroMedia?.focusX === "number" ? heroMedia.focusX : 50;
  const heroFocusY = typeof heroMedia?.focusY === "number" ? heroMedia.focusY : 50;
  const heroObjectPosition = `${heroFocusX}% ${heroFocusY}%`;
  const dayDifferenceLabel = getDayDifference(meet.date);
  const displayMeetName = formatMeetName(meet.name ?? "Meet", meet.date);
  const metricTiles = [
    {
      label: "Height Cleared",
      value: meet.heightCleared ?? "",
      Icon: HeightIcon,
    },
    {
      label: "Pole Used",
      value: meet.poleUsed ?? "",
      Icon: PoleIcon,
    },
    {
      label: "Deepest Takeoff",
      value: meet.deepestTakeoff ?? "",
      Icon: TakeoffIcon,
    },
    {
      label: "Place",
      value: meet.place ?? "",
      Icon: PlaceIcon,
    },
  ];
  const hasAnyMetrics = metricTiles.some((item) => String(item.value).trim().length > 0);

  return (
    <div className="min-h-screen bg-background pb-app-nav">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
              <span className="sr-only">Back</span>
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {displayMeetName}
            </p>
            <p className="text-xs text-muted-foreground">{formatDate(meet.date)}</p>
          </div>
          {!isReadOnly && (
            <Drawer>
              <DrawerTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 rounded-full p-0"
                  aria-label="Meet actions"
                >
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Meet Actions</DrawerTitle>
                  <DrawerDescription>Quick actions for this meet.</DrawerDescription>
                </DrawerHeader>
                <div className="grid gap-2 px-4 pb-4">
                  {showMedia && (
                    <DrawerClose asChild>
                      <Button onClick={() => setMediaDialogOpen(true)}>Add media</Button>
                    </DrawerClose>
                  )}
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
          )}
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-4 pb-32">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/70">
          <div
            className={
              showMedia
                ? "relative aspect-[16/9] bg-zinc-700 sm:aspect-[21/9]"
                : "relative bg-gradient-to-br from-white/[0.04] to-transparent p-5 sm:p-6"
            }
          >
            {showMedia && heroMedia ? (
              heroIsVideo ? (
                <video
                  src={heroVideoUrl ?? heroMedia.url}
                  poster={heroPosterUrl ?? undefined}
                  className="h-full w-full object-cover"
                  style={{ objectPosition: heroObjectPosition }}
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : (
                <img
                  src={heroImageUrl ?? heroMedia.url}
                  alt={heroMedia.caption || `${displayMeetName} cover`}
                  className="h-full w-full object-cover"
                  style={{ objectPosition: heroObjectPosition }}
                  loading="eager"
                  decoding="async"
                />
              )
            ) : null}
            {showMedia ? (
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
            ) : null}
            <div className={showMedia ? "absolute inset-x-0 bottom-0 p-5 sm:p-6" : ""}>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge
                  variant="outline"
                  className={`${statusClass} font-normal px-2 py-0.5`}
                >
                  {isPast ? "Past" : "Upcoming"}
                </Badge>
                {dayDifferenceLabel && (
                  <div className="flex items-center gap-1 rounded-full border border-white/15 bg-black/30 px-2 py-0.5 text-white/80">
                    <Clock className="h-3 w-3" />
                    <span>{dayDifferenceLabel}</span>
                  </div>
                )}
                {showRegistrationStatus && (
                  <Badge
                    variant="secondary"
                    className={`text-xs font-medium ${
                      meet.registrationStatus === "registered"
                        ? "bg-emerald-500/15 text-emerald-200 border-emerald-500/30"
                        : meet.registrationStatus === "contacted director"
                        ? "bg-sky-500/15 text-sky-200 border-sky-500/30"
                        : "bg-amber-500/15 text-amber-200 border-amber-500/30"
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
              <h1 className="mt-3 text-2xl font-semibold text-foreground sm:text-3xl">
                {displayMeetName}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formatDate(meet.date)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {formatLocationWithFlag(meet.location)}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {hasAnyMetrics ? (
            metricTiles.map(({ label, value, Icon }) => {
              const displayValue = String(value).trim();
              const isEmpty = displayValue.length === 0;
              return (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-card/70 p-4"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </div>
                  <div
                    className={`mt-2 text-base font-semibold ${
                      isEmpty ? "text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {isEmpty ? "—" : displayValue}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-2 rounded-2xl border border-white/10 bg-card/70 p-4 text-sm text-muted-foreground sm:col-span-4">
              No metrics yet.
            </div>
          )}
        </section>

        <section className="grid gap-4">
          <div className="rounded-2xl border border-white/10 bg-card/70 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Overview & Logistics
              </h2>
            </div>
            <div className="mt-3 space-y-2 text-sm text-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(meet.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{formatLocationWithFlag(meet.location)}</span>
              </div>
              {meet.link && (
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={meet.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-300 hover:text-sky-200 underline break-all"
                  >
                    {meet.link}
                  </a>
                </div>
              )}
              {meet.driveTime && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{meet.driveTime}</span>
                </div>
              )}
              {!meet.link && !meet.driveTime && (
                <p className="text-xs text-muted-foreground">
                  No additional logistics yet.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-card/70 p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-foreground">Notes</h2>
            <div className="mt-3 text-sm text-foreground">
              {hasNotes ? (
                <p className="whitespace-pre-line">{meet.description}</p>
              ) : (
                <p className="text-muted-foreground">No notes yet.</p>
              )}
            </div>
          </div>

          {showMedia && (
            <div className="rounded-2xl border border-white/10 bg-card/70 p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Media</h2>
                {!isReadOnly && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMediaDialogOpen(true)}
                    className="h-8"
                  >
                    Add media
                  </Button>
                )}
              </div>

              {meet.media && meet.media.length > 0 ? (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {meet.media.map((item, index) => {
                    const isPhoto = item.type === "photo";
                    return (
                      <div
                        key={item.id}
                        className="group relative overflow-hidden rounded-2xl border border-white/10 bg-card/60 aspect-[9/16] content-auto"
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
                          <MinimalVideo
                            src={getOptimizedVideoUrl(item.url, { width: 720 })}
                            poster={
                              item.thumbnail
                                ? getOptimizedImageUrl(item.thumbnail, { width: 720 })
                                : getOptimizedVideoPosterUrl(item.url, { width: 720 }) ?? undefined
                            }
                            className="h-full w-full"
                          />
                        ) : (
                          <img
                            src={getOptimizedImageUrl(item.url, { width: 720 })}
                            alt={item.caption || `${displayMeetName} media`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        )}
                        {!isReadOnly && (
                          <button
                            type="button"
                            className="absolute right-2 top-2 rounded-full border border-white/10 bg-black/40 p-1.5 text-white/80 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
                            onClick={(event) => {
                              event.stopPropagation();
                              setMediaActionIndex(index);
                            }}
                            aria-label="Media actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">No media yet.</p>
              )}
            </div>
          )}
        </section>
      </main>

      {!isReadOnly && (
        <div className="fixed inset-x-0 z-30 px-4 bottom-app-nav">
          <div className="mx-auto flex max-w-3xl items-center gap-2 rounded-2xl border border-white/10 bg-card/95 p-2 shadow-none">
            {showMedia && (
              <Button
                className="flex-1"
                onClick={() => setMediaDialogOpen(true)}
              >
                Add media
              </Button>
            )}
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
      )}

      {/* Edit Meet Dialog */}
      {!isReadOnly && editMeet && (
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

      {/* Featured Image Framing Dialog */}
      {showMedia && framingDialogOpen && (
        <Dialog
          open={framingDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setFramingDialogOpen(false);
              setFramingMediaId(null);
              setFramingDraftX(50);
              setFramingDraftY(50);
            }
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Adjust featured image</DialogTitle>
              <DialogDescription>
                Fine-tune how the featured image crops on the meet card.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="aspect-video w-full overflow-hidden rounded-lg bg-card/5">
                {framingMedia ? (
                  <img
                    src={getOptimizedImageUrl(framingMedia.url, { width: 960 })}
                    alt={framingMedia.caption || `${displayMeetName} featured`}
                    className="h-full w-full object-cover"
                    style={{
                      objectPosition: `${framingDraftX}% ${framingDraftY}%`,
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No featured image selected.
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="framing-x" className="text-sm font-medium text-foreground">
                    Horizontal
                  </Label>
                  <Slider
                    id="framing-x"
                    min={0}
                    max={100}
                    step={1}
                    value={[framingDraftX]}
                    onValueChange={(value) => setFramingDraftX(value[0] ?? 50)}
                    aria-label="Horizontal framing"
                    disabled={!framingMedia}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="framing-y" className="text-sm font-medium text-foreground">
                    Vertical
                  </Label>
                  <Slider
                    id="framing-y"
                    min={0}
                    max={100}
                    step={1}
                    value={[framingDraftY]}
                    onValueChange={(value) => setFramingDraftY(value[0] ?? 50)}
                    aria-label="Vertical framing"
                    disabled={!framingMedia}
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Applies to the meet card preview.
              </p>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="ghost"
                  className="sm:flex-1"
                  onClick={() => {
                    setFramingDraftX(50);
                    setFramingDraftY(50);
                  }}
                  disabled={!framingMedia}
                >
                  Reset
                </Button>
                <DialogClose asChild>
                  <Button
                    variant="outline"
                    className="sm:flex-1"
                    disabled={updateMediaMutation.isPending}
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  className="sm:flex-1"
                  onClick={handleFramingSave}
                  disabled={!framingMedia || updateMediaMutation.isPending}
                >
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Media Upload Dialog */}
      {showMedia && !isReadOnly && mediaDialogOpen && (
        <Dialog
          open={mediaDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setMediaDialogOpen(false);
              resetMediaForm();
            }
          }}
        >
          <DialogContent className="sm:max-w-2xl p-0">
            <div className="flex max-h-[90vh] flex-col">
              <div className="flex-1 overflow-y-auto px-6 pb-4 pt-6">
                <div className="space-y-5">
                  <DialogHeader className="pr-8">
                    <DialogTitle>Add Media</DialogTitle>
                    <DialogDescription>
                      {uploadsEnabled
                        ? "Upload a photo or video, or add a link to hosted media."
                        : "Add a link to hosted media. File uploads are disabled here."}
                    </DialogDescription>
                  </DialogHeader>

                  <Tabs
                    value={mediaMode}
                    onValueChange={(value) => {
                      if (!uploadsEnabled && value === "upload") {
                        setMediaMode("url");
                        return;
                      }
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
                    <TabsList
                      className={`grid w-full ${uploadsEnabled ? "grid-cols-2" : "grid-cols-1"}`}
                    >
                      {uploadsEnabled && (
                        <TabsTrigger value="upload">Upload</TabsTrigger>
                      )}
                      <TabsTrigger value="url">
                        {uploadsEnabled ? "Link" : "Add link"}
                      </TabsTrigger>
                    </TabsList>
                    {!uploadsEnabled && (
                      <p className="text-xs text-amber-300">
                        File uploads are disabled on this deployment. Add a hosted URL instead.
                      </p>
                    )}

                    {uploadsEnabled && (
                      <TabsContent value="upload" className="space-y-4 pt-4">
                        <div
                          className={`rounded-xl border-2 border-dashed p-4 transition ${
                            isDragActive
                              ? "border-sky-400/70 bg-sky-500/10"
                              : "border-white/10 bg-background"
                          }`}
                          onDragOver={handleDragOver}
                          onDragEnter={() => setIsDragActive(true)}
                          onDragLeave={(event) => {
                            if (event.currentTarget === event.target) {
                              setIsDragActive(false);
                            }
                          }}
                          onDrop={handleDrop}
                        >
                          <div className="flex flex-col items-center gap-2 text-center">
                            <p className="text-sm font-semibold text-foreground">
                              Drag and drop files here
                            </p>
                            <p className="text-xs text-muted-foreground">
                              or use the buttons below
                            </p>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2">
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
                              handleDropFiles(event.target.files);
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
                              handleDropFiles(event.target.files);
                              event.currentTarget.value = "";
                            }}
                          />
                          <p className="mt-2 text-xs text-muted-foreground">
                            Select multiple photos or videos. Max file size: {MAX_MEDIA_LABEL} each. Swipe left on a file to remove.
                          </p>
                        </div>

                        {mediaQueue.length > 0 ? (
                          <div className="space-y-3">
                            {mediaQueue.map((item, index) => (
                              <div
                                key={item.id}
                                className="rounded-xl border border-white/10 bg-card p-3 shadow-none"
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
                                <div className="flex items-start gap-3">
                                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-card/5">
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
                                  <div className="min-w-0 flex-1 space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="truncate text-sm font-semibold text-foreground">
                                        {item.file.name}
                                      </p>
                                      <div className="flex items-center gap-2">
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] uppercase tracking-wide text-muted-foreground"
                                        >
                                          {item.type === "photo" ? "Photo" : "Video"}
                                        </Badge>
                                        {item.status === "error" && (
                                          <Badge
                                            variant={item.errorType === "upload" ? "secondary" : "destructive"}
                                            className="text-[10px] uppercase tracking-wide"
                                          >
                                            {item.errorType === "upload" ? "Upload failed" : "Fix needed"}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {formatFileSize(item.file.size)} · {formatQueueStatus(item)}
                                    </p>
                                    <Input
                                      value={item.caption ?? ""}
                                      onChange={(event) => updateQueueCaption(item.id, event.target.value)}
                                      placeholder="Add a caption"
                                      className="h-9"
                                      disabled={item.status === "uploading"}
                                    />
                                    {item.error && (
                                      <p className="text-[11px] text-rose-300">
                                        {item.error}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex flex-col items-center gap-1">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      disabled={index === 0 || item.status === "uploading"}
                                      onClick={() => moveQueueItem(item.id, "up")}
                                    >
                                      <ArrowUp className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      disabled={index === mediaQueue.length - 1 || item.status === "uploading"}
                                      onClick={() => moveQueueItem(item.id, "down")}
                                    >
                                      <ArrowDown className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    disabled={item.status === "uploading"}
                                    onClick={() => removeQueueItem(item.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dashed border-white/10 bg-card p-4 text-xs text-muted-foreground">
                            No files selected yet.
                          </div>
                        )}
                      </TabsContent>
                    )}

                    <TabsContent value="url" className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Media URL</label>
                        <Input
                          placeholder="https://example.com/media.jpg"
                          value={mediaUrl}
                          onChange={(event) => setMediaUrl(event.target.value)}
                        />
                        {trimmedMediaUrl.length > 0 && !isValidLink && (
                          <p className="text-xs text-rose-300">
                            Enter a valid http(s) URL.
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Type</label>
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
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Caption (optional)</label>
                        <Textarea
                          value={mediaCaption}
                          onChange={(event) => setMediaCaption(event.target.value)}
                          rows={3}
                          placeholder="Add a short note about this media"
                        />
                      </div>
                      {showLinkPreview && (
                        <div className="rounded-xl border border-white/10 bg-card/50 p-3">
                          <p className="text-xs font-semibold uppercase text-muted-foreground">Preview</p>
                          <div className="mt-2 overflow-hidden rounded-lg bg-card">
                            {mediaType === "video" ? (
                              <video
                                src={getOptimizedVideoUrl(trimmedMediaUrl, { width: 720 })}
                                controls
                                preload="metadata"
                                className="h-48 w-full object-cover"
                              />
                            ) : (
                              <img
                                src={getOptimizedImageUrl(trimmedMediaUrl, { width: 720 })}
                                alt="Media preview"
                                className="h-48 w-full object-cover"
                                loading="lazy"
                                decoding="async"
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              <div className="border-t border-white/10 bg-card/95 px-6 py-4">
                <div className="space-y-3">
                  {uploadProgress && isUploading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          Uploading {uploadProgress.current} of {uploadProgress.total}
                        </span>
                        <span>{uploadPercent}%</span>
                      </div>
                      <Progress value={uploadPercent} className="h-2" />
                    </div>
                  )}
                  {mediaWarning && <p className="text-xs text-amber-300">{mediaWarning}</p>}
                  {mediaError && <p className="text-xs text-rose-300">{mediaError}</p>}
                  {mediaMode === "upload" && hasValidationErrors && !mediaError && !mediaWarning && (
                    <p className="text-xs text-amber-300">
                      Remove or fix files marked as needing attention.
                    </p>
                  )}
                  {mediaMode === "upload" && hasQueueErrors && !hasValidationErrors && !mediaError && !mediaWarning && (
                    <p className="text-xs text-amber-300">
                      Some uploads failed. You can retry.
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <DialogClose asChild>
                      <Button variant="outline" className="flex-1" disabled={isUploading}>
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button
                      onClick={handleMediaSubmit}
                      disabled={isUploading || !canSaveMedia}
                      className="flex-1"
                    >
                      {uploadCtaLabel}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
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
            {showMedia && mediaActionItem && !isReadOnly && isFeaturedAction && (
              <DrawerClose asChild>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (mediaActionItem) {
                      openFramingDialog(mediaActionItem);
                    }
                    setMediaActionIndex(null);
                  }}
                >
                  Adjust framing
                </Button>
              </DrawerClose>
            )}
            {showMedia && mediaActionItem && !isReadOnly && (
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
      {showMedia && lightboxOpen && meet?.media?.length ? (
        <Dialog
          open={lightboxOpen}
          onOpenChange={(open) => setLightboxOpen(open)}
        >
          <DialogContent className="sm:max-w-4xl bg-black/95 border-white/10">
            <div onWheel={handleLightboxWheel}>
              <Carousel
                setApi={setCarouselApi}
                className="w-full touch-pan-y"
                opts={{ loop: false }}
              >
                <CarouselContent>
                  {meet.media.map((item) => (
                    <CarouselItem key={item.id}>
                      <div className="flex h-[70vh] items-center justify-center">
                        {item.type === "video" ? (
                          <div className="w-full max-w-[420px] aspect-[9/16]">
                            <MinimalVideo
                              src={getOptimizedVideoUrl(item.url, { width: 1080 })}
                              poster={
                                item.thumbnail
                                  ? getOptimizedImageUrl(item.thumbnail, { width: 1080 })
                                  : getOptimizedVideoPosterUrl(item.url, { width: 1080 }) ?? undefined
                              }
                              fit="contain"
                              className="h-full w-full"
                              lazy={false}
                            />
                          </div>
                        ) : (
                          <img
                            src={getOptimizedImageUrl(item.url, { width: 1400 })}
                            alt={item.caption || `${displayMeetName} media`}
                            className="max-h-[70vh] w-full object-contain"
                            loading="lazy"
                            decoding="async"
                          />
                        )}
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-2 text-white border-white/20 hover:bg-white/10" />
                <CarouselNext className="right-2 text-white border-white/20 hover:bg-white/10" />
              </Carousel>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
      
      {/* Delete Confirmation Dialog */}
      {!isReadOnly && (
        <DeleteConfirmation
          isOpen={deleteConfirmOpen}
          onCancel={() => setDeleteConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Meet"
          description="Are you sure you want to delete this meet? This action cannot be undone."
        />
      )}
    </div>
  );
}
