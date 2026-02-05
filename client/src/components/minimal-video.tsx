import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

type MinimalVideoProps = {
  src: string;
  className?: string;
  fit?: "cover" | "contain";
  muted?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  poster?: string;
};

export default function MinimalVideo({
  src,
  className,
  fit = "cover",
  muted = true,
  loop = false,
  autoPlay = false,
  poster,
}: MinimalVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(muted);
  const [showUi, setShowUi] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return undefined;
    }

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTime = () => {
      if (!Number.isFinite(video.duration) || video.duration === 0) {
        setProgress(0);
        return;
      }
      setProgress((video.currentTime / video.duration) * 100);
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("timeupdate", handleTime);
    video.addEventListener("loadedmetadata", handleTime);

    if (autoPlay) {
      video.play().catch(() => undefined);
    }

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("timeupdate", handleTime);
      video.removeEventListener("loadedmetadata", handleTime);
    };
  }, [autoPlay]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    if (video.paused) {
      video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    setIsMuted((current) => !current);
  };

  const handleSeek = (event: MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration === 0) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    video.currentTime = ratio * video.duration;
  };

  const showControls = showUi || !isPlaying;

  return (
    <div
      className={cn("relative h-full w-full overflow-hidden", className)}
      onMouseEnter={() => setShowUi(true)}
      onMouseLeave={() => setShowUi(false)}
      onTouchStart={() => setShowUi(true)}
    >
      <video
        ref={videoRef}
        src={src}
        className={cn("h-full w-full", fit === "contain" ? "object-contain" : "object-cover")}
        playsInline
        preload="metadata"
        muted={isMuted}
        loop={loop}
        poster={poster}
      />
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-opacity",
          showControls ? "opacity-100" : "opacity-0",
        )}
      >
        <button
          type="button"
          onClick={togglePlay}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white/90 backdrop-blur"
          aria-label={isPlaying ? "Pause video" : "Play video"}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
        </button>
      </div>
      <div
        className={cn(
          "absolute bottom-2 left-2 right-2 flex items-center gap-2 transition-opacity",
          showControls ? "opacity-100" : "opacity-0",
        )}
      >
        <div
          className="relative h-1 w-full cursor-pointer overflow-hidden rounded-full bg-white/20"
          onClick={handleSeek}
          aria-hidden="true"
        >
          <div
            className="h-full bg-white/80"
            style={{ width: `${progress}%` }}
          />
        </div>
        <button
          type="button"
          onClick={toggleMute}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/80 backdrop-blur"
          aria-label={isMuted ? "Unmute video" : "Mute video"}
        >
          {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}
