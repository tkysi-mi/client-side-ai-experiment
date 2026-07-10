# EdTech Client-Side LLM Experiments

EdTech における **Client-Side LLM の活用可能性**を検討するための実験リポジトリです。Google Chrome の Prompt API とオンデバイスの Gemini Nano を使用し、学習者向けの対話、支援、フィードバックをブラウザ内で実現する方法を検証します。

サーバー側の LLM に依存しない構成を通じて、教育データのプライバシー、応答速度、オフライン利用、運用コスト、端末ごとのモデル性能といった、EdTech で重要になる論点を実装ベースで探ることを目的としています。

## 実験テーマ

- 学習者の入力を外部の LLM サーバーへ送信しない、プライバシーに配慮した学習体験
- ストリーミング生成と音声認識を組み合わせた、待ち時間の短い支援とフィードバック
- オンデバイスモデルの能力、制約、端末差を踏まえた教材・アクティビティ設計
- ネットワーク接続や従量課金への依存を抑えた EdTech 機能の実現可能性
- 小型 LLM に適したプロンプト、評価基準、エラーハンドリングの検証

## 収録デモ

### リアルタイム英日音声翻訳

Web Speech API で英語音声を連続認識し、Prompt API で日本語へストリーミング翻訳します。学習者が発話内容をすぐ確認できる支援機能として、オンデバイス LLM の速度と翻訳品質を検証します。

### ピンチ脱出ゲーム

学習者が限られたアイテムを使って状況を切り抜ける方法を英語で説明するアクティビティです。Prompt API は CEFR A1/A2 レベルを想定し、文法の正確さだけでなく「意図や意味が伝わったか」を重視して回答を評価します。

## 技術構成

- Chrome Prompt API (`LanguageModel`) によるオンデバイス推論
- Web Speech API (`SpeechRecognition`) による英語音声のテキスト化
- `promptStreaming` を使った逐次的な結果表示
- モデル状態とダウンロード進捗の監視
- HTML、CSS、Vanilla JavaScript、Express による最小構成

## セットアップ

```bash
npm install
npm run dev
# または npm start
```

ローカルサーバーが `http://localhost:3000` で起動します。Chrome 148 以降では Web 向け Prompt API が利用できます。初回利用時に Gemini Nano モデルのダウンロードが開始されるため、十分なストレージとマシンスペックを用意してください。詳細な対応状況とハードウェア要件は [The Prompt API | Chrome for Developers](https://developer.chrome.com/docs/ai/prompt-api) を参照してください。

## 使用モデル

Chrome の Prompt API は、ブラウザ内蔵の基盤モデルとして Gemini Nano を使用します。このアプリケーションからモデル名やバージョンを指定することはできません。Chrome が端末性能に応じて適切なバリアント（例: 2B または 4B パラメータ）を選択し、モデルのダウンロードと更新も管理します。

モデルの正確なバージョンは JavaScript から取得できません。インストール済みモデルは `chrome://on-device-internals` で確認できます。詳細は [Chrome の組み込みモデル管理](https://developer.chrome.com/docs/ai/understand-built-in-model-management) を参照してください。

## 注意事項

- マイク権限が必要です。
- Chrome 148+ を想定しています。
- Prompt API による LLM 推論はブラウザ内で実行され、プロンプトや生成結果は LLM サーバーへ送信されません。
- Web Speech API の音声認識方式はブラウザや OS の実装に依存し、音声が外部サービスで処理される場合があります。教育現場で利用する際は、対象環境の仕様とデータ取り扱いを別途確認してください。
- `temperature` と `topK` のサンプリングパラメータを Web サイトから指定するには、Chrome 148 以降でも対象の Origin Trial が必要です。Origin Trial を使用しない場合は、これらの指定を削除してブラウザの既定値を使用してください。詳細は [The Prompt API | Chrome for Developers](https://developer.chrome.com/docs/ai/prompt-api#model_parameters) を参照してください。

## ライセンス

MIT License
