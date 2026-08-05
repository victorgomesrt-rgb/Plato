"use client";

import { useSyncExternalStore } from "react";

// Reduced-motion-aware hero loop for the landing phone mockup. Autoplays a muted looping
// clip so prospects see a menu "live"; falls back to the poster still when the visitor
// prefers reduced motion.
function useReducedMotion() {
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

export function HeroVideo() {
  const reduced = useReducedMotion();
  if (reduced)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src="/landing/hero-poster.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />;
  return (
    <video
      src="/landing/hero-loop.mp4"
      poster="/landing/hero-poster.jpg"
      autoPlay
      muted
      loop
      playsInline
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}
