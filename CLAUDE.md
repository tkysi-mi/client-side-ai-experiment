# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

このプロジェクトは、EdTech における Client-Side LLM の活用可能性を検証する実験用 Web アプリケーションです。Chrome AI API（Prompt API）を使用し、学習者向けの翻訳支援と英語説明アクティビティをオンデバイスで実行します。

## アーキテクチャ

### 技術スタック
- **フロントエンド**: HTML5 + CSS3 + Vanilla JavaScript
- **音声認識**: Web Speech API (`SpeechRecognition`)
- **AI機能**: Chrome AI API (`LanguageModel`)
- **実行環境**: Chrome 148+（Web 向け Prompt API 搭載）

### ファイル構成
- `public/index.html`: メインアプリケーション画面
- `public/js/app.js`: 翻訳、学習ゲーム、モデル管理
- `public/css/style.css`: アプリケーションのスタイル
- `public/assets/scenarios/`: 学習ゲームのシナリオ画像
- `index.js`: Express サーバー
- `.claude/settings.local.json`: Claude Code設定ファイル

### 主要コンポーネント

#### 1. 音声認識システム
- Web Speech APIを使用した連続音声認識
- 英語音声の実時間テキスト変換
- 中間結果と確定結果の分離処理

#### 2. AI翻訳エンジン
- Chrome AI API Language Modelを使用
- ストリーミング翻訳による高速レスポンス
- デバウンシング機能による効率的な翻訳処理

#### 3. 英語説明アクティビティ
- 制限時間内に状況の解決方法を英語で説明する学習ゲーム
- CEFR A1/A2 学習者を想定した意味伝達重視の LLM 評価
- 音声入力とテキスト入力の両方に対応

#### 4. UI管理システム
- レスポンシブデザイン対応
- ステータス表示（API状態、音声認識状態、モデル状態）
- 翻訳履歴管理（最大10件保持）

## 開発時の注意事項

### 環境要件
- Chrome 148+ を使用
- 初回利用時に Gemini Nano モデルのダウンロードが始まるため、[Prompt API ドキュメント](https://developer.chrome.com/docs/ai/prompt-api) に記載されたハードウェア要件を満たすこと
- モデル名、バージョン、端末に応じたバリアントはアプリケーションから指定できず、Chrome が自動的に選択・更新する
- インストール済みモデルのバージョンは `chrome://on-device-internals` で確認する
- マイクアクセス許可必要

### デバッグとテスト
このプロジェクトにはビルドプロセスやテストフレームワークはありません。デバッグは以下の方法で行います：

```bash
# ローカルサーバーで実行（推奨）
python -m http.server 8000
# または
npx serve .

# ブラウザで http://localhost:8000/index.html にアクセス
```

### 主要な機能ポイント

#### 1. AIモデル初期化
- モデルの利用可能性チェック（available/downloadable/downloading/unavailable）
- ダウンロード進捗の表示
- エラーハンドリングと再試行機能

#### 2. 音声認識の最適化
- 連続認識による切れ目のない音声取得
- 中間結果のデバウンシング（300ms）
- 最終結果の即座翻訳

#### 3. 翻訳品質の向上
- システムプロンプトによる翻訳品質制御
- ストリーミング出力による体感速度向上
- 重複翻訳の防止

## 開発ワークフロー

### コード修正時の手順
1. HTMLファイルを直接編集
2. ブラウザでリロードしてテスト
3. DevToolsでコンソールエラーを確認
4. 各種APIの状態を確認

### よくある問題とデバッグ
- **AI APIエラー**: Chrome Flagsの設定確認
- **音声認識エラー**: マイク許可とブラウザ対応確認
- **翻訳の遅延**: ネットワーク状況とモデル状態確認

## セキュリティ考慮事項
- Prompt API による LLM 推論はクライアントサイドで完結
- プロンプトと生成結果は LLM サーバーへ送信されない
- Web Speech API の音声処理方式はブラウザや OS に依存するため、完全なローカル処理を前提にしない
- 学習者データを扱う場合は、利用環境の音声認識仕様とデータ取り扱いを確認する

## 今後の拡張可能性
- 他言語対応（言語選択UI追加）
- 翻訳結果の音声出力
- オフライン対応の強化
- より高精度な翻訳モデルの利用
