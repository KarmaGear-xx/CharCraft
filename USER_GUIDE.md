# CharCraft · User Guide / 使用说明

A Ginger-like **SillyTavern character card editor**, shipped as a portable Windows `.exe`.
一个类 Ginger 的 **SillyTavern 角色卡开发/编辑工具**,以 Windows 便携版单文件 `.exe` 交付。

> This is the Electron desktop edition, fully rewritten. It bundles its own Chromium, so it does not depend on the system browser.
> 本版为 Electron 桌面版,完全重写,内置 Chromium,不依赖系统浏览器。

---

## 1. Run the app / 直接使用(成品)

1. Double-click **`release/CharCraft.exe`** (single portable file, can be moved freely).
   双击 **`release/CharCraft.exe`**(单文件便携版,可随意拷贝移动)。
2. On first run, Windows SmartScreen may warn about an "unknown publisher" — click "More info" → "Run anyway" (the app is not code-signed).
   首次运行 SmartScreen 可能提示「未知发布者」→ 点「更多信息」→「仍要运行」(应用未做代码签名)。
3. Click **Import** and choose a `.png` / `.json` / `.charx` card (native file dialog).
   点顶部「导入」选择 `.png` / `.json` / `.charx` 角色卡(原生文件对话框)。
4. Edit fields, generate with AI, manage the world book, then click **Export .png / Export .json** (native save dialog).
   编辑字段、用 AI 生成、维护世界书,再点「导出 .png / .json」保存(原生另存为对话框)。
5. Reopen the app anytime — your last draft is restored automatically.
   关闭后重新打开,上次草稿会自动恢复。

---

## 2. Features / 功能

- **Import / 导入**: `.png` (embedded `chara`/`ccv3`), `.json`, `.charx`; supports `chara_card_v2` / `chara_card_v3`.
- **Visual form editor / 可视化表单**: core fields + an "Advanced Options" collapse; each field has an enable/disable checkbox and an ✨ AI rewrite button.
- **AI-assisted generation / AI 辅助生成**: whole-card drafting, per-field rewrite, world-book entries; runs in the main process (no CORS); overwrite protection + cost reminder.
- **World book / 世界书**: manual or AI-generated entries, bound to the card and exported with it.
- **Export / 导出**: `.json` and `.png` (writes back the `tEXt` `chara`/`ccv3` chunk, recognized by SillyTavern).
- **Bilingual UI / 中英双语**: switchable; card data field names and content are always English.

---

## 3. AI settings / AI 设置

Fill in three things under **AI Settings**: base URL, API key, model name. Presets for OpenRouter and DeepSeek are built in; custom OpenAI-compatible endpoints are also supported.
顶部「AI 设置」填三项:接口地址 / API Key / 模型名。内置 OpenRouter、DeepSeek 两个预设,也支持自定义 OpenAI 兼容地址。

- The API key is stored **only in the local app-data directory** and is sent only to the provider you configure.
  API Key 只存本机应用数据目录,只发给你填写的服务商。
- The API key may be **left blank** for local OpenAI-compatible servers (Ollama / LM Studio / llama.cpp / vLLM …); set the base URL to e.g. `http://localhost:11434/v1`.
  API Key **可留空**,用于本地 OpenAI 兼容服务(Ollama / LM Studio / llama.cpp / vLLM…);接口地址填如 `http://localhost:11434/v1`。
- **JSON Mode** (`json_object` by default): for local models that reject `json_object` (e.g. LM Studio with some models), set it to **Off** so no `response_format` is sent.
  **JSON 模式**(默认 `json_object`):若本地模型报 `'response_format.type' must be 'json_schema'`(如 LM Studio 部分模型),把该项设为「关闭」即可。
- App-data directory: `%APPDATA%\CharCraft\` (contains `config.json` and `draft.json`).
  应用数据目录:`%APPDATA%\CharCraft\`(含 `config.json` 与 `draft.json`)。

---

## 4. Build from source (optional) / 从源码构建(可选)

Requirements: Node.js ≥ 20, pnpm.
要求:Node.js ≥ 20、pnpm。

```bash
pnpm install
pnpm typecheck   # type check 类型检查
pnpm test        # unit tests 单元测试
pnpm build       # compile main/preload + renderer → out/
pnpm package     # electron-builder → release/CharCraft.exe
```

---

## 5. Directory layout / 目录结构

```
src/
  main/       # Electron main process 主进程
  preload/    # contextBridge (window.api) 安全桥
  renderer/   # React UI + core logic 界面与核心逻辑
  shared/     # shared types + IPC contract 共享类型与 IPC
demo/         # community sample cards (tests) 社区样例卡
tests/        # vitest tests 测试
out/          # build output 构建产物
release/      # packaged output (CharCraft.exe) 打包产物
docs/         # documentation 文档
```

---

## 6. Notes / 说明

- No custom icon yet (default Electron icon) and no code signing — both can be added later.
  尚未设置自定义图标与代码签名,后续可补。
- Uses npm/npmmirror mirrors to download the Electron runtime; build scripts embed mirror + cache config.
  依赖 npm/npmmirror 镜像下载 Electron 运行时;打包脚本已内置镜像与缓存配置。
