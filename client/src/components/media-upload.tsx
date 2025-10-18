import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, X, Film, Pencil, Check, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaItem } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

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
  const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
  const [captionDraft, setCaptionDraft] = useState("");
  const [savingCaption, setSavingCaption] = useState(false);

  useEffect(() => {
    setMedia(existingMedia);
    setEditingMediaId(null);
    setCaptionDraft("");
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
        const newMedia = data.media ?? data.meet?.media ?? [];
        const uploadedCount = queue.length;
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
      const updatedMedia: MediaItem[] = data.media ?? data.meet?.media ?? media.filter(item => item.id !== mediaId);
      setMedia(updatedMedia);
      onMediaUpdate?.(updatedMedia);
      if (editingMediaId === mediaId) {
        setEditingMediaId(null);
        setCaptionDraft("");
      }

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

  const startEditingCaption = (item: MediaItem) => {
    setEditingMediaId(item.id);
    setCaptionDraft(item.caption ?? "");
  };

  const cancelCaptionEdit = () => {
    setEditingMediaId(null);
    setCaptionDraft("");
  };

  const saveCaption = async () => {
    if (!meetId || !editingMediaId) return;

    setSavingCaption(true);
    try {
      const response = await apiRequest("PATCH", `/api/meets/${meetId}/media/${editingMediaId}`, {
        caption: captionDraft,
      });
      const data = await response.json();
      const updatedMedia: MediaItem[] = data.media ?? data.meet?.media ?? [];
      setMedia(updatedMedia);
      onMediaUpdate?.(updatedMedia);
      toast({
        title: "Caption updated",
        description: "The caption for this media item has been saved.",
      });
      cancelCaptionEdit();
    } catch (error) {
      console.error("Error updating caption:", error);
      toast({
        title: "Failed to update caption",
        description: "We couldn't update that caption. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingCaption(false);
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
          {media.map((item) => {
            const isEditingCaption = editingMediaId === item.id;
            return (
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

                {item.caption && !isEditingCaption && (
                  <div className="absolute inset-x-1 bottom-1 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {item.caption}
                  </div>
                )}

                {isEditing && !isEditingCaption && (
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => startEditingCaption(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => deleteMedia(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {isEditingCaption && (
                  <div className="absolute inset-0 rounded-lg bg-black/80 flex flex-col p-3 text-white">
                    <label htmlFor={`caption-${item.id}`} className="text-xs uppercase tracking-wide text-white/70">
                      Caption
                    </label>
                    <Textarea
                      id={`caption-${item.id}`}
                      value={captionDraft}
                      onChange={(event) => setCaptionDraft(event.target.value)}
                      placeholder="Add a short description"
                      className="mt-2 flex-1 resize-none bg-white/90 text-gray-900"
                      maxLength={300}
                    />
                    <div className="mt-3 flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/10"
                        onClick={cancelCaptionEdit}
                        disabled={savingCaption}
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void saveCaption()}
                        disabled={savingCaption}
                      >
                        {savingCaption ? (
                          'Saving...'
                        ) : (
                          <>
                            <Check className="mr-1 h-4 w-4" />
                            Save
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
