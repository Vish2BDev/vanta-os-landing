/**
 * scripts/record-demo.ts
 *
 * Records a slow, choreographed scroll of the VantaOS landing page using
 * Playwright with video capture enabled. Saves the recording to public/demo/.
 *
 * Usage:
 *   1. Start the dev server:  npm run dev
 *   2. Run this script:        npx tsx scripts/record-demo.ts
 *
 * Output:
 *   public/demo/vanta-os-scroll-demo.webm
 */

import { chromium } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, "../public/demo");
const BASE_URL = "http://localhost:3001";

// Total scroll duration in ms — long enough to see every section cleanly
const TOTAL_SCROLL_MS = 28_000;
// Viewport
const VIEWPORT = { width: 1440, height: 900 };

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log("🎬 Launching Chromium (headful)…");
  const browser = await chromium.launch({
    headless: false, // headful so the GPU compositor runs
    args: ["--start-maximized"],
  });

  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: {
      dir: OUTPUT_DIR,
      size: VIEWPORT,
    },
  });

  const page = await context.newPage();

  console.log(`🌐 Navigating to ${BASE_URL}…`);
  await page.goto(BASE_URL, { waitUntil: "networkidle" });

  // Wait for the canvas hero to be ready (first frame drawn)
  await page.waitForTimeout(2000);

  // Get full page scroll height
  const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const clientHeight = await page.evaluate(() => window.innerHeight);
  const maxScroll = scrollHeight - clientHeight;

  console.log(`📏 Page height: ${scrollHeight}px  |  Max scroll: ${maxScroll}px`);
  console.log(`⏱  Recording scroll over ${TOTAL_SCROLL_MS / 1000}s…`);

  // Eased scroll — slow start, fast middle, slow end (for cinematic feel)
  const STEPS = 600;
  const STEP_MS = TOTAL_SCROLL_MS / STEPS;

  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS;
    // Ease in-out cubic
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const scrollY = Math.round(eased * maxScroll);
    await page.evaluate((y) => window.scrollTo(0, y), scrollY);
    await sleep(STEP_MS);
  }

  // Hold at bottom
  await sleep(1500);

  // Scroll back up slowly for the rewind effect
  const REWIND_STEPS = 120;
  const REWIND_MS = 4000;
  for (let i = 0; i <= REWIND_STEPS; i++) {
    const t = i / REWIND_STEPS;
    const scrollY = Math.round((1 - t) * maxScroll);
    await page.evaluate((y) => window.scrollTo(0, y), scrollY);
    await sleep(REWIND_MS / REWIND_STEPS);
  }

  await sleep(1000);

  console.log("✅ Scroll complete. Closing browser…");
  await context.close();
  await browser.close();

  // Playwright saves the video with a UUID filename — rename it
  const files = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith(".webm"));
  if (files.length > 0) {
    const latest = files
      .map((f) => ({ f, t: fs.statSync(path.join(OUTPUT_DIR, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t)[0].f;

    const dest = path.join(OUTPUT_DIR, "vanta-os-scroll-demo.webm");
    fs.renameSync(path.join(OUTPUT_DIR, latest), dest);
    console.log(`📹 Recording saved to: ${dest}`);
  } else {
    console.warn("⚠️  No .webm file found in output dir — video may not have been captured.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
