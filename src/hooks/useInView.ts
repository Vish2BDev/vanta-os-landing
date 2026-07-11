"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Returns true once `ref` has intersected the viewport past `threshold`.
 * Stays true after first reveal (one-shot), matching the site's reveal-on-enter
 * sections (phi, waitlist).
 */
export function useInView(
  ref: RefObject<HTMLElement | null>,
  { threshold = 0.25, rootMargin = "0px" }: { threshold?: number; rootMargin?: string } = {},
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, inView, threshold, rootMargin]);

  return inView;
}
