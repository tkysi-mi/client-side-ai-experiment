export interface NanoAudioResult {
  transcript: string;
  translation: string;
}

export function createAudioBuffer(samples: Float32Array, sampleRate = 16000): AudioBuffer {
  const buffer = new AudioBuffer({
    length: samples.length,
    numberOfChannels: 1,
    sampleRate,
  });
  buffer.copyToChannel(new Float32Array(samples), 0);
  return buffer;
}

export function parseNanoAudioResult(text: string): NanoAudioResult {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    const object = text.match(/\{[\s\S]*\}/)?.[0];
    if (!object) throw new Error("音声処理結果をJSONとして読み取れませんでした。");
    value = JSON.parse(object);
  }

  if (!value || typeof value !== "object") {
    throw new Error("音声処理結果の形式が正しくありません。");
  }

  const candidate = value as Record<string, unknown>;
  if (typeof candidate.transcript !== "string" || typeof candidate.translation !== "string") {
    throw new Error("文字起こしまたは翻訳が結果に含まれていません。");
  }

  return {
    transcript: candidate.transcript.trim(),
    translation: candidate.translation.trim(),
  };
}

export function getAudioDuration(samples: Float32Array, sampleRate = 16000): number {
  return samples.length / sampleRate;
}
