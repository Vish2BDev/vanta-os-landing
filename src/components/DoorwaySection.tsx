"use client";

import { useCallback, useRef } from "react";
import { useTrackProgress, mapClamp } from "@/hooks/useTrackProgress";

const LABELS = [
  { text: "Ambition", left: "44%", top: "10%", cls: "uppercase tracking-[0.3em] text-[10px] md:text-xs" },
  { text: "Health", left: "81%", top: "60%", cls: "uppercase tracking-[0.3em] text-[10px] md:text-xs" },
  { text: "Burning Potential", left: "28%", top: "40%", cls: "text-[10px] md:text-sm" },
  { text: "Stagnation", left: "28%", top: "76%", cls: "text-[10px] md:text-sm" },
  {
    text: "Underutilized Capacity",
    left: "64%",
    top: "76%",
    cls: "text-[10px] md:text-sm max-md:max-w-[92px] max-md:text-center max-md:leading-snug",
  },
];

export function DoorwaySection() {
  const trackRef = useRef<HTMLElement>(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const xAxisRef = useRef<SVGLineElement>(null);
  const yAxisRef = useRef<SVGLineElement>(null);
  const arrowsRef = useRef<SVGGElement>(null);
  const trailRef = useRef<SVGLineElement>(null);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const dotRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const beaconRef = useRef<HTMLDivElement>(null);

  const onProgress = useCallback((p: number) => {
    const rise = (el: HTMLElement | null, t: number) => {
      if (el) {
        el.style.opacity = String(t);
        el.style.transform = `translateY(${(1 - t) * 12}px)`;
      }
    };
    // headings
    rise(headRef.current, mapClamp(p, 0.04, 0.16));
    rise(subRef.current, mapClamp(p, 0.08, 0.2));

    // axes extend from origin (176,180)
    const a = mapClamp(p, 0.14, 0.42);
    if (xAxisRef.current) xAxisRef.current.setAttribute("x2", String(176 + (288 - 176) * a));
    if (yAxisRef.current) yAxisRef.current.setAttribute("y2", String(180 - (180 - 54) * a));
    if (arrowsRef.current) arrowsRef.current.style.opacity = String(mapClamp(p, 0.4, 0.46));

    // labels stagger
    LABELS.forEach((_, i) => rise(labelRefs.current[i], mapClamp(p, 0.24 + i * 0.05, 0.36 + i * 0.05)));

    // start dot + glow
    const dotO = mapClamp(p, 0.34, 0.42);
    if (dotRef.current) dotRef.current.style.opacity = String(dotO);
    if (glowRef.current) glowRef.current.style.opacity = String(dotO * 0.9);

    // trail draws from dot (124,240) to beacon (244,108)
    const b = mapClamp(p, 0.44, 0.74);
    if (trailRef.current) {
      trailRef.current.setAttribute("x2", String(124 + (244 - 124) * b));
      trailRef.current.setAttribute("y2", String(240 - (240 - 108) * b));
      trailRef.current.style.opacity = String(mapClamp(p, 0.44, 0.5));
    }

    // beacon locks in
    beaconRef.current?.setAttribute("data-locked", p > 0.74 ? "true" : "false");
  }, []);

  useTrackProgress(trackRef, onProgress);

  return (
    <section ref={trackRef} className="relative bg-black" style={{ height: "440vh" }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-black">
        <div className="absolute inset-x-0 top-[12vh] z-20 px-6 text-center md:top-[14vh]">
          <h2
            ref={headRef}
            className="mx-auto max-w-3xl font-aeonik text-2xl font-medium leading-[1.1] tracking-tight text-white md:text-4xl"
            style={{ opacity: 0, transform: "translateY(14px)" }}
          >
            Peak health is just the doorway.
          </h2>
          <p
            ref={subRef}
            className="mx-auto mt-4 max-w-xl font-aeonik text-sm font-light text-white/50 md:text-base"
            style={{ opacity: 0, transform: "translateY(10px)" }}
          >
            you are here to be unstoppable. <em className="italic text-white/75">consistently</em>
          </p>
        </div>

        <div className="absolute inset-0 z-10 flex items-center justify-center px-6 pt-[12vh]">
          <div className="relative" style={{ width: "min(90vw, 72vh, 760px)", aspectRatio: "4 / 3" }}>
            <div
              ref={glowRef}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: "31%",
                top: "80%",
                width: "22%",
                height: "22%",
                opacity: 0,
                background:
                  "radial-gradient(circle, rgba(255,92,42,0.25) 0%, rgba(255,92,42,0) 68%)",
              }}
            />
            <svg
              viewBox="0 0 400 300"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full overflow-visible"
            >
              <defs>
                <linearGradient id="ev-x-axis" x1="80" y1="180" x2="288" y2="180" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="rgb(255 255 255)" stopOpacity="0" />
                  <stop offset="16%" stopColor="rgb(255 255 255)" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="rgb(255 255 255)" stopOpacity="0.5" />
                </linearGradient>
                <linearGradient id="ev-y-axis" x1="176" y1="276" x2="176" y2="54" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="rgb(255 255 255)" stopOpacity="0" />
                  <stop offset="18%" stopColor="rgb(255 255 255)" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="rgb(255 255 255)" stopOpacity="0.5" />
                </linearGradient>
                <linearGradient id="ev-trail" x1="124" y1="240" x2="244" y2="108" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="rgb(255 92 42)" stopOpacity="0" />
                  <stop offset="100%" stopColor="rgb(255 92 42)" stopOpacity="0.85" />
                </linearGradient>
              </defs>
              <g>
                <line ref={xAxisRef} x1="176" y1="180" x2="176" y2="180" stroke="url(#ev-x-axis)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                <line ref={yAxisRef} x1="176" y1="180" x2="176" y2="180" stroke="url(#ev-y-axis)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                <g
                  ref={arrowsRef}
                  fill="none"
                  stroke="rgb(255 255 255 / 0.5)"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ opacity: 0 }}
                >
                  <polyline points="284,177.5 288,180 284,182.5" />
                  <polyline points="173.5,58 176,54 178.5,58" />
                </g>
              </g>
              <line
                ref={trailRef}
                x1="124"
                y1="240"
                x2="124"
                y2="240"
                stroke="url(#ev-trail)"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                style={{ opacity: 0 }}
              />
            </svg>

            <div className="pointer-events-none absolute inset-0">
              {LABELS.map((l, i) => (
                <span key={l.text} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: l.left, top: l.top }}>
                  <span
                    ref={(el) => {
                      labelRefs.current[i] = el;
                    }}
                    data-label="true"
                    className={`block font-aeonik text-white/40 ${l.cls}`}
                    style={{ opacity: 0, transform: "translateY(10px)" }}
                  >
                    {l.text}
                  </span>
                </span>
              ))}
            </div>

            <div ref={dotRef} className="ev-dot pointer-events-none absolute z-20" style={{ left: "31%", top: "80%", opacity: 0 }} />
            <div ref={beaconRef} data-locked="false" className="ev-beacon pointer-events-none absolute z-20" style={{ left: "61%", top: "36%" }}>
              <span className="ev-ping" />
              <div className="ev-label absolute left-[18px] top-1/2 -translate-y-1/2 whitespace-nowrap md:left-[30px]">
                <span className="font-aeonik text-xs font-medium text-white md:text-base">Escape Velocity</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
