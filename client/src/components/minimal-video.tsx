import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
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
  const idleTimer = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(muted);
  const [hasIntersected, setHasIntersected] = useState(!lazy);

  // Whether the bottom bar (progress + mute) is visible during playback.
  // The centered play button does NOT use this — it simply hides whenever
  // the video is playing. This separation is the key design decision.
  const [bottomBarVisible, setBottomBarVisible] = useState(false);

  /* ------------------------------------------------------------------ */
  /*  Idle timer — hides bottom bar after inactivity while playing       */
  /* ------------------------------------------------------------------ */

  const clearIdle = useCallback(() => {
    if (idleTimer.current !== null) {
      window.clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
  }, []);

  const startIdle = useCallback(() => {
    clearIdle();
    idleTimer.current = window.setTimeout(() => {
      setBottomBarVisible(false);
    }, 2200);
  }, [clearIdle]);

  useEffect(() => () => clearIdle(), [clearIdle]);

  /* ------------------------------------------------------------------ */
  /*  Video event listeners                                              */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const onPlay = () => {
      setIsPlaying(true);
      setBottomBarVisible(false);
      clearIdle();
    };
    const onPause = () => {
      setIsPlaying(false);
      setBottomBarVisible(false);
      clearIdle();
    };
    const onEnded = () => {
      setIsPlaying(false);
      setBottomBarVisible(false);
      clearIdle();
      setProgress(100);
    };
    const onTime = () => {
      if (!Number.isFinite(video.duration) || video.duration === 0) {
        setProgress(0);
        return;
      }
      setProgress((video.currentTime / video.duration) * 100);
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("loadedmetadata", onTime);

    if (autoPlay) video.play().catch(() => undefined);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("loadedmetadata", onTime);
    };
  }, [autoPlay, clearIdle, hasIntersected]);

  /* ------------------------------------------------------------------ */
  /*  Lazy loading via Intersection Observer                             */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    if (!lazy) return;
    const target = containerRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHasIntersected(true);
          } else if (videoRef.current) {
            videoRef.current.pause();
          }
        });
      },
      { rootMargin },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [lazy, rootMargin]);

  /* ------------------------------------------------------------------ */
  /*  Sync muted prop                                                    */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = isMuted;
  }, [isMuted]);

  /* ------------------------------------------------------------------ */
  /*  Actions                                                            */
  /* ------------------------------------------------------------------ */

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((v) => !v);
  }, []);

  const handleSeek = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const video = videoRef.current;
      if (!video || !Number.isFinite(video.duration) || video.duration === 0) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const ratio = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
      video.currentTime = ratio * video.duration;
      startIdle();
    },
    [startIdle],
  );

  /* ------------------------------------------------------------------ */
  /*  Pointer handlers — only manage bottomBarVisible while playing      */
  /* ------------------------------------------------------------------ */

  const showBottomBar = useCallback(() => {
    setBottomBarVisible(true);
    startIdle();
  }, [startIdle]);

  const handlePointerMove = useCallback(() => {
    if (!videoRef.current || videoRef.current.paused) return;
    showBottomBar();
  }, [showBottomBar]);

  const handlePointerLeave = useCallback(() => {
    if (!videoRef.current || videoRef.current.paused) return;
    setBottomBarVisible(false);
    clearIdle();
  }, [clearIdle]);

  /* ------------------------------------------------------------------ */
  /*  Derived state                                                      */
  /* ------------------------------------------------------------------ */

  // Play button: visible ONLY when paused. Never shown while playing.
  const showPlayButton = !isPlaying;

  // Bottom bar: visible when paused OR when pointer activity during playback
  const showBottomControls = !isPlaying || bottomBarVisible;

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <div
      ref={containerRef}
      className={cn("relative h-full w-full overflow-hidden", className)}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {/* Video element */}
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

      {/* Gradient scrim — tied to bottom controls */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-opacity duration-300",
          showBottomControls ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Tap target — full surface area to toggle play/pause */}
      <button
        type="button"
        className="absolute inset-0 cursor-pointer"
        onClick={togglePlay}
        aria-label={isPlaying ? "Pause video" : "Play video"}
      />

      {/* Centered play icon — only visible when paused */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-200",
          showPlayButton ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white/90 backdrop-blur">
          <Play className="h-5 w-5 ml-0.5" />
        </div>
      </div>

      {/* Bottom controls — progress bar + mute */}
      <div
        className={cn(
          "absolute bottom-2 left-2 right-2 flex items-center gap-2 transition-opacity duration-300",
          showBottomControls ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
      >
        <div
          className="relative h-1 w-full cursor-pointer overflow-hidden rounded-full bg-white/20"
          onClick={handleSeek}
          onPointerDown={(e) => e.stopPropagation()}
          aria-hidden="true"
        >
          <div className="h-full bg-white/80" style={{ width: `${progress}%` }} />
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
            if (isPlaying) startIdle();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/80 backdrop-blur"
          aria-label={isMuted ? "Unmute video" : "Mute video"}
        >
          {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}
