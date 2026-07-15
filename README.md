# EdTech Client-Side LLM Experiments

EdTech における **Client-Side LLM の活用可能性**を検討する実験リポジトリです。Chrome Prompt API とオンデバイスの Gemini Nano を使い、学習者向けの対話、支援、フィードバックをブラウザ内で実現する方法を検証します。

## 収録実験

- **リアルタイム英日音声翻訳**: Web Speech APIで英語音声を認識し、Prompt APIで日本語へストリーミング翻訳します。
- **Gemini Nano 音声理解**: Silero VADで発話区間を検出し、音声をGemini Nanoへ直接渡して文字起こしと翻訳を行います。
- **ピンチ脱出ゲーム**: 限られたアイテムを使った英語説明を、CEFR A1/A2を想定して意味伝達重視で評価します。

各実験は独立したURLと実行環境パネルを持ち、必要なAPI、権限、Gemini Nanoの準備状況をページ内で確認できます。

## 技術構成

- Vite 8 / React 19 / TypeScript
- React Router
- Tailwind CSS 4 / Shadcn UIの限定採用 / Radix UI / Lucide React
- Chrome Prompt API (`LanguageModel`)
- Web Speech API (`SpeechRecognition`)
- Silero VAD / ONNX Runtime Web
- Vitest / React Testing Library / Playwright
- Railway / Caddy

## ローカル開発

Node.js 22.12以降が必要です。

```bash
npm install
npm run dev
```

Viteの開発サーバーが表示するURLへアクセスしてください。

```bash
npm run typecheck
npm test
npm run build
npm run preview
```

## URL

- `/`: プロジェクトの目的と実験一覧
- `/experiments/translator`: リアルタイム英日音声翻訳
- `/experiments/nano-audio`: Silero VADとGemini Nanoによる音声理解
- `/experiments/survival`: ピンチ脱出ゲーム

## 使用モデル

ChromeのPrompt APIは、ブラウザ内蔵のGemini Nanoを使用します。アプリケーションからモデル名やバージョンは指定できず、Chromeが端末性能に応じたバリアントと更新を管理します。インストール済みモデルは`chrome://on-device-internals`で確認できます。

Chrome 148以降と、[Prompt APIのハードウェア要件](https://developer.chrome.com/docs/ai/prompt-api)を満たす端末を想定しています。

Gemini Nanoの音声入力にはGPUが必要です。音声理解実験では、Silero VADのモデル、AudioWorklet、ONNX Runtime WebのWASMを同一オリジンから読み込みます。

## プライバシー上の注意

- Prompt APIによるLLM推論はブラウザ内で実行され、プロンプトや生成結果はLLMサーバーへ送信されません。
- Web Speech APIの音声認識方式はブラウザやOSに依存し、音声が外部サービスで処理される場合があります。教育現場で利用する際は対象環境の仕様を確認してください。

## Railway

本番環境ではマルチステージDockerfileでViteをビルドし、Caddyが`dist/`を配信します。Caddyは通常URLのSPAフォールバックと`/health`を提供します。RailwayのHealth Check Pathには`/health`を設定してください。

## ライセンス

MIT License
