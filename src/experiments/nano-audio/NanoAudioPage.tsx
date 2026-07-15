import { useCallback, useEffect, useRef, useState } from "react";
import { AudioLines, CircleStop, Clock3, LoaderCircle, Mic, Sparkles, Trash2, Waves } from "lucide-react";
import type { MicVAD } from "@ricky0123/vad-web";
import ortRuntimeUrl from "@/generated/vad/ort-wasm-simd-threaded.mjs?url";
import ortWasmUrl from "@/generated/vad/ort-wasm-simd-threaded.wasm?url";
import { useLanguageModel } from "@/ai/language-model-context";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CapabilityPanel } from "@/components/CapabilityPanel";
import { PageHeader } from "@/components/PageHeader";
import { experiments } from "@/experiments/registry";
import { createAudioBuffer, getAudioDuration, parseNanoAudioResult } from "./audio";

interface UtteranceResult {
  id: number;
  transcript: string;
  translation: string;
  audioSeconds: number;
  processingMs: number;
  timestamp: string;
}

const experiment = experiments.find((item) => item.id === "nano-audio")!;
const modelOptions: LanguageModelCreateOptions = {
  expectedInputs: [
    { type: "text", languages: ["en"] },
    { type: "audio" },
  ],
  expectedOutputs: [{ type: "text", languages: ["en", "ja"] }],
  initialPrompts: [{
    role: "system",
    content: "You are a precise speech transcription and translation engine. Preserve the learner's exact English wording, including grammatical mistakes and repetitions. Do not silently correct the transcript. Return only valid JSON.",
  }],
};
const responseSchema = {
  type: "object",
  properties: {
    transcript: { type: "string" },
    translation: { type: "string" },
  },
  required: ["transcript", "translation"],
};

