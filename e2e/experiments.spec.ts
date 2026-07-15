import { expect, test } from "@playwright/test";

async function installBuiltInAiMocks(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    class MockLanguageModel {
      static async availability() { return "available"; }
      static async create(options?: { monitor?: (monitor: EventTarget) => void }) {
        options?.monitor?.(new EventTarget());
        return new MockLanguageModel();
      }
      promptStreaming() {
        return new ReadableStream<string>({ start(controller) { controller.enqueue("こんにちは"); controller.close(); } });
      }
      async prompt() {
        return JSON.stringify({ meaningTransfer: 82, reasonClarity: 74, itemUse: 70, taskSuccess: 80, repairability: 76, understood: ["解決方法が伝わりました。"], needsWork: ["理由をもう少し加えましょう。"], nextLine: "I can use these items because they are helpful." });
      }
      destroy() {}
    }
    class MockSpeechRecognition {
      continuous = true; interimResults = true; lang = "en-US"; maxAlternatives = 1;
      onstart: (() => void) | null = null; onend: (() => void) | null = null;
      onerror: ((event: { error: string }) => void) | null = null;
      onresult: ((event: { resultIndex: number; results: Array<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null = null;
      start() {
        this.onstart?.();
        setTimeout(() => this.onresult?.({ resultIndex: 0, results: [{ 0: { transcript: "Hello everyone" }, isFinal: true }] }), 10);
      }
      stop() { this.onend?.(); }
      abort() { this.onend?.(); }
    }
    Object.assign(globalThis, { LanguageModel: MockLanguageModel });
    Object.assign(window, { SpeechRecognition: MockSpeechRecognition });
  });
}

test("translates a mocked speech result as a stream", async ({ page }) => {
  await installBuiltInAiMocks(page);
  await page.goto("/experiments/translator");
  await page.getByRole("button", { name: "実験を準備" }).click();
  await expect(page.getByRole("button", { name: "準備完了" })).toBeDisabled();
  await page.getByRole("button", { name: "音声認識を開始" }).click();
  await expect(page.getByText("Hello everyone")).toBeVisible();
  await expect(page.getByText("こんにちは")).toBeVisible();
});

test("runs a survival mission and renders model scoring", async ({ page }, testInfo) => {
  await installBuiltInAiMocks(page);
  await page.goto("/experiments/survival");
  await page.getByRole("button", { name: "実験を準備" }).click();
  await page.getByRole("button", { name: /新しいミッション/ }).click();
  await expect(page.getByText("Thinking Time", { exact: true }).first()).toBeVisible();
  const image = page.locator("img[alt]").last();
  await expect(image).toBeVisible();
  expect(await image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
  await page.getByRole("button", { name: "今すぐTalkへ" }).click();
  await page.getByLabel("Your explanation").fill("I use all three items because they can help me solve this problem safely.");
  await page.getByRole("button", { name: "採点する" }).click();
  await expect(page.getByText("採点が完了しました。伝わった点と次の一言を確認してください。")).toBeVisible();
  await expect(page.getByText("78", { exact: true })).toBeVisible();
  await page.screenshot({ path: `visual-output/${testInfo.project.name}-survival-active.png`, fullPage: true });
});

test("automatically starts Talk time after thinking ends", async ({ page }) => {
  await installBuiltInAiMocks(page);
  await page.clock.install();
  await page.goto("/experiments/survival");
  await page.getByRole("button", { name: "実験を準備" }).click();
  await page.getByRole("button", { name: /新しいミッション/ }).click();
  await page.clock.runFor(60000);
  await expect(page.getByText("Talk Time", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("03:00", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Your explanation")).toBeEnabled();
});

test("loads the local Silero VAD runtime and starts microphone detection", async ({ page }) => {
  await installBuiltInAiMocks(page);
  await page.goto("/experiments/nano-audio");
  await page.getByRole("button", { name: "実験を準備" }).click();
  await expect(page.getByRole("button", { name: "準備完了" })).toBeDisabled({ timeout: 30000 });
  await page.getByRole("button", { name: "入力開始" }).click();
  await expect(page.getByText("発話を待っています。自然に英語で話してください。")).toBeVisible();
  await page.getByRole("button", { name: "停止" }).click();
  await expect(page.getByText("マイク入力を停止しました。")).toBeVisible();
});
