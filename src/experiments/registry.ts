import { lazy } from "react";
import { AudioLines, Languages, MessagesSquare } from "lucide-react";
import type { ExperimentDefinition } from "./types";

export const experiments: ExperimentDefinition[] = [
  {
    id: "translator",
    path: "/experiments/translator",
    title: "リアルタイム英日音声翻訳",
    shortTitle: "音声翻訳",
    description: "英語の発話を認識し、オンデバイスLLMで日本語へストリーミング翻訳します。",
    accent: "sky",
    icon: Languages,
    requirements: [
      { kind: "language-model", label: "Prompt API / Gemini Nano", required: true },
      { kind: "speech-recognition", label: "Web Speech API", required: true },
      { kind: "microphone", label: "マイク権限", required: true },
    ],
    component: lazy(() => import("./translator/TranslatorPage")),
  },
  {
    id: "nano-audio",
    path: "/experiments/nano-audio",
    title: "Gemini Nano 音声理解",
    shortTitle: "Nano音声理解",
    description: "Silero VADで発話を区切り、Gemini Nanoへ音声を直接渡して文字起こしと翻訳を行います。",
    accent: "yellow",
    icon: AudioLines,
    requirements: [
      { kind: "language-model", label: "Prompt API 音声入力", required: true },
      { kind: "voice-activity-detection", label: "Silero VAD", required: true },
      { kind: "microphone", label: "マイク権限", required: true },
    ],
    component: lazy(() => import("./nano-audio/NanoAudioPage")),
  },
  {
    id: "survival",
    path: "/experiments/survival",
    title: "ピンチ脱出ゲーム",
    shortTitle: "ピンチ脱出ゲーム",
    description: "限られたアイテムを使って英語で説明し、意味が伝わったかをローカルAIが評価します。",
    accent: "coral",
    icon: MessagesSquare,
    requirements: [
      { kind: "language-model", label: "Prompt API / Gemini Nano", required: true },
      { kind: "speech-recognition", label: "Web Speech API", required: false },
      { kind: "microphone", label: "マイク権限", required: false },
    ],
    component: lazy(() => import("./survival/SurvivalPage")),
  },
];