export default function NanoAudioPage() {
  const { prepare } = useLanguageModel();
  const sessionRef = useRef<LanguageModel | null>(null);
  const vadRef = useRef<MicVAD | null>(null);
  const listeningRef = useRef(false);
  const processingRef = useRef(false);
  const queueRef = useRef<Float32Array[]>([]);
  const processQueueRef = useRef<() => Promise<void>>(async () => undefined);
  const promptControllerRef = useRef<AbortController | null>(null);
  const utteranceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const probabilityUpdateRef = useRef(0);
  const resultIdRef = useRef(0);
  const [sessionReady, setSessionReady] = useState(false);
  const [vadReady, setVadReady] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [speechProbability, setSpeechProbability] = useState(0);
  const [queued, setQueued] = useState(0);
  const [results, setResults] = useState<UtteranceResult[]>([]);
  const [notice, setNotice] = useState("実験を準備して、マイク入力を開始してください。");
  const [error, setError] = useState<string | null>(null);

  const clearUtteranceTimer = useCallback(() => {
    if (utteranceTimerRef.current) clearTimeout(utteranceTimerRef.current);
    utteranceTimerRef.current = null;
  }, []);

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setProcessing(true);

    try {
      while (queueRef.current.length > 0) {
        const samples = queueRef.current.shift()!;
        setQueued(queueRef.current.length);
        const session = sessionRef.current;
        if (!session) throw new Error("Gemini Nanoセッションが準備されていません。");

        setNotice("Gemini Nanoが音声を文字起こしし、日本語へ翻訳しています。");
        const startedAt = performance.now();
        const controller = new AbortController();
        promptControllerRef.current = controller;
        const response = await session.prompt([
          {
            role: "user",
            content: [
              {
                type: "text",
                value: "Transcribe this English speech verbatim without correcting the learner, then translate its meaning into natural Japanese. Return JSON with transcript and translation.",
              },
              { type: "audio", value: createAudioBuffer(samples) },
            ],
          },
        ], { responseConstraint: responseSchema, signal: controller.signal });
        const parsed = parseNanoAudioResult(response);
        const item: UtteranceResult = {
          id: ++resultIdRef.current,
          ...parsed,
          audioSeconds: getAudioDuration(samples),
          processingMs: Math.round(performance.now() - startedAt),
          timestamp: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        };
        setResults((current) => [item, ...current].slice(0, 10));
        setNotice(listeningRef.current ? "次の発話を待っています。" : "音声処理が完了しました。");
      }
    } catch (cause) {
      queueRef.current = [];
      setQueued(0);
      if (!promptControllerRef.current?.signal.aborted) {
        setError(cause instanceof Error ? cause.message : "Gemini Nanoで音声を処理できませんでした。");
      }
    } finally {
      processingRef.current = false;
      setProcessing(false);
      promptControllerRef.current = null;
    }
  }, []);

  useEffect(() => {
    processQueueRef.current = processQueue;
  }, [processQueue]);

  const prepareExperiment = useCallback(async () => {
    setError(null);
    try {
      sessionRef.current?.destroy();
      sessionRef.current = await prepare("nano-audio", modelOptions);
      setSessionReady(true);

      if (!vadRef.current) {
        const { MicVAD } = await import("@ricky0123/vad-web");
        vadRef.current = await MicVAD.new({
        model: "v5",
        startOnLoad: false,
        processorType: "AudioWorklet",
        baseAssetPath: "/vad/",
        onnxWASMBasePath: "/vad/",
        ortConfig(ort) {
          ort.env.wasm.numThreads = 1;
          ort.env.wasm.wasmPaths = {
            mjs: new URL(ortRuntimeUrl, window.location.href).href,
            wasm: new URL(ortWasmUrl, window.location.href).href,
          };
        },
        positiveSpeechThreshold: 0.6,
        negativeSpeechThreshold: 0.45,
        redemptionMs: 700,
        preSpeechPadMs: 250,
        minSpeechMs: 300,
        submitUserSpeechOnPause: true,
        onFrameProcessed(probabilities) {
          const now = performance.now();
          if (now - probabilityUpdateRef.current >= 100) {
            probabilityUpdateRef.current = now;
            setSpeechProbability(Math.round(probabilities.isSpeech * 100));
          }
        },
        onSpeechStart() {
          setSpeaking(true);
          setNotice("発話を検出しています。話し終わると自動で処理します。");
          clearUtteranceTimer();
          utteranceTimerRef.current = setTimeout(() => {
            const vad = vadRef.current;
            if (!vad || !listeningRef.current) return;
            void vad.pause()
              .then(() => listeningRef.current ? vad.start() : undefined)
              .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "長い発話を分割できませんでした。"));
          }, 15000);
        },
        onSpeechEnd(audio) {
          clearUtteranceTimer();
          setSpeaking(false);
          setSpeechProbability(0);
          queueRef.current.push(audio.slice());
          setQueued(queueRef.current.length);
          setNotice("発話区間を確定しました。Gemini Nanoの処理を開始します。");
          void processQueueRef.current();
        },
        onVADMisfire() {
          setSpeaking(false);
          setNotice("短い音を除外しました。次の発話を待っています。");
        },
        });
      }

      setVadReady(true);
      setNotice("準備が完了しました。マイク入力を開始できます。");
    } catch (cause) {
      sessionRef.current?.destroy();
      sessionRef.current = null;
      setSessionReady(false);
      setVadReady(false);
      setError(cause instanceof Error ? cause.message : "音声理解実験を準備できませんでした。");
    }
  }, [clearUtteranceTimer, prepare]);

  const startListening = async () => {
    const vad = vadRef.current;
    if (!vad) return;
    setError(null);
    try {
      listeningRef.current = true;
      await vad.start();
      setListening(true);
      setNotice("発話を待っています。自然に英語で話してください。");
    } catch (cause) {
      listeningRef.current = false;
      setError(cause instanceof Error ? cause.message : "マイク入力を開始できませんでした。");
    }
  };

  const stopListening = async () => {
    listeningRef.current = false;
    clearUtteranceTimer();
    setListening(false);
    setSpeaking(false);
    try {
      await vadRef.current?.pause();
      setNotice(processingRef.current ? "残りの音声を処理しています。" : "マイク入力を停止しました。");
    } catch {
      setError("マイク入力を停止できませんでした。");
    }
  };

  useEffect(() => () => {
    listeningRef.current = false;
    clearUtteranceTimer();
    promptControllerRef.current?.abort();
    queueRef.current = [];
    sessionRef.current?.destroy();
    void vadRef.current?.destroy();
  }, [clearUtteranceTimer]);

  const status = speaking ? "発話検出中" : processing ? "Nano処理中" : listening ? "待機中" : sessionReady && vadReady ? "準備完了" : "未準備";

  return (
    <div className="content-width">
      <PageHeader
        title={experiment.title}
        description={experiment.description}
        icon={AudioLines}
        accent="yellow"
        actions={<Badge tone={speaking ? "coral" : processing ? "sky" : listening ? "mint" : "yellow"}>{status}</Badge>}
      />
      <CapabilityPanel experiment={experiment} modelOptions={modelOptions} sessionReady={sessionReady && vadReady} onPrepare={prepareExperiment} />
      {error && <Alert className="mb-5" tone="danger" title="音声処理を続行できません">{error}</Alert>}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
        <div className="rounded-lg border border-border bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-muted">Silero VAD</p>
              <h2 className="mt-2 text-xl font-black text-ink">発話区間をローカルで検出</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">音声は16kHzの発話チャンクとしてGemini Nanoへ直接渡されます。Web Speech APIは使用しません。</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button onClick={() => void startListening()} disabled={!sessionReady || !vadReady || listening}><Mic />入力開始</Button>
              <Button variant="danger" onClick={() => void stopListening()} disabled={!listening}><CircleStop />停止</Button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-yellow bg-yellow-soft p-4"><span className="text-[11px] font-black uppercase tracking-[0.1em] text-muted-strong">Voice probability</span><strong className="mt-2 block text-2xl font-black tabular-nums text-ink">{speechProbability}%</strong><Progress className="mt-3" value={speechProbability} aria-label="音声確率" /></div>
            <div className="rounded-lg border border-coral bg-coral-soft p-4"><span className="text-[11px] font-black uppercase tracking-[0.1em] text-muted-strong">Detector</span><strong className="mt-2 flex items-center gap-2 text-lg font-black text-ink"><Waves className="size-5" />{speaking ? "Speaking" : listening ? "Listening" : "Stopped"}</strong></div>
            <div className="rounded-lg border border-sky bg-sky-soft p-4"><span className="text-[11px] font-black uppercase tracking-[0.1em] text-muted-strong">Processing queue</span><strong className="mt-2 flex items-center gap-2 text-lg font-black text-ink">{processing && <LoaderCircle className="size-5 animate-spin" />}{queued} utterances</strong></div>
          </div>
        </div>

        <Alert tone={speaking ? "warning" : processing ? "info" : "success"} title={status}>{notice}</Alert>
      </section>

      <section aria-labelledby="nano-results-title" className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div><p className="text-xs font-black uppercase tracking-[0.12em] text-muted">Utterance results</p><h2 id="nano-results-title" className="mt-1 text-xl font-black text-ink">文字起こしと翻訳</h2></div>
          <Button variant="secondary" size="sm" onClick={() => setResults([])} disabled={results.length === 0}><Trash2 />結果をクリア</Button>
        </div>

        {results.length === 0 ? (
          <div className="grid min-h-48 place-items-center rounded-lg border border-dashed border-border bg-white p-8 text-center"><div><Sparkles className="mx-auto size-7 text-yellow" /><p className="mt-3 text-sm leading-6 text-muted">発話が完了すると、Gemini Nanoによる文字起こしと翻訳が表示されます。</p></div></div>
        ) : (
          <div className="space-y-3">
            {results.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-lg border border-border bg-white">
                <div className="grid md:grid-cols-2">
                  <div className="border-b border-border p-5 md:border-b-0 md:border-r"><span className="text-[11px] font-black uppercase tracking-[0.1em] text-sky-ink">English / Gemini Nano STT</span><p className="mt-3 text-base leading-7 text-ink">{item.transcript || "（文字起こしなし）"}</p></div>
                  <div className="bg-yellow-soft/40 p-5"><span className="text-[11px] font-black uppercase tracking-[0.1em] text-yellow-ink">日本語 / Gemini Nano翻訳</span><p className="mt-3 text-base leading-7 text-ink">{item.translation || "（翻訳なし）"}</p></div>
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border bg-canvas px-5 py-3 text-xs font-semibold text-muted"><span className="flex items-center gap-1.5"><Clock3 className="size-3.5" />音声 {item.audioSeconds.toFixed(1)}秒</span><span>処理 {item.processingMs}ms</span><time>{item.timestamp}</time></div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
