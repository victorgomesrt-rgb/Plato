"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

// Respects prefers-reduced-motion without setState-in-effect.
function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia("(prefers-reduced-motion: reduce)");
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
}

// Looping muted video that autoplays ONLY while in view (architecture §8). Falls back
// to the poster when reduced motion is set or no clip is available.
export function VideoTile({
  poster,
  mp4Url,
  className,
  onPlay,
}: {
  poster: string | null;
  mp4Url: string | null;
  className?: string;
  onPlay?: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const played = useRef(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || !mp4Url) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.play()
            .then(() => {
              if (!played.current) {
                played.current = true;
                onPlay?.();
              }
            })
            .catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, mp4Url, onPlay]);

  // Poster + video are both absolutely-positioned object-cover over a dark backing, so the
  // media always fully covers the tile. Fixes iOS Safari not reliably applying object-fit
  // to a <video poster>, which left a light strip at the tile's top edge. `relative` only
  // when the caller didn't already position the wrapper (the reel passes `absolute`).
  const cls = className ?? "";
  const posed = /(?:^|\s)(?:absolute|fixed|relative|sticky)(?:\s|$)/.test(cls);
  const wrap = `${posed ? "" : "relative"} block overflow-hidden bg-ink ${cls}`;
  // Overscan + own compositing layer: iOS Safari paints a light hairline at the top edge
  // of a <video> inside an overflow-hidden rounded box (its GPU layer isn't clipped to the
  // radius). Scaling the media slightly past the clip pushes that edge out of view.
  const media = "absolute inset-0 h-full w-full object-cover bg-ink [transform:scale(1.03)_translateZ(0)]";

  if (reduced || !mp4Url) {
    return (
      <span className={wrap}>
        {poster && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="" className={media} />
        )}
      </span>
    );
  }

  return (
    <span className={wrap}>
      {poster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt="" aria-hidden className={media} />
      )}
      <video ref={ref} muted loop playsInline preload="metadata" className={media}>
        <source src={mp4Url} type="video/mp4" />
      </video>
    </span>
  );
}
