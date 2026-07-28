<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8.1-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/License-AGPL--3.0-blue?style=for-the-badge" alt="License" />
</p>

<p align="center">
  <a href="README.md">English</a> •
  <a href="README_VI.md">Tiếng Việt</a> •
  <a href="README_ZH.md">中文</a> •
  <a href="README_FR.md">Français</a> •
  <a href="README_RU.md">Русский</a> •
  <a href="README_JA.md"><b>日本語</b></a> •
  <a href="README_KO.md">韓国語</a>
</p>

# ⚡ FlowForge

**ビジュアル AI ワークフロービルダー — ドラッグ＆ドロップでマルチモーダル AI パイプラインをノーコード構築。**

FlowForge は、DAG ノードグラフを使用して複雑な AI パイプラインを視覚的に構築、結合、実行できる 100% クライアントサイド動作の Web アプリケーションです。OpenRouter を通じて **400 以上の AI モデル**（GPT-4o、Claude 3.5、Gemini 2.0、Llama 3.1、FLUX、MiniMax など）に接続 — すべての処理はブラウザ上で直接完了し、プライバシーは 100% 保持され、バックエンドサーバーの運用コストは一切かかりません。

---

## 🖼️ 概要

```
┌─────────────────────────────────────────────────────────────┐
│  TopBar (ワークフロー名 · 自動保存 · 実行 · インポート/エクスポート)│
├────┬────────────────────────────────────────────────┬───────┤
│    │                                                │ プロ  │
│ T  │          ✦ キャンバスワークスペース ✦          │ パティ│
│ o  │                                                │ パネル│
│ o  │   [テキスト入力] ──→ [AI テキスト生成] ──→ [ダウンロード]│
│ l  │                           │                    │       │
│ b  │   [ファイル入力] ─────────┘                    │       │
│ a  │                                                │       │
│ r  │   [画像入力] ──→ [AI 画像生成]                 │       │
│    │                                                │       │
├────┴─────────────────────────┬──────────────────────┴───────┤
│  ズームコントロール          │  中央に戻すボタン            │
└──────────────────────────────┴──────────────────────────────┘
```

---

## ✨ 主な機能

### 🧩 ノードベースのビジュアルエディタ
- **ドラッグ＆ドロップ**: 無限キャンバス上にノードを自由に配置・整理。
- **ワイヤー接続 (Edges)**: ノードポート間を接続し、動的なデータフローを構築。
- **スムーズなズーム＆パン**: マウスホイール、トラックパッド、またはタッチジェスチャに対応。
- **無制限の Redo/Undo**: `Ctrl+Z` / `Ctrl+Shift+Z` で直感的に操作。

### 🤖 OpenRouter 経由で 400+ の AI モデルに対応
- **テキスト生成 (LLM)**: GPT-4o, Claude 3.5 Sonnet, Gemini 2.0 Flash, Llama 3.1, DeepSeek, Qwen など。
- **画像生成 (Image Gen)**: DALL·E 3, Stable Diffusion XL, FLUX.1, Midjourney など。
- **動画生成 (Video Gen)**: Luma Dream Machine, Runway Gen-3, MiniMax など。
- **マルチ API キー管理**: 複数の API キーを登録し、エイリアスを設定してワンクリック切り替え可能。

### 📄 スマートなファイルテキスト抽出
- **対応フォーマット**: `.pdf`, `.docx`, `.doc`, `.txt`, `.md`, `.csv`, `.json`, `.xml`, `.html`。
- **PDF 抽出**: `pdfjs-dist` によるテキスト抽出＋Claude 等のビジョンモデル向け Base64 パススルー。
- **自動 Markdown 変換**: API 送信前にファイル内容を Markdown へ自動整形し、LLM の文脈理解精度を向上。

---

## 🚀 クイックスタート

```bash
# リポジトリをクローン
git clone https://github.com/<your-username>/flowforge.git
cd flowforge

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev

# プロダクションビルド
npm run build
```

---

## 📄 ライセンス

本プロジェクトは [GNU Affero General Public License v3.0 (AGPL-3.0)](LICENSE) のもとで公開されています。

---

<p align="center">
  <strong>FlowForge</strong> — AI アイデアを直感的な実行パイプラインへ。 ⚡
</p>
