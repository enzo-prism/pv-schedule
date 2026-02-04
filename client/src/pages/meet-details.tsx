import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Meet } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, ArrowLeft, Clock, Edit2, Trash2, MoreVertical } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MAX_MEDIA_BYTES = 10 * 1024 * 1024;
type MediaMode = "upload" | "url";

export default function MeetDetails() {
  // Extract meet ID from URL
  const [, params] = useRoute<{ id: string }>("/meet/:id");
  const meetId = params?.id ? parseInt(params.id, 10) : null;
  const { toast } = useToast();
  
  const [editMeet, setEditMeet] = useState<Meet | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [mediaMode, setMediaMode] = useState<MediaMode>("upload");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaCaption, setMediaCaption] = useState("");
  const [mediaType, setMediaType] = useState<"photo" | "video">("photo");
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const lastWheelRef = useRef(0);

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

  const resetMediaForm = () => {
    setMediaFile(null);
    setMediaUrl("");
    setMediaCaption("");
    setMediaType("photo");
    setMediaError(null);
    setMediaMode("upload");
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read file."));
      reader.readAsDataURL(file);
    });

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

  const uploadMediaMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (!meetId) {
        throw new Error("Meet ID is missing.");
      }
      const res = await apiRequest("POST", `/api/meets/${meetId}/media`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meets"] });
      queryClient.invalidateQueries({ queryKey: [`/api/meets/${meetId}`] });
      setMediaDialogOpen(false);
      resetMediaForm();
      toast({
        title: "Media added",
        description: "Your media has been uploaded.",
      });
    },
    onError: (error) => {
      setMediaError(error.message || "Unable to upload media.");
      toast({
        title: "Upload failed",
        description: error.message || "Unable to upload media.",
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
    setMediaError(null);
    if (!meetId) {
      setMediaError("Meet ID is missing.");
      return;
    }

    if (mediaMode === "upload") {
      if (!mediaFile) {
        setMediaError("Please select a file to upload.");
        return;
      }

      if (
        !mediaFile.type.startsWith("image/") &&
        !mediaFile.type.startsWith("video/")
      ) {
        setMediaError("Only image or video files are supported.");
        return;
      }

      if (mediaFile.size > MAX_MEDIA_BYTES) {
        setMediaError("File is too large. Max size is 10MB.");
        return;
      }

      try {
        const dataUrl = await readFileAsDataUrl(mediaFile);
        uploadMediaMutation.mutate({
          mode: "upload",
          filename: mediaFile.name,
          contentType: mediaFile.type,
          data: dataUrl,
          caption: mediaCaption || undefined,
        });
      } catch (error) {
        setMediaError("Unable to read the selected file.");
      }

      return;
    }

    if (!mediaUrl.trim()) {
      setMediaError("Please provide a media URL.");
      return;
    }

    uploadMediaMutation.mutate({
      mode: "url",
      url: mediaUrl.trim(),
      type: mediaType,
      caption: mediaCaption || undefined,
    });
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with back button */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center">
          <Link href="/">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-5 w-5 text-gray-500" />
              <span className="sr-only">Back</span>
            </Button>
          </Link>
          <span className="text-sm text-gray-500 ml-2">Back</span>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Meet header */}
          <div className="p-5 border-b border-gray-100 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">{meet.name}</h1>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`${statusClass} font-normal text-xs px-2 py-0.5`}>
                  {isPast ? 'Past' : 'Upcoming'}
                </Badge>
                <div className="flex items-center text-gray-500">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  <span className="text-xs">{getDayDifference(meet.date)}</span>
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 rounded-full p-0"
                  aria-label="More options"
                >
                  <MoreVertical className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditMeet(meet)} className="cursor-pointer">
                  <Edit2 className="h-4 w-4 mr-2" />
                  <span>Edit</span>
                </DropdownMenuItem>
                {(
                  <DropdownMenuItem 
                    onClick={() => setDeleteConfirmOpen(true)} 
                    className="cursor-pointer text-red-500 focus:text-red-500"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Meet details */}
          <div className="p-5 space-y-5">
            <div>
              <h2 className="text-xs uppercase font-medium text-gray-500 mb-2">DATE & TIME</h2>
              <div className="flex items-center text-gray-800">
                <Calendar className="h-4 w-4 mr-2 text-gray-600" />
                <span className="text-base">{formatDate(meet.date)}</span>
              </div>
            </div>
            
            <div>
              <h2 className="text-xs uppercase font-medium text-gray-500 mb-2">LOCATION</h2>
              <div className="flex items-center text-gray-800">
                <MapPin className="h-4 w-4 mr-2 text-gray-600" />
                <span className="text-base">{meet.location}</span>
              </div>
            </div>
            
            {/* Registration Status */}
            {showRegistrationStatus && (
              <div>
                <h2 className="text-xs uppercase font-medium text-gray-500 mb-2">REGISTRATION STATUS</h2>
                <div className="flex items-center">
                  <Badge 
                    variant="secondary"
                    className={`text-sm font-medium ${
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
                </div>
              </div>
            )}
            
            {/* Pole vault performance metrics section - only displayed if any of the fields have data */}
            {(meet.heightCleared || meet.poleUsed || meet.deepestTakeoff || meet.place) && (
              <div>
                <h2 className="text-xs uppercase font-medium text-gray-500 mb-2">POLE VAULT METRICS</h2>
                
                {meet.heightCleared && (
                  <div className="flex items-center text-gray-800 mb-3">
                    <HeightIcon className="h-5 w-5 mr-2 text-gray-600 flex-shrink-0" />
                    <div>
                      <span className="text-xs text-gray-500 block">Height Cleared</span>
                      <span className="text-base">{meet.heightCleared}</span>
                    </div>
                  </div>
                )}
                
                {meet.poleUsed && (
                  <div className="flex items-center text-gray-800 mb-3">
                    <PoleIcon className="h-5 w-5 mr-2 text-gray-600 flex-shrink-0" />
                    <div>
                      <span className="text-xs text-gray-500 block">Pole Used</span>
                      <span className="text-base">{meet.poleUsed}</span>
                    </div>
                  </div>
                )}
                
                {meet.deepestTakeoff && (
                  <div className="flex items-center text-gray-800 mb-3">
                    <TakeoffIcon className="h-5 w-5 mr-2 text-gray-600 flex-shrink-0" />
                    <div>
                      <span className="text-xs text-gray-500 block">Deepest Takeoff</span>
                      <span className="text-base">{meet.deepestTakeoff}</span>
                    </div>
                  </div>
                )}

                {meet.place && (
                  <div className="flex items-center text-gray-800">
                    <PlaceIcon className="h-5 w-5 mr-2 text-gray-600 flex-shrink-0" />
                    <div>
                      <span className="text-xs text-gray-500 block">Place/Ranking</span>
                      <span className="text-base">{meet.place}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Meet Link */}
            {meet.link && (
              <div>
                <h2 className="text-xs uppercase font-medium text-gray-500 mb-2">MEET LINK</h2>
                <div className="flex items-center text-gray-800">
                  <svg className="h-4 w-4 mr-2 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                  </svg>
                  <a 
                    href={meet.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline text-base break-all"
                  >
                    {meet.link}
                  </a>
                </div>
              </div>
            )}
            
            {/* Drive Time */}
            {meet.driveTime && (
              <div>
                <h2 className="text-xs uppercase font-medium text-gray-500 mb-2">DRIVE TIME</h2>
                <div className="flex items-center text-gray-800">
                  <svg className="h-4 w-4 mr-2 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12,6 12,12 16,14"></polyline>
                  </svg>
                  <span className="text-base">{meet.driveTime}</span>
                </div>
              </div>
            )}
            
            {meet.description && (
              <div>
                <h2 className="text-xs uppercase font-medium text-gray-500 mb-2">DESCRIPTION</h2>
                <p className="text-gray-700 whitespace-pre-line text-sm">{meet.description}</p>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs uppercase font-medium text-gray-500">MEDIA</h2>
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
                      onClick={
                        isPhoto
                          ? () => openLightbox(index)
                          : undefined
                      }
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
                            className="text-gray-600 hover:text-gray-800"
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
                            className="text-red-500 hover:text-red-600"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No media yet.</p>
              )}
            </div>
          </div>
        </div>
      </main>

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

            <Tabs value={mediaMode} onValueChange={(value) => setMediaMode(value as MediaMode)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="url">Link</TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-3 pt-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">File</label>
                  <Input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setMediaFile(file);
                    }}
                  />
                  {mediaFile && (
                    <p className="text-xs text-gray-500">
                      {mediaFile.name} · {(mediaFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  )}
                  <p className="text-xs text-gray-400">Max file size: 10MB.</p>
                </div>
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
            </div>

            {mediaError && <p className="text-xs text-red-500">{mediaError}</p>}

            <Button
              onClick={handleMediaSubmit}
              disabled={uploadMediaMutation.isPending}
            >
              {uploadMediaMutation.isPending ? "Uploading..." : "Add media"}
            </Button>
          </DialogContent>
        </Dialog>
      )}

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
