import { describe, expect, it } from "vitest";
import { clampScore, fallbackGameScore, normalizeGameScore, parseGameScore } from "./score";

describe("survival scoring", () => {
  it("clamps score values", () => {
    expect(clampScore(120)).toBe(100);
    expect(clampScore(-4)).toBe(0);
    expect(clampScore("54.6")).toBe(55);
    expect(clampScore("invalid")).toBe(0);
  });

  it("calculates the weighted total and limits feedback", () => {
    const score = normalizeGameScore({
      meaningTransfer: 80, reasonClarity: 70, itemUse: 60, taskSuccess: 90, repairability: 50,
      understood: ["one", "two", "three", "four"], needsWork: ["next"], nextLine: "I can help.",
    });
    expect(score.total).toBe(74);
    expect(score.understood).toHaveLength(3);
  });

  it("extracts JSON wrapped in model prose", () => {
    expect(parseGameScore('Result: {"meaningTransfer": 75} done').meaningTransfer).toBe(75);
  });

  it("rewards item use in fallback scoring", () => {
    const items = [{ en: "paper cup", ja: "紙コップ" }, { en: "coin", ja: "コイン" }, { en: "string", ja: "ひも" }];
    const complete = fallbackGameScore("I use a paper cup, a coin, and string because they can help me solve this problem quickly.", items);
    const missing = fallbackGameScore("I will ask for help.", items);
    expect(complete.itemUse).toBe(100);
    expect(missing.itemUse).toBe(0);
    expect(complete.total).toBeGreaterThan(missing.total);
  });
});
