# StudyingHelper 阶段式开发计划

> 每个阶段必须 `npm run dev` 可运行。
> 每阶段结束后验证完成标准。
> 不允许跨阶段偷跑功能。
> 不允许用假数据页面糊弄。
> 不砍功能，分批次开发。
> 功能总数：20 个模块，分 11 个阶段。

---

## 功能全景与阶段对应

| # | 模块 | 归属阶段 |
|---|---|---|
| 1 | 📚 课程管理 | 阶段 2 |
| 2 | 🔢 成绩测算 | 阶段 2 |
| 3 | 🗓 课表 | 阶段 3 |
| 4 | ✅ 任务 | 阶段 3 |
| 5 | 📝 笔记 | 阶段 4 |
| 6 | 📋 笔记模板 | 阶段 4 |
| 7 | 📂 资料库 | 阶段 4 |
| 8 | 📄 PDF 标注 | 阶段 5 |
| 9 | 🌐 网页剪藏 | 阶段 6 |
| 10 | 🎓 学术检索 | 阶段 6 |
| 11 | 📥 Moodle 拉取 | 阶段 6 |
| 12 | 🎬 视频字幕 | 阶段 6 |
| 13 | 📡 RSS 订阅 | 阶段 6 |
| 14 | 🃏 闪卡 | 阶段 7 |
| 15 | ❌ 错题本 | 阶段 7 |
| 16 | 🍅 番茄钟 | 阶段 8 |
| 17 | 🔥 学习连击 | 阶段 8 |
| 18 | 📊 学习分析 | 阶段 9 |
| 19 | 🧠 知识图谱 | 阶段 9 |
| 20 | 🤖 AI 助手 + 📸 OCR + 📅 考前冲刺 | 阶段 10 |
| — | 🏠 Dashboard | 贯穿 3→10 逐阶段增强 |
| — | ⚙️ 设置 | 阶段 2 基础 + 各阶段按需扩展 |
| — | 📦 打包验证 | 阶段 11 |

---

## 阶段 1：最小可运行桌面壳

### 目标

```
Electron 窗口出来 → React + 路由 + 深色布局出现
```

### 涉及文件

```
package.json
electron.vite.config.ts
tailwind.config.ts
electron/main.ts
electron/preload.ts
src/main.tsx
src/App.tsx
src/index.css
src/components/layout/AppShell.tsx
src/components/layout/Sidebar.tsx
src/components/layout/Topbar.tsx
src/features/dashboard/DashboardPage.tsx       # 占位页
src/features/courses/CoursesPage.tsx            # 占位页
src/features/settings/SettingsPage.tsx          # 占位页
```

### 需要实现

1. `npm create @quick-start/electron` 初始化 react-ts 模板
2. `npm install` 全部基础依赖
3. `npx shadcn@latest init` 初始化
4. Tailwind 3 深色主题 CSS 变量
5. Electron main.ts：BrowserWindow + `contextIsolation: true` + `nodeIntegration: false`
6. preload.ts 空壳
7. React Router：`/` `/courses` `/settings`
8. AppShell + Sidebar + Topbar

### 完成标准

- [ ] `npm install` 成功（含 postinstall rebuild）
- [ ] `npm run dev` → Electron 窗口打开
- [ ] Sidebar 三个导航项可点击切换
- [ ] 深色背景 + 玻璃态边框可见
- [ ] 窗口最小化/最大化/关闭正常

### 测试

```bash
npm install
npm run dev
# → 窗口打开 → 导航切换 → 关闭正常
```

### 禁止

- 不写数据库代码
- 不写 IPC handler
- 不 import better-sqlite3
- 不做任何持久化
- 不写假数据

---

## 阶段 2：课程 CRUD + 成绩测算

### 目标

```
SQLite 创建 → migration 建表 → 课程 CRUD 持久化 → 重启不丢 → GPA 计算 + 反向测算
```

### 涉及文件

