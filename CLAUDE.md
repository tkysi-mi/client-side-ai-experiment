# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

このプロジェクトは、Chrome AI API（Prompt API）を使用したリアルタイム英日音声翻訳アプリケーションです。単一のHTMLファイルで完結するスタンドアロンWebアプリケーションとして実装されています。

## アーキテクチャ

### 技術スタック
- **フロントエンド**: HTML5 + CSS3 + Vanilla JavaScript
- **音声認識**: Web Speech API (`SpeechRecognition`)
- **AI翻訳**: Chrome AI API (`LanguageModel`)
- **実行環境**: Chrome Stable 140+ （Prompt API標準搭載）

### ファイル構成
- `index.html`: メインアプリケーションファイル（すべての機能を含む）
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

#### 3. UI管理システム
- レスポンシブデザイン対応
- ステータス表示（API状態、音声認識状態、モデル状態）
- 翻訳履歴管理（最大10件保持）

## 開発時の注意事項

### 環境要件
- Chrome Stable 140+ を使用
- 初回利用時に Gemini Nano モデルのダウンロードが始まるため、[Prompt API ドキュメント](https://developer.chrome.com/docs/ai/prompt-api) に記載されたハードウェア要件を満たすこと
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
- すべての処理はクライアントサイドで完結
- 外部APIへの音声データ送信なし
- ローカルAIモデルによる翻訳処理

## 今後の拡張可能性
- 他言語対応（言語選択UI追加）
- 翻訳結果の音声出力
- オフライン対応の強化
- より高精度な翻訳モデルの利用