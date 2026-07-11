"use client";

import { useEffect, type RefObject } from "react";

/**
 * Drives scroll choreography for a tall "scroll-track" section whose inner
 * content is pinned with `position: sticky; top: 0; height: 100vh`.
 *
 * Progress is 0 when the track's top reaches the top of the viewport and 1
 * when its bottom reaches the bottom of the viewport — identical to the pin
 * range on the live site. The callback runs inside requestAnimationFrame and
 * receives progress in [0, 1]; write to the DOM directly from it (set CSS
 * variables / data attributes) to avoid per-frame React re-renders.
 */
export function useTrackProgress(
  ref: RefObject<HTMLElement | null>,
  onProgress: (p: number) => void,
): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let last = -1;

    const measure = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height - vh;
      // distance scrolled past the top of the track
      const scrolled = -rect.top;
      const p = total > 0 ? Math.min(1, Math.max(0, scrolled / total)) : 0;
      if (p !== last) {
        last = p;
        onProgress(p);
      }
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [ref, onProgress]);
}

/** Linear map + clamp: remap x in [a,b] to [0,1]. */
export function mapClamp(x: number, a: number, b: number): number {
  if (b === a) return x < a ? 0 : 1;
  return Math.min(1, Math.max(0, (x - a) / (b - a)));
}
