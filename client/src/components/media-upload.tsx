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

  useEffect(() => {
    setMedia(existingMedia);
  }, [existingMedia]);

  const uploadFiles = useCallback(
    async (
      filesToUpload?: { file: File; url: string }[]
    ): Promise<MediaItem[] | undefined> => {
      const queue = filesToUpload ?? previewFiles;
      if (!meetId || queue.length === 0) return;

      setUploading(true);
      const formData = new FormData();

      queue.forEach(({ file }) => {
        formData.append("media", file);
      });

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
        queue.forEach(({ url }) => URL.revokeObjectURL(url));
        setPreviewFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        if (onMediaUpdate) {
          onMediaUpdate(newMedia);
        }

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
        toast({
          title: "Upload failed",
          description: "We couldn't save those files. Please try again.",
          variant: "destructive",
        });
      } finally {
        setUploading(false);
      }
    },
    [meetId, onMediaUpdate, previewFiles, queryClient, toast]
  );

  useEffect(() => {
    if (onUploadHelperReady) {
      onUploadHelperReady(uploadFiles);
    }
  }, [onUploadHelperReady, uploadFiles]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPreviews: { file: File; url: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      newPreviews.push({ file, url });
    }

    let updatedPreviews: { file: File; url: string }[] = [];
    setPreviewFiles(prev => {
      updatedPreviews = [...prev, ...newPreviews];
      return updatedPreviews;
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (autoUpload && updatedPreviews.length > 0) {
      await uploadFiles(updatedPreviews);
    }
  };

  const removePreview = (index: number) => {
    setPreviewFiles(prev => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[index].url);
      newPreviews.splice(index, 1);
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
