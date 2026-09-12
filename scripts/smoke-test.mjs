import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const email = `smoketest+${Date.now()}@lifeos.app`;

(async () => {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });

  console.log("1. Register...");
  await page.goto(`${BASE}/register`);
  await page.fill("#name", "Smoke Test");
  await page.fill("#email", email);
  await page.fill("#password", "smoketest123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard/, { timeout: 15000 });
  console.log("   -> Landed on dashboard after register OK");

  await page.waitForTimeout(1500);
  console.log("2. Dashboard content check...");
  const heading = await page.textContent("h1");
  console.log("   heading:", heading);

  console.log("3. Create a task via modal...");
  await page.click('button:has-text("Add task")');
  await page.waitForSelector('#title');
  await page.fill("#title", "Smoke test task");
  await page.click('button:has-text("Create task")');
  await page.waitForTimeout(1000);

  console.log("4. Go to Tasks page...");
  await page.goto(`${BASE}/tasks`);
  await page.waitForTimeout(1000);
  const taskVisible = await page.isVisible("text=Smoke test task");
  console.log("   task visible on Tasks page:", taskVisible);

  console.log("5. Go to Calendar...");
  await page.goto(`${BASE}/calendar`);
  await page.waitForTimeout(1000);

  console.log("6. Go to Habits, add habit...");
  await page.goto(`${BASE}/habits`);
  await page.click('button:has-text("Add habit")');
  await page.waitForTimeout(300);
  await page.fill('input[placeholder="Exercise, Read, Meditate…"]', "Smoke Habit");
  await page.click('button:has-text("Create habit")');
  await page.waitForTimeout(1000);
  const habitVisible = await page.isVisible("text=Smoke Habit");
  console.log("   habit visible:", habitVisible);

  console.log("7. Go to Goals, add goal...");
  await page.goto(`${BASE}/goals`);
  await page.click('button:has-text("Add goal")');
  await page.waitForTimeout(300);
  await page.fill('input[placeholder="Learn Python, Run a 10k…"]', "Smoke Goal");
  await page.click('button:has-text("Create goal")');
  await page.waitForTimeout(1000);

  console.log("8. Go to Focus...");
  await page.goto(`${BASE}/focus`);
  await page.waitForTimeout(500);

  console.log("9. Go to Analytics...");
  await page.goto(`${BASE}/analytics`);
  await page.waitForTimeout(1500);

  console.log("10. Go to AI Assistant, send message...");
  await page.goto(`${BASE}/ai`);
  await page.waitForTimeout(500);
  await page.fill('input[placeholder="Ask LifeOS anything about your day…"]', "Plan my day");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  console.log("11. Notes...");
  await page.goto(`${BASE}/notes`);
  await page.waitForTimeout(500);

  console.log("12. Journal...");
  await page.goto(`${BASE}/journal`);
  await page.waitForTimeout(500);

  console.log("13. Projects...");
  await page.goto(`${BASE}/projects`);
  await page.waitForTimeout(500);

  console.log("14. Notifications...");
  await page.goto(`${BASE}/notifications`);
  await page.waitForTimeout(500);

  console.log("15. Settings...");
  await page.goto(`${BASE}/settings`);
  await page.waitForTimeout(500);

  console.log("\n=== Console/page errors captured ===");
  console.log(errors.length ? errors.join("\n") : "NONE");

  await browser.close();
  process.exit(errors.length ? 1 : 0);
})().catch((e) => {
  console.error("SMOKE TEST FAILED:", e);
  process.exit(1);
});
