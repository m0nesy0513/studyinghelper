# StudyingHelper 数据库工程笔记

> 本文档是 SQLite 数据库的工程实现细节。不是设计文档，是施工文档。
> 写数据库相关代码时必须参照本文档，不要自己猜。

---

## 一、初始化规范

### 1.1 连接创建

```ts
// electron/database/connection.ts
import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (db) return db;

  const dbPath = path.join(app.getPath('userData'), 'studyinghelper.db');

  db = new Database(dbPath);

  // ===== 以下 pragma 必须执行 =====
  db.pragma('journal_mode = WAL');       // 写入不阻塞读取
  db.pragma('foreign_keys = ON');        // 必须！否则 ON DELETE CASCADE 不生效
  db.pragma('busy_timeout = 5000');      // 忙等待 5 秒，避免并发写入时的 SQLITE_BUSY

  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
```

### 1.2 为什么 foreign_keys 必须显式开启

SQLite 默认 `foreign_keys = OFF`。如果不显式 `PRAGMA foreign_keys = ON`：

- `ON DELETE CASCADE` 不会触发
- `REFERENCES` 约束不会校验
- 删课程时关联的课表事件不会自动删除

这个 pragma 是连接级设置，每次连接都要执行。所以必须放在 `getDatabase()` 里。

### 1.3 WAL 模式

```
journal_mode = WAL 的好处：
- 写入不阻塞读取（一个写 + 多个读可同时进行）
- 适合 Electron 桌面应用场景（主进程写，多个查询并发）
- 性能比默认的 DELETE 模式好

代价：
- 会产生 .db-wal 和 .db-shm 文件
- 这两个文件是数据库正常运行的组成部分，不要删除
```

---

## 二、Migration 系统

### 2.1 migrations 表

```sql
CREATE TABLE IF NOT EXISTS migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  applied_at TEXT DEFAULT (datetime('now'))
);
```

### 2.2 执行规则

1. 启动时检查 `migrations` 表
2. 读取最大 `version`
3. 按版本号升序执行 `version > maxVersion` 的 migration
4. 每个 migration 在一个事务内执行
5. 成功 → `INSERT INTO migrations` 记录
6. 失败 → ROLLBACK → 终止启动并报错

### 2.3 Migration 代码结构

```ts
// electron/database/migrations.ts
interface Migration {
  version: number;
  name: string;
  up: (db: Database) => void;
}

const migrations: Migration[] = [
  {
    version: 1,
    name: 'create_courses_and_settings',
    up: (db) => {
      db.exec(`
        CREATE TABLE courses (...);
        CREATE TABLE settings (...);
        CREATE INDEX idx_courses_semester ON courses(semester);
        -- ...
      `);
    },
  },
  {
    version: 2,
    name: 'create_schedule_and_tasks',
    up: (db) => {
      db.exec(`
        CREATE TABLE schedule_events (...);
        CREATE TABLE tasks (...);
        CREATE INDEX ...
      `);
    },
  },
  // ... 更多 migration
];

export function runMigrations(db: Database): void {
  db.exec(`CREATE TABLE IF NOT EXISTS migrations (...)`;

  const currentVersion = db.prepare(
    'SELECT COALESCE(MAX(version), 0) as version FROM migrations'
  ).get() as { version: number };

  const pending = migrations.filter(m => m.version > currentVersion.version);

  for (const m of pending) {
    const run = db.transaction(() => {
      m.up(db);
      db.prepare('INSERT INTO migrations (version, name) VALUES (?, ?)').run(m.version, m.name);
    });
    run();
    console.log(`Migration v${m.version} "${m.name}" applied.`);
  }
}
```

### 2.4 Migration 版本与开发阶段对应

| Migration 版本 | 对应开发阶段 | 创建的表 |
|---|---|---|
| v1 | 阶段 2（课程 + 成绩测算） | courses, settings |
| v2 | 阶段 3（任务与课表） | schedule_events, tasks |
| v3 | 阶段 4（笔记与资料） | notes, resources |
| v4 | 阶段 5（PDF 标注） | pdf_annotations |
| v5 | 阶段 6（资源抓取） | fetch_sources, fetch_logs |
| v6 | 阶段 7（闪卡与错题） | flashcard_decks, flashcards, error_questions |
| v7 | 阶段 8（番茄钟与连击） | pomodoro_sessions |
| v8 | 阶段 10（AI + OCR + 考前冲刺） | ai_conversations, ai_messages, exam_prep |

每个阶段开始时的第一步就是编写对应版本的 migration。

---

## 三、Repository 模式

### 3.1 规范

所有数据库操作封装在 `electron/database/repositories/` 中。
每个 repository 文件导出一个类或一组函数：

```ts
// electron/database/repositories/courses.ts
export const courseRepo = {
  list(filters?: CourseFilters): Course[] { ... },
  get(id: string): Course | null { ... },
  create(data: CreateCourseDTO): Course { ... },
  update(id: string, data: UpdateCourseDTO): Course { ... },
  delete(id: string): void { ... },
};
```

