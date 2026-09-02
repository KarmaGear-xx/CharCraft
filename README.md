# CharCraft · SillyTavern 角色卡工具

一个类 Ginger 的 **SillyTavern 角色卡开发/编辑工具**,以 Windows 便携版单文件 `.exe` 交付,免安装、双击即用。

A Ginger-like **SillyTavern character card editor**, shipped as a portable Windows `.exe` (no installation required).

> **🚀 本项目全程使用 [DeepSeek](https://www.deepseek.com/) 进行编程开发。**
> **🚀 This project was entirely developed using [DeepSeek](https://www.deepseek.com/).**

## 功能特性 · Features

| English | 中文 |
|---|---|
| **Import/Export**: `.png` (embedded `chara`/`ccv3`), `.json`, `.charx`; export `.json` / `.png` | **导入/导出**:`.png`(内嵌 `chara`/`ccv3`)、`.json`、`.charx`;导出 `.json` / `.png` |
| **Visual form editor**: core + advanced fields, enable/disable, AI rewrite, description sub-fields, fullscreen input | **可视化表单编辑**:核心 + 高级字段、启用/禁用、AI 改写、描述子项、全屏输入 |
| **AI-assisted generation**: whole-card drafting, per-field rewrite, world book entries; main-process direct (no CORS); overwrite protection + cost reminder; fetch model list from server | **AI 辅助生成**:整卡起草、逐字段改写、世界书条目;主进程直连(无 CORS);覆盖保护 + 费用提醒;从服务端拉取模型列表 |
| **World Book**: entry CRUD, AI generation, import/export/merge | **世界书**:条目增删改、AI 生成、导入/导出/合并 |
| **Productivity**: Recipes, Snippets, find & replace, token count & budget | **效率工具**:配方、片段、查找替换、Token 计数与预算 |
| **Extras**: dialogue formatting, avatar crop/resize/import, gender swap, multi-platform extensions, dark mode, version snapshots, EN/中文 UI | **进阶**:对话格式化、头像裁剪/缩放/导入、性别转换、多平台扩展、深色模式、版本快照、中英双语 |

## 下载 · Download

Download the latest `CharCraft.exe` from the **Releases** page (Windows x64, portable).
请到本仓库 **Releases** 页面下载最新 `CharCraft.exe`(Windows x64,免安装)。

> The exe is unsigned, so SmartScreen may show a warning — click "More info" → "Run anyway".
> exe 未做代码签名,SmartScreen 可能提示「未知发布者」,点「更多信息 → 仍要运行」。

## 从源码构建 · Build from source

Requirements: **Node.js ≥ 20** + **pnpm**.
要求:**Node.js ≥ 20** 和 **pnpm**。

```bash
pnpm install
pnpm typecheck   # type check 类型检查
pnpm test        # unit tests 单元测试
pnpm build       # compile → out/ 编译产物
pnpm package     # package → release/CharCraft.exe 打包
```

> In mainland China, if the Electron binary download is slow, use a mirror:
> 中国大陆网络下载 Electron 较慢时,可用镜像:
> `export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/`

## 依赖 · Dependencies

- **Runtime (users)**: none — the exe bundles the Electron runtime.
- **Build**: react / react-dom / zustand / fflate / gpt-tokenizer; dev: electron / electron-builder / vite / typescript / vitest / jsdom (see `package.json`).

- **运行时(用户)**:无 —— exe 内置 Electron 运行时。
- **构建**:react / react-dom / zustand / fflate / gpt-tokenizer;开发依赖 electron / electron-builder / vite / typescript / vitest / jsdom 等(见 `package.json`)。

## 许可 · License

- Code 代码:**MIT**(see `LICENSE` / 见 `LICENSE`)。
- Font 字体 Sarasa Mono SC:**SIL OFL 1.1**(see `THIRD_PARTY_NOTICES.md` / 见 `THIRD_PARTY_NOTICES.md`)。

## 关于 demo 卡 · About the demo cards

The character cards under `demo/` are created by community authors and are used only as regression-test samples; all rights belong to their original authors.

`demo/` 目录内的角色卡为社区创作者作品,仅作导入/导出回归测试样本,版权归原作者所有。

---

相关文档 · Related docs:
`USER_GUIDE.md`(使用指南 / user guide)
`docs/SPEC.md`(需求方案 / spec)
`docs/MAINTENANCE.md`(维护文档 / maintenance guide)
