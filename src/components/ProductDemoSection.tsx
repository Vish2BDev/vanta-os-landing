"use client";

import { useCallback, useRef } from "react";
import { useTrackProgress, mapClamp } from "@/hooks/useTrackProgress";

/**
 * Data sources. Each belongs to the step whose narration/screen it illustrates:
 * they fade in beside the phone (left of it) when their step is active, then
 * converge (shrink into the phone) as that step ends. `step` indexes B below.
 */
const RAW_SOURCES = [
  { src: "whoop", left: "49%", top: "28%", float: 1, step: 1 },
  { src: "oura", left: "60%", top: "44%", float: 2, step: 1 },
  { src: "apple-watch", left: "46%", top: "60%", float: 1, step: 1 },
  { src: "bloodwork", left: "54%", top: "42%", float: 2, step: 2 },
  { src: "cgm", left: "52%", top: "46%", float: 1, step: 3 },
  { src: "diet", left: "47%", top: "40%", float: 2, step: 4 },
  { src: "supplements", left: "60%", top: "56%", float: 1, step: 4 },
];
// order = index of the source within its own step (drives the fly-in stagger)
const stepSeen: Record<number, number> = {};
const SOURCES = RAW_SOURCES.map((s) => {
  const order = (stepSeen[s.step] = (stepSeen[s.step] ?? -1) + 1);
  const count = RAW_SOURCES.filter((x) => x.step === s.step).length;
  return { ...s, order, count };
});

/** Left-column narration, one block per step (index aligns with B / phone screens). */
const COPY = [
  { intro: true, title: "Your health is scattered across a dozen apps.", sub: "Wearables, labs, glucose, meals. None of it talks. Vanta is where it finally connects." },
  { eyebrow: "01 · Wearables", title: "Every wearable, one live feed.", sub: "Your watch, ring and band stream sleep, recovery and strain into Vanta automatically. No exports, no toggling between apps." },
  { eyebrow: "02 · Bloodwork", title: "Your bloodwork, read and explained.", sub: "Upload a panel and Vanta tracks every marker over time, flags what's drifting, and tells you what it means in plain language." },
  { eyebrow: "03 · Glucose", title: "Continuous glucose, in real context.", sub: "Every spike and crash mapped to the meal, workout or night that caused it, so you see what your body actually responds to." },
  { eyebrow: "04 · Intake", title: "Food and supplements, logged and scored.", sub: "Vanta reads your meals and your stack, balances your macros, and flags anything working against your goals." },
  { eyebrow: "05 · Training & Recovery", title: "Your workouts and sleep, synced automatically.", sub: "Vanta tracks how hard you train and how well you recover." },
  { eyebrow: "06 · Protocol", title: "Your protocol, adjusted to all of it.", sub: "It adapts every day to your wearables, bloodwork, glucose and intake." },
];

// Step boundaries along the pinned scroll track (global progress p, 0..1). The
// spacing is intentionally uneven so each screen holds for a different beat.
// Screens HARD-CUT between these (binary opacity, no crossfade) to keep the
// transitions crisp. Step i owns narration[i], screen[i], and its sources; within
// a step a normalized local t (0..1) drives the sub-animations (source fly-in,
// chart draw, connect).
const NSTEP = 7;
const B = [0, 0.175, 0.385, 0.51, 0.64, 0.74, 0.875, 1.0001];

