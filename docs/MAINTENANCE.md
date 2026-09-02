# CharCraft · Maintenance Guide / 项目维护文档

> Purpose: a complete context reference for future maintenance or sequels — requirements, features, implementation, build flow, and environment notes.
> 用途:后续维护 / 续作时的完整上下文参考。记录需求、功能、实现方式、构建流程与环境注意事项。
>
> Generated at: M4 completion. 生成时间:M4 完成时。

---

## 1. Overview / 项目概述

**CharCraft** — a Ginger-like **SillyTavern character card editor**, shipped as a **Windows portable single-file `.exe`** (no install, double-click to run).
**CharCraft** —— 类 Ginger 的 **SillyTavern 角色卡开发/编辑工具**,以 **Windows 便携版单文件 `.exe`** 交付(免安装、双击即用)。

- Framework: Electron (single TypeScript language, mature packaging, low maintenance). 框架:Electron(单一 TypeScript 语言、打包链路成熟、维护成本低)。
- Scope: import / generate / edit cards, bind a world book, export `.json` / `.png`. 功能定位:导入 / 生成 / 编辑角色卡,绑定世界书,导出 `.json` / `.png`。
- Constraint: card data field names and content are always English; the bilingual UI only affects the display layer. 关键约束:卡片数据字段名与内容恒为英文;UI 中英双语仅影响显示层。

## 2. Deliverables / 交付物与产物

| Path 路径 | Description 说明 |
|---|---|
| `release/CharCraft.exe` | **Product 成品**(portable single file, ~95–100 MB) |
| `out/` | Build intermediates (main / preload / renderer) 构建中间产物 |
| `release/win-unpacked/` | Unpacked app (for debugging; can be ignored) 解包后的应用(排查用,可忽略) |
| `demo/` | 7 community sample cards (regression data) 7 张社区角色卡样例(回归测试数据) |
| `docs/` | Spec + this document 需求方案 + 本文档 |

## 3. Tech stack & dependencies / 技术栈与依赖

| Dependency 依赖 | Version 版本 | Purpose 用途 |
|---|---|---|
| electron | 44.x | Desktop shell 桌面外壳 |
| electron-builder | 26.x | Package `.exe` (portable) 打包 .exe(portable) |
| react / react-dom | 19.x | Renderer UI 渲染层 UI |
| zustand | 5.x | State management 状态管理 |
| vite + @vitejs/plugin-react | 8.x / 6.x | Renderer build 渲染进程构建 |
| typescript | 7.x | Types + main-process compile (native compiler) 类型 + 主进程编译(原生编译器) |
| vitest | 4.x | Unit tests 单元测试 |
| jsdom | 30.x | React mount tests React 渲染挂载测试 |
| fflate | 0.8.x | `.charx` (ZIP) decompress `.charx`(ZIP)解压 |
| gpt-tokenizer | latest | Exact token count (tiktoken) Token 精确计数(tiktoken) |

No native modules (no node-gyp / Rust); everything is pure JS/TS.
无原生模块(无 node-gyp / Rust),全部纯 JS/TS。

## 4. Architecture (Electron three layers) / 架构(Electron 三层)

```
src/
  main/     Main process (Node.js): window, dialogs, file I/O, AI calls, config/draft storage
            (主进程:窗口、原生对话框、文件读写、AI 直连、配置/草稿存取)
  preload/  contextBridge secure bridge, exposes window.api
  renderer/ Renderer process (React): UI + core logic + state
  shared/   Cross-process shared types + IPC contract
```

- The renderer **never touches Node / the filesystem directly**; everything goes through `window.api` (preload + IPC).
  渲染进程 **不直接接触 Node/文件系统**,全部通过 `window.api`(preload + IPC)。
- Main-process `webPreferences`: `contextIsolation: true`, `nodeIntegration: false`, **`sandbox: false`** (critical: a sandboxed preload cannot `require` relative modules — this caused a white screen).
  主进程 `webPreferences`:`contextIsolation: true`、`nodeIntegration: false`、**`sandbox: false`**(关键:沙箱化预加载无法 require 相对模块,曾导致白屏)。

### IPC contract (`src/shared/ipc.ts` → `window.api`)

| Method 方法 | Purpose 用途 |
|---|---|
| `openCard()` | Native open dialog (.png/.json/.charx) 原生打开对话框 |
| `openFile(filters)` | Generic open dialog (avatar, world-book import) 通用打开对话框(头像、世界书导入) |
| `saveFile(name, filters, bytes)` | Native save-as 原生另存为 |
| `aiChat(settings, messages, opts)` | AI call (**main-process direct, no CORS**) AI 调用(主进程直连,无 CORS) |
| `getConfig() / setConfig()` | App settings 应用设置 |
| `getDraft() / setDraft()` | Draft (incl. snapshots) 草稿(含快照) |

