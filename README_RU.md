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
  <a href="README_RU.md"><b>Русский</b></a> •
  <a href="README_JA.md">日本語</a> •
  <a href="README_KO.md">한국어</a>
</p>

# ⚡ FlowForge

**Визуальный конструктор ИИ-пайплайнов — Создавайте мультимодальные цепочки ИИ путем перетаскивания узлов без кода.**

FlowForge — это 100% клиентское веб-приложение для визуального проектирования, объединения и выполнения сложных ИИ-процессов с использованием интерактивных DAG-графов. Подключайте **более 400 моделей ИИ** через OpenRouter (GPT-4o, Claude 3.5, Gemini 2.0, Llama 3.1, FLUX, MiniMax и др.) — всё работает прямо в вашем браузере с полной конфиденциальностью данных и без затрат на бэкенд-серверы.

---

## 🖼️ Обзор интерфейса

```
┌─────────────────────────────────────────────────────────────┐
│  TopBar (Название · Автосохранение · Запуск · Экспорт)     │
├────┬────────────────────────────────────────────────┬───────┤
│    │                                                │ Панель│
│ T  │          ✦ Рабочая область (Canvas) ✦          │ Свой- │
│ o  │                                                │ ств   │
│ o  │   [Вход Текст] ──→ [AI Текст Gen] ──→ [Скачать]│(Right)│
│ l  │                        │                       │       │
│ b  │   [Вход Файл] ─────────┘                       │       │
│ a  │                                                │       │
│ r  │   [Вход Изображение] ──→ [AI Фото Gen]         │       │
│    │                                                │       │
├────┴─────────────────────────┬──────────────────────┴───────┤
│  Управление масштабом        │  Центрировать                │
└──────────────────────────────┴──────────────────────────────┘
```

---

## ✨ Ключевые возможности

### 🧩 Визуальный редактор узлов
- **Drag-and-Drop**: Свободное размещение и перемещение узлов на бесконечном холсте.
- **Связи (Edges)**: Соединение портов узлов для построения динамических потоков данных.
- **Масштабирование и панорамирование**: Плавный Zoom & Pan мышью, тачпадом или сенсорными жестами.
- **Неограниченный Undo/Redo**: Отмена и повтор через `Ctrl+Z` / `Ctrl+Shift+Z`.

### 🤖 Подключение 400+ моделей ИИ через OpenRouter
- **Генерация текста**: GPT-4o, Claude 3.5 Sonnet, Gemini 2.0 Flash, Llama 3.1, DeepSeek, Qwen и др.
- **Генерация изображений**: DALL·E 3, Stable Diffusion XL, FLUX.1, Midjourney и др.
- **Генерация видео**: Luma Dream Machine, Runway Gen-3, MiniMax и др.
- **Управление API-ключами**: Сохраняйте несколько API-ключей и быстро переключайтесь между ними.

### 📄 Умное извлечение содержимого файлов
- **Поддерживаемые форматы**: `.pdf`, `.docx`, `.doc`, `.txt`, `.md`, `.csv`, `.json`, `.xml`, `.html`.
- **Извлечение из PDF**: Парсинг текста через `pdfjs-dist` + поддержка передачи PDF в base64 для мультимодальных моделей (Claude).
- **Авто-конвертация в Markdown**: Преобразование содержимого файлов в Markdown перед отправкой в LLM для лучшего понимания контекста.

---

## 🚀 Быстрый старт

```bash
# Клонировать репозиторий
git clone https://github.com/<your-username>/flowforge.git
cd flowforge

# Установить зависимости
npm install

# Запустить сервер разработки
npm run dev

# Сборка для продакшена
npm run build
```

---

## 📄 Лицензия

Распространяется под лицензией [GNU Affero General Public License v3.0 (AGPL-3.0)](LICENSE).

---

<p align="center">
  <strong>FlowForge</strong> — Превращайте идеи ИИ в визуальные исполняемые пайплайны. ⚡
</p>
