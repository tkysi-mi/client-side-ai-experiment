import { useCallback, useEffect, useRef, useState } from "react";
import { Clock3, LoaderCircle, MessageSquareText, Mic, MicOff, Play, RefreshCw, Sparkles } from "lucide-react";
import { useLanguageModel } from "@/ai/language-model-context";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CapabilityPanel } from "@/components/CapabilityPanel";
import { experiments } from "@/experiments/registry";
import { pickRandom, survivalItems, survivalScenarios, type SurvivalScenario } from "./data";
import { fallbackGameScore, normalizeGameScore, parseGameScore, type GameScore, type SurvivalItem } from "./score";

type GamePhase = "waiting" | "thinking" | "talking" | "scoring" | "done";
type DisplayLanguage = "en" | "ja";
const experiment = experiments.find((item) => item.id === "survival")!;
const THINK_SECONDS = 60;
const TALK_SECONDS = 3 * 60;
const modelOptions: LanguageModelCreateOptions = {
  expectedInputs: [{ type: "text", languages: ["en"] }],
  expectedOutputs: [{ type: "text", languages: ["en", "ja"] }],
  initialPrompts: [{ role: "system", content: "You evaluate short English explanations by CEFR A1/A2 learners. Reward successful meaning transfer more than grammar. Return only valid JSON." }],
};
const scoreSchema = {
  type: "object",
  properties: {
    meaningTransfer: { type: "number" }, reasonClarity: { type: "number" }, itemUse: { type: "number" }, taskSuccess: { type: "number" }, repairability: { type: "number" },
    understood: { type: "array", items: { type: "string" } }, needsWork: { type: "array", items: { type: "string" } }, nextLine: { type: "string" },
  },
  required: ["meaningTransfer", "reasonClarity", "itemUse", "taskSuccess", "repairability", "understood", "needsWork", "nextLine"],
};
const phaseLabels: Record<GamePhase, string> = { waiting: "待機中", thinking: "Thinking Time", talking: "Talk Time", scoring: "採点中", done: "完了" };
const scoreLabels = [["meaningTransfer", "意味伝達"], ["reasonClarity", "理由"], ["itemUse", "アイテム"], ["taskSuccess", "達成"], ["repairability", "修復性"]] as const;

