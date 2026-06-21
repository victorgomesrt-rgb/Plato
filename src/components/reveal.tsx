"use client";

import { useEffect, useRef } from "react";

// Scroll-reveal: adds .in-view (CSS fades/slides up) when the element reaches ~88% down the
// viewport. One shared rAF-throttled scroll/resize check across all instances — robust against
// fast scroll and anchor jumps (anything in OR above the viewport reveals; nothing stays hidden).
// Ref + classList only — no setState-in-effect.
const items = new Set<HTMLElement>();
let raf = 0;
function run() {
  raf = 0;
  const vh = window.innerHeight;
  for (const el of items) {
    if (el.getBoundingClientRect().top < vh * 0.88) {
      el.classList.add("in-view");
      items.delete(el);
    }
  }
}
function schedule() { if (!raf) raf = requestAnimationFrame(run); }

export function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    items.add(el);
    if (items.size === 1) {
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule);
    }
    schedule();
    return () => {
      items.delete(el);
      if (items.size === 0) {
        window.removeEventListener("scroll", schedule);
        window.removeEventListener("resize", schedule);
      }
    };
  }, []);
  return <div ref={ref} className={`reveal ${className}`}>{children}</div>;
}
