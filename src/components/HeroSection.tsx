"use client";

import { useCallback, useEffect, useRef } from "react";
import { useTrackProgress, mapClamp } from "@/hooks/useTrackProgress";

const FRAME_COUNT = 201;
const framePath = (i: number) =>
  `/assets/hero/evolution/frame_${String(i).padStart(3, "0")}.webp`;

export function HeroSection() {
  const trackRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const loadedRef = useRef<boolean[]>([]);
  const currentFrame = useRef(-1);

  // stage text refs (imperatively animated to avoid re-renders)
  const stage1 = useRef<HTMLDivElement>(null);
  const stage2 = useRef<HTMLDivElement>(null);
  const stage3 = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  // preload frame sequence
  useEffect(() => {
    const imgs: HTMLImageElement[] = [];
    const loaded: boolean[] = [];
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      const idx = i - 1;
      loaded[idx] = false;
      img.onload = () => {
        loaded[idx] = true;
        if (idx === 0) draw(0);
      };
      img.src = framePath(i);
      imgs[idx] = img;
    }
    framesRef.current = imgs;
    loadedRef.current = loaded;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const draw = useCallback((frameIdx: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = framesRef.current[frameIdx];
    if (!img || !loadedRef.current[frameIdx]) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) {
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }, []);

  const onProgress = useCallback(
    (p: number) => {
      // scrub frame sequence across the whole track
      const frameIdx = Math.min(FRAME_COUNT - 1, Math.round(p * (FRAME_COUNT - 1)));
      if (frameIdx !== currentFrame.current) {
        currentFrame.current = frameIdx;
        draw(frameIdx);
      }

      // scroll hint fades out immediately on scroll
      if (hintRef.current) hintRef.current.style.opacity = String(1 - mapClamp(p, 0.01, 0.06));

      // text stages (stage 1 is visible at the very top, then fades out)
      const s1 = 1 - mapClamp(p, 0.22, 0.3);
      const s2in = mapClamp(p, 0.4, 0.47);
      const s2 = s2in * (1 - mapClamp(p, 0.6, 0.68));
      const s3 = mapClamp(p, 0.76, 0.84);
      if (stage1.current) {
        stage1.current.style.opacity = String(s1);
        stage1.current.style.transform = `translateY(${(1 - s1) * 8}px)`;
      }
      if (stage2.current) {
        stage2.current.style.opacity = String(s2);
        stage2.current.style.transform = `translateY(${(1 - s2in) * 8}px)`;
      }
      if (stage3.current) {
        stage3.current.style.opacity = String(s3);
        stage3.current.style.transform = `translateY(${(1 - s3) * 8}px)`;
      }
    },
    [draw],
  );

  useTrackProgress(trackRef, onProgress);

  useEffect(() => {
    const onResize = () => draw(currentFrame.current < 0 ? 0 : currentFrame.current);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [draw]);

  return (
    <section ref={trackRef} id="top" className="relative bg-black" style={{ height: "500vh" }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-black">
        <div className="hero-in h-full w-full">
          {/* frame-sequence canvas */}
          <div className="absolute inset-0">
            <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
          </div>

          {/* bottom fade */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/60 to-transparent" />

          {/* scroll hint */}
          <div ref={hintRef} className="pointer-events-none absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
            <div className="scroll-hint flex flex-col items-center gap-3">
              <span className="font-aeonik text-[10px] uppercase tracking-[0.3em] text-white/40">
                Scroll
              </span>
              <span className="block h-8 w-px bg-gradient-to-b from-white/40 to-transparent" />
            </div>
          </div>

          {/* stage 1 */}
          <div
            ref={stage1}
            className="absolute bottom-[12vh] left-6 z-10 max-w-2xl md:left-14"
            style={{ opacity: 1 }}
          >
            <div className="flex items-center gap-2.5">
              <span className="inline-block h-2 w-2 bg-[#FF5C2A]" />
              <span className="font-aeonik text-[10px] uppercase tracking-[0.3em] text-white/50">
                Human, Evolved
              </span>
            </div>
            <h1 className="mt-4 font-aeonik text-4xl font-medium leading-[1.05] tracking-tight text-white md:text-6xl">
              For the Enhanced Generation
            </h1>
          </div>

          {/* stage 2 */}
          <div
            ref={stage2}
            className="absolute inset-y-0 left-6 z-10 flex max-w-2xl flex-col justify-center md:left-14"
            style={{ opacity: 0 }}
          >
            <div className="flex items-center gap-2.5">
              <span className="inline-block h-2 w-2 bg-[#FF5C2A]" />
              <span className="font-aeonik text-[10px] uppercase tracking-[0.3em] text-white/50">
                The Ambitious Class
              </span>
            </div>
            <h2 className="mt-4 font-aeonik text-4xl font-medium leading-[1.05] tracking-tight text-white md:text-6xl">
              Founders. Creators. Athletes. Artists.
            </h2>
          </div>

          {/* stage 3 */}
          <div
            ref={stage3}
            className="absolute bottom-[12vh] left-6 z-10 max-w-2xl md:left-14"
            style={{ opacity: 0 }}
          >
            <h2 className="font-aeonik text-4xl font-medium leading-[1.05] tracking-tight text-white md:text-6xl">
              Outlive Ordinary.
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
}