```
electron/database/connection.ts
electron/database/migrations.ts
electron/database/repositories/courses.ts
electron/database/repositories/settings.ts
electron/main.ts
electron/preload.ts
src/lib/gpa.ts                                  # GPA 计算 + 反算（纯函数）
src/types/index.ts
src/types/ipc.ts
src/stores/courseStore.ts
src/features/courses/CoursesPage.tsx
src/features/courses/CourseCard.tsx
src/features/courses/CourseForm.tsx
src/features/courses/CourseDetail.tsx
src/features/courses/GradeCalculator.tsx          # 成绩测算组件
```

### 迁移

v1：`courses`、`settings` 表 + 索引

### 需要实现

1. SQLite 连接（`userData/studyinghelper.db`）+ WAL + foreign_keys
2. migrations 表 + v1 migration
3. Course repository：list/get/create/update/delete
4. 主进程 courses IPC + preload 白名单
5. React 课程页面：新增/列表/详情/编辑/删除
6. GPA 计算：`sum(credits * gradePoint) / sum(credits)`
7. **成绩测算**：
   - 已有成绩 → 算当前 GPA
   - "如果期末 XX 分" → 预测最终 GPA
   - 反算："要拿 A 需要期末考多少分"
8. Zustand courseStore

### 完成标准

- [ ] DB 自动创建在 userData
- [ ] 新增课程持久化，重启不丢
- [ ] GPA 计算正确
- [ ] 反向测算结果正确

### 测试

```
新增课程 + 输入已有成绩 → 看 GPA
→ 选一门课"如果期末考 90" → 看到预测 GPA
→ 关闭 → 重启 → 数据在
```

---

## 阶段 3：任务 + 课表 + Dashboard 雏形

### 目标

```
课程→课表→任务三者打通 + Dashboard 显示真实今日数据
```

### 涉及文件

```
electron/database/repositories/schedule.ts
electron/database/repositories/tasks.ts
electron/main.ts
electron/preload.ts
src/stores/taskStore.ts
src/features/schedule/SchedulePage.tsx
src/features/schedule/WeekView.tsx
src/features/schedule/EventForm.tsx
src/features/tasks/TasksPage.tsx
src/features/tasks/TaskCard.tsx
src/features/tasks/TaskForm.tsx
src/features/tasks/TaskKanban.tsx
src/features/dashboard/DashboardPage.tsx          # 真实数据
src/features/dashboard/TodayWidget.tsx
src/features/dashboard/UpcomingTasks.tsx
```

### 迁移

v2：`schedule_events`、`tasks` 表 + 索引

### 需要实现

1. schedule_events 表（含 start_date/end_date）
2. tasks 表
3. 周课表视图
4. 任务列表 + 看板，按状态/优先级筛选
5. Dashboard：今日课程（日期计算）、近期 DDL、待办数量
6. 外键行为：删课程 → 课表 CASCADE / 任务 SET NULL

### 完成标准

- [ ] 课表创建 + 周视图显示
- [ ] 任务看板三列可拖拽切换状态
- [ ] Dashboard 今日课程和 DDL 用真实日期计算
- [ ] 删课程后关联数据行为正确

### 测试

```
创建课程 → 加课表 → 加任务 → Dashboard 显示
→ 删课程 → 课表消失/任务保留
```

---

## 阶段 4：笔记 + 笔记模板 + 资料库

### 目标

```
Markdown 笔记可保存搜索 → 笔记模板可套用 → 资料导入复制到 userData
```

### 涉及文件

```
electron/database/repositories/notes.ts
electron/database/repositories/resources.ts
electron/main.ts
electron/preload.ts
src/stores/noteStore.ts
src/features/notes/NotesPage.tsx
src/features/notes/NoteEditor.tsx
src/features/notes/NoteCard.tsx
src/features/notes/NoteTree.tsx
src/features/notes/TemplateSelector.tsx            # 🆕 模板选择器
src/features/resources/ResourcesPage.tsx
src/features/resources/ResourceCard.tsx
src/components/shared/MarkdownEditor.tsx
src/components/shared/MarkdownViewer.tsx
src/components/shared/SearchBar.tsx
src/lib/noteTemplates.ts                          # 🆕 模板定义（纯数据）
```

### 迁移

v3：`notes`、`resources` 表 + 索引

### 需要实现

