<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8.1-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/License-AGPL--3.0-blue?style=for-the-badge" alt="License" />
</p>

<p align="center">
  <a href="README.md"><b>English</b></a> •
  <a href="README_VI.md">Tiếng Việt</a> •
  <a href="README_ZH.md">中文</a> •
  <a href="README_FR.md">Français</a> •
  <a href="README_RU.md">Русский</a> •
  <a href="README_JA.md">日本語</a> •
  <a href="README_KO.md">한국어</a>
</p>

# ⚡ FlowForge

**Visual AI Workflow Builder — Drag-and-drop multi-modal AI pipelines, zero code required.**

FlowForge is a 100% client-side web application designed to let you visually build, chain, and execute complex AI pipelines using interactive DAG node graphs. Connect **400+ AI models** from OpenRouter (GPT-4o, Claude, Gemini, Llama, FLUX, MiniMax, etc.) — all executed directly inside your browser with 100% data privacy and zero backend server costs.

---

## 🖼️ Overview

```
┌─────────────────────────────────────────────────────────────┐
│  TopBar (Workflow Name · Auto-save · Run · Import/Export)   │
├────┬────────────────────────────────────────────────┬───────┤
│    │                                                │       │
│ T  │            ✦ Canvas Workspace ✦                │ Pro-  │
│ o  │                                                │ per-  │
│ o  │   [Input Text] ──→ [AI Text Gen] ──→ [Down-   │ ties  │
│ l  │                         │              load]   │ Panel │
│ b  │   [Input File] ────────┘                       │       │
│ a  │                                                │       │
│ r  │   [Input Image] ──→ [AI Image Gen]             │       │
│    │                                                │       │
├────┴─────────────────────────┬──────────────────────┴───────┤
│  ZoomControls                │  Recenter Button             │
└──────────────────────────────┴──────────────────────────────┘
```

---

## ✨ Features

### 🧩 Node-Based Visual Editor
- **Drag-and-Drop** workspace to arrange nodes freely on an infinite canvas.
- **Wire Connections (Edges)** between node ports to establish dynamic data flows.
- **Smooth Zoom & Pan** using mouse wheel, touch gestures, or dedicated canvas controls.
- **Unlimited Undo/Redo** via `Ctrl+Z` / `Ctrl+Shift+Z`.
- **Multi-Node Selection** using `Ctrl+Click`.

### 🤖 400+ AI Models via OpenRouter
- **Text Generation:** GPT-4o, Claude 3.5 Sonnet, Gemini 2.0 Flash, Llama 3.1, DeepSeek, Qwen, etc.
- **Image Generation:** DALL·E 3, Stable Diffusion XL, FLUX.1, Midjourney, etc.
- **Video Generation:** Luma Dream Machine, Runway Gen-3, MiniMax, etc.
- **Audio / Speech / Embeddings / Rerank** — full multi-modal support.
- **Browse Models** by provider and modality directly within the app.
- **Multi-API Key Management**: Store multiple keys, rename them, and switch between provider keys seamlessly.

### 📄 Smart File Content Extraction
- **Direct Upload Support:** `.pdf`, `.docx`, `.doc`, `.txt`, `.md`, `.csv`, `.json`, `.xml`, `.html`.
- **PDF Extraction:** Text parsing via `pdfjs-dist` + native PDF base64 pass-through for vision-capable models (e.g. Claude).
- **DOCX Extraction:** Converts Word documents into clean text via `mammoth`.
- **Auto Markdown Conversion:** Formats file text into clean Markdown before sending to LLM APIs for optimal context comprehension.

### 💾 Local Storage & Cloud Auto-Sync
- **Continuous Auto-Save** to `localStorage` and `IndexedDB`.
- **Multi-Workflow Management:** Create, save, rename, and switch between workflows instantly.
- **Import/Export:** Export complete DAG graphs as JSON and import anytime.
- **Google Drive Sync:** OAuth2 integration to back up and sync workflows to personal Google Drive.
- **Recovery Mode:** Auto-recover graphs from IndexedDB backups if local data is cleared.

### 📱 Touch-Optimized (Mobile & Tablet)
- **Pinch-to-Zoom:** 2-finger zoom gesture.
- **1-Finger Pan:** Smooth canvas panning on empty spaces.
- **Enlarged Touch Targets:** Expanded 36×36px touch areas on node port handles.
- **Viewport Lock:** Prevents accidental browser zooming for native app feel.

### ⌨️ Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Delete` / `Backspace` | Delete selected node/edge |
| `Space` (hold) | Pan workspace mode |
| `Ctrl+S` | Save workflow |
| `?` | Toggle keyboard shortcuts modal |

---

## 🗂️ Node Types

