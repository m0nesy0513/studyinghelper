# StudyingHelper 开发进度

> 最后更新：2026-07-08
> 当前阶段：验收中 — 阶段 4/6/8/9/10 全功能验证

## 项目状态总览

| 阶段 | 状态 | 说明 |
|---|---|---|
| 1 | ✅ | 桌面壳 |
| 2 | ✅ | 课程 + 成绩测算 |
| 3 | ✅ | 课表 + 任务 |
| 4 | 🔧 待验收 | 笔记 + 模板 + 资料库 |
| 5 | ✅ | PDF 查看 (Chromium原生 + pdf://协议) |
| 6 | 🔧 待验收 | 资源抓取 — RSS添加按钮已修复(+反馈+容错)，待验证 |
| 7 | ✅ | 闪卡(SM-2/浏览模式/管理模式) + 错题本 |
| 8 | 🔧 待验收 | 番茄钟(25+5/进度环/连击/里程碑) |
| 9 | 🔧 待验收 | 学习分析(Recharts图表/知识图谱SVG) |
| 10 | 🔧 待验收 | AI(DeepSeek对话/OCR/闪卡生成/考试倒计时) |
| 11 | ⏳ | 打包 .exe (electron-builder) |

## 2026-07-08 修复记录

### 🔧 修复 1：Electron 启动崩溃 (P0)
- **根因**: [Electron Bug #49034](https://github.com/electron/electron/issues/49034) — Windows 上 `require('electron')` 返回 npm 包路径字符串而非内置 API 模块
- **修复**:
  - `electron.vite.config.ts`: 主进程构建添加 `output.banner`，在编译输出开头注入 `delete process.env.ELECTRON_RUN_AS_NODE`
  - `electron/main.ts`: 顶部添加同样的 delete 兜底
  - `dev.bat`: 增强 env var 检查和警告
- **注意**: 如果 `ELECTRON_RUN_AS_NODE=1`（非空），需先 `unset`/删除该变量才能启动

### 🔧 修复 2：RSS 添加按钮无响应 (P1)
- **根因**: `handleAdd()` 中 `if (!url.trim()) return` 静默返回，用户未填 URL 时无任何反馈
- **修复** (`ResourceFetcher.tsx` RSS 标签):
  - 添加 `urlError` 状态：空 URL 时显示红色错误提示"请输入 RSS 订阅地址"
  - 错误输入框红色边框高亮 `!border-red-400`
  - 输入时自动清除错误状态
  - `refresh()` 和 `handleSaveItem()` 添加 try/catch 容错
  - URL placeholder 改为"RSS URL (必填)"，名称改为"源名称 (可选)"
  - 按钮图标改为 Plus 图标始终显示

## 新对话快速启动提示词

```
我正在开发 StudyingHelper，一个 Electron + React + TypeScript + sql.js 的桌面学习工具。

项目在 d:/VIBECODING/studyinghelper/
启动方式：双击 dev.bat

当前进度见 PROGRESS.md。
请先阅读 PROGRESS.md 和 DEVELOPMENT_STAGES.md。

⚠️ 数据库是 sql.js，Electron API 必须用 require('electron') 不能用 import。
当前任务：修复阶段 6 RSS 添加按钮无响应问题，然后继续全功能验收。
```
