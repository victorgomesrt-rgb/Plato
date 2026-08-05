"use client";

import { useEffect, useRef } from "react";

// Scroll-reveal: adds .in-view (CSS fades/slides up) when the element enters the viewport.
// IntersectionObserver (not a scroll listener) — no per-frame work, batched by the browser.
// The hidden state lives under `html.js` (globals.css), so no-JS renders content visible.
export function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Already in/above the viewport on mount (e.g. anchor jump, fast load) → reveal now.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
      el.classList.add("in-view");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in-view");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${className}`}>{children}</div>;
}