| Node | Description | Input | Output |
|------|-------------|-------|--------|
| **📝 Input Text** | Plain text or prompt input | — | Text |
| **🖼️ Input Image** | Image file or URL upload | — | Image URL |
| **📄 Other Input (File)** | File upload (PDF, DOCX, TXT, etc.) | — | Extracted Text |
| **🤖 AI Text Gen** | Call LLM for text generation | Text + File | Generated Text |
| **🎨 AI Image Gen** | Call AI model for image synthesis | Text Prompt | Image |
| **🎬 AI Video Gen** | Call AI model for video generation | Text + Image | Video |
| **📥 Download** | Save output to disk | Any output | File Download |
| **📌 Note** | Markdown notes on canvas | — | — |

---

## 🏗️ Project Architecture

```
flowforge/
├── index.html                    # Entry point + viewport meta
├── package.json                  # Dependencies & scripts
├── tailwind.config.js            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Vite build configuration
│
└── src/
    ├── main.tsx                  # React DOM entry
    ├── App.tsx                   # Root layout & routing
    ├── index.css                 # Global styles & CSS variables
    │
    ├── engine/                   # 🔧 Canvas Engine (core)
    │   ├── canvasEngine.ts       #   Node/edge/viewport state machine
    │   └── useCanvasEngine.ts    #   React hook for engine subscription
    │
    ├── store/                    # 📦 State Management (Zustand)
    │   ├── workflowStore.ts      #   Primary store (workflows, API keys, settings)
    │   ├── toastStore.ts         #   Toast notification store
    │   └── modelCatalog.ts       #   AI model metadata catalog
    │
    ├── services/                 # 🌐 External Services
    │   ├── openRouterApi.ts      #   OpenRouter API client (models, chat, image gen)
    │   ├── fileExtractor.ts      #   Client-side file parsing (PDF, DOCX, TXT)
    │   ├── mediaStorage.ts       #   IndexedDB media blob storage
    │   └── googleDriveApi.ts     #   Google Drive OAuth2 + file sync
    │
    ├── hooks/                    # 🪝 Custom React Hooks
    │   ├── useAutoSave.ts        #   Periodic auto-save to localStorage/IDB
    │   ├── useKeyboardShortcuts.ts #  Global keyboard shortcut handler
    │   └── useTouchGestures.ts   #   Touch pinch-zoom & pan gestures
    │
    └── components/               # 🧱 UI Components
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **npm** ≥ 9

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/flowforge.git
cd flowforge

# Install dependencies
npm install
```

### Run Development Server

```bash
npm run dev
```

Open browser at `http://localhost:5173`

### Production Build

```bash
npm run build
```

The output in `dist/` is ready to deploy to any static host (GitHub Pages, Vercel, Netlify, Cloudflare Pages).

---

## ⚙️ Configuration

### OpenRouter API Key
1. Create a free account at [openrouter.ai](https://openrouter.ai/).
2. Generate an API Key at [openrouter.ai/keys](https://openrouter.ai/keys).
3. Open **Settings** (⚙️) in FlowForge → Paste key → **Test & Save**.
4. Supports **multiple API keys** with custom aliases and fast key switching.

### Google Drive Sync (Optional)
1. Create a Google Cloud project and enable Google Drive API.
2. Create an OAuth2 Client ID (Web Application).
3. In FlowForge Settings → Enter Client ID → **Authorize**.
4. Workflows automatically sync to Google Drive as JSON.

---

## 🛠️ Tech Stack

| Layer | Technology | Role |
|-------|------------|------|
| **UI Framework** | React 19 | Component-based rendering |
| **Language** | TypeScript 6.0 | Type safety |
| **Build Tool** | Vite 8.1 | Dev server + production bundling |
| **Styling** | Tailwind CSS 3.4 | Utility-first CSS |
| **State** | Zustand 4.5 + Zundo | Global state + undo/redo |
| **Animation** | Framer Motion 11.5 | Smooth transitions |
| **Icons** | Lucide React | Modern icon set |
| **PDF Parser** | pdfjs-dist 6.1 | Client-side PDF text extraction |
| **DOCX Parser** | Mammoth 1.12 | Client-side Word document parsing |
| **Storage** | idb 8.0 (IndexedDB) | Persistent media & workflow storage |
| **AI Gateway** | OpenRouter API | Access to 400+ AI models |
| **Cloud Sync** | Google Drive API | Workflow backup & sync |

---

## 🤝 Contributing

Contributions are welcome!
1. **Fork** the repository.
2. Create feature branch: `git checkout -b feature/your-feature-name`
3. Commit changes: `git commit -m "feat: add amazing feature"`
4. Push to branch: `git push origin feature/your-feature-name`
5. Open a **Pull Request**.

---

## 📄 License

Distributed under the [GNU Affero General Public License v3.0 (AGPL-3.0)](LICENSE).

---

<p align="center">
  <strong>FlowForge</strong> — Turn AI ideas into visual DAG execution pipelines. ⚡
</p>
