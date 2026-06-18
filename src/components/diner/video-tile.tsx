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
}: {
  poster: string | null;
  mp4Url: string | null;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || !mp4Url) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, mp4Url]);

  if (reduced || !mp4Url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={poster ?? ""} alt="" className={className} />;
  }

  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      preload="metadata"
      poster={poster ?? undefined}
      className={className}
    >
      <source src={mp4Url} type="video/mp4" />
    </video>
  );
}