## 5. Directory layout / 目录结构

```
src/
  main/
    index.ts     # window + IPC registration 窗口 + IPC 注册
    files.ts     # open/save dialogs + file read/write 打开/保存对话框 + 文件读写
    storage.ts   # config.json / draft.json (userData) 存取
    ai.ts        # OpenAI-compatible call (fetch) 接口调用
  preload/index.ts
  renderer/
    index.html
    main.tsx / App.tsx / styles.css / env.d.ts
    core/        # domain logic (pure functions, testable) 领域逻辑(纯函数,可测)
      png.ts       # PNG codec (chunk + native zlib)
      card.ts      # parse/serialize/export + description sub-field merge
      cardText.ts  # shared cross-field text transform helper (find-replace / gender reuse)
      fields.ts    # field metadata + description sub-field definitions
      ai.ts        # prompt builders + JSON parse + field coercion
      format.ts    # dialogue formatting
      image.ts     # avatar crop/resize/decode
      lorebook.ts  # world book import/export/merge
      charx.ts     # .charx decompress
      token.ts     # token count
      findReplace.ts # find & replace
      gender.ts    # gender swap / pronoun replace
      recipes.ts   # builtin recipes
    store/store.ts # zustand global state + persistence
    i18n/index.ts  # zh/en dictionaries 中英双语字典
    ui/            # components and modals 各组件与弹窗
  shared/
    types.ts     # data models + WindowApi
    ipc.ts       # IPC channel names
tests/            # vitest (11 files, 37 cases)
```

## 6. Data models & file formats / 数据模型与文件格式

### 6.1 Card formats (all import; `.charx` import-only) 角色卡格式(均支持导入,`.charx` 仅导入)

| Format 格式 | Embedding 内嵌方式 |
|---|---|
| `chara_card_v2` (spec 2.0) | PNG `tEXt` chunk, key `chara`, value = base64 JSON |
| `chara_card_v3` (spec 3.0) | PNG `tEXt` chunk, key `ccv3`, value = base64 JSON; top-level field mirror + `data` |
| `.charx` | ZIP archive containing `card.json` + optional asset files 含 `card.json` + 可选资源文件 |
| Standalone world book 独立世界书 | JSON, `entries` as an **object** (key = index) or an array 对象(键为索引)或数组两种形式 |

### 6.2 Standard fields (`data` object) 标准字段

Core: name / description / personality / scenario / first_mes / mes_example / alternate_greetings / system_prompt / creator_notes / tags / creator
Advanced (disabled by default): post_history_instructions / character_version / group_only_greetings
Others: avatar、character_book、extensions、group_only_greetings

### 6.3 Extension fields (`data.extensions`) 扩展字段

- `chub` (Chub data), `depth_prompt` ({depth,prompt,role}), `fav`, `talkativeness`, `world`
- **Unknown extensions are preserved as-is** (no data loss on import/export). **未知扩展一律原样保留**(导入导出不丢)。

### 6.4 Local app storage (`%APPDATA%\CharCraft\`) 应用本地存储

| File 文件 | Contents 内容 |
|---|---|
| `config.json` | lang / theme / aiSettings / snippets / customRecipes / tokenBudget |
| `draft.json` | card / enabled / image (avatar rgba stored as base64) / subFields / snapshots / sourceName |

## 7. Feature list (by milestone) / 功能清单(按里程碑)

**M1 basic loop 基础闭环**: import .png/.json → form edit (enable/disable + AI rewrite + advanced collapse) → AI whole-card/per-field generation (4 overwrite strategies + cost reminder) → world-book generation & binding → export .json/.png → bilingual → draft autosave.

**M2 advanced 进阶**: dialogue/greeting formatting (4 styles); avatar crop/resize; world-book import/export/merge; `.charx` import.

**M2.5 polish 补强**: new card can pick an image as avatar; description sub-fields (fullname/gender/age/traits/personality/likes/dislikes/body) merge into the top of `description` on export.

**M3 efficiency 效率工具**: Recipes (12 builtin + custom, AI "bake"); Snippets (add/remove + insert into field); cross-field find & replace; token count & budget (per-field + total/budget, budget configurable).

**M4 wrap-up 收尾**: gender swap / pronoun replace (case-aware, cross-field); multi-platform extension editing (depth_prompt/talkativeness/fav); dark mode; incremental save (snapshots/version history).

## 8. Key implementation details / 关键实现细节

