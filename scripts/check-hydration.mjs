/**
 * Reproduce the user's environment: prefers-reduced-motion: reduce.
 *
 * Headless Chrome defaults to no-preference, which is exactly why the
 * CountUp / ScoreCard hydration mismatch never appeared in earlier checks.
 */
import { createRequire } from "node:module";

// Override with: node scripts/check-hydration.mjs http://localhost:3001
const BASE = process.argv[2] ?? process.env.BASE_URL ?? "http://localhost:3000";

const STANDALONE =
  "C:/Users/SrinivasS/.vscode/extensions/danielsanmedium.dscodegpt-3.24.50/standalone/";
const require = createRequire(STANDALONE + "index.js");
const { chromium } = require("patchright");

// channel:'chromium' picks the full build rather than the headless shell,
// matching how the browser-automation skill launches.
const browser = await chromium.launch({ headless: true, channel: "chromium" });
const context = await browser.newContext({ reducedMotion: "reduce" });

await context.addCookies([
  {
    name: "udyamai_session",
    value: encodeURIComponent(
      JSON.stringify({
        role: "customer",
        id: "24AABCS1234R1Z8",
        displayName: "Rajesh Patel",
        gstin: "24AABCS1234R1Z8",
        loginAt: new Date().toISOString(),
      }),
    ),
    domain: "localhost",
    path: "/",
  },
]);

const page = await context.newPage();
const errors = [];
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push("PAGEERROR: " + String(e)));

const results = {};
for (const path of ["/", "/dashboard?gstin=24AABCS1234R1Z8", "/lender"]) {
  errors.length = 0;
  await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2500);

  const hydration = errors.filter((e) => /hydrat|did not match|didn't match/i.test(e));
  results[path] = {
    reducedMotionActive: await page.evaluate(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
    hydrationErrors: hydration.length,
    sample: hydration.slice(0, 1).map((s) => s.slice(0, 160)),
    otherErrors: errors.length - hydration.length,
    score: await page.evaluate(() => {
      const el = document.querySelector(".tabular.text-6xl");
      return el ? el.textContent.trim() : null;
    }),
  };
}

console.log(JSON.stringify(results, null, 2));
await browser.close();
