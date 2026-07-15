import { useCallback, useEffect, useRef, useState } from "react";
import { CircleStop, Languages, LoaderCircle, Mic, Trash2 } from "lucide-react";
import { experiments } from "@/experiments/registry";
import { useLanguageModel } from "@/ai/language-model-context";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CapabilityPanel } from "@/components/CapabilityPanel";
import { PageHeader } from "@/components/PageHeader";

interface HistoryItem { english: string; japanese: string; timestamp: string }
const experiment = experiments.find((item) => item.id === "translator")!;
const modelOptions: LanguageModelCreateOptions = {
  expectedInputs: [{ type: "text", languages: ["en"] }],
  expectedOutputs: [{ type: "text", languages: ["ja"] }],
  initialPrompts: [{ role: "system", content: "You are a professional English to Japanese translator. Translate the given English text to natural Japanese. Only output the Japanese translation without explanation." }],
};

export default function TranslatorPage() {
  const { prepare } = useLanguageModel();
  const sessionRef = useRef<LanguageModel | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const activeRef = useRef(false);
  const finalTextRef = useRef("");
  const translationRef = useRef("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silenceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const promptControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const [sessionReady, setSessionReady] = useState(false);
  const [listening, setListening] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [translation, setTranslation] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const prepareSession = useCallback(async () => {
    sessionRef.current?.destroy();
    sessionRef.current = await prepare("translator", modelOptions);
    setSessionReady(true);
    setError(null);
  }, [prepare]);

  const saveToHistory = useCallback(() => {
    const english = finalTextRef.current.trim();
    const japanese = translationRef.current.trim();
    if (!english || !japanese) return;
    setHistory((items) => [{ english, japanese, timestamp: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }) }, ...items].slice(0, 10));
    finalTextRef.current = "";
    translationRef.current = "";
    setFinalText(""); setInterimText(""); setTranslation("");
  }, []);

  const translate = useCallback(async (text: string) => {
    const session = sessionRef.current;
    if (!session || !text.trim()) return;
    const requestId = ++requestIdRef.current;
    promptControllerRef.current?.abort();
    const controller = new AbortController();
    promptControllerRef.current = controller;
    setTranslating(true); setError(null); setTranslation("");
    try {
      let result = "";
      const reader = session.promptStreaming(`Translate to Japanese: "${text.trim()}"`, { signal: controller.signal }).getReader();
      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        if (requestId !== requestIdRef.current) return;
        result += chunk;
        translationRef.current = result;
        setTranslation(result);
      }
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "翻訳に失敗しました。");
    } finally {
      if (requestId === requestIdRef.current) setTranslating(false);
    }
  }, []);

  const queueTranslation = useCallback((text: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void translate(text), 300);
  }, [translate]);

  const stopRecognition = useCallback(() => {
    activeRef.current = false;
    setListening(false);
    if (restartRef.current) clearTimeout(restartRef.current);
    try { recognitionRef.current?.stop(); } catch { /* already stopped */ }
  }, []);

  const createRecognition = useCallback(() => {
    const Constructor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Constructor) throw new Error("Web Speech APIを利用できません。");
    const recognition = new Constructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;
    recognition.onstart = () => { setListening(true); setError(null); };
    recognition.onresult = (event) => {
      let interim = ""; let finalized = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const text = event.results[index][0].transcript;
        if (event.results[index].isFinal) finalized += text; else interim += text;
      }
      if (finalized) {
        finalTextRef.current = `${finalTextRef.current}${finalTextRef.current ? " " : ""}${finalized.trim()}`;
        setFinalText(finalTextRef.current); setInterimText("");
        void translate(finalTextRef.current);
        if (silenceRef.current) clearTimeout(silenceRef.current);
        silenceRef.current = setTimeout(saveToHistory, 4000);
      } else if (interim) {
        if (silenceRef.current) clearTimeout(silenceRef.current);
        setInterimText(interim);
        queueTranslation(`${finalTextRef.current} ${interim}`);
      }
    };
    recognition.onerror = (event) => {
      if (event.error !== "aborted") setError(event.error === "not-allowed" ? "マイクへのアクセスが拒否されました。" : `音声認識エラー: ${event.error}`);
      if (event.error === "not-allowed") activeRef.current = false;
    };
    recognition.onend = () => {
      setListening(false);
      if (activeRef.current) restartRef.current = setTimeout(() => { try { recognition.start(); } catch { activeRef.current = false; setError("音声認識を再開できませんでした。"); } }, 500);
    };
    recognitionRef.current = recognition;
    return recognition;
  }, [queueTranslation, saveToHistory, translate]);

  const startRecognition = () => {
    if (!sessionRef.current) return;
    try { activeRef.current = true; (recognitionRef.current ?? createRecognition()).start(); } catch (cause) { activeRef.current = false; setError(cause instanceof Error ? cause.message : "音声認識を開始できませんでした。"); }
  };

  const clearHistory = () => { setHistory([]); finalTextRef.current = ""; translationRef.current = ""; setFinalText(""); setInterimText(""); setTranslation(""); };

  useEffect(() => () => {
    activeRef.current = false;
    recognitionRef.current?.abort();
    sessionRef.current?.destroy();
    promptControllerRef.current?.abort();
    [debounceRef, silenceRef, restartRef].forEach((ref) => { if (ref.current) clearTimeout(ref.current); });
  }, []);

  return (
    <div className="content-width">
      <PageHeader title={experiment.title} description={experiment.description} icon={Languages} accent="sky" actions={<Badge tone={listening ? "mint" : "neutral"}>{listening ? "音声認識中" : "待機中"}</Badge>} />
      <CapabilityPanel experiment={experiment} modelOptions={modelOptions} sessionReady={sessionReady} onPrepare={prepareSession} />
      {error && <Alert className="mb-5" tone="danger" title="処理を続行できません">{error}</Alert>}

      <div className="mb-5 flex flex-wrap gap-2">
        <Button onClick={startRecognition} disabled={!sessionReady || listening}><Mic />音声認識を開始</Button>
        <Button variant="danger" onClick={() => { stopRecognition(); saveToHistory(); }} disabled={!listening}><CircleStop />停止</Button>
        <Button variant="secondary" onClick={clearHistory}><Trash2 />履歴をクリア</Button>
      </div>

      <section aria-label="翻訳結果" className="grid overflow-hidden rounded-lg border border-border bg-white lg:grid-cols-2">
        <article className="min-h-56 border-b border-border p-5 lg:border-b-0 lg:border-r"><div className="flex items-center justify-between"><h2 className="text-xs font-black uppercase tracking-[0.1em] text-muted">English / 音声認識</h2>{listening && <span className="size-2 animate-pulse rounded-full bg-mint-strong" />}</div><p className="mt-5 whitespace-pre-wrap text-base leading-8 text-ink">{finalText}{interimText && <span className="text-muted"> {interimText}</span>}{!finalText && !interimText && <span className="text-muted">認識した英語がここに表示されます。</span>}</p></article>
        <article className="min-h-56 bg-sky-soft/40 p-5"><div className="flex items-center justify-between"><h2 className="text-xs font-black uppercase tracking-[0.1em] text-muted">日本語 / AI翻訳</h2>{translating && <LoaderCircle className="size-4 animate-spin text-sky" />}</div><p className="mt-5 whitespace-pre-wrap text-base leading-8 text-ink">{translation || <span className="text-muted">Gemini Nanoの翻訳がここに表示されます。</span>}</p></article>
      </section>

      <section aria-labelledby="history-title" className="mt-8"><div className="mb-4 flex items-center justify-between"><h2 id="history-title" className="text-lg font-black text-ink">翻訳履歴</h2><span className="text-xs font-bold text-muted">最大10件</span></div>{history.length === 0 ? <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">履歴はまだありません。</div> : <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-white">{history.map((item, index) => <article key={`${item.timestamp}-${index}`} className="grid gap-4 p-4 md:grid-cols-[1fr_1fr_auto]"><div><span className="text-[11px] font-black uppercase text-sky-ink">English</span><p className="mt-1 text-sm leading-6 text-ink">{item.english}</p></div><div><span className="text-[11px] font-black text-mint-ink">日本語</span><p className="mt-1 text-sm leading-6 text-ink">{item.japanese}</p></div><time className="text-xs font-semibold text-muted">{item.timestamp}</time></article>)}</div>}</section>
    </div>
  );
}
