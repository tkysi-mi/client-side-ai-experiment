import { describe, expect, it } from "vitest";
import { getAudioDuration, parseNanoAudioResult } from "./audio";

describe("Gemini Nano audio results", () => {
  it("parses structured transcription and translation", () => {
    expect(parseNanoAudioResult('{"transcript":"I go yesterday.","translation":"私は昨日行きます。"}')).toEqual({
      transcript: "I go yesterday.",
      translation: "私は昨日行きます。",
    });
  });

  it("extracts JSON surrounded by model prose", () => {
    expect(parseNanoAudioResult('Result: {"transcript":"Hello","translation":"こんにちは"} done').transcript).toBe("Hello");
  });

  it("calculates duration for 16kHz samples", () => {
    expect(getAudioDuration(new Float32Array(24000))).toBe(1.5);
  });
});
