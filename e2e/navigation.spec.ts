import { expect, test } from "@playwright/test";

test("home links to both experiments", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Client-side AI/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "収録実験" })).toBeVisible();
  await expect(page.getByRole("link", { name: /実験を開く/ })).toHaveCount(3);
});

test("experiment URLs support direct navigation", async ({ page }) => {
  await page.goto("/experiments/translator");
  await expect(page.getByRole("heading", { name: "リアルタイム英日音声翻訳" })).toBeVisible();
  await expect(page.getByText("この実験の実行環境")).toBeVisible();
  await page.goto("/experiments/survival");
  await expect(page.getByRole("heading", { name: "ピンチ脱出ゲーム" })).toBeVisible();
  await expect(page.getByRole("button", { name: /新しいミッション/ })).toBeVisible();
  await page.goto("/experiments/nano-audio");
  await expect(page.getByRole("heading", { name: "Gemini Nano 音声理解" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "発話区間をローカルで検出" })).toBeVisible();
});

test("mobile navigation opens as a drawer", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile-only interaction");
  await page.goto("/");
  await page.getByRole("button", { name: "メニューを開く" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("link", { name: "音声翻訳" }).click();
  await expect(page).toHaveURL(/experiments\/translator/);
});
