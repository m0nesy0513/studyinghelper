# StudyingHelper

面向澳门大学心理学本科生的全科本地优先桌面学习辅助工具。覆盖心理学专业课 + GE 通识课 + FE 自由选修课。

## 项目定位

- **本地优先**：所有数据存本地 SQLite，断网不影响核心功能
- **桌面原生**：Windows .exe 应用，非网页套壳
- **全科覆盖**：不只限心理学，支持所有课程类型
- **AI 增强**：接入 DeepSeek API，辅助生成闪卡、出题、总结、OCR

## 技术栈

| 层 | 选型 |
|---|---|
| 桌面壳 | Electron（当前稳定版） |
| 构建 | electron-vite |
| UI | React 18 + TypeScript 5 |
| 样式 | Tailwind CSS 3 + shadcn/ui |
| 动画 | Framer Motion |
| 状态管理 | Zustand |
| 路由 | React Router 6 |
| 数据库 | better-sqlite3（仅主进程） |
| 图表 | Recharts |
| 公式 | KaTeX |
| AI | DeepSeek API（主进程代理） |
| 打包 | electron-builder |

## 功能模块（20 个）

### 核心学习
| 模块 | 说明 |
|---|---|
| 📚 课程管理 | 录入课程、分类（心理/GE/FE/语言/其他）、学分、教授、学期 |
| 🔢 成绩测算 | GPA 计算、预测期末成绩、反向算"要拿 A 需要多少分" |
| 🗓 课表 | 周视图、日期范围计算、考试/调课单次事件、停课标记 |
| ✅ 任务管理 | 看板视图、DDL 追踪、优先级、权重/得分 |
| 📝 笔记系统 | Markdown + KaTeX、文件夹嵌套、全文搜索、课程关联 |
| 📋 笔记模板 | 康奈尔/课堂/文献阅读/心理学实验模板，新建一键套用 |
| 🃏 闪卡 | SM-2 间隔重复、牌组管理、每日自动安排复习量 |
| ❌ 错题本 | 记录错因、来源归类、掌握度追踪 |

### 资料工具
| 模块 | 说明 |
|---|---|
| 📂 资料库 | PDF/图片/链接归集，导入自动复制到应用内部 |
| 📄 PDF 标注 | 高亮/下划线/批注，导出标注为 Markdown 笔记 |
| 🌐 网页剪藏 | 粘贴 URL → 正文提取 → 存为笔记 |
| 🎓 学术检索 | 关键词搜 Semantic Scholar → 保存论文引用 |
| 📥 Moodle 拉取 | 扫描 UMMoodle 资源 → 批量下载 → 自动关联课程 |
| 🎬 视频字幕 | YouTube/B站链接 → 抓字幕 → 存为笔记 |
| 📡 RSS 订阅 | 期刊/Blog 订阅，新文章通知，一键收藏 |

### 效率与激励
| 模块 | 说明 |
|---|---|
| 🍅 番茄钟 | 25+5 计时、关联任务、历史记录 |
| 🔥 学习连击 | 每日学习打卡、连击天数、里程碑徽章（7/30/100/365天） |
| 📊 学习分析 | 时长图表、任务完成率、GPA 走势、闪卡复习统计 |
| 🧠 知识图谱 | 课程→笔记→闪卡→资料→错题的关系网络可视化 |

### AI 与冲刺
| 模块 | 说明 |
|---|---|
| 🤖 AI 助手 | DeepSeek 流式对话、自动生成闪卡/练习题/笔记摘要 |
| 📸 OCR 拍照识字 | 拍课本/讲义 → 识别文字 → 存笔记/生成闪卡 |
| 📅 考前冲刺 | 设定考试日期 → 自动拆分每日复习任务 → 倒计时 |

### 系统
| 模块 | 说明 |
|---|---|
| 🏠 Dashboard | 今日课程 + 待办 DDL + 到期闪卡 + 学习连击 + 考试倒计时 |
| ⚙️ 设置 | API Key 加密管理、数据导出/导入（JSON）、提醒设置 |

## 开发环境要求

- **Node.js**：20 LTS 或更高
- **npm**：10.x 或更高（或 pnpm 9.x）
- **操作系统**：Windows 10/11（开发目标平台）
- **Git**：版本管理
- **VS Code**：推荐编辑器

## 开发启动

```bash
# 1. 克隆项目
git clone <repo-url>
cd studyinghelper

# 2. 安装依赖（postinstall 自动 rebuild better-sqlite3）
npm install

# 3. 启动开发模式
npm run dev
```

## 数据存储位置

所有用户数据存储在 Electron `userData` 目录：

```
# Windows
%APPDATA%/studyinghelper/
├── studyinghelper.db       # SQLite 数据库
├── resources/              # 导入的资料文件
└── backups/                # 数据导出备份
```

## 打包

```bash
npm run build
```

输出在 `release/` 目录，生成 Windows `.exe` 安装包。

## 架构文档

| 文档 | 内容 |
|---|---|
| [PLAN.md](PLAN.md) | 完整架构设计 — 技术栈、IPC、数据库、路由、安全 |
| [DEVELOPMENT_STAGES.md](DEVELOPMENT_STAGES.md) | 11 阶段开发计划，每阶段目标/标准/测试 |
| [SECURITY_AND_STORAGE.md](SECURITY_AND_STORAGE.md) | Electron 安全、文件存储、API Key 加密 |
| [DATABASE_NOTES.md](DATABASE_NOTES.md) | SQLite 工程细节、migration 规范、索引、搜索 |
| [UI-DESIGN-BRIEF.md](UI-DESIGN-BRIEF.md) | UI 设计竞标邀请书 |

## 常见问题

**Q: 为什么渲染进程不能直接访问 SQLite？**
A: Electron 安全隔离原则。渲染进程是浏览器环境，不应拥有文件系统和数据库的直接访问权。所有数据操作通过 IPC 白名单桥接。

**Q: API Key 存哪里？安全吗？**
A: 用 Electron `safeStorage` API 加密后存 SQLite settings 表。渲染进程永远拿不到 Key 原文。AI 请求由主进程代理发送。

**Q: 能不能在 macOS / Linux 用？**
A: 首版目标 Windows。electron-builder 理论上可跨平台打包，但不在首版验证范围。

**Q: 数据怎么备份？**
A: 设置页有"导出数据"功能，导出完整 JSON。也可以直接复制 `userData` 目录下的 `studyinghelper.db` 文件。
