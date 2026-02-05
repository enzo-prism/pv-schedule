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
  lazy?: boolean;
  rootMargin?: string;
};

export default function MinimalVideo({
  src,
  className,
  fit = "cover",
  muted = true,
  loop = false,
  autoPlay = false,
  poster,
  lazy = true,
  rootMargin = "300px",
}: MinimalVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimeout = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(muted);
  const [uiVisible, setUiVisible] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(!lazy);

  const clearHideTimeout = () => {
    if (hideTimeout.current !== null) {
      window.clearTimeout(hideTimeout.current);
      hideTimeout.current = null;
    }
  };

  const scheduleHide = () => {
    clearHideTimeout();
    if (!isPlaying) {
      return;
    }
    hideTimeout.current = window.setTimeout(() => {
      setUiVisible(false);
    }, 2200);
  };

  const revealUi = () => {
    setUiVisible(true);
    scheduleHide();
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return undefined;
    }

    const handlePlay = () => {
      setIsPlaying(true);
      setUiVisible(false);
      clearHideTimeout();
    };
    const handlePause = () => {
      setIsPlaying(false);
      setUiVisible(true);
      clearHideTimeout();
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setUiVisible(true);
      clearHideTimeout();
      setProgress(100);
    };
    const handleTime = () => {
      if (!Number.isFinite(video.duration) || video.duration === 0) {
        setProgress(0);
        return;
      }
      setProgress((video.currentTime / video.duration) * 100);
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("timeupdate", handleTime);
    video.addEventListener("loadedmetadata", handleTime);

    if (autoPlay) {
      video.play().catch(() => undefined);
    }

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("timeupdate", handleTime);
      video.removeEventListener("loadedmetadata", handleTime);
    };
  }, [autoPlay]);

  useEffect(() => {
    if (!lazy) {
      return;
    }
    const target = containerRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHasIntersected(true);
          } else if (videoRef.current && !entry.isIntersecting) {
            videoRef.current.pause();
          }
        });
      },
      { rootMargin },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [lazy, rootMargin]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => () => clearHideTimeout(), []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    if (video.paused) {
      setUiVisible(false);
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
    scheduleHide();
  };

  const showControls = uiVisible || !isPlaying;

  return (
    <div
      ref={containerRef}
      className={cn("relative h-full w-full overflow-hidden", className)}
      onPointerDown={() => {
        if (!isPlaying) {
          setUiVisible(true);
          return;
        }
        setUiVisible((current) => {
          const next = !current;
          if (next) {
            scheduleHide();
          } else {
            clearHideTimeout();
          }
          return next;
        });
      }}
      onPointerMove={() => {
        if (isPlaying) {
          revealUi();
        }
      }}
      onPointerLeave={() => {
        if (isPlaying) {
          setUiVisible(false);
          clearHideTimeout();
        }
      }}
    >
      {hasIntersected ? (
        <video
          ref={videoRef}
          src={src}
          className={cn("h-full w-full", fit === "contain" ? "object-contain" : "object-cover")}
          playsInline
          preload={lazy ? "metadata" : "auto"}
          muted={isMuted}
          loop={loop}
          poster={poster}
        />
      ) : (
        <div className="h-full w-full bg-white/5" />
      )}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-opacity",
          showControls ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-opacity",
          !isPlaying
            ? "opacity-100"
            : uiVisible
              ? "opacity-100"
              : "opacity-0 pointer-events-none",
        )}
      >
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            togglePlay();
          }}
          onPointerDown={(event) => event.stopPropagation()}
          className={cn(
            "flex items-center justify-center rounded-full border backdrop-blur transition-all",
            isPlaying
              ? "h-9 w-9 border-white/15 bg-black/30 text-white/70"
              : "h-12 w-12 border-white/20 bg-black/50 text-white/90",
          )}
          aria-label={isPlaying ? "Pause video" : "Play video"}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-5 w-5 ml-0.5" />}
        </button>
      </div>
      <div
        className={cn(
          "absolute bottom-2 left-2 right-2 flex items-center gap-2 transition-opacity",
          showControls ? "opacity-100" : "opacity-0",
          showControls ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <div
          className="relative h-1 w-full cursor-pointer overflow-hidden rounded-full bg-white/20"
          onClick={handleSeek}
          onPointerDown={(event) => event.stopPropagation()}
          aria-hidden="true"
        >
          <div
            className="h-full bg-white/80"
            style={{ width: `${progress}%` }}
          />
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            toggleMute();
            scheduleHide();
          }}
          onPointerDown={(event) => event.stopPropagation()}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/80 backdrop-blur"
          aria-label={isMuted ? "Unmute video" : "Mute video"}
        >
          {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}
