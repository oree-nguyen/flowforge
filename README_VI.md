<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8.1-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/License-AGPL--3.0-blue?style=for-the-badge" alt="License" />
</p>

<p align="center">
  <a href="README.md">English</a> •
  <a href="README_VI.md"><b>Tiếng Việt</b></a> •
  <a href="README_ZH.md">中文</a> •
  <a href="README_FR.md">Français</a> •
  <a href="README_RU.md">Русский</a> •
  <a href="README_JA.md">日本語</a> •
  <a href="README_KO.md">한국어</a>
</p>

# ⚡ FlowForge

**Visual AI Workflow Builder — Xây dựng pipeline AI bằng kéo-thả, không cần code.**

FlowForge là một ứng dụng web client-side 100% cho phép bạn thiết kế, kết nối và chạy các pipeline AI phức tạp thông qua giao diện đồ họa trực quan (node-based). Kết nối với **400+ model AI** từ OpenRouter (GPT-4o, Claude, Gemini, Llama, FLUX, MiniMax,...) — tất cả chạy trực tiếp trên trình duyệt, không cần backend và bảo mật 100%.

---

## 🖼️ Tổng quan

```
┌─────────────────────────────────────────────────────────────┐
│  TopBar (Tên workflow · Auto-save · Run · Import/Export)    │
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

## ✨ Tính năng chính

### 🧩 Node-based Visual Editor
- **Kéo-thả** để tạo và sắp xếp các node trên canvas vô hạn.
- **Kết nối dây** (edges) giữa các node để xây dựng luồng dữ liệu.
- **Zoom & Pan** mượt mà bằng cuộn chuột, kéo thả, hoặc cử chỉ cảm ứng.
- **Undo/Redo** không giới hạn với `Ctrl+Z` / `Ctrl+Shift+Z`.
- **Multi-select** node bằng `Ctrl+Click`.

### 🤖 Tích hợp 400+ Model AI qua OpenRouter
- **Text Generation:** GPT-4o, Claude 3.5 Sonnet, Gemini 2.0, Llama 3.1, DeepSeek, Qwen,...
- **Image Generation:** DALL·E 3, Stable Diffusion XL, FLUX.1, Midjourney,...
- **Video Generation:** Luma Dream Machine, Runway Gen-3, MiniMax,...
- **Audio / Speech / Embeddings / Rerank** — hỗ trợ đầy đủ các loại modality.
- Duyệt model theo **provider** và **category** ngay trong ứng dụng.
- Hỗ trợ nhiều API key cùng lúc, đặt tên và chuyển đổi nhanh.

### 📄 Trích xuất nội dung File thông minh
- Upload trực tiếp: `.pdf`, `.docx`, `.doc`, `.txt`, `.md`, `.csv`, `.json`, `.xml`, `.html`.
- **PDF:** Trích xuất text qua `pdfjs-dist` + giữ base64 cho các model hỗ trợ đọc PDF gốc (Claude).
- **DOCX:** Chuyển đổi sang text thuần qua `mammoth`.
- Nội dung file được tự động format sang **Markdown** trước khi gửi API — giúp LLM đọc hiểu chính xác hơn.

### 💾 Lưu trữ & Đồng bộ
- **Auto-save** liên tục vào `localStorage` + `IndexedDB`.
- **Multi-workflow:** Tạo, lưu, và chuyển đổi giữa nhiều workflow.
- **Import/Export:** Xuất workflow dưới dạng JSON, import lại bất kỳ lúc nào.
- **Google Drive Sync:** Đồng bộ workflow lên Google Drive (OAuth2).
- **Recovery Mode:** Khôi phục workflow từ bản backup IndexedDB khi mất dữ liệu.

### 📱 Tối ưu Cảm ứng (Mobile & Tablet)
- **Pinch-to-Zoom:** Chụm 2 ngón tay để thu phóng canvas.
- **1-Finger Pan:** Vuốt 1 ngón trên vùng trống để di chuyển góc nhìn.
- **Enlarged Touch Targets:** Vùng chạm port kết nối mở rộng 36×36px.
- **Viewport meta** chặn browser zoom để trải nghiệm mượt như app native.

### ⌨️ Phím tắt chuyên nghiệp
| Phím | Hành động |
|------|-----------|
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Delete` / `Backspace` | Xóa node/edge đang chọn |
| `Space` (giữ) | Chuyển sang chế độ Pan |
| `Ctrl+S` | Lưu workflow |
| `?` | Mở/đóng bảng phím tắt |

---

## 🗂️ Các loại Node

| Node | Mô tả | Đầu vào | Đầu ra |
|------|--------|---------|--------|
| **📝 Input Text** | Nhập văn bản tự do | — | Text |
| **🖼️ Input Image** | Upload ảnh | — | Image URL |
| **📄 Other Input (File)** | Upload file (PDF, DOCX, TXT,...) | — | Extracted Text |
| **🤖 AI Text Gen** | Gọi LLM để sinh văn bản | Text + File | Generated Text |
| **🎨 AI Image Gen** | Gọi model AI tạo ảnh | Text Prompt | Image |
| **🎬 AI Video Gen** | Gọi model AI tạo video | Text + Image | Video |
| **📥 Download** | Tải output về máy | Any output | File download |
| **📌 Note** | Ghi chú trên canvas | — | — |

---

## 🚀 Cài đặt & Chạy

### Yêu cầu
- **Node.js** ≥ 18
- **npm** ≥ 9

### Cài đặt

```bash
# Clone repository
git clone https://github.com/<your-username>/flowforge.git
cd flowforge

# Cài dependencies
npm install
```

### Chạy Development Server

```bash
npm run dev
```

Mở trình duyệt tại `http://localhost:5173`

### Build Production

```bash
npm run build
```

---

## ⚙️ Cấu hình

### OpenRouter API Key
1. Đăng ký tài khoản tại [openrouter.ai](https://openrouter.ai/).
2. Tạo API Key tại [openrouter.ai/keys](https://openrouter.ai/keys).
3. Trong FlowForge, mở **Settings** (⚙️) → dán API Key → **Test & Save**.

---

## 📄 License

Dự án này được phát hành dưới giấy phép [GNU Affero General Public License v3.0 (AGPL-3.0)](LICENSE).

---

<p align="center">
  <strong>FlowForge</strong> — Biến ý tưởng thành pipeline AI, chỉ bằng kéo-thả. ⚡
</p>