- **PNG codec**: hand-written chunk parsing + browser-native `CompressionStream`/`DecompressionStream` (zlib), zero native deps. 手写 chunk 解析 + 浏览器原生 zlib,零原生依赖。
- **AI call**: main-process `fetch` directly to an OpenAI-compatible endpoint (`baseUrl + '/chat/completions'`); renderer calls via `aiChat` IPC to avoid CORS. Presets: OpenRouter / DeepSeek / custom.
- **Cost reminder**: dialog on the first AI generation per launch (in-memory flag, reset on restart). 每次启动后首次生成弹窗(内存标志,重启重置)。
- **Overwrite protection**: before whole-card generation, if content exists, show 4 options (cancel / clear-overwrite / fill-empty-only / choose targets).
- **Sub-field merge**: `mergeDescription()` prepends non-empty sub-fields to `description` on **export** as `English label: value` lines (labels in English, per the English-content constraint).
- **Gender swap**: `gender.ts` word-level bidirectional replace, mapping `his→her`, `her→him`, `hers→his`; three-case preservation (see limitations).
- **Dark mode**: `data-theme` attribute + CSS variables (`--bg/--panel/--field-bg/--input-bg/...`); theme persisted with config.
- **Snapshots**: `snapshots[]` in `draft.json` (card/enabled/subFields/timestamp), excluding avatar image; restore keeps the current avatar.
- **Field token count**: shown in the field header; total via `countCardTokens()` (gpt-tokenizer).
- **Default enable policy**: core fields enabled by default; advanced fields disabled by default, but **an imported card keeps an advanced field enabled if it already has content** (avoid data loss on export).

## 9. Build / test / package / 构建 / 测试 / 打包

```bash
pnpm install            # dependencies 依赖
pnpm typecheck          # tsc --noEmit -p tsconfig.json
pnpm test               # vitest run (11 files, 37 cases)
pnpm build              # tsc -p tsconfig.main.json && vite build → out/
pnpm package            # build && electron-builder --win portable → release/
```

- After packaging, rename `release/CharCraft 0.1.0.exe` to `release/CharCraft.exe` (already automated in the script).
- Regression samples: 7 cards in `demo/` (Alaric/Meru/Nina/Rikka/Rikka1/Story Master - Vampire/Veronica).

## 10. Environment & sandbox notes (important!) / 环境与沙箱注意事项(重要!)

Local (DSH sandbox) handling; ignore when moving to a normal environment. 本机(DSH 沙箱)下的特殊处理,迁移到常规环境可忽略:

1. **TypeScript 7 (native compiler)**: `moduleResolution: node10` removed; the main-process tsconfig uses `module: node16` + `moduleResolution: node16`.
2. **pnpm 11**: the `pnpm` field in `package.json` no longer takes effect; `.npmrc` sets `verify-deps-before-run=false` (avoids a pre-run deps self-check crashing in the sandbox); the `electron-winstaller` "ignored builds" warning can be ignored (portable doesn't need it).
3. **Sandbox EPERM**: vite/rolldown/vitest/electron-builder spawn child processes (named pipes), which the current sandbox forbids → run these under `danger-full-access`.
4. **Electron binary download**:
   - the correct cache env var is `electron_config_cache` (lowercase underscore), **not** `ELECTRON_CACHE`;
   - GitHub direct is slow/limited → use `ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/`;
   - electron-builder also needs `ELECTRON_BUILDER_CACHE` and `ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/`.
5. **pnpm store**: `.npmrc` points store/cache/state into the workspace (`.pnpm-store` etc.) to avoid writing to the user directory being blocked by the sandbox.

## 11. Known limitations & suggestions / 已知局限与后续建议

1. No **custom icon** (default Electron icon); no **code signing** (SmartScreen warns on first run).
2. `.charx` is **import-only** (no export); within a `.charx` the avatar only decodes **PNG** (jpg/webp/gif not yet).
3. English **`her` ambiguity** in gender swap (object vs possessive determiner); word-level replace can't fully disambiguate — `her book` may be wrong and needs manual tweaks.
4. The AI pipeline depends on a real API key and has **no end-to-end test** (logic is covered by unit tests).
5. The renderer bundle is ~2.3 MB larger due to the gpt-tokenizer dictionary (acceptable).
6. Possible future work: Recipes/Snippets import/export & sharing, multi-format avatars, context-aware pronoun disambiguation, `.charx` export, automatic versioning of incremental saves.

## 12. Quick commands / 快速命令速查

| Goal 目标 | Command (direct node, bypass pnpm self-check) 命令 |
|---|---|
| Type check 类型检查 | `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json` |
| Test 测试 | `node node_modules/vitest/vitest.mjs run` |
| Main compile 主进程编译 | `node node_modules/typescript/bin/tsc -p tsconfig.main.json` |
| Renderer build 渲染构建 | `node node_modules/vite/bin/vite.js build` |
| Package 打包 | `node node_modules/electron-builder/cli.js --win portable` |
