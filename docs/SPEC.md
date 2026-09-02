# CharCraft · Requirements & Implementation Plan (Electron) / 需求与实现方案

> Status: implemented (M1–M4). This document records the original plan.
> 状态:已实现(M1–M4)。本文档记录原始方案。

---

## 1. Overview / 项目概述

A Ginger-like **SillyTavern character card editor**, delivered as a portable Windows single-file `.exe`.
开发类 Ginger 的 **SillyTavern 角色卡开发/编辑工具**,以 Windows 便携版单文件 `.exe` 交付。

- **Framework / 框架**: Electron (single TypeScript language, mature packaging, low maintenance).
- **Delivery / 交付**: portable single-file `.exe`, no install.
- **Code strategy / 代码策略**: fully rewritten, desktop-first.

---

## 2. Decisions / 已确认决策

| Item 项 | Decision 决策 |
|---|---|
| Shell framework 外壳框架 | Electron |
| Delivery 交付形态 | portable single `.exe` 便携版单文件 |
| Code strategy 代码策略 | rewrite, desktop-first 全新重写 |
| App name 应用名 | CharCraft |

---

## 3. Hard constraints / 硬性约束

1. **Language layering 语言分层**: UI is bilingual, but card data field names and content are always English. UI 双语仅影响显示层,卡片数据恒英文。
2. **Key locality 密钥本地化**: API key stored only in the local app-data directory. Key 仅存本机。
3. **Cost protection 财产保护**: cost reminder before the first AI generation per launch. 每次启动首次生成前弹费用提醒。
4. **Content protection 内容保护**: overwrite strategy before whole-card generation (cancel / clear-overwrite / fill-empty-only / choose targets). 整卡生成前弹覆盖策略。

---

## 4. Feature requirements / 功能需求

### 4.1 Import / 导入
- Native open dialog for `.png` / `.json` (`.charx` in M2). 原生对话框打开 `.png` / `.json`。
- Parse `chara_card_v2` (PNG `tEXt`→`chara`) and `chara_card_v3` (`tEXt`→`ccv3`). 解析两种规格。

### 4.2 Visual form editor / 可视化表单
- Core fields: name / description / personality / scenario / first_mes / mes_example / alternate_greetings / system_prompt / creator_notes / tags / creator.
- Advanced (collapsed): post_history_instructions / character_version / group_only_greetings / avatar.
- Each field has an enable/disable checkbox + AI rewrite button; `name` is locked enabled.
- 每个字段旁 = 启用/禁用勾选框 + AI 改写按钮;`name` 锁定启用。

### 4.3 AI-assisted generation / AI 辅助生成
- Model settings: base URL + API key + model, with OpenRouter / DeepSeek presets + custom OpenAI-compatible endpoints.
- Whole-card drafting, per-field rewrite, world-book entry generation. 整卡起草、逐字段改写、世界书条目生成。
- Output is forced to English. 输出强制英文。

### 4.4 World book / 世界书
- Manual / AI entries, bound to `data.character_book`, exported with the card. 条目绑定到角色卡随卡导出。

### 4.5 Export / 导出
- Native "save as" for `.json` and `.png` (writes back the `tEXt` `chara`/`ccv3` chunk). 导出 `.json` / `.png`。

### 4.6 Others / 其他
- Bilingual UI; local draft autosave. 中英双语;本地草稿自动保存。

---

## 5. Architecture (Electron 3-layer) / 架构(三层)

- **main** (Node.js): window, dialogs, file I/O, AI direct calls, config/draft storage. 主进程:窗口、对话框、文件、AI 直连、存储。
- **preload**: exposes `window.api` via `contextBridge`. 预加载:contextBridge 暴露安全 API。
- **renderer** (React + TS): UI and core logic (PNG, card, AI, state). 渲染进程:界面与核心逻辑。
- **AI calls / AI 调用**: main-process direct, no browser CORS. 主进程直连,无 CORS。

---

## 6. Tech stack / 技术栈

- Electron + Vite + React + TypeScript (pnpm).
- electron-builder, `portable` target → single `.exe`.
- vitest for tests, using the 7 cards in `demo/` for round-trip regression.

---

## 7. Milestones / 里程碑

| Milestone 里程碑 | Content 内容 |
|---|---|
| **M1 (MVP)** | import/edit/export, AI generation, world book, bilingual UI |
| M2 | dialogue formatting, avatar crop/resize, world book import/export/merge, `.charx` |
| M3 | Recipes, Snippets, find & replace, token count & budget |
| M4 | gender swap, multi-platform extensions, dark mode, snapshots |

---

## 8. Acceptance criteria (M1) / 验收标准

1. `.exe` runs on double-click without a white screen or crash. `.exe` 双击可运行,无白屏闪退。
2. Import the 7 `demo/` cards → edit → export `.png`/`.json` → re-import, data consistent (round-trip).
3. AI generation (OpenRouter/DeepSeek) works; cost reminder + overwrite protection active.
4. Bilingual switch does not affect card data (always English).

---

## 9. Notes / 备注

- `.charx` structure was researched before M2. `.charx` 结构已在 M2 前查证。
- electron-builder portable output details (icon, signing, antivirus warnings).
