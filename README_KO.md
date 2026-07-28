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
  <a href="README_ZH.md">中文</a> •
  <a href="README_FR.md">Français</a> •
  <a href="README_RU.md">Русский</a> •
  <a href="README_JA.md">日本語</a> •
  <a href="README_KO.md"><b>한국어</b></a>
</p>

# ⚡ FlowForge

**비주얼 AI 워크플로우 빌더 — 코딩 없이 드래그 앤 드롭으로 구축하는 멀티모달 AI 파이프라인.**

FlowForge는 직관적인 DAG 노드 그래프를 통해 복잡한 AI 파이프라인을 시각적으로 설계, 연결 및 실행할 수 있는 100% 클라이언트 사이드 웹 애플리케이션입니다. OpenRouter에서 제공하는 **400개 이상의 AI 모델**(GPT-4o, Claude 3.5, Gemini 2.0, Llama 3.1, FLUX, MiniMax 등)에 연결하세요. 모든 프로세스는 100% 데이터 개인정보 보호와 함께 브라우저에서 직접 실행되며 백엔드 서버 비용이 전혀 들지 않습니다.

---

## 🖼️ 개요

```
┌─────────────────────────────────────────────────────────────┐
│  TopBar (워크플로우 이름 · 자동 저장 · 실행 · 가져오기/내보내기)│
├────┬────────────────────────────────────────────────┬───────┤
│    │                                                │ 속성  │
│ T  │          ✦ 캔버스 워크스페이스 ✦               │ 패널  │
│ o  │                                                │(Panel)│
│ o  │   [텍스트 입력] ──→ [AI 텍스트 생성] ──→ [다운로드] │       │
│ l  │                           │                    │       │
│ b  │   [파일 입력] ────────────┘                    │       │
│ a  │                                                │       │
│ r  │   [이미지 입력] ──→ [AI 이미지 생성]           │       │
│    │                                                │       │
├────┴─────────────────────────┬──────────────────────┴───────┤
│  확대/축소 조작 (Zoom)       │  재정렬 버튼 (Recenter)      │
└──────────────────────────────┴──────────────────────────────┘
```

---

## ✨ 핵심 기능

### 🧩 노드 기반 비주얼 에디터
- **드래그 앤 드롭**: 무한 캔버스 위에서 노드를 자유롭게 배치하고 정렬합니다.
- **선 연결 (Edges)**: 노드 포트 간을 연결하여 동적 데이터 흐름을 생성합니다.
- **부드러운 줌 & 팬 (Zoom & Pan)**: 마우스 휠, 터치 제스처 또는 조작 버튼 지원.
- **무제한 실행 취소/다시 실행**: `Ctrl+Z` / `Ctrl+Shift+Z`.

### 🤖 OpenRouter를 통한 400+ AI 모델 지원
- **텍스트 생성 (LLM)**: GPT-4o, Claude 3.5 Sonnet, Gemini 2.0 Flash, Llama 3.1, DeepSeek, Qwen 등.
- **이미지 생성 (Image Gen)**: DALL·E 3, Stable Diffusion XL, FLUX.1, Midjourney 등.
- **비디오 생성 (Video Gen)**: Luma Dream Machine, Runway Gen-3, MiniMax 등.
- **다중 API 키 관리**: 여러 개의 API 키를 등록하고 닉네임을 설정하여 빠르게 전환할 수 있습니다.

### 📄 스마트 파일 콘텐츠 추출
- **지원 포맷**: `.pdf`, `.docx`, `.doc`, `.txt`, `.md`, `.csv`, `.json`, `.xml`, `.html`.
- **PDF 추출**: `pdfjs-dist`를 통한 텍스트 추출 및 Claude 등 비전 지원 모델을 위한 Base64 패스스루 지원.
- **자동 Markdown 변환**: LLM 문맥 이해도를 극대화하기 위해 API 전송 전 파일 내용을 Markdown으로 자동 변환.

---

## 🚀 빠른 시작

```bash
# 리포지토리 클론
git clone https://github.com/<your-username>/flowforge.git
cd flowforge

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
```

---

## 📄 라이선스

본 프로젝트는 [MIT License](LICENSE)에 따라 배포됩니다.

---

<p align="center">
  <strong>FlowForge</strong> — 드래그 앤 드롭으로 AI 아이디어를 실행 가능한 파이프라인으로 변환하세요. ⚡
</p>
