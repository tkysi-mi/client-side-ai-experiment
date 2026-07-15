# CLAUDE.md

## プロジェクト概要

EdTechにおけるClient-Side LLMの活用可能性を検証するReactアプリケーションです。Chrome Prompt APIを使い、翻訳支援と英語説明アクティビティをオンデバイスで実行します。

## 技術スタック

- Vite 8、React 19、TypeScript、React Router
- Tailwind CSS 4、Shadcn/Radix UI、Lucide React
- Chrome Prompt API (`LanguageModel`)
- Web Speech API (`SpeechRecognition`)
- Silero VAD、ONNX Runtime Web
- Vitest、React Testing Library、Playwright
- Caddyによる静的配信

## 構造

- `src/app/`: ルーティングと共通レイアウト
- `src/ai/`: Prompt APIの能力・ダウンロード管理
- `src/components/`: 共通部品とShadcnベースのUI
- `src/experiments/`: 実験レジストリ、翻訳、ゲーム
- `scripts/copy-vad-assets.mjs`: Silero VADとONNX Runtimeの実行アセットを`public/vad/`へ配置
- `src/pages/`: ホームと404
- `public/assets/scenarios/`: ゲーム用シナリオ画像
- `Dockerfile` / `Caddyfile`: Railway配信

## コマンド

```bash
npm run dev
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
```

## 実装上の原則

- 実験を追加するときは`src/experiments/registry.ts`へ登録し、独立したルートと必要能力を定義する。
- Gemini Nano本体の状態はContextで共有し、`LanguageModel`セッションは実験ごとに生成・破棄する。
- ページ離脱時に音声認識、タイマー、AbortController、モデルセッションを必ず解放する。
- モデル準備はユーザー操作から開始し、各ページに進捗と失敗理由を表示する。
- Gemini Nano音声入力はSilero VADで発話単位に分割し、同時プロンプトを避けるため直列キューで処理する。
- エラーをToastだけにせず、操作箇所に近いAlertで表示する。
- カラーだけで状態を伝えず、文言とアイコンを併用する。

## セキュリティ

- Prompt APIのLLM推論はクライアントサイドで完結する。
- Web Speech APIは環境によって外部処理されるため、完全ローカルとは表現しない。
- 学習者データを扱う場合は、対象ブラウザとOSの音声認識仕様を確認する。
