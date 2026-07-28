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
  <a href="README_FR.md"><b>Français</b></a> •
  <a href="README_RU.md">Русский</a> •
  <a href="README_JA.md">日本語</a> •
  <a href="README_KO.md">한국어</a>
</p>

# ⚡ FlowForge

**Générateur de workflows IA visuels — Créez des pipelines d'IA multimodaux par glisser-déposer, sans aucun code.**

FlowForge est une application web 100% côté client qui vous permet de concevoir, connecter et exécuter des pipelines d'IA complexes via des graphes de nœuds DAG interactifs. Connectez **plus de 400 modèles d'IA** d'OpenRouter (GPT-4o, Claude 3.5, Gemini 2.0, Llama 3.1, FLUX, MiniMax, etc.) — le tout exécuté directement dans votre navigateur avec 100% de confidentialité des données et aucun coût de serveur.

---

## 🖼️ Aperçu

```
┌─────────────────────────────────────────────────────────────┐
│  TopBar (Nom du workflow · Sauvegarde auto · Exécuter)      │
├────┬────────────────────────────────────────────────┬───────┤
│    │                                                │ Panel │
│ T  │            ✦ Espace de travail ✦               │ Pro-  │
│ o  │                                                │ prié- │
│ o  │   [Texte Entrée] ──→ [IA Texte Gen] ──→ [Télé- │ tés   │
│ l  │                           │             charger]│(Right)│
│ b  │   [Fichier Entrée] ───────┘                    │       │
│ a  │                                                │       │
│ r  │   [Image Entrée] ──→ [IA Image Gen]            │       │
│    │                                                │       │
├────┴─────────────────────────┬──────────────────────┴───────┤
│  ZoomControls                │  Bouton Recentrer            │
└──────────────────────────────┴──────────────────────────────┘
```

---

## ✨ Fonctionnalités clés

### 🧩 Éditeur visuel basé sur des nœuds
- **Glisser-déposer** pour organiser librement les nœuds sur un canvas infini.
- **Connexions filaires (Edges)** entre les ports pour établir des flux de données dynamiques.
- **Zoom & Pan fluides** via la molette, le pavé tactile ou les gestes tactiles.
- **Annuler/Rétablir illimités** avec `Ctrl+Z` / `Ctrl+Shift+Z`.
- **Sélection multiple** avec `Ctrl+Clic`.

### 🤖 Plus de 400 modèles d'IA via OpenRouter
- **Génération de Texte (LLM):** GPT-4o, Claude 3.5 Sonnet, Gemini 2.0, Llama 3.1, DeepSeek, Qwen,...
- **Génération d'Images:** DALL·E 3, Stable Diffusion XL, FLUX.1, Midjourney,...
- **Génération de Vidéos:** Luma Dream Machine, Runway Gen-3, MiniMax,...
- **Support multimodal complet:** Audio, parole, Embeddings et Rerank.
- **Gestion des clés API multiples:** Enregistrez et basculez instantanément entre différentes clés d'API.

### 📄 Extraction intelligente de fichiers
- **Formats pris en charge:** `.pdf`, `.docx`, `.doc`, `.txt`, `.md`, `.csv`, `.json`, `.xml`, `.html`.
- **Extraction PDF:** Analyse du texte via `pdfjs-dist` + transmission base64 native pour les modèles lisant les PDF (Claude).
- **Conversion Markdown automatique:** Formatage du texte du fichier en Markdown avant l'envoi aux API LLM pour une meilleure compréhension du contexte.

---

## 🚀 Démarrage rapide

```bash
# Cloner le dépôt
git clone https://github.com/<your-username>/flowforge.git
cd flowforge

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Compiler pour la production
npm run build
```

---

## 📄 Licence

Distribué sous la licence [MIT License](LICENSE).

---

<p align="center">
  <strong>FlowForge</strong> — Transformez vos idées IA en pipelines visuels en quelques clics. ⚡
</p>
