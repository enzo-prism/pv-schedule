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
  const [previewFiles, setPreviewFiles] = useState<{ file: File; url: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingQueueRef = useRef<{ file: File; url: string }[]>([]);
  const inFlightUploadRef = useRef<Promise<MediaItem[] | undefined> | null>(null);

  useEffect(() => {
    setMedia(existingMedia);
  }, [existingMedia]);

  const uploadFiles = useCallback((): Promise<MediaItem[] | undefined> => {
    if (!meetId) {
      return Promise.resolve(undefined);
    }

    if (inFlightUploadRef.current) {
      return inFlightUploadRef.current;
    }

    if (pendingQueueRef.current.length === 0) {
      return Promise.resolve(undefined);
    }

    const queue = [...pendingQueueRef.current];
    pendingQueueRef.current = [];
    const snapshotUrls = new Set(queue.map(({ url }) => url));
    setUploading(true);
    const formData = new FormData();

    queue.forEach(({ file }) => {
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
        const uploadedCount = Array.isArray(data.media) ? data.media.length : queue.length;
        setMedia(newMedia);
        setPreviewFiles(prev => {
          const remaining = prev.filter(item => !snapshotUrls.has(item.url));
          snapshotUrls.forEach(url => URL.revokeObjectURL(url));
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
        pendingQueueRef.current = [...queue, ...pendingQueueRef.current];
        toast({
          title: "Upload failed",
          description: "We couldn't save those files. Please try again.",
          variant: "destructive",
        });
      } finally {
        setUploading(false);
        inFlightUploadRef.current = null;
        if (autoUpload && pendingQueueRef.current.length > 0) {
          void uploadFiles();
        }
      }
    })();

    inFlightUploadRef.current = uploadPromise;
    return uploadPromise;
  }, [autoUpload, meetId, onMediaUpdate, queryClient, toast]);

  useEffect(() => {
    if (onUploadHelperReady) {
      onUploadHelperReady(uploadFiles);
    }
  }, [onUploadHelperReady, uploadFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPreviews: { file: File; url: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      newPreviews.push({ file, url });
    }

    pendingQueueRef.current = [...pendingQueueRef.current, ...newPreviews];
    setPreviewFiles(prev => [...prev, ...newPreviews]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (autoUpload) {
      void uploadFiles();
    }
  };

  const removePreview = (index: number) => {
    setPreviewFiles(prev => {
      const newPreviews = [...prev];
      const [removed] = newPreviews.splice(index, 1);
      if (removed) {
        URL.revokeObjectURL(removed.url);
        pendingQueueRef.current = pendingQueueRef.current.filter(item => item.url !== removed.url);
      }
      return newPreviews;
    });
  };

  const deleteMedia = async (mediaId: string) => {
    if (!meetId) return;

    try {
      const response = await apiRequest('DELETE', `/api/meets/${meetId}/media/${mediaId}`);
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
      console.error('Error deleting media:', error);
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
            
            {previewFiles.length > 0 && (
              <Button
                type="button"
                size="sm"
                onClick={() => void uploadFiles()}
                disabled={uploading || previewFiles.length === 0}
              >
                {uploading ? 'Uploading...' : `Upload ${previewFiles.length} file${previewFiles.length > 1 ? 's' : ''}`}
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
      {previewFiles.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {previewFiles.map((preview, index) => (
            <div key={index} className="relative aspect-square">
              {preview.file.type.startsWith('video/') ? (
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
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6"
                onClick={() => removePreview(index)}
                disabled={uploading}
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