function setVar(el: HTMLElement | null, name: string, value: string | number) {
  el?.style.setProperty(name, String(value));
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
// step index + local progress t for a global p, using the uneven real boundaries
function stepAt(p: number): { step: number; t: number } {
  let step = 0;
  for (let i = 0; i < NSTEP; i++) if (p >= B[i]) step = i;
  const t = clamp01((p - B[step]) / (B[step + 1] - B[step]));
  return { step, t };
}

export function ProductDemoSection() {
  const trackRef = useRef<HTMLElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const screenRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sourceRefs = useRef<(HTMLDivElement | null)[]>([]);
  const copyRefs = useRef<(HTMLDivElement | null)[]>([]);
  const timelineRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  const onProgress = useCallback((p: number) => {
    const { step, t } = stepAt(p);

    // phone entrance + resting tilt + subtle edge glow
    setVar(phoneRef.current, "--in", mapClamp(p, 0, 0.06).toFixed(3));
    setVar(phoneRef.current, "--tilt", (0.32 * mapClamp(p, 0.01, 0.09)).toFixed(3));
    setVar(phoneRef.current, "--glow", "0.14");

    // narration + phone screens: HARD CUT (binary) — each holds solo, then swaps.
    for (let i = 0; i < NSTEP; i++) {
      const on = i === step ? 1 : 0;
      const copy = copyRefs.current[i];
      if (copy) {
        copy.style.opacity = String(on);
        if (COPY[i].intro) copy.style.transform = `translateY(${(1 - on) * 36}px)`;
      }
      const screen = screenRefs.current[i];
      if (screen) {
        screen.style.opacity = String(on);
        screen.style.pointerEvents = on ? "auto" : "none";
      }
    }

    // sources: enter early in their step, hold, then fly INTO the phone before the cut
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pr = phoneRef.current?.getBoundingClientRect();
    const targetX = pr ? pr.left + pr.width / 2 : vw * 0.75;
    const targetY = pr ? pr.top + pr.height / 2 : vh * 0.5;
    SOURCES.forEach((s, i) => {
      const el = sourceRefs.current[i];
      if (!el) return;
      let enter: number;
      let converge: number;
      if (step < s.step) {
        enter = 0;
        converge = 0;
      } else if (step > s.step) {
        enter = 1;
        converge = 1; // already absorbed (scaled to 0)
      } else {
        enter = mapClamp(t, 0.05, 0.25);
        const cs = 0.45 + s.order * 0.11; // stagger fly-in; all absorbed by ~t 0.85
        converge = mapClamp(t, cs, cs + 0.18);
      }
      const cEase = converge * converge;
      const homeX = (parseFloat(s.left) / 100) * vw;
      const homeY = (parseFloat(s.top) / 100) * vh;
      setVar(el, "--enter", enter.toFixed(3));
      setVar(el, "--converge", converge.toFixed(3));
      setVar(el, "--tx", `${(cEase * (targetX - homeX)).toFixed(1)}px`);
      setVar(el, "--ty", `${(cEase * (targetY - homeY)).toFixed(1)}px`);
    });

    // progress bar
    if (progressRef.current) progressRef.current.style.width = `${(p * 100).toFixed(1)}%`;

    // value that draws during its step, stays "done" after, resets before
    const stepVal = (idx: number, a: number, b: number) =>
      step < idx ? 0 : step > idx ? 1 : mapClamp(t, a, b);

    // wearables: SYNCING while devices converge (done ~t 0.85), then "Wearables Connected"
    // holds solo (t 0.86 -> 1.0) before the hard cut to bloodwork — the pause.
    screenRefs.current[1]?.setAttribute("data-connected", step > 1 || (step === 1 && t > 0.86) ? "true" : "false");

    // chart draws, keyed to each screen's local t
    setVar(screenRefs.current[2], "--fill", stepVal(2, 0.15, 0.65).toFixed(3));
    setVar(screenRefs.current[3], "--gfill", stepVal(3, 0.15, 0.65).toFixed(3));

    // screen 5: training -> sleep
    setVar(screenRefs.current[5], "--tr-voice", stepVal(5, 0.05, 0.2).toFixed(3));
    setVar(screenRefs.current[5], "--route", stepVal(5, 0.15, 0.45).toFixed(3));
    setVar(screenRefs.current[5], "--tr-swap", stepVal(5, 0.52, 0.66).toFixed(3));
    setVar(screenRefs.current[5], "--sleep", stepVal(5, 0.6, 0.8).toFixed(3));

    // screen 6: protocol timeline
    timelineRef.current?.setAttribute("data-line", step === 6 && t > 0.12 ? "true" : "false");
    rowRefs.current.forEach((r, k) => {
      r?.setAttribute("data-shown", step === 6 && t > 0.2 + k * 0.13 ? "true" : "false");
    });
  }, []);

  useTrackProgress(trackRef, onProgress);

  const setScreen = (i: number) => (el: HTMLDivElement | null) => {
    screenRefs.current[i] = el;
  };

  return (
    <section ref={trackRef} className="relative bg-black" style={{ height: "1080vh" }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* ambient glow */}
        <div className="phone-ambient pointer-events-none absolute inset-0">
          <div className="phone-ambient-glow absolute inset-0" />
        </div>

        {/* per-step data sources (float left of the phone) */}
        <div className="psx-sources pointer-events-none absolute inset-0 z-20">
          {SOURCES.map((s, i) => (
            <div
              key={s.src}
              ref={(el) => {
                sourceRefs.current[i] = el;
              }}
              data-blob="true"
              className="psx-source"
              style={{ left: s.left, top: s.top, ["--enter" as string]: 0, ["--converge" as string]: 0 } as React.CSSProperties}
            >
              <div className={`psx-source-core float-card-${s.float}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="psx-source-img" src={`/assets/new/sources/${s.src}.png`} alt="" />
              </div>
            </div>
          ))}
        </div>

        {/* left narration column */}
        <div className="pointer-events-none absolute inset-0 z-20">
          <div className="psx-narration">
            {COPY.map((c, i) => (
              <div
                key={c.title}
                ref={(el) => {
                  copyRefs.current[i] = el;
                }}
                data-copy="true"
                className={`psx-copy${c.intro ? " psx-copy-intro" : ""}`}
                style={{ opacity: 0, ...(c.intro ? { transform: "translateY(36px)" } : {}) }}
              >
                {c.eyebrow && <p className="psx-eyebrow font-aeonik">{c.eyebrow}</p>}
                {c.intro ? (
                  <h2 className="psx-title font-aeonik">{c.title}</h2>
                ) : (
                  <h3 className="psx-title font-aeonik">{c.title}</h3>
                )}
                <p className="psx-sub font-aeonik">{c.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* phone (right half on desktop) */}
        <div className="absolute inset-0 z-10 flex items-start justify-center px-6 pt-[11vh] md:left-1/2 md:items-center md:px-0 md:pt-0">
          <div className="phone-perspective">
            <div ref={phoneRef} className="phone">
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={i}
                  aria-hidden="true"
                  className="phone-slab"
                  style={{ transform: `translateZ(${(-(i + 1) * 1.4).toFixed(2)}px)` }}
                />
              ))}
              <div className="phone-body">
                <div className="phone-edge" />
                <div className="phone-island" />
                <div className="phone-screen">
                  {/* 0 — boot */}
                  <div ref={setScreen(0)} className="ps-screen" data-boot="on" style={{ opacity: 1 }}>
                    <Status />
                    <div className="ps-intro">
                      <p className="ps-intro-word font-organetto">VANTA</p>
                    </div>
                  </div>

                  {/* 1 — wearables */}
                  <div
                    ref={setScreen(1)}
                    className="ps-screen"
                    data-connected="false"
                    style={{ opacity: 0 }}
                  >
                    <Status />
                    <div className="wear-ripple">
                      <span aria-hidden="true" />
                      <span aria-hidden="true" />
                      <span aria-hidden="true" />
                      <p className="wear-sync-label font-aeonik">Syncing</p>
                    </div>
                    <div className="wear-done">
                      <span className="wear-check">
                        <svg className="wear-check-svg" viewBox="0 0 48 36" aria-hidden="true">
                          <path
                            className="wear-check-tick"
                            d="M4 19 L18 32 L44 4"
                            pathLength={1}
                          />
                        </svg>
                      </span>
                      <p className="wear-done-title font-aeonik">Wearables Connected</p>
                      <p className="ps-subline font-aeonik">Devices synced</p>
                    </div>
                  </div>

                  {/* 2 — bloodwork */}
                  <div ref={setScreen(2)} className="ps-screen" style={{ opacity: 0 }}>
                    <Status />
                    <div className="ps-hero">
                      <p className="ps-eyebrow font-aeonik">Bloodwork</p>
                      <FlaskIcon />
                      <p className="ps-state font-aeonik">ApoB</p>
                      <p className="ps-figure font-aeonik tabular-nums">
                        78<span className="ps-unit">mg/dL</span>
                      </p>
                      <div className="ps-marker-spark">
                        <svg className="ps-chart-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="blood-stroke" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#ffffff" />
                              <stop offset="100%" stopColor="rgb(255 138 92)" />
                            </linearGradient>
                          </defs>
                          <path
                            className="ps-chart-line"
                            d="M 4.00 18.00 C 6.56 19.56, 14.22 23.44, 19.33 27.33 C 24.44 31.22, 29.56 36.67, 34.67 41.33 C 39.78 46.00, 44.89 51.44, 50.00 55.33 C 55.11 59.22, 60.22 60.78, 65.33 64.67 C 70.44 68.56, 75.56 74.78, 80.67 78.67 C 85.78 82.56, 93.44 86.44, 96.00 88.00"
                            fill="none"
                            stroke="url(#blood-stroke)"
                            strokeWidth={1.5}
                            vectorEffect="non-scaling-stroke"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            pathLength={1}
                            style={{
                              strokeDasharray: 1,
                              strokeDashoffset: "calc(1 - var(--fill, 0))",
                              opacity: "min(1, calc(var(--fill, 0) * 40))",
                            }}
                          />
                        </svg>
                      </div>
                      <p className="ps-subline font-aeonik">in range · every marker tracked</p>
                    </div>
                  </div>

                  {/* 3 — glucose */}
                  <div ref={setScreen(3)} className="ps-screen" style={{ opacity: 0 }}>
                    <Status />
                    <div className="ps-hero">
                      <p className="ps-eyebrow font-aeonik">Glucose</p>
                      <DropletIcon />
                      <p className="ps-figure font-aeonik tabular-nums">
                        94<span className="ps-unit">mg/dL</span>
                      </p>
                      <div className="ps-curve">
                        <svg className="ps-chart-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="glucose-stroke" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#ffffff" />
                              <stop offset="100%" stopColor="rgb(255 138 92)" />
                            </linearGradient>
                          </defs>
                          <path
                            className="ps-chart-line"
                            d="M 4.00 88.00 C 5.39 86.06, 9.58 82.17, 12.36 76.33 C 15.15 70.50, 17.94 62.72, 20.73 53.00 C 23.52 43.28, 26.30 19.30, 29.09 18.00 C 31.88 16.70, 34.67 36.15, 37.45 45.22 C 40.24 54.30, 43.03 65.96, 45.82 72.44 C 48.61 78.93, 51.39 84.76, 54.18 84.11 C 56.97 83.46, 59.76 76.98, 62.55 68.56 C 65.33 60.13, 68.12 35.50, 70.91 33.56 C 73.70 31.61, 76.48 49.11, 79.27 56.89 C 82.06 64.67, 84.85 77.63, 87.64 80.22 C 90.42 82.81, 94.61 73.74, 96.00 72.44"
                            fill="none"
                            stroke="url(#glucose-stroke)"
                            strokeWidth={1.5}
                            vectorEffect="non-scaling-stroke"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            pathLength={1}
                            style={{
                              strokeDasharray: 1,
                              strokeDashoffset: "calc(1 - var(--gfill, 0))",
                              opacity: "min(1, calc(var(--gfill, 0) * 40))",
                            }}
                          />
                        </svg>
                      </div>
                      <p className="ps-subline font-aeonik">92% in range</p>
                    </div>
                  </div>

                  {/* 4 — intake */}
                  <div ref={setScreen(4)} className="ps-screen" style={{ opacity: 0 }}>
                    <Status />
                    <div className="ps-hero">
                      <p className="ps-eyebrow font-aeonik">Intake</p>
                      <UtensilsIcon />
                      <p className="ps-figure font-aeonik tabular-nums">
                        2,140<span className="ps-unit">kcal</span>
                      </p>
                      <p className="ps-subline font-aeonik">Macros balanced · Supplements added</p>
                    </div>
                  </div>

                  {/* 5 — training / sleep */}
                  <div ref={setScreen(5)} className="ps-screen" style={{ opacity: 0 }}>
                    <Status />
                    <div className="ps-hero psx-tr-train">
                      <p className="ps-eyebrow font-aeonik">Training</p>
                      <div className="psx-voice">
                        <span className="psx-voice-mic">
                          <MicIcon />
                        </span>
                        <span className="psx-voice-wave" aria-hidden="true">
                          <span /><span /><span /><span /><span /><span /><span />
                        </span>
                        <p className="psx-voice-text font-aeonik">
                          &ldquo;Morning run, 8k, felt strong&rdquo;
                        </p>
                        <p className="psx-voice-sources font-aeonik">Strava · Apple Health · Garmin</p>
                      </div>
                      <div className="psx-route">
                        <svg className="ps-chart-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                          <defs>
                            <linearGradient id="route-stroke" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#ffffff" />
                              <stop offset="100%" stopColor="rgb(255 138 92)" />
                            </linearGradient>
                          </defs>
                          <g className="psx-route-grid">
                            <line x1="2" y1="20" x2="98" y2="20" />
                            <line x1="2" y1="40" x2="98" y2="40" />
                            <line x1="2" y1="60" x2="98" y2="60" />
                            <line x1="2" y1="80" x2="98" y2="80" />
                            <line x1="20" y1="2" x2="20" y2="98" />
                            <line x1="40" y1="2" x2="40" y2="98" />
                            <line x1="60" y1="2" x2="60" y2="98" />
                            <line x1="80" y1="2" x2="80" y2="98" />
                          </g>
                          <path
                            className="ps-chart-line"
                            d="M 20.00 74.00 C 21.00 71.00, 22.67 60.17, 26.00 56.00 C 29.33 51.83, 36.67 52.50, 40.00 49.00 C 43.33 45.50, 42.33 38.17, 46.00 35.00 C 49.67 31.83, 57.00 29.17, 62.00 30.00 C 67.00 30.83, 74.33 35.67, 76.00 40.00 C 77.67 44.33, 75.50 52.67, 72.00 56.00 C 68.50 59.33, 58.67 56.83, 55.00 60.00 C 51.33 63.17, 47.83 71.67, 50.00 75.00 C 52.17 78.33, 65.00 79.17, 68.00 80.00"
                            fill="none"
                            stroke="url(#route-stroke)"
                            strokeWidth={1.5}
                            vectorEffect="non-scaling-stroke"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            pathLength={1}
                            style={{
                              strokeDasharray: 1,
                              strokeDashoffset: "calc(1 - var(--route, 0))",
                              opacity: "min(1, calc(var(--route, 0) * 40))",
                            }}
                          />
                          <circle
                            className="psx-route-start"
                            cx="20"
                            cy="74"
                            r="2.6"
                            style={{ opacity: "min(1, calc(var(--route, 0) * 4))" }}
                          />
                          <circle
                            className="psx-route-end"
                            cx="68"
                            cy="80"
                            r="3"
                            style={{ opacity: "max(0, calc((var(--route, 0) - 0.7) * 3.3))" }}
                          />
                        </svg>
                      </div>
                      <p className="ps-subline font-aeonik tabular-nums">8.0 km · 5:12 /km</p>
                    </div>
                    <div className="ps-hero psx-tr-rec">
                      <p className="ps-eyebrow font-aeonik">Sleep</p>
                      <p className="ps-figure font-aeonik tabular-nums">7h 42m</p>
                      <div className="psx-sleep">
                        <svg className="ps-chart-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="sleep-stroke" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#ffffff" />
                              <stop offset="100%" stopColor="rgb(255 138 92)" />
                            </linearGradient>
                          </defs>
                          <g className="psx-sleep-grid">
                            <line x1="0" y1="92" x2="100" y2="92" />
                            <line x1="0" y1="64" x2="100" y2="64" />
                            <line x1="0" y1="36" x2="100" y2="36" />
                            <line x1="0" y1="8" x2="100" y2="8" />
                          </g>
                          <path
                            className="ps-chart-line"
                            d="M 4.00 8.00 H 10.57 V 64.00 H 17.14 V 92.00 H 23.71 V 92.00 H 30.29 V 64.00 H 36.86 V 36.00 H 43.43 V 64.00 H 50.00 V 92.00 H 56.57 V 64.00 H 63.14 V 36.00 H 69.71 V 64.00 H 76.29 V 36.00 H 82.86 V 64.00 H 89.43 V 8.00 H 96.00"
                            fill="none"
                            stroke="url(#sleep-stroke)"
                            strokeWidth={1.25}
                            vectorEffect="non-scaling-stroke"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            pathLength={1}
                            style={{
                              strokeDasharray: 1,
                              strokeDashoffset: "calc(1 - var(--sleep, 0))",
                              opacity: "min(1, calc(var(--sleep, 0) * 40))",
                            }}
                          />
                        </svg>
                      </div>
                      <p className="ps-subline font-aeonik">88 recovery · deep &amp; REM on track</p>
                    </div>
                  </div>

                  {/* 6 — protocol */}
                  <div ref={setScreen(6)} className="ps-screen" style={{ opacity: 0 }}>
                    <Status />
                    <div className="ps-protocol psx-proto">
                      <div className="psx-proto-head">
                        <p className="ps-eyebrow font-aeonik">Today&apos;s protocol</p>
                        <p className="ps-proto-brief font-aeonik">
                          Two low-sleep nights. Today&apos;s built to recover.
                        </p>
                      </div>
                      <div ref={timelineRef} className="ps-timeline" data-line="false">
                        {PROTOCOL.map((row, i) => (
                          <div
                            key={row.label}
                            ref={(el) => {
                              rowRefs.current[i] = el;
                            }}
                            data-row="true"
                            data-shown="false"
                            className="ps-tl-row"
                          >
                            <span className="ps-tl-node">{row.icon}</span>
                            <span className="ps-tl-main">
                              <span className="ps-tl-head">
                                <span className="ps-tl-time font-aeonik tabular-nums">{row.time}</span>
                                <span className="ps-tl-label font-aeonik">{row.label}</span>
                              </span>
                              <span className="ps-tl-detail font-aeonik">{row.detail}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="phone-reflection" />
                <div className="phone-sheen" />
              </div>
              <div className="phone-floor-shadow" />
            </div>
          </div>
        </div>

        {/* progress bar */}
        <div className="progress-track absolute inset-x-0 top-0">
          <div ref={progressRef} className="progress-fill psx-progress-fill" style={{ width: "0%" }} />
        </div>
      </div>
    </section>
  );
}

function Status() {
  return (
    <div className="ps-status">
      <span className="font-aeonik text-[9px] tabular-nums tracking-wider text-white/40">7:02</span>
    </div>
  );
}

const iconProps = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.25,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const FlaskIcon = () => (
  <svg {...iconProps} className="ps-hero-icon">
    <path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2" />
    <path d="M6.453 15h11.094" />
    <path d="M8.5 2h7" />
  </svg>
);

const DropletIcon = () => (
  <svg {...iconProps} className="ps-hero-icon">
    <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
  </svg>
);

const UtensilsIcon = () => (
  <svg {...iconProps} className="ps-hero-icon">
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
    <path d="M7 2v20" />
    <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
  </svg>
);

const MicIcon = () => (
  <svg
    {...iconProps}
    strokeWidth={1.5}
    className="h-3.5 w-3.5"
  >
    <path d="M12 19v3" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <rect x="9" y="2" width="6" height="13" rx="3" />
  </svg>
);

const smallIcon = { ...iconProps, strokeWidth: 1.5, className: "h-3 w-3" };

const PROTOCOL = [
  {
    time: "07:00",
    label: "Low-carb breakfast",
    detail: "high protein",
    icon: (
      <svg {...smallIcon}>
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
        <path d="M7 2v20" />
        <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
      </svg>
    ),
  },
  {
    time: "17:30",
    label: "Zone 2 cardio",
    detail: "45 min",
    icon: (
      <svg {...smallIcon}>
        <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
      </svg>
    ),
  },
  {
    time: "21:30",
    label: "Breathwork",
    detail: "10 min",
    icon: (
      <svg {...smallIcon}>
        <path d="M12.8 19.6A2 2 0 1 0 14 16H2" />
        <path d="M17.5 8a2.5 2.5 0 1 1 2 4H2" />
        <path d="M9.8 4.4A2 2 0 1 1 11 8H2" />
      </svg>
    ),
  },
  {
    time: "22:15",
    label: "Magnesium",
    detail: "400 mg",
    icon: (
      <svg {...smallIcon}>
        <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
        <path d="m8.5 8.5 7 7" />
      </svg>
    ),
  },
];
