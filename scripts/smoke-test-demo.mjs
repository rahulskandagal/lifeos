import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const email = `demosmoke+${Date.now()}@lifeos.app`;

(async () => {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("response", (res) => {
    if (res.status() >= 400 && !res.url().includes("/api/weather")) errors.push(`http ${res.status()}: ${res.url()}`);
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });

  console.log("Register with demo data...");
  await page.goto(`${BASE}/register`);
  await page.fill("#name", "Demo Smoke");
  await page.fill("#email", email);
  await page.fill("#password", "smoketest123");
  // seedDemoData checkbox is checked by default
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard/, { timeout: 15000 });
  await page.waitForTimeout(2000);
  console.log("Dashboard loaded with demo data");

  const pages = ["/tasks", "/calendar", "/habits", "/goals", "/projects", "/focus", "/analytics", "/ai", "/notes", "/journal", "/notifications", "/settings"];
  for (const p of pages) {
    await page.goto(`${BASE}${p}`);
    await page.waitForTimeout(1200);
    console.log(`Visited ${p}`);
  }

  // Visit project detail page (first project card)
  await page.goto(`${BASE}/projects`);
  await page.waitForTimeout(1000);
  const projectLink = await page.$('a[href^="/projects/"]');
  if (projectLink) {
    await projectLink.click();
    await page.waitForTimeout(1500);
    console.log("Visited project detail page");
    // try switching views
    const listBtn = await page.$('button:has-text("List")');
    if (listBtn) await listBtn.click();
    await page.waitForTimeout(500);
    const timelineBtn = await page.$('button:has-text("Timeline")');
    if (timelineBtn) await timelineBtn.click();
    await page.waitForTimeout(500);
  }

  // Kanban view on tasks page
  await page.goto(`${BASE}/tasks`);
  await page.waitForTimeout(1000);
  const boardBtn = await page.$('button:has-text("Board")');
  if (boardBtn) {
    await boardBtn.click();
    await page.waitForTimeout(1000);
    console.log("Switched to Kanban board view");
  }

  // Toggle a habit
  await page.goto(`${BASE}/habits`);
  await page.waitForTimeout(1000);

  // Calendar month/week/day/year toggles
  await page.goto(`${BASE}/calendar`);
  await page.waitForTimeout(800);
  for (const view of ["Week", "Day", "Year", "Month"]) {
    const btn = await page.$(`button:has-text("${view}")`);
    if (btn) {
      await btn.click();
      await page.waitForTimeout(600);
      console.log(`Calendar view: ${view}`);
    }
  }

  console.log("\n=== Errors captured ===");
  console.log(errors.length ? errors.join("\n") : "NONE");

  await browser.close();
  process.exit(errors.length ? 1 : 0);
})().catch((e) => {
  console.error("DEMO SMOKE TEST FAILED:", e);
  process.exit(1);
});