1. notes 表（plain_text 搜索字段）
2. resources 表（stored_path/mime_type/checksum）
3. Markdown 编辑器 + 预览
4. 笔记关联课程、文件夹嵌套、置顶
5. LIKE 搜索（title + plain_text）
6. **笔记模板**：康奈尔模板、课堂模板、读书模板、心理学实验模板、自定义模板
7. 资料导入：dialog → 复制到 userData/resources/{id}/ → 写 DB
8. 资料打开/删除

### 笔记模板定义

```ts
// src/lib/noteTemplates.ts
export const NOTE_TEMPLATES = [
  {
    id: 'cornell',
    name: '康奈尔笔记',
    content: `# 课题\n\n## 笔记区\n\n\n## 关键词/问题列\n\n\n## 总结\n\n`,
  },
  {
    id: 'lecture',
    name: '课堂笔记',
    content: `# 课程：\n日期：\n教授：\n\n## 要点\n\n\n## 疑问\n\n\n## 课后待办\n\n`,
  },
  {
    id: 'reading',
    name: '文献阅读',
    content: `# 文献信息\n\n- 标题：\n- 作者：\n- 年份：\n- DOI：\n\n## 核心论点\n\n\n## 方法与数据\n\n\n## 批判与思考\n\n\n## 引用摘录\n\n`,
  },
  {
    id: 'experiment',
    name: '心理学实验',
    content: `# 实验名称\n\n## 假设\n\n\n## 自变量 / 因变量\n\n\n## 被试\n\n\n## 方法\n\n\n## 结果\n\n\n## 局限性\n\n`,
  },
  {
    id: 'blank',
    name: '空白笔记',
    content: '',
  },
];
```

### 完成标准

- [ ] 创建笔记 → Markdown 编辑 → 保存 → 重开内容不变
- [ ] 新建时选择模板，模板内容正确填入
- [ ] 搜索找到笔记
- [ ] 导入 PDF → 删原文件 → 应用内仍能打开
- [ ] 删资料 → DB 和文件副本都清理

### 测试

```
新建笔记 → 选康奈尔模板 → 写内容 → 保存 → 重开
搜索关键词 → 找到
导入 PDF → 删原文件 → 仍可打开
```

---

## 阶段 5：PDF 标注

### 目标

```
资料库的 PDF 可标注 → 划重点 → 写批注 → 导出标注为笔记
```

### 涉及文件

```
electron/database/repositories/annotations.ts
electron/main.ts
electron/preload.ts
src/features/resources/PdfViewer.tsx
src/features/resources/PdfAnnotationLayer.tsx
src/features/resources/AnnotationSidebar.tsx
src/features/resources/ExportAnnotations.tsx
```

### 迁移

v4：`pdf_annotations` 表 + 索引

### 数据模型

```sql
CREATE TABLE pdf_annotations (
  id TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  type TEXT NOT NULL,               -- 'highlight' | 'underline' | 'note' | 'free_text'
  page_number INTEGER NOT NULL,
  rect_json TEXT,                   -- 位置 {x, y, w, h}（百分比坐标，适配缩放）
  color TEXT DEFAULT '#fbbf24',
  text TEXT,                        -- 高亮区域的文本
  comment TEXT,                     -- 批注/笔记内容
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

### 需要实现

1. PDF.js 渲染 PDF 页面
2. 鼠标选择文本 → 高亮/下划线
3. 点击页面添加批注气泡
4. 批注侧边栏（按页码排序）
5. 筛选（只看高亮/只看批注）
6. 导出：选中标注 → 一键生成 Markdown 笔记
7. 标注与 resource 关联，删资料时 CASCADE

### 完成标准

- [ ] 打开 PDF → 渲染正常
- [ ] 选中文本 → 高亮 → 保存 → 重开可见
- [ ] 添加批注 → 侧边栏显示
- [ ] 导出标注 → 生成笔记成功

### 测试

```
导入 PDF → 打开 → 划 3 个高亮 → 写 2 个批注
→ 关闭 → 重开 → 标注仍在
→ 导出 → 笔记里出现标注内容
```

---

## 阶段 6：资源抓取

### 目标

```
网页剪藏 + 学术检索 + Moodle 拉取 + 视频字幕 + RSS 订阅
```

### 涉及文件

```
electron/database/repositories/fetchSources.ts
electron/lib/fetcher/
  ├── webClipper.ts           # 网页正文提取
  ├── scholarSearch.ts        # Semantic Scholar / PubMed
  ├── moodleFetcher.ts        # UMMoodle 扫描
  ├── transcriptFetcher.ts    # YouTube / B站字幕
  └── rssFetcher.ts           # RSS 解析 + 定时
electron/main.ts
electron/preload.ts
src/features/resources/ResourceFetcher.tsx
src/features/resources/FetchSourceList.tsx
src/features/resources/FetchSourceForm.tsx
src/features/resources/RssFeedView.tsx
```

### 迁移

v5：`fetch_sources`、`fetch_logs` 表 + 索引

### 数据模型

```sql
CREATE TABLE fetch_sources (
  id TEXT PRIMARY KEY,
  course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
  type TEXT NOT NULL,              -- 'rss' | 'moodle' | 'scholar' | 'youtube' | 'bilibili' | 'web'
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  credentials_encrypted TEXT,      -- safeStorage 加密
  last_fetched_at TEXT,
  fetch_interval_minutes INTEGER,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE fetch_logs (
  id TEXT PRIMARY KEY,
  source_id TEXT REFERENCES fetch_sources(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  items_found INTEGER DEFAULT 0,
  items_new INTEGER DEFAULT 0,
  error_message TEXT,
  fetched_at TEXT DEFAULT (datetime('now'))
);
```

### 各子功能实现

#### 6.1 网页剪藏
```
粘贴 URL → 主进程 HTTP 获取 HTML → @mozilla/readability 提取正文
→ 渲染成 Markdown → 存为笔记 → 图片自动下载到资料库
```

#### 6.2 学术检索
```
输入关键词 → 调 Semantic Scholar API（免费无 Key）→ 返回论文列表
→ 查看摘要 → 一键保存引用信息到资料库（type='link' url=DOI）
→ 可选：设置关键词监控，新论文自动提醒
```

#### 6.3 Moodle 拉取
```
配置课程 Moodle 链接 + 账号 Cookie → 扫描资源页
→ 列出所有文件/链接 → 用户勾选 → 批量下载 → 自动关联对应课程
→ Cookie 用 safeStorage 加密存储
```

#### 6.4 视频字幕
```
粘贴 YouTube/B站链接 → 主进程调 transcript API
→ 返回字幕文本（含时间戳可选）→ 存为 Markdown 笔记 → 关联课程
→ B站字幕需支持语言选择（中文/英文）
```

#### 6.5 RSS 订阅
```
添加 RSS 源 URL → 主进程定时（用户可设间隔）解析 XML
→ 有新条目时系统通知 → 点击查看 → 一键收藏到资料库
→ 可按课程/标签筛选
```

### 完成标准

- [ ] 粘贴网页 URL → 正文提取 → 存为笔记
- [ ] 检索论文 → 看到结果 → 保存引用
- [ ] Moodle 扫描到资源列表 → 选中下载
- [ ] 视频链接 → 字幕存为笔记
- [ ] RSS 新文章 → 通知 → 可收藏

### 测试

```
粘贴一篇 Medium 文章 URL → 生成 Markdown 笔记
搜索 "cognitive behavioral therapy" → 论文列表出现
配置 RSS → 等来新文章 → 收到通知
```

---

## 阶段 7：闪卡 + 错题本

### 目标

```
SM-2 间隔重复复习流程 + 错题本追踪
```

### 涉及文件

```
electron/database/repositories/flashcards.ts
electron/database/repositories/errorQuestions.ts
electron/main.ts
electron/preload.ts
src/lib/spaced-repetition.ts
src/stores/flashcardStore.ts
src/features/flashcards/FlashcardsPage.tsx
src/features/flashcards/DeckList.tsx
src/features/flashcards/DeckForm.tsx
src/features/flashcards/StudySession.tsx
src/features/flashcards/CardForm.tsx
src/features/errorbook/ErrorBookPage.tsx
src/features/errorbook/ErrorCard.tsx
src/features/errorbook/ErrorForm.tsx
```

### 迁移

v6：`flashcard_decks`、`flashcards`、`error_questions` 表 + 索引

### 需要实现

1. 牌组管理（不含 card_count 冗余字段）
2. 卡片正反面编辑（支持 Markdown）
3. SM-2 复习流程：到期卡片 → 正面→翻转→背面→评分→更新参数
4. 错题本：题目/正确答案/错误答案/原因/来源
5. 掌握度标记 + 复习次数追踪

### 完成标准

- [ ] 创建牌组 → 添加卡片 → 进入复习
- [ ] 评分后 next_review 正确更新
- [ ] 错误后 interval 重置 + lapses 增加
- [ ] 下次只看到到期卡片
- [ ] 错题可记录/编辑/标记掌握

### 测试

```
创建牌组 → 3 张卡片 → 复习 → 评分 → 验证 next_review
→ 重启 → 到期卡片数正确
```

---

## 阶段 8：番茄钟 + 学习连击

### 目标

```
计时记录持久化 + 连续学习天数激励 + 连击徽章
```

### 涉及文件

```
electron/database/repositories/pomodoro.ts
electron/database/repositories/streaks.ts
electron/main.ts
electron/preload.ts
src/features/pomodoro/PomodoroPage.tsx
src/features/pomodoro/Timer.tsx
src/features/pomodoro/SessionLog.tsx
src/features/dashboard/StudyStreak.tsx            # 🆕 连击组件
src/lib/streaks.ts                                # 🆕 连击计算（纯函数）
```

### 迁移

v7：`pomodoro_sessions` 表 + 索引（streaks 可通过查询计算，不新增表）

### 需要实现

1. 番茄钟计时器：开始/暂停/完成，关联 task_id
2. **学习连击**：
   - 每天有 ≥25 分钟学习 → 连击 +1
   - Dashboard 显示当前连击天数、最长记录
   - 里程碑徽章：7天 / 30天 / 100天 / 365天
   - 断连去重（一天只算一次）
3. 番茄钟历史记录

### 完成标准

- [ ] 25 分钟完成 → pomodoro_sessions 有记录
- [ ] 连击天数正确（每日纯 SQL 聚合去重日期）
- [ ] 里程碑徽章触发（7天显示铜牌图标）

### 测试

```
完成番茄钟 → 连击数 +1 → 第二天继续 → 连续 7 天 → 徽章弹出
```

---

## 阶段 9：学习分析 + 知识图谱

### 目标

```
学习数据可视化 + 知识网络关系图
```

### 涉及文件

```
src/features/analytics/AnalyticsPage.tsx
src/features/analytics/StudyTimeChart.tsx
src/features/analytics/GradeTracker.tsx
src/features/analytics/KnowledgeGraph.tsx          # 🆕 知识图谱
src/features/dashboard/DashboardPage.tsx           # 增强：图谱摘要
```

### 无需新迁移（使用已有表数据聚合）

### 需要实现

1. 图表（Recharts）：
   - 每日/每周学习时长柱状图
   - 任务完成率饼图
   - GPA 趋势折线图
   - 闪卡复习统计
2. **知识图谱**：
   - 以课程为根节点
   - 课程 → 笔记 → 笔记引用关系 → 闪卡牌组 → 资料 → 错题
   - 用力导向图（d3-force 或 react-flow）可视化
   - 点击节点跳转到对应资源
   - 颜色区分：课程=紫、笔记=蓝、闪卡=绿、错题=红

### 完成标准

- [ ] 所有图表用 SQLite 真实数据渲染
- [ ] 知识图谱显示课程→笔记→闪卡→资料的关系网
- [ ] 点击图谱节点可跳转

### 测试

```
完成几次番茄钟 → 分析页 → 本周时长柱状图正确
→ 知识图谱 → 看到课程及其关联资源的网络
```

---

## 阶段 10：AI 助手 + OCR + 考前冲刺

### 目标

```
DeepSeek 流式对话 → 结构化生成闪卡/题目/摘要 → OCR 识字 → 考试倒计时冲刺
```

### 涉及文件

```
electron/lib/ai/
  ├── client.ts                # DeepSeek HTTP 客户端
  ├── chat.ts                  # 流式对话
  ├── structured.ts            # 结构化输出
  └── ocr.ts                   # 🆕 OCR 请求
electron/database/repositories/aiConversations.ts
electron/database/repositories/examPrep.ts          # 🆕 考前冲刺
electron/main.ts
electron/preload.ts
src/stores/aiStore.ts
src/features/ai/AIPage.tsx
src/features/ai/ChatPanel.tsx
src/features/ai/FlashcardGenerator.tsx
src/features/ai/QuizGenerator.tsx
src/features/ai/Summarizer.tsx
src/features/ai/OcrUploader.tsx                     # 🆕 OCR 上传
src/features/exam/ExamPrepPage.tsx                  # 🆕 考前冲刺
src/features/exam/ExamCountdown.tsx
src/features/exam/ExamStudyPlan.tsx
src/features/dashboard/DashboardPage.tsx             # 增强：考试倒计时
```

### 迁移

v8：`ai_conversations`、`ai_messages`、`exam_prep` 表 + 索引

### 需要实现

#### 10.1 AI 助手
- API Key 加密存储（safeStorage）
- 流式对话 + 取消
- 对话历史持久化
- 菜单式工具调用：
  - "从这篇笔记生成闪卡" → 结构化输出（返回 JSON 数组）→ 一键导入牌组
  - "根据课程内容出 5 道选择题" → 返回 JSON → 可保存到错题本
  - "总结这篇文章" → Markdown 输出 → 可存为新笔记

#### 10.2 OCR 拍照识字（🆕）
- 选择图片 → 主进程转 base64
- 调 DeepSeek Vision API（或本地 OCR 库如 tesseract.js）
- 返回识别文本 → 渲染成 Markdown
- 一键：存为笔记 / 生成闪卡 / 提取知识点
- 场景：拍课本页、讲义、手写笔记

#### 10.3 考前冲刺（🆕）
- 设定考试日期 + 关联课程 + 目标分数
- **自动拆分复习任务**：
  - 根据考试日期倒推，每日分配闪卡复习量
  - 错题本薄弱点优先推送
  - 每日清单：今天该复习什么
- Dashboard 倒计时组件
- 进度条：已复习 X / 总需要复习 Y

```sql
CREATE TABLE exam_prep (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  exam_date TEXT NOT NULL,
  target_score REAL,
  auto_generate_tasks INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### 完成标准

- [ ] API Key 加密 → 流式对话正常 → 重启后对话历史在
- [ ] 拍照 → OCR 识别 → 文本正确 → 生成笔记/闪卡
- [ ] 设置考试日期 → Dashboard 出现倒计时
- [ ] 自动生成每日复习清单
- [ ] AI 生成闪卡可一键导入牌组

### 测试

```
输入 API Key → 对话 → 看到流式回复
拍课本页 → OCR → 存为笔记
设置考试 → 30 天后 → 看到倒计时 + 每日任务
```

---

## 阶段 11：打包与稳定性验证

### 目标

```
electron-builder → .exe → 安装后全部功能正常
```

### 涉及文件

```
electron-builder.yml
package.json
electron/main.ts                      # 生产路径适配
```

### 需要实现

1. electron-builder Windows NSIS 配置
2. 验证 userData 路径在打包后正确
3. 验证 better-sqlite3 打包后无 ABI 错误
4. preload 路径生产环境适配
5. 窗口状态持久化
6. 关闭/最小化/托盘行为

### 完成标准与测试

```bash
npm run build
# → 安装 exe → 每个阶段的所有功能全跑一遍
# → 课程 CRUD → 课表 → 笔记+模板 → PDF 标注 → 抓取 → 闪卡 → OCR → AI
# → 重启 → 全部数据在
# → API Key 加密正常
# → 资料文件原位置删除后仍可打开
```

---

## 开发铁律

1. `npm run dev` 随时可运行
2. 每阶段完成后再进下一阶段
3. 数据库只在主进程，渲染只走 IPC
4. preload 白名单 + 不暴露任意文件读写
5. API Key 加密，主进程代理 AI 请求
6. 流式输出可取消
7. 文件导入复制到 userData，不存外部路径
8. 不做假数据页面
9. 每阶段开始先写 migration
10. 每阶段结束逐项对照完成标准验证
