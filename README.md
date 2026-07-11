# Vanta OS - Front-End Recreation

A pixel-perfect, front-end recreation of the [Vanta OS](https://www.vanta-os.com/) marketing site, rebuilt from scratch in **Next.js 16 / React 19 / Tailwind v4**.

The interesting part isn't the layout - it's the motion. The original leans on a scroll-driven canvas hero and a tightly choreographed product walkthrough. I rebuilt both with a **dependency-free scroll engine** (no GSAP, no ScrollMagic), matching the original's timing beat for beat.

> **Note on ownership.** This is a self-directed engineering study - a recreation of the Vanta OS marketing site built to reverse-engineer and re-implement its scroll choreography. The visual design belongs to Vanta OS; the front-end code in this repository is my own, written from scratch.

---

## Highlights

- **201-frame canvas hero scrubber.** A `<canvas>` plays a 201-frame WebP sequence scrubbed directly by scroll position - preloaded, drawn on `requestAnimationFrame`, with text stages that fade in and out against it.
- **Custom scroll-choreography engine.** A `useTrackProgress` hook pins a section and maps scroll into a normalized `0..1` progress value via `rAF`. Every animated section reads from it - fully reversible, no animation library.
- **The product-demo sequence** (the hardest 620 lines here): a phone locked in the right half of the viewport, seven screens that **hard-cut** in lockstep with a narration column, and source cards (wearables, bloodwork, CGM, food) that fly *into* the phone and get absorbed, staggered, before each cut. Step boundaries are uneven by design so each screen holds for its own beat.
- **Escape-velocity chart, prompt console, and metallic waitlist form** - each a self-contained section driven off the same scroll-progress primitive.
- **Self-hosted type.** Aeonik (four weights) and Organetto loaded via `next/font/local` for zero layout shift.

## Tech stack

| | |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4, oklch design tokens |
| Motion | Custom `useTrackProgress` / `useInView` hooks - **no animation library** |
| Assets | 201-frame WebP hero sequence, self-hosted OTF fonts, inline SVG charts |

## Architecture

```
src/
  app/
    layout.tsx          # font loading + root shell
    page.tsx            # section assembly
    globals.css         # design tokens + ported layout primitives
  components/
    Nav.tsx
    HeroSection.tsx        # 201-frame canvas scrubber + text stages
    ProductDemoSection.tsx # phone choreography, 7 hard-cut screens
    DoorwaySection.tsx     # escape-velocity chart
    PhiSection.tsx         # prompt nav + typing console
    WaitlistSection.tsx    # metallic pill form + monument
    ui/                    # primitives
  hooks/
    useTrackProgress.ts # sticky pin + rAF scroll progress
    useInView.ts        # intersection-based reveal
  lib/
    utils.ts
public/
  assets/               # hero frames, fonts, source images
```

Most sections follow the same pattern: pin the section, read a `0..1` progress value from `useTrackProgress`, and drive transforms/opacity from it. Screens transition with **binary opacity (hard cuts)** rather than crossfades - crossfading caused screen ghosting, so cuts keep the motion crisp.

## Running locally

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts:

```bash
npm run build      # production build
npm run check      # lint + typecheck + build
```

Requires Node >= 24.

## Credits

Design reference: [Vanta OS](https://www.vanta-os.com/). Front-end engineering: **Vishal Bhandari**.

## License

[MIT](./LICENSE)
