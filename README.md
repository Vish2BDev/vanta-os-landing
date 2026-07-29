<div align="center">

# Vanta OS — Landing Page

**Freelance front-end build · Scroll-choreography engine · Canvas hero sequence**

[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind v4](https://img.shields.io/badge/Tailwind_v4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Canvas API](https://img.shields.io/badge/Canvas_API-F97316?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

</div>

---

## Overview

This is the marketing landing page I built for **[Vanta OS](https://www.vanta-os.com/)** — a next-generation personal health intelligence platform. The brief was simple: make the scroll feel cinematic. The engineering was not.

The page is built entirely in **Next.js 16 / React 19**, driven by a **custom, dependency-free scroll-choreography engine** — no GSAP, no ScrollMagic, no Framer Motion. Every animated section reads from a single `useTrackProgress` primitive that maps scroll position to a normalized `0 → 1` progress value via `requestAnimationFrame`. Every transition is fully reversible (scroll back up, it rewinds).

---

## The Scroll Engine

The entire page is choreographed by a single ~50-line hook.

```ts
// hooks/useTrackProgress.ts
export function useTrackProgress(
  ref: RefObject<HTMLElement | null>,
  onProgress: (p: number) => void,
): void {
  useEffect(() => {
    const el = ref.current;
    let raf = 0;
    let last = -1;

    const measure = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height - vh;       // total scroll distance of the pinned track
      const scrolled = -rect.top;           // how far past the top we are
      const p = Math.min(1, Math.max(0, scrolled / total));  // 0..1
      if (p !== last) { last = p; onProgress(p); }
    };

    const schedule = () => { if (!raf) raf = requestAnimationFrame(measure); };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => { cancelAnimationFrame(raf); /* cleanup */ };
  }, [ref, onProgress]);
}
```

**How it works:**
- Each animated section is a tall `div` (`height: Nvh`) with an inner `sticky` child pinned at `top: 0; height: 100vh`
- `useTrackProgress` attaches to the outer div and measures how far its `getBoundingClientRect().top` has scrolled past zero, divided by the total scroll distance
- The resulting `p` value (0–1) is passed to a `onProgress` callback that writes directly to the DOM — **no React state, no re-renders per frame**
- A `mapClamp(x, a, b)` utility remaps any sub-range of `p` to 0–1 for per-element animation windows

```ts
// Remap x in [a, b] to [0, 1], clamped
export function mapClamp(x: number, a: number, b: number): number {
  if (b === a) return x < a ? 0 : 1;
  return Math.min(1, Math.max(0, (x - a) / (b - a)));
}
```

---

## Section Breakdown

### 1 · Hero — 201-Frame Canvas Scrubber

The hero section is `500vh` tall. As you scroll, a `<canvas>` element plays a 201-frame WebP image sequence, scrubbed frame-by-frame in lockstep with scroll position.

**Implementation details:**
- 201 WebP frames are preloaded in parallel on mount using `new Image()` — each sets a `loaded[idx]` flag on completion so partial frames are never drawn
- On each `onProgress` call: `frameIdx = Math.round(p * 200)`, if it changed, `ctx.drawImage(img, ...)` repaints the canvas
- Canvas is drawn cover-fit: `scale = Math.max(cw / iw, ch / ih)`, centered — handles any viewport aspect ratio
- DPR-aware: canvas pixel size is set to `clientWidth * devicePixelRatio` (capped at 2×) before every draw
- Three text stages (`stage1`, `stage2`, `stage3`) are driven by `mapClamp` windows on `p` — they fade and translate independently, timed against specific frame ranges

```ts
// Hero text choreography (excerpt)
const s1 = 1 - mapClamp(p, 0.22, 0.30);       // stage 1 fades out at 22–30%
const s2 = mapClamp(p, 0.40, 0.47)             // stage 2 fades in at 40–47%
          * (1 - mapClamp(p, 0.60, 0.68));     // … and out at 60–68%
const s3 = mapClamp(p, 0.76, 0.84);            // stage 3 fades in at 76–84%
```

---

### 2 · Product Demo — 7-Screen Phone Choreography

The hardest section. A phone is locked in the right half of the viewport. As the user scrolls, seven screens **hard-cut** (binary opacity, not crossfades — crossfading caused ghosting) in lockstep with a narration column on the left. Data-source cards (wearables, bloodwork, CGM, food) **fly into the phone** and get absorbed, staggered, before each cut.

**Step boundaries (`B`) are deliberately uneven** — each screen holds for its own beat:

```ts
const B = [0, 0.175, 0.385, 0.51, 0.64, 0.74, 0.875, 1.0001];
//         ^         ^           ^                            ^
//     intro    wearables    glucose                       protocol
```

For each `p`, `stepAt(p)` returns the active step index and a local `t` (0–1) within that step:

```ts
function stepAt(p: number): { step: number; t: number } {
  let step = 0;
  for (let i = 0; i < NSTEP; i++) if (p >= B[i]) step = i;
  const t = clamp01((p - B[step]) / (B[step + 1] - B[step]));
  return { step, t };
}
```

**Source card fly-in (the `converge` effect):**
- Cards start at their initial position beside the phone
- As their step ends, they scale down and translate toward the phone's center, with per-card stagger via `order / count`
- The phone "absorbs" them with a brief `scale(1.04)` pulse

This section is ~620 lines and handles 7 narration blocks, 7 phone screens, and 7 source card constellations — all imperatively written to avoid per-frame React re-renders.

---

### 3 · Doorway — Escape-Velocity Chart

A self-contained animated chart section. Driven off the same `useTrackProgress` primitive. SVG path length is animated using `stroke-dasharray` / `stroke-dashoffset` mapped to `p`.

---

### 4 · Phi — Prompt Console

A typing-console animation section. Characters are revealed progressively as `p` increases. The cursor blinks independently via CSS animation; the text reveal is imperative.

---

### 5 · Waitlist — Metallic Pill Form

A waitlist CTA with a metallic border treatment and a monumental visual behind it. Entry fade orchestrated with `useInView` (intersection-based reveal hook).

---

## Architecture

```
src/
  app/
    layout.tsx               # Font loading (Aeonik + Organetto) + root shell
    page.tsx                 # Section assembly — Nav → Hero → Demo → Doorway → Phi → Waitlist
    globals.css              # Design tokens (oklch palette), layout primitives
  components/
    Nav.tsx
    HeroSection.tsx          # 201-frame canvas scrubber + 3 text stages
    ProductDemoSection.tsx   # Phone choreography, 7 screens, source card fly-in (~620 lines)
    DoorwaySection.tsx       # Escape-velocity SVG chart
    PhiSection.tsx           # Prompt console + typing reveal
    WaitlistSection.tsx      # Metallic pill form + monument
    ui/                      # Shared primitives
  hooks/
    useTrackProgress.ts      # Sticky-pin scroll engine (the heart of it)
    useInView.ts             # Intersection-based reveal
  lib/
    utils.ts
public/
  assets/
    hero/evolution/          # frame_001.webp … frame_201.webp (201-frame sequence)
    fonts/                   # Aeonik (4 weights) + Organetto — self-hosted via next/font/local
```

**Key architectural decisions:**

| Decision | Rationale |
|---|---|
| No animation library | Zero dep, zero bundle overhead. The `useTrackProgress` primitive covers every scroll case on the page. |
| Imperative DOM writes in `onProgress` | Avoiding React re-renders at 60fps is non-negotiable. All animated properties are written directly to `el.style`. |
| Hard cuts between phone screens | Crossfading caused visual ghosting at fast scroll velocities. Binary opacity keeps motion crisp. |
| Uneven step boundaries | Each product feature needs its own "breath". Fixed intervals made some screens feel rushed and others padded. |
| DPR-capped canvas | Device pixel ratios above 2× gave no perceptible quality gain but doubled memory and paint cost. |

---

## Running Locally

```bash
# Requires Node >= 24
npm install
npm run dev       # http://localhost:3000
```

Other scripts:

```bash
npm run build     # production build
npm run check     # lint + typecheck + build
```

---

## Tech Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4, oklch design tokens |
| Motion | Custom `useTrackProgress` hook — **no animation library** |
| Canvas | 201-frame WebP hero sequence, DPR-aware draw loop |
| Typography | Aeonik (4 weights) + Organetto — self-hosted via `next/font/local` |

---

## Credits

Client: **[Vanta OS](https://www.vanta-os.com/)** · Front-end engineering: **Vishal Bhandari**

## License

[MIT](./LICENSE)