function formatTime(seconds: number) { return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`; }

export default function SurvivalPage() {
  const { prepare } = useLanguageModel();
  const sessionRef = useRef<LanguageModel | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptRef = useRef("");
  const answerRef = useRef("");
  const missionRef = useRef<SurvivalScenario | null>(null);
  const itemsRef = useRef<SurvivalItem[]>([]);
  const [sessionReady, setSessionReady] = useState(false);
  const [phase, setPhase] = useState<GamePhase>("waiting");
  const [seconds, setSeconds] = useState(60);
  const [missionCount, setMissionCount] = useState(0);
  const [mission, setMission] = useState<SurvivalScenario | null>(null);
  const [items, setItems] = useState<SurvivalItem[]>([]);
  const [language, setLanguage] = useState<DisplayLanguage>("en");
  const [answer, setAnswer] = useState("");
  const [listening, setListening] = useState(false);
  const [score, setScore] = useState<GameScore | null>(null);
  const [notice, setNotice] = useState("新しいミッションを始めてください。");
  const [error, setError] = useState<string | null>(null);

  const stopTimer = useCallback(() => { if (timerRef.current) clearInterval(timerRef.current); timerRef.current = null; }, []);
  const stopSpeech = useCallback(() => { try { recognitionRef.current?.stop(); } catch { /* already stopped */ } setListening(false); }, []);
  const prepareSession = useCallback(async () => { sessionRef.current?.destroy(); sessionRef.current = await prepare("survival", modelOptions); setSessionReady(true); setError(null); }, [prepare]);

  const startCountdown = useCallback((duration: number, onFinish: () => void) => {
    stopTimer(); setSeconds(duration);
    let remaining = duration;
    timerRef.current = setInterval(() => {
      remaining -= 1; setSeconds(Math.max(0, remaining));
      if (remaining <= 0) { stopTimer(); onFinish(); }
    }, 1000);
  }, [stopTimer]);

  const evaluate = useCallback(async () => {
    const activeMission = missionRef.current;
    const activeItems = itemsRef.current;
    if (!activeMission || !answerRef.current.trim()) return;
    stopTimer(); stopSpeech(); setSeconds(0); setPhase("scoring"); setNotice("AIが、文法ではなく意味が相手に届いたかを中心に採点しています。"); setError(null);
    const prompt = `Evaluate this CEFR A1/A2 learner answer for a short survival explanation game.

Situation in English: ${activeMission.situation.en}
Situation in Japanese: ${activeMission.situation.ja}
Goal: ${activeMission.goal.en}
Required meaning: ${activeMission.requiredMeaning.join(", ")}
The learner must use: ${activeItems.map((item) => `${item.en} (${item.ja})`).join(", ")}
Learner answer: ${answerRef.current.trim()}

Score meaningTransfer, reasonClarity, itemUse, taskSuccess, and repairability from 0 to 100. Return short Japanese feedback in understood and needsWork, and one simple English sentence in nextLine.`;
    try {
      const session = sessionRef.current ?? await prepare("survival", modelOptions);
      sessionRef.current = session; setSessionReady(true);
      const response = await session.prompt(prompt, { responseConstraint: scoreSchema });
      setScore(normalizeGameScore(parseGameScore(response)));
      setNotice("採点が完了しました。伝わった点と次の一言を確認してください。");
    } catch (cause) {
      setScore(fallbackGameScore(answerRef.current, activeItems));
      setError(cause instanceof Error ? `AI採点に失敗したため簡易採点を表示します: ${cause.message}` : "AI採点に失敗したため簡易採点を表示します。");
      setNotice("簡易採点を表示しています。");
    } finally { setPhase("done"); }
  }, [prepare, stopSpeech, stopTimer]);

  const beginTalk = useCallback(() => {
    stopTimer(); setPhase("talking"); setNotice("Talk Timeです。3分以内に、状況・理由・3つのアイテムの使い方を英語で伝えてください。");
    startCountdown(TALK_SECONDS, () => { stopSpeech(); if (answerRef.current.trim()) void evaluate(); else { setPhase("done"); setNotice("回答が入力されませんでした。もう一度ミッションを始めてください。"); } });
  }, [evaluate, startCountdown, stopSpeech, stopTimer]);

  const newMission = () => {
    stopSpeech(); stopTimer();
    const nextMission = pickRandom(survivalScenarios, 1)[0];
    const nextItems = pickRandom(survivalItems, 3);
    missionRef.current = nextMission; itemsRef.current = nextItems;
    setMission(nextMission); setItems(nextItems); setMissionCount((count) => count + 1); setAnswer(""); answerRef.current = ""; transcriptRef.current = ""; setScore(null); setPhase("thinking"); setNotice("Thinking Timeです。3つのアイテムの使い方を考えてください。終了すると自動でTalk Timeへ進みます。");
    startCountdown(THINK_SECONDS, beginTalk);
  };

  const updateAnswer = (value: string) => { setAnswer(value); answerRef.current = value; };

  const toggleSpeech = () => {
    if (phase !== "talking") return;
    if (listening) { stopSpeech(); return; }
    const Constructor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Constructor) { setError("Web Speech APIを利用できません。テキスト入力を使用してください。"); return; }
    if (!recognitionRef.current) {
      const recognition = new Constructor(); recognition.continuous = true; recognition.interimResults = true; recognition.lang = "en-US"; recognition.maxAlternatives = 1;
      recognition.onstart = () => setListening(true);
      recognition.onend = () => setListening(false);
      recognition.onerror = (event) => { setListening(false); if (event.error !== "aborted") setError(event.error === "not-allowed" ? "マイクへのアクセスが拒否されました。" : `音声入力エラー: ${event.error}`); };
      recognition.onresult = (event) => {
        let interim = "";
        for (let index = event.resultIndex; index < event.results.length; index += 1) { const text = event.results[index][0].transcript; if (event.results[index].isFinal) transcriptRef.current += `${transcriptRef.current ? " " : ""}${text.trim()}`; else interim += text; }
        updateAnswer(`${transcriptRef.current}${interim ? ` ${interim}` : ""}`.trim());
      };
      recognitionRef.current = recognition;
    }
    try { recognitionRef.current.start(); } catch { setError("音声入力を開始できませんでした。"); }
  };

  useEffect(() => () => { stopTimer(); recognitionRef.current?.abort(); sessionRef.current?.destroy(); }, [stopTimer]);
  const localized = <K extends "title" | "situation" | "goal">(field: K) => mission?.[field][language] ?? "";
  const resultPhase = phase === "scoring" || phase === "done";

  return (
    <div className="content-width">
      <header className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-coral bg-coral-soft"><MessageSquareText className="size-5" /></span>
          <div className="min-w-0"><div className="flex items-center gap-2"><h1 className="truncate text-xl font-black text-ink sm:text-2xl">{experiment.title}</h1><Badge tone={phase === "talking" ? "yellow" : phase === "done" ? "mint" : "coral"}>{phaseLabels[phase]}</Badge></div><p className="mt-1 truncate text-xs text-muted sm:text-sm">{experiment.description}</p></div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">
          <ToggleGroup className="flex-1 sm:flex-none" type="single" value={language} onValueChange={(value) => value && setLanguage(value as DisplayLanguage)} aria-label="シナリオ表示言語"><ToggleGroupItem className="flex-1 sm:flex-none" value="en">English</ToggleGroupItem><ToggleGroupItem className="flex-1 sm:flex-none" value="ja">日本語</ToggleGroupItem></ToggleGroup>
          <Button variant="coral" className="w-full sm:w-auto" onClick={newMission}><RefreshCw />新しいミッション</Button>
        </div>
      </header>

      <CapabilityPanel compact experiment={experiment} modelOptions={modelOptions} sessionReady={sessionReady} onPrepare={prepareSession} />
      {error && <Alert className="mb-3" tone="warning" title="確認してください">{error}</Alert>}

      <section aria-label="ゲームの進行" className="grid overflow-hidden rounded-lg border border-border bg-white sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
        <div aria-current={phase === "thinking" ? "step" : undefined} className={`border-b border-border p-3 sm:border-b-0 sm:border-r ${phase === "thinking" ? "bg-yellow-soft" : phase !== "waiting" ? "bg-mint-soft" : ""}`}>
          <div className="flex items-center gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full border border-yellow bg-yellow text-xs font-black text-ink">1</span><div><h2 className="text-sm font-black text-ink">Thinking Time</h2><p className="text-xs text-muted-strong">60秒で作戦を考える</p></div></div>
        </div>
        <div aria-current={phase === "talking" ? "step" : undefined} className={`border-b border-border p-3 sm:border-b-0 lg:border-r ${phase === "talking" ? "bg-coral-soft" : phase === "done" ? "bg-mint-soft" : ""}`}>
          <div className="flex items-center gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full border border-coral bg-coral text-xs font-black text-ink">2</span><div><h2 className="text-sm font-black text-ink">Talk Time</h2><p className="text-xs text-muted-strong">3分で英語で伝える</p></div></div>
        </div>
        <div className="col-span-2 flex items-center justify-between gap-5 bg-sky-soft px-4 py-3 lg:col-span-1 lg:min-w-52">
          <div><span className="block text-[10px] font-black uppercase text-muted-strong">{missionCount ? `Mission #${missionCount}` : "Mission"}</span><strong className="text-sm font-black text-ink">{phaseLabels[phase]}</strong></div>
          <div className="text-right"><span className="block text-[10px] font-black uppercase text-muted-strong">残り時間</span><strong className="flex items-center gap-1.5 text-xl font-black tabular-nums text-ink"><Clock3 className="size-4" />{formatTime(seconds)}</strong></div>
        </div>
      </section>

      <div className="mt-3 grid items-stretch gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.75fr)] xl:min-h-[520px]">
        <section aria-label="ミッション" className={`${phase === "talking" || resultPhase ? "order-2" : "order-1"} overflow-hidden rounded-lg border border-border bg-white xl:order-1`}>
          {mission ? <div className="flex h-full flex-col"><div className="grid flex-1 md:grid-cols-[42%_1fr]"><img src={mission.image} alt={localized("title")} width={800} height={600} loading="lazy" decoding="async" className="aspect-[4/3] h-full min-h-52 max-h-80 w-full border-b border-border object-cover md:max-h-none md:border-b-0 md:border-r" /><div className="flex flex-col p-4 sm:p-5"><span className="text-[11px] font-black uppercase text-coral-ink">Situation</span><h2 className="mt-1 text-xl font-black leading-tight text-ink">{localized("title")}</h2><p className="mt-3 text-sm leading-6 text-muted">{localized("situation")}</p><div className="mt-auto border-t border-border pt-4"><span className="text-[11px] font-black uppercase text-sky-ink">Goal</span><p className="mt-1 text-sm font-bold leading-6 text-ink">{localized("goal")}</p></div></div></div><div className="grid grid-cols-3 border-t border-border" aria-label="使用できるアイテム">{[0, 1, 2].map((index) => <div key={index} className="min-w-0 border-r border-border p-3 last:border-r-0 sm:p-4"><span className="text-[10px] font-black uppercase text-muted-strong">Item {index + 1}</span><strong className="mt-1 block break-words text-sm font-black text-ink">{items[index] ? language === "ja" ? `${items[index].ja} / ${items[index].en}` : items[index].en : "?"}</strong></div>)}</div></div> : <div className="grid min-h-80 h-full place-items-center bg-coral-soft/35 p-8 text-center"><div><Sparkles className="mx-auto size-8 text-coral-ink" /><h2 className="mt-4 text-xl font-black text-ink">Start a new mission</h2><p className="mt-2 text-sm text-muted">新しいミッションを押すと、状況と3つのアイテムが選ばれます。</p></div></div>}
        </section>

        <section aria-label={resultPhase ? "採点結果" : "回答"} className={`${phase === "talking" || resultPhase ? "order-1" : "order-2"} flex min-h-[420px] flex-col rounded-lg border border-border bg-white p-4 xl:order-2`}>
          <Alert tone={phase === "talking" ? "warning" : phase === "done" ? "success" : "info"} title={phaseLabels[phase]}>{notice}</Alert>
          {resultPhase ? <div className="mt-4 flex flex-1 flex-col">
            {phase === "scoring" ? <div className="grid flex-1 place-items-center text-center"><div><LoaderCircle className="mx-auto size-8 animate-spin text-mint-strong" /><p className="mt-3 text-sm font-bold text-muted">回答を採点しています</p></div></div> : score ? <><div className="flex items-end justify-between border-b border-border pb-4"><div><span className="text-[11px] font-black uppercase text-mint-ink">Communication Score</span><strong className="mt-1 block text-5xl font-black text-ink">{score.total}</strong></div><p className="max-w-44 text-right text-xs leading-5 text-muted">文法よりも、意味が伝わったかを重視した評価です。</p></div><dl className="mt-4 space-y-2.5">{scoreLabels.map(([key, label]) => <div key={key} className="grid grid-cols-[64px_1fr_30px] items-center gap-2 text-xs"><dt className="font-bold text-ink">{label}</dt><dd className="h-2 overflow-hidden rounded-full bg-black/8"><span className="block h-full rounded-full bg-mint-strong" role="progressbar" aria-label={`${label}: ${score[key]}点`} aria-valuenow={score[key]} aria-valuemin={0} aria-valuemax={100} style={{ width: `${score[key]}%` }} /></dd><dd className="text-right font-black tabular-nums text-muted">{score[key]}</dd></div>)}</dl><div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2 xl:grid-cols-1"><div><h3 className="text-xs font-black text-mint-ink">伝わったこと</h3>{score.understood.map((text) => <p key={text} className="mt-1 text-xs leading-5 text-muted">{text}</p>)}</div><div><h3 className="text-xs font-black text-coral-ink">次の改善</h3>{score.needsWork.map((text) => <p key={text} className="mt-1 text-xs leading-5 text-muted">{text}</p>)}</div></div>{score.nextLine && <div className="mt-auto rounded-md border border-sky bg-sky-soft p-3 text-xs leading-5"><strong className="text-sky-ink">次の一言:</strong> {score.nextLine}</div>}</> : <div className="grid flex-1 place-items-center text-center text-sm text-muted">回答が入力されませんでした。</div>}
          </div> : <><div className="mt-4 flex flex-wrap gap-2"><Button variant="secondary" onClick={beginTalk} disabled={!mission || phase !== "thinking"}><Play />今すぐTalkへ</Button><Button variant="secondary" onClick={toggleSpeech} disabled={phase !== "talking"}>{listening ? <MicOff /> : <Mic />}{listening ? "音声停止" : "音声入力"}</Button><Button onClick={() => void evaluate()} disabled={phase !== "talking" || !answer.trim()}><Sparkles />採点する</Button></div><div className="mt-4 flex flex-1 flex-col"><label htmlFor="player-answer" className="text-sm font-black text-ink">Your explanation</label><textarea id="player-answer" value={answer} onChange={(event) => updateAnswer(event.target.value)} disabled={phase !== "talking"} placeholder="Talk Timeになったら英語で説明してください。例: I can use the umbrella to..." className="mt-2 min-h-52 flex-1 resize-none rounded-lg border border-border bg-white p-4 text-sm leading-7 text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-sky focus:ring-3 focus:ring-sky/25 disabled:bg-canvas disabled:text-muted" /></div></>}
        </section>
      </div>
    </div>
  );
}
