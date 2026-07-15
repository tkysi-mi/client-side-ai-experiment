export interface GameScore {
  meaningTransfer: number;
  reasonClarity: number;
  itemUse: number;
  taskSuccess: number;
  repairability: number;
  total: number;
  understood: string[];
  needsWork: string[];
  nextLine: string;
}

export interface SurvivalItem { en: string; ja: string }

export function clampScore(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(100, Math.round(number))) : 0;
}

export function normalizeGameScore(input: Partial<GameScore>): GameScore {
  const score = {
    meaningTransfer: clampScore(input.meaningTransfer),
    reasonClarity: clampScore(input.reasonClarity),
    itemUse: clampScore(input.itemUse),
    taskSuccess: clampScore(input.taskSuccess),
    repairability: clampScore(input.repairability),
    understood: Array.isArray(input.understood) ? input.understood.filter((item): item is string => typeof item === "string").slice(0, 3) : [],
    needsWork: Array.isArray(input.needsWork) ? input.needsWork.filter((item): item is string => typeof item === "string").slice(0, 3) : [],
    nextLine: typeof input.nextLine === "string" ? input.nextLine : "",
  };
  return { ...score, total: clampScore(score.meaningTransfer * 0.35 + score.reasonClarity * 0.2 + score.itemUse * 0.15 + score.taskSuccess * 0.2 + score.repairability * 0.1) };
}

export function fallbackGameScore(answer: string, items: SurvivalItem[]): GameScore {
  const lower = answer.toLowerCase();
  const usedItems = items.filter((item) => lower.includes(item.en.toLowerCase())).length;
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  return normalizeGameScore({
    meaningTransfer: Math.min(100, wordCount * 4),
    reasonClarity: lower.includes("because") || lower.includes("so") ? 70 : 45,
    itemUse: Math.round((usedItems / Math.max(1, items.length)) * 100),
    taskSuccess: wordCount >= 18 ? 70 : 45,
    repairability: wordCount >= 12 ? 65 : 35,
    understood: ["一部の説明は伝わりました。"],
    needsWork: ["AI採点に失敗したため、簡易採点を表示しています。"],
    nextLine: "I need help because...",
  });
}

export function parseGameScore(text: string): Partial<GameScore> {
  try { return JSON.parse(text) as Partial<GameScore>; }
  catch {
    const object = text.match(/\{[\s\S]*\}/)?.[0];
    if (!object) throw new Error("採点結果をJSONとして読み取れませんでした。");
    return JSON.parse(object) as Partial<GameScore>;
  }
}
