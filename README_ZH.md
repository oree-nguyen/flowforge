<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8.1-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>

<p align="center">
  <a href="README.md">English</a> •
  <a href="README_VI.md">Tiếng Việt</a> •
  <a href="README_ZH.md"><b>中文</b></a> •
  <a href="README_FR.md">Français</a> •
  <a href="README_RU.md">Русский</a> •
  <a href="README_JA.md">日本語</a> •
  <a href="README_KO.md">한국어</a>
</p>

# ⚡ FlowForge

**可视化 AI 工作流构建器 — 拖拽式多模态 AI 管线，无需编写任何代码。**

FlowForge 是一个 100% 纯客户端运行的 Web 应用程序，允许您通过直观的 DAG 节点图可视化构建、连接和执行复杂的 AI 工作流。无缝接入来自 OpenRouter 的 **400+ AI 模型**（GPT-4o、Claude 3.5、Gemini 2.0、Llama 3.1、FLUX、MiniMax 等）— 所有操作直接在浏览器本地运行，100% 数据隐私保护，零后端服务器成本。

---

## 🖼️ 概览

```
┌─────────────────────────────────────────────────────────────┐
│  TopBar (工作流名称 · 自动保存 · 运行 · 导入/导出)           │
├────┬────────────────────────────────────────────────┬───────┤
│    │                                                │       │
│ T  │            ✦ 画布工作区 (Canvas) ✦             │ 属性  │
│ o  │                                                │ 面板  │
│ o  │   [文本输入] ──→ [AI 文本生成] ──→ [下载]       │(Panel)│
│ l  │                         │                      │       │
│ b  │   [文件输入] ──────────┘                      │       │
│ a  │                                                │       │
│ r  │   [图像输入] ──→ [AI 图像生成]                 │       │
│    │                                                │       │
├────┴─────────────────────────┬──────────────────────┴───────┤
│  缩放控制 (ZoomControls)     │  重置视角 (Recenter)         │
└──────────────────────────────┴──────────────────────────────┘
```

---

## ✨ 核心特性

### 🧩 节点化可视化编辑器
- **自由拖拽**：在无限画布上自由创建和排列节点。
- **连线建立依赖 (Edges)**：在节点端口之间连线，直观构建数据流。
- **流畅缩放与平移 (Zoom & Pan)**：支持鼠标滚轮、手势或画布控制按钮。
- **无限撤销/重做**：使用 `Ctrl+Z` / `Ctrl+Shift+Z`。
- **多节点选择**：使用 `Ctrl+Click` 进行多选。

### 🤖 接入 OpenRouter 400+ AI 模型
- **文本生成 (LLM)**: GPT-4o, Claude 3.5 Sonnet, Gemini 2.0 Flash, Llama 3.1, DeepSeek, Qwen 等。
- **图像生成 (Image Gen)**: DALL·E 3, Stable Diffusion XL, FLUX.1, Midjourney 等。
- **视频生成 (Video Gen)**: Luma Dream Machine, Runway Gen-3, MiniMax 等。
- **全模态支持**：涵盖音频、语音、Embeddings 与 Rerank。
- **快捷切换**：按 Provider 和 Category 快速筛选模型，支持配置多个 API Key 并自由命名与切换。

### 📄 智能本地文件提取
- **支持格式**：`.pdf`, `.docx`, `.doc`, `.txt`, `.md`, `.csv`, `.json`, `.xml`, `.html`。
- **PDF 解析**：通过 `pdfjs-dist` 提取文本，并支持原生 PDF Base64 传递（针对 Claude 等原生支持 PDF 视效的模型）。
- **DOCX 解析**：通过 `mammoth` 转换为纯文本。
- **自动 Markdown 格式化**：在发送给 LLM API 前自动将文件内容转换为 Markdown，显著提升上下文理解准确度。

### 💾 本地存储与云端同步
- **实时自动保存**：自动持久化至 `localStorage` 与 `IndexedDB`。
- **多工作流管理**：轻松创建、重命名、保存与切换不同的工作流。
- **导入/导出**：将 DAG 节点图导出为 JSON 文件，随时导入还原。
- **Google Drive 同步**：通过 OAuth2 将工作流同步备份至个人 Google Drive。
- **灾难恢复模式**：意外清除浏览器缓存时，可从 IndexedDB 备份中恢复工作流。

---

## 🛠️ 技术栈

| 层级 | 技术 | 作用 |
|------|------|------|
| **UI 框架** | React 19 | 组件化渲染 |
| **语言** | TypeScript 6.0 | 类型安全 |
| **构建工具** | Vite 8.1 | 开发服务器 + 生产打包 |
| **样式** | Tailwind CSS 3.4 | 原子化 CSS |
| **状态管理** | Zustand 4.5 + Zundo | 全局状态 + 撤销重做 |
| **动画** | Framer Motion 11.5 | 平滑过渡与微交互 |
| **图标** | Lucide React | 现代图标库 |
| **存储** | idb 8.0 (IndexedDB) | 媒体与工作流持久化 |
| **AI 网关** | OpenRouter API | 连接 400+ AI 模型 |

---

## 🚀 快速开始

```bash
# 克隆仓库
git clone https://github.com/<your-username>/flowforge.git
cd flowforge

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产包
npm run build
```

---

## 📄 开源协议

本项目采用 [MIT 许可证](LICENSE)。

---

<p align="center">
  <strong>FlowForge</strong> — 轻松拖拽，将 AI 构想转化为可视化工作流。 ⚡
</p>