### 3.2 参数化查询

所有 SQL 使用参数化查询，不允许字符串拼接：

```ts
// ✅ 正确
db.prepare('SELECT * FROM courses WHERE category = ? AND is_active = ?').all(category, 1);

// ❌ 错误
db.prepare(`SELECT * FROM courses WHERE category = '${category}'`).all();
```

### 3.3 ID 生成

使用 UUID v4 作为主键（不是自增整数）。理由：
- 分布式友好（未来多端同步预留）
- 前端可以先分配 ID 再持久化
- 避免自增 ID 碰撞

```ts
import { randomUUID } from 'crypto';
const id = randomUUID();
```

### 3.4 JSON 字段处理

`tags` 等 JSON 字段在 DB 中存为 TEXT。
Repository 层负责序列化/反序列化：

```ts
// 写入
tags: JSON.stringify(['心理学', '统计'])

// 读取（在返回给渲染进程前解析）
const row = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
return { ...row, tags: JSON.parse(row.tags || '[]') };
```

---

## 四、索引策略

### 4.1 已建索引（全文）

见 PLAN.md 5.4 节。

### 4.2 索引原则

- 每个外键列建索引（`course_id` 出现在多张表）
- 每个常用筛选列建索引（`status`, `category`, `priority`, `due_date`）
- 每个排序列建索引（`updated_at`, `started_at`）
- 复合索引用于常见查询组合（如 `status + due_date` 是任务页最常用的组合）
- 不在低基数列上单独建索引（如 `is_active` 只有 0/1，但参与复合查询时值得加）

### 4.3 索引维护

- 索引在 migration 中与表一起创建
- 不要在业务代码中动态创建索引
- 如果后续需要新增索引，写一个新的 migration

---

## 五、搜索方案

### 5.1 第一阶段：LIKE 搜索

使用 SQLite 的 `LIKE` 运算符 + `plain_text` 字段：

```ts
// electron/database/repositories/notes.ts
search(query: string): Note[] {
  const pattern = `%${query}%`;
  return db.prepare(`
    SELECT * FROM notes
    WHERE title LIKE ? OR plain_text LIKE ?
    ORDER BY updated_at DESC
    LIMIT 50
  `).all(pattern, pattern);
}
```

### 5.2 LIKE 搜索的局限与对策

| 局限 | 对策 |
|---|---|
| 不支持中文分词 | 用户输入"心理学"，能匹配"心理学导论"（LIKE 本身就是子串匹配，这点是满足的） |
| 不能模糊匹配 | 第一版接受精确子串匹配 |
| 性能 | 50 条笔记 LIKE 扫描很快；超过 500 条笔记时再考虑 FTS5 |

### 5.3 第二阶段（后续）：FTS5

如果后续引入 FTS5，必须完整实现：

#### 建虚拟表

```sql
CREATE VIRTUAL TABLE notes_fts USING fts5(
  title,
  plain_text,
  content='notes',
  content_rowid='rowid'
);
```

#### 同步 Triggers（必须补全，缺一不可）

```sql
-- INSERT 同步
CREATE TRIGGER notes_fts_ai AFTER INSERT ON notes BEGIN
  INSERT INTO notes_fts(rowid, title, plain_text)
  VALUES (new.rowid, new.title, new.plain_text);
END;

-- DELETE 同步
CREATE TRIGGER notes_fts_ad AFTER DELETE ON notes BEGIN
  INSERT INTO notes_fts(notes_fts, rowid, title, plain_text)
  VALUES ('delete', old.rowid, old.title, old.plain_text);
END;

-- UPDATE 同步
CREATE TRIGGER notes_fts_au AFTER UPDATE ON notes BEGIN
  INSERT INTO notes_fts(notes_fts, rowid, title, plain_text)
  VALUES ('delete', old.rowid, old.title, old.plain_text);
  INSERT INTO notes_fts(rowid, title, plain_text)
  VALUES (new.rowid, new.title, new.plain_text);
END;
```

#### 查询方式

```sql
SELECT n.* FROM notes n
JOIN notes_fts fts ON n.rowid = fts.rowid
WHERE notes_fts MATCH ?
ORDER BY rank;
```

#### 错题本的 FTS 同理

错题本的 FTS5 方案与笔记完全对称，三个 trigger 的结构相同。

---

## 六、card_count 字段说明

`flashcard_decks` 表**不包含** `card_count` 列。

每次需要牌组卡片数量时，使用 COUNT 查询：

```sql
SELECT COUNT(*) as count FROM flashcards WHERE deck_id = ?;
```

如果后续性能分析确认这里是热点，可以选择：
- 添加 `card_count` 缓存列 + 通过 TRIGGER 自动维护
- 或添加 Redis/内存缓存层
- 第一版不做优化

