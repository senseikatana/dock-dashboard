import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto("http://localhost:5173/");
await page.waitForSelector(".kpi-strip");
await page.screenshot({
  path: ".impeccable/review/desktop.png",
  fullPage: true,
});

await page.setViewportSize({ width: 1440, height: 1440 });
await page.getByRole("tab", { name: /^Todos/ }).click();
await page.screenshot({
  path: ".impeccable/review/desktop-stamped.png",
  fullPage: true,
});

await page.setViewportSize({ width: 768, height: 1024 });
await page.getByRole("tab", { name: /^Pendientes/ }).click();
await page.screenshot({
  path: ".impeccable/review/tablet.png",
  fullPage: true,
});

await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({
  path: ".impeccable/review/mobile.png",
  fullPage: true,
});

await browser.close();
console.log("captures written");
