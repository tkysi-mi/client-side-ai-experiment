# Real-time English–Japanese Speech Translation Demo

Google の **Prompt API for Gemini Nano** を利用したクライアントサイド LLM デモです。最新の Chrome (Stable 140+ 以降) が備えるオンデバイス機能を活用し、ブラウザだけでリアルタイム英日翻訳を実現します。

このリポジトリの目的は、単一の HTML ファイルと最小限のサーバー設定だけで、LLM 機能を統合した Web アプリケーションを構築できることを示すことにあります。

## 機能概要

- ブラウザ内で完結する英語→日本語の同時通訳
- Web Speech API による連続音声認識（英語音声をテキスト化）
- Chrome Prompt API (LanguageModel) を使ったストリーミング翻訳
- 翻訳済みテキストと履歴のUI表示、モデル・音声認識・AI状態のモニタリング

## 仕組み

1. **音声取得と認識**  
   `SpeechRecognition` (または `webkitSpeechRecognition`) を continuous モードで起動し、マイク入力をリアルタイムでテキスト化します。中間結果と確定結果を区別し、300ms デバウンスを用いて余分な翻訳リクエストを抑制します。

2. **オンデバイス LLM 翻訳**  
   `window.LanguageModel` を通じて Gemini Nano セッションを生成します。初期プロンプトで役割を「英→日専門翻訳者」に設定し、`promptStreaming` によってチャンク単位の翻訳結果を受信しながら UI へ即時反映します。モデル状態（available / downloadable / downloading / unavailable）を確認し、必要に応じてダウンロード進捗を表示します。

3. **履歴管理とUI**  
   翻訳結果は最大10件まで保持し、タイムスタンプ付きで過去ログとして閲覧できます。警告メッセージや状態表示用のコンポーネントを備え、API利用不可・権限エラーなどのケースに対応します。

## セットアップ

```bash
npm install
npm run dev
# または npm start
```

ローカルサーバーが `http://localhost:3000` で起動します。最新の安定版 Chrome (バージョン 140 以降) では Prompt API が標準搭載されているため、通常版の Chrome でそのまま動作します。初回利用時に Gemini Nano モデルのダウンロードが開始されるため、十分なストレージとマシンスペックを用意してください。詳細なハードウェア要件は [The Prompt API | Chrome for Developers](https://developer.chrome.com/docs/ai/prompt-api) を参照してください。

## 注意事項

- マイク権限が必要です。
- Chrome Stable 140+ を想定しています。
- すべての処理はブラウザ内で完結し、音声データは外部に送信されません。
- 公開ドメインで運用する場合は Prompt API の Origin Trial に参加し、トークンを設定する必要があります。詳細は [Join the Prompt API origin trial](https://developer.chrome.com/blog/prompt-multimodal-origin-trial) を参照してください。

## ライセンス

MIT License
