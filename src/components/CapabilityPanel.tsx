import { useEffect, useMemo, useState } from "react";
import { AudioWaveform, Cpu, Download, Mic, Radio, RefreshCw } from "lucide-react";
import type { ExperimentDefinition } from "@/experiments/types";
import { useLanguageModel } from "@/ai/language-model-context";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type SimpleStatus = "checking" | "ready" | "unavailable" | "prompt";
const labels = { checking: "確認中", ready: "利用可能", unavailable: "利用不可", prompt: "許可待ち" };

export function CapabilityPanel({ experiment, modelOptions, sessionReady, onPrepare, compact = false }: { experiment: ExperimentDefinition; modelOptions: LanguageModelCreateOptions; sessionReady: boolean; onPrepare: () => Promise<void>; compact?: boolean }) {
  const { getState, check } = useLanguageModel();
  const model = getState(experiment.id);
  const [speech] = useState<SimpleStatus>(() => window.SpeechRecognition || window.webkitSpeechRecognition ? "ready" : "unavailable");
  const [vad] = useState<SimpleStatus>(() => "WebAssembly" in window && "AudioWorkletNode" in window ? "ready" : "unavailable");
  const [microphone, setMicrophone] = useState<SimpleStatus>("checking");
  const [preparing, setPreparing] = useState(false);

  useEffect(() => { void check(experiment.id, modelOptions); }, [check, experiment.id, modelOptions]);
  useEffect(() => {
    navigator.permissions?.query({ name: "microphone" as PermissionName }).then((result) => {
      setMicrophone(result.state === "granted" ? "ready" : result.state === "prompt" ? "prompt" : "unavailable");
    }).catch(() => setMicrophone("prompt"));
  }, []);

  const requirements = useMemo(() => experiment.requirements.map((requirement) => ({
    ...requirement,
    status: requirement.kind === "language-model" ? model.status : requirement.kind === "speech-recognition" ? speech : requirement.kind === "voice-activity-detection" ? vad : microphone,
    icon: requirement.kind === "language-model" ? Cpu : requirement.kind === "speech-recognition" ? Radio : requirement.kind === "voice-activity-detection" ? AudioWaveform : Mic,
  })), [experiment.requirements, microphone, model.status, speech, vad]);

  const needsDownload = model.status === "downloadable" || model.status === "downloading";
  const modelUnavailable = model.status === "unavailable" || model.status === "error";
  const prepare = async () => { setPreparing(true); try { await onPrepare(); } catch { /* The page or model context renders the error. */ } finally { setPreparing(false); } };

  return (
    <section aria-labelledby="capability-title" className={`${compact ? "mb-3 p-3" : "mb-6 p-4 sm:p-5"} rounded-lg border border-border bg-white`}>
      <div className={compact ? "grid grid-cols-[1fr_auto] items-center gap-2 lg:grid-cols-[auto_1fr_auto]" : "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"}>
        <div className={compact ? "shrink-0" : ""}><h2 id="capability-title" className="text-sm font-black text-ink">この実験の実行環境</h2>{!compact && <p className="mt-1 text-xs leading-5 text-muted">必要なAPIとモデルを、このページの設定で確認します。</p>}</div>
        <div className={compact ? "order-3 col-span-2 flex gap-2 overflow-x-auto pb-1 lg:order-none lg:col-span-1 lg:pb-0" : "flex flex-wrap gap-2"}>
          {requirements.map(({ kind, label, required, status, icon: Icon }) => (
            <Badge key={kind} className="shrink-0" tone={status === "ready" ? "mint" : status === "unavailable" ? "danger" : status === "prompt" ? "yellow" : "sky"}>
              <Icon className="size-3.5" />{label}: {status in labels ? labels[status as keyof typeof labels] : status}{!required && "（任意）"}
            </Badge>
          ))}
        </div>
        <Button size={compact ? "sm" : "default"} onClick={() => void prepare()} disabled={preparing || modelUnavailable || sessionReady} variant={sessionReady ? "secondary" : "primary"}>
          {preparing || model.status === "downloading" ? <RefreshCw className="animate-spin" /> : needsDownload ? <Download /> : <Cpu />}
          {sessionReady ? "準備完了" : needsDownload ? "モデルを準備" : "実験を準備"}
        </Button>
      </div>
      {model.status === "downloading" && <div className="mt-4"><div className="mb-2 flex justify-between text-xs font-bold text-muted"><span>Gemini Nanoを準備中</span><span>{model.progress}%</span></div><Progress value={model.progress} /></div>}
      {modelUnavailable && <Alert className="mt-4" tone="danger" title="Prompt APIを利用できません">{model.message ?? "Chromeと端末要件を確認してください。"}</Alert>}
    </section>
  );
}
