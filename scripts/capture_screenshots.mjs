#!/usr/bin/env node
/** Capture deck screenshots from local dev server. */
import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "deck-screenshots");
const BASE = "http://localhost:3000";
const VIEWPORT = { width: 1600, height: 1000 };

async function shot(page, name, fn) {
  await fn(page);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false });
  console.log(`  ✓ ${name}.png`);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: VIEWPORT });

  await shot(page, "01", async (p) => {
    await p.goto(BASE, { waitUntil: "networkidle" });
    await p.waitForTimeout(1200);
  });

  await shot(page, "02", async (p) => {
    await p.goto(BASE, { waitUntil: "networkidle" });
    await p.locator("text=Check your business").scrollIntoViewIfNeeded();
    await p.waitForTimeout(800);
  });

  await shot(page, "03", async (p) => {
    await p.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
    await p.waitForTimeout(1500);
  });

  await shot(page, "04", async (p) => {
    await p.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
    await p.locator("text=holding you back").scrollIntoViewIfNeeded();
    await p.waitForTimeout(800);
  });

  await shot(page, "05", async (p) => {
    await p.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
    await p.locator("text=Pre-qualified").scrollIntoViewIfNeeded();
    await p.waitForTimeout(800);
  });

  await shot(page, "06", async (p) => {
    await p.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
    const btn = p.locator("button", { hasText: /Apply via OCEN|OCEN/i }).first();
    if (await btn.count()) {
      await btn.click();
      await p.waitForTimeout(1200);
    }
  });

  await browser.close();
  console.log(`Screenshots saved to ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
