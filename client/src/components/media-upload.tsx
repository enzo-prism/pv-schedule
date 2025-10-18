import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, X, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaItem } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface MediaUploadProps {
  meetId?: number;
  existingMedia?: MediaItem[];
  onMediaUpdate?: (media: MediaItem[]) => void;
  isEditing?: boolean;
  autoUpload?: boolean;
  onUploadHelperReady?: (uploadPendingFiles: () => Promise<MediaItem[] | undefined>) => void;
}

type PreviewStatus = "pending" | "uploading";

interface PreviewItem {
  id: string;
  file: File;
  url: string;
  status: PreviewStatus;
}

const createPreviewId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function MediaUpload({
  meetId,
  existingMedia = [],
  onMediaUpdate,
  isEditing = false,
  autoUpload = false,
  onUploadHelperReady,
}: MediaUploadProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [media, setMedia] = useState<MediaItem[]>(existingMedia);
  const [uploading, setUploading] = useState(false);
  const [previewItems, setPreviewItemsState] = useState<PreviewItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewItemsRef = useRef<PreviewItem[]>([]);
  const inFlightUploadRef = useRef<Promise<MediaItem[] | undefined> | null>(null);

  const updatePreviewItems = useCallback(
    (updater: (prev: PreviewItem[]) => PreviewItem[]) => {
      setPreviewItemsState(prev => {
        const next = updater(prev);
        previewItemsRef.current = next;
        return next;
      });
    },
    []
  );

  useEffect(() => {
    setMedia(existingMedia);
  }, [existingMedia]);

  useEffect(() => {
    previewItemsRef.current = previewItems;
  }, [previewItems]);

  useEffect(() => {
    return () => {
      previewItemsRef.current.forEach(item => {
        URL.revokeObjectURL(item.url);
      });
    };
  }, []);

  const uploadFiles = useCallback((): Promise<MediaItem[] | undefined> => {
    if (!meetId) {
      return Promise.resolve(undefined);
    }

    if (inFlightUploadRef.current) {
      return inFlightUploadRef.current;
    }

    const pendingBatch = previewItemsRef.current.filter(item => item.status === "pending");

    if (pendingBatch.length === 0) {
      return Promise.resolve(undefined);
    }

    const uploadingIds = new Set(pendingBatch.map(item => item.id));

    updatePreviewItems(prev =>
      prev.map(item => (uploadingIds.has(item.id) ? { ...item, status: "uploading" } : item))
    );

    setUploading(true);
    const formData = new FormData();

    pendingBatch.forEach(({ file }) => {
      formData.append("media", file);
    });

    const uploadPromise = (async () => {
      try {
        const response = await fetch(`/api/meets/${meetId}/media`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const data = await response.json();
        const newMedia = data.meet?.media ?? data.media ?? [];
        const uploadedCount = Array.isArray(data.media) ? data.media.length : pendingBatch.length;
        setMedia(newMedia);
        updatePreviewItems(prev => {
          const remaining = prev.filter(item => !uploadingIds.has(item.id));
          pendingBatch.forEach(item => URL.revokeObjectURL(item.url));
          return remaining;
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        onMediaUpdate?.(newMedia);

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["/api/meets"] }),
          meetId
            ? queryClient.invalidateQueries({ queryKey: [`/api/meets/${meetId}`] })
            : Promise.resolve(),
        ]);

        toast({
          title: "Media uploaded",
          description: `${uploadedCount} file${uploadedCount === 1 ? "" : "s"} added to this meet.`,
        });

        return newMedia;
      } catch (error) {
        console.error("Error uploading files:", error);
        updatePreviewItems(prev =>
          prev.map(item => (uploadingIds.has(item.id) ? { ...item, status: "pending" } : item))
        );
        toast({
          title: "Upload failed",
          description: "We couldn't save those files. Please try again.",
          variant: "destructive",
        });
      } finally {
        setUploading(false);
        inFlightUploadRef.current = null;
        const hasPending = previewItemsRef.current.some(item => item.status === "pending");
        if (autoUpload && hasPending) {
          void uploadFiles();
        }
      }
    })();

    inFlightUploadRef.current = uploadPromise;
    return uploadPromise;
  }, [autoUpload, meetId, onMediaUpdate, queryClient, toast, updatePreviewItems]);

  useEffect(() => {
    if (onUploadHelperReady) {
      onUploadHelperReady(uploadFiles);
    }
  }, [onUploadHelperReady, uploadFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const selected = Array.from(files).map(file => ({
      id: createPreviewId(),
      file,
      url: URL.createObjectURL(file),
      status: "pending" as const,
    }));

    updatePreviewItems(prev => [...prev, ...selected]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (autoUpload) {
      void uploadFiles();
    }
  };

  const removePreview = (id: string) => {
    updatePreviewItems(prev => {
      const target = prev.find(item => item.id === id);
      if (!target || target.status === "uploading") {
        return prev;
      }
      URL.revokeObjectURL(target.url);
      return prev.filter(item => item.id !== id);
    });
  };

  const pendingCount = previewItems.filter(item => item.status === "pending").length;
  const displayCount = pendingCount || previewItems.length;

  const deleteMedia = async (mediaId: string) => {
    if (!meetId) return;

    try {
      const response = await apiRequest("DELETE", `/api/meets/${meetId}/media/${mediaId}`);
      const data = await response.json();
      const updatedMedia: MediaItem[] = data.meet?.media ?? media.filter(item => item.id !== mediaId);
      setMedia(updatedMedia);
      onMediaUpdate?.(updatedMedia);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/meets"] }),
        meetId ? queryClient.invalidateQueries({ queryKey: [`/api/meets/${meetId}`] }) : Promise.resolve(),
      ]);

      toast({
        title: "Media removed",
        description: "The selected file has been deleted from this meet.",
      });
    } catch (error) {
      console.error("Error deleting media:", error);
      toast({
        title: "Failed to delete media",
        description: "We couldn't remove that file. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload button */}
      {isEditing && (
        <>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Add Photos/Videos
            </Button>

            {previewItems.length > 0 && (
              <Button
                type="button"
                size="sm"
                onClick={() => void uploadFiles()}
                disabled={uploading || pendingCount === 0}
              >
                {uploading
                  ? "Uploading..."
                  : `Upload ${displayCount} file${displayCount === 1 ? "" : "s"}`}
              </Button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </>
      )}

      {/* Preview of files to upload */}
      {previewItems.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {previewItems.map(preview => (
            <div key={preview.id} className="relative aspect-square">
              {preview.file.type.startsWith("video/") ? (
                <video
                  src={preview.url}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <img
                  src={preview.url}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-lg"
                />
              )}
              {preview.status === "uploading" && (
                <div className="absolute inset-0 rounded-lg bg-black/40 flex items-center justify-center text-xs font-medium text-white">
                  Uploading...
                </div>
              )}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6"
                onClick={() => removePreview(preview.id)}
                disabled={preview.status === "uploading"}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Existing media */}
      {media.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {media.map((item) => (
            <div key={item.id} className="relative aspect-square group">
              {item.type === 'video' ? (
                <div className="relative w-full h-full">
                  <video
                    src={item.url}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <Film className="absolute bottom-1 left-1 h-5 w-5 text-white drop-shadow-lg" />
                </div>
              ) : (
                <img
                  src={item.url}
                  alt={item.caption || 'Meet media'}
                  className="w-full h-full object-cover rounded-lg"
                />
              )}
              {isEditing && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteMedia(item.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