不要在 Repository 外面手动维护计数。

---

## 七、课表日期计算

### 7.1 字段含义

| 字段 | 含义 | 示例 |
|---|---|---|
| day_of_week | 每周星期几 | 1 = 周一 |
| start_time | 几点开始 | '14:00' |
| end_time | 几点结束 | '15:30' |
| start_date | 课程开始日期 | '2025-09-01' |
| end_date | 课程结束日期 | '2025-12-20' |
| weeks | 哪些教学周有课 | '1-15' 表示第1到第15周 |
| specific_date | 单次事件日期 | '2025-12-15' 考试日期 |
| is_cancelled | 是否停课 | 调课时设为 1 |

### 7.2 今日课程查询

```sql
-- 查询今天（2025-09-08 周一）有哪些课
SELECT * FROM schedule_events
WHERE start_date <= '2025-09-08'
  AND end_date >= '2025-09-08'
  AND day_of_week = 1           -- 1 = 周一
  AND is_cancelled = 0
  AND (
    specific_date = '2025-09-08'  -- 单次事件匹配具体日期
    OR specific_date IS NULL      -- 或者不是单次事件，按每周规则
  );
```

### 7.3 教学周计算

```ts
// 第N教学周 = 当前日期在 start_date 后的第几周
function getWeekNumber(date: Date, semesterStart: Date): number {
  const diffDays = Math.floor((date.getTime() - semesterStart.getTime()) / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7) + 1;
}
```

如果 `weeks = '1-15'`，只有 `getWeekNumber(today, start_date)` 落在 1-15 时该事件才有效。

---

## 八、数据完整性

### 8.1 事务使用

涉及多表写入的操作必须用事务：

```ts
// 删除课程 → 同时删除关联资源文件
const deleteCourse = db.transaction((courseId: string) => {
  // 1. 先查关联的资源
  const resources = db.prepare('SELECT * FROM resources WHERE course_id = ?').all(courseId);
  // 2. 删数据库记录
  db.prepare('DELETE FROM courses WHERE id = ?').run(courseId);
  // 3. 删文件
  for (const r of resources) {
    fs.unlinkSync(path.join(userData, r.stored_path));
  }
});
```

### 8.2 可选关联处理

对于 `course_id REFERENCES courses(id) ON DELETE SET NULL`：

- 删课程时，任务的 `course_id` 自动设为 NULL
- 任务仍在，但不再关联任何课程
- 前端显示时处理 `course_id` 为 NULL 的情况

对于 `course_id REFERENCES courses(id) ON DELETE CASCADE`：

- 删课程时，关联的课表事件自动删除
- 这符合逻辑：课程删了，课表事件也没意义了

---

## 九、better-sqlite3 与 Electron 兼容性

### 9.1 为什么需要 electron-rebuild

`better-sqlite3` 包含 C++ 原生代码，编译时链接 Node.js 的 ABI。
Electron 内置的 Node.js ABI 可能与系统安装的 Node.js 不同。
如果不重新编译，会出现：

```
Error: The module 'better_sqlite3.node' was compiled against a different
Node.js version using NODE_MODULE_VERSION xxx.
```

### 9.2 解决

```bash
npm install @electron/rebuild -D
```

`package.json` 中：

```json
{
  "scripts": {
    "postinstall": "electron-rebuild -f -w better-sqlite3"
  }
}
```

`-f` 表示强制重新编译；`-w better-sqlite3` 表示只针对这个模块。

### 9.3 打包时注意

`electron-builder` 通常会自动处理 native module。
如果打包后 .exe 启动报 ABI 错误，检查：

1. `node_modules/better-sqlite3/build/Release/better_sqlite3.node` 是否存在
2. 是否对该 Electron 版本做过 rebuild
3. `electron-builder.yml` 中 `nodeGypRebuild: true`

---

## 十、数据库文件位置 — 开发 vs 生产

| 环境 | 数据库路径 |
|---|---|
| 开发 (`npm run dev`) | `app.getPath('userData')` → `%APPDATA%/studyinghelper/` |
| 生产 (`npm run build` 安装后) | 同上，`userData` 路径不变 |
| 测试 (`npm run test`) | 不应使用真实 userData，走环境变量或被 mock |

不要硬编码数据库路径。始终用 `app.getPath('userData')`。

---

## 十一、检查清单

新写数据库相关代码时对照：

- [ ] `foreign_keys` 已开启？
- [ ] 新表有对应 migration？
- [ ] 新表有外键索引？
- [ ] 多表操作在事务内？
- [ ] SQL 使用参数化查询？
- [ ] Repository 封装在 `electron/database/repositories/`？
- [ ] 渲染进程没有直接 import better-sqlite3？
- [ ] JSON 字段在 Repository 层序列化/反序列化？
- [ ] 数据库路径通过 `app.getPath('userData')` 获取？
- [ ] 关闭应用前 `closeDatabase()` 被调用？
