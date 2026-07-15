import { expect, test } from "@playwright/test";

for (const route of [
  { name: "home", path: "/" },
  { name: "translator", path: "/experiments/translator" },
  { name: "survival", path: "/experiments/survival" },
  { name: "nano-audio", path: "/experiments/nano-audio" },
]) {
  test(`captures ${route.name} without horizontal overflow`, async ({ page }, testInfo) => {
    await page.goto(route.path);
    await page.waitForLoadState("networkidle");
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasOverflow).toBe(false);
    await page.screenshot({ path: `visual-output/${testInfo.project.name}-${route.name}.png`, fullPage: true });
  });
}
