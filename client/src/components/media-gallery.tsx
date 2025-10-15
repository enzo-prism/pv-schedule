import { useState } from "react";
import { MediaItem } from "@shared/schema";
import { Film, X, ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface MediaGalleryProps {
  media: MediaItem[];
  showInCard?: boolean;
}

export default function MediaGallery({ media, showInCard = false }: MediaGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!media || media.length === 0) {
    return null;
  }

  const openMedia = (index: number) => {
    setSelectedIndex(index);
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
    setSelectedIndex(null);
  };

  const navigateMedia = (direction: 'prev' | 'next') => {
    if (selectedIndex === null) return;
    
    const newIndex = direction === 'prev' 
      ? (selectedIndex - 1 + media.length) % media.length
      : (selectedIndex + 1) % media.length;
    
    setSelectedIndex(newIndex);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') navigateMedia('prev');
    if (e.key === 'ArrowRight') navigateMedia('next');
    if (e.key === 'Escape') closeFullscreen();
  };

  // Card view - compact grid
  if (showInCard) {
    const displayItems = media.slice(0, 3);
    const remainingCount = media.length - 3;

    return (
      <div className="mt-3">
        <div className="grid grid-cols-3 gap-1">
          {displayItems.map((item, index) => (
            <div 
              key={item.id} 
              className="relative aspect-square cursor-pointer"
              onClick={() => openMedia(index)}
            >
              {item.type === 'video' ? (
                <div className="relative w-full h-full">
                  <video
                    src={item.url}
                    className="w-full h-full object-cover rounded"
                    muted
                  />
                  <Film className="absolute bottom-1 left-1 h-4 w-4 text-white drop-shadow-lg" />
                </div>
              ) : (
                <img
                  src={item.url}
                  alt={item.caption || 'Meet photo'}
                  className="w-full h-full object-cover rounded"
                />
              )}
              
              {/* Show count overlay on last item if there are more */}
              {index === 2 && remainingCount > 0 && (
                <div className="absolute inset-0 bg-black/60 rounded flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">+{remainingCount}</span>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Fullscreen viewer */}
        {isFullscreen && selectedIndex !== null && (
          <FullscreenMediaViewer
            media={media}
            selectedIndex={selectedIndex}
            onClose={closeFullscreen}
            onNavigate={navigateMedia}
            onKeyDown={handleKeyDown}
          />
        )}
      </div>
    );
  }

  // Full gallery view for details page
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {media.map((item, index) => (
          <div 
            key={item.id} 
            className="relative aspect-square cursor-pointer group"
            onClick={() => openMedia(index)}
          >
            {item.type === 'video' ? (
              <div className="relative w-full h-full">
                <video
                  src={item.url}
                  className="w-full h-full object-cover rounded-lg"
                  muted
                />
                <Film className="absolute bottom-2 left-2 h-5 w-5 text-white drop-shadow-lg" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-lg flex items-center justify-center">
                  <Expand className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full">
                <img
                  src={item.url}
                  alt={item.caption || 'Meet photo'}
                  className="w-full h-full object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-lg flex items-center justify-center">
                  <Expand className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Fullscreen viewer */}
      {isFullscreen && selectedIndex !== null && (
        <FullscreenMediaViewer
          media={media}
          selectedIndex={selectedIndex}
          onClose={closeFullscreen}
          onNavigate={navigateMedia}
          onKeyDown={handleKeyDown}
        />
      )}
    </>
  );
}

// Fullscreen media viewer component
interface FullscreenMediaViewerProps {
  media: MediaItem[];
  selectedIndex: number;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

function FullscreenMediaViewer({ 
  media, 
  selectedIndex, 
  onClose, 
  onNavigate,
  onKeyDown 
}: FullscreenMediaViewerProps) {
  const currentItem = media[selectedIndex];
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        onNavigate('next');
      } else {
        onNavigate('prev');
      }
    }

    setTouchStart(null);
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent 
        className="max-w-screen-lg h-[90vh] p-0 overflow-hidden bg-black/95"
        onKeyDown={onKeyDown}
      >
        <div 
          className="relative w-full h-full flex items-center justify-center"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Navigation buttons */}
          {media.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 z-10 text-white hover:bg-white/20"
                onClick={() => onNavigate('prev')}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 z-10 text-white hover:bg-white/20"
                onClick={() => onNavigate('next')}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          {/* Media content */}
          <div className="max-w-full max-h-full">
            {currentItem.type === 'video' ? (
              <video
                src={currentItem.url}
                className="max-w-full max-h-full"
                controls
                autoPlay
              />
            ) : (
              <img
                src={currentItem.url}
                alt={currentItem.caption || 'Meet media'}
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>

          {/* Caption and counter */}
          <div className="absolute bottom-4 left-4 right-4 text-white text-center">
            {currentItem.caption && (
              <p className="text-sm mb-2">{currentItem.caption}</p>
            )}
            <p className="text-xs opacity-70">
              {selectedIndex + 1} / {media.length}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}