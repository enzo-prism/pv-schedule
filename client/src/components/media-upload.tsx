import { useState, useRef } from "react";
import { Upload, X, Image, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MediaItem } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface MediaUploadProps {
  meetId?: number;
  existingMedia?: MediaItem[];
  onMediaUpdate?: (media: MediaItem[]) => void;
  isEditing?: boolean;
}

export default function MediaUpload({ meetId, existingMedia = [], onMediaUpdate, isEditing = false }: MediaUploadProps) {
  const [media, setMedia] = useState<MediaItem[]>(existingMedia);
  const [uploading, setUploading] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<{ file: File; url: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPreviews: { file: File; url: string }[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      newPreviews.push({ file, url });
    }

    setPreviewFiles(prev => [...prev, ...newPreviews]);
  };

  const removePreview = (index: number) => {
    setPreviewFiles(prev => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[index].url);
      newPreviews.splice(index, 1);
      return newPreviews;
    });
  };

  const uploadFiles = async () => {
    if (!meetId || previewFiles.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    
    previewFiles.forEach(({ file }) => {
      formData.append('media', file);
    });

    try {
      const response = await fetch(`/api/meets/${meetId}/media`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      const newMedia = [...media, ...data.media];
      setMedia(newMedia);
      setPreviewFiles([]);
      
      if (onMediaUpdate) {
        onMediaUpdate(newMedia);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
    }
  };

  const deleteMedia = async (mediaId: string) => {
    if (!meetId) return;

    try {
      const response = await apiRequest('DELETE', `/api/meets/${meetId}/media/${mediaId}`);
      const updatedMedia = media.filter(item => item.id !== mediaId);
      setMedia(updatedMedia);
      
      if (onMediaUpdate) {
        onMediaUpdate(updatedMedia);
      }
    } catch (error) {
      console.error('Error deleting media:', error);
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
                onClick={uploadFiles}
                disabled={uploading}
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