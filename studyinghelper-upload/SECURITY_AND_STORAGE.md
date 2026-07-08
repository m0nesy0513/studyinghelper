# StudyingHelper 安全与存储规范

> 本文档定义 StudyingHelper 的安全边界、文件存储策略、API Key 管理方案和数据导出/导入规则。
> 所有代码实现必须遵守本文档的安全约束。

---

## 一、Electron 安全基线

### 1.1 BrowserWindow 必须配置

```ts
// electron/main.ts — 创建窗口时的不可妥协配置
const mainWindow = new BrowserWindow({
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,    // 必须。渲染进程与主进程 Node 环境隔离
    nodeIntegration: false,    // 必须。渲染进程不能访问 Node.js API
    sandbox: false,            // better-sqlite3 需要主进程 Node 能力，
                               // sandbox 只影响渲染进程，不影响主进程
  },
});
```

### 1.2 安全配置清单

| 配置 | 值 | 原因 |
|---|---|---|
| contextIsolation | true | 防止渲染进程访问 Node.js 全局对象 |
| nodeIntegration | false | 防止渲染进程直接 require('fs') 等 |
| webSecurity | true（默认） | 防止跨域请求 |
| allowRunningInsecureContent | false（默认） | 防止混合内容 |
| experimentalFeatures | false（默认） | 避免未稳定的 Chromium 特性 |
| devTools | 开发模式 true，生产模式 false（可选） | 生产环境可关闭 |

### 1.3 内容安全策略（CSP）

生产环境建议配置 CSP（在 HTML 中或通过主进程设置）：

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'">
```

注意：`'unsafe-inline'` 是 Tailwind / shadcn 需要的（CSS-in-JS 场景可调整）。

---

## 二、IPC 安全边界

### 2.1 白名单原则

preload 只暴露明确设计过的 IPC 通道。每个通道：

- 有明确的频道名（如 `courses:list`）
- 有类型约束（TypeScript DTO）
- 主进程有输入验证（不允许 SQL 注入、路径穿越）

### 2.2 禁止事项（铁律）

| 禁止 | 原因 |
|---|---|
| `ipcRenderer.invoke('file:readFile', arbitraryPath)` | 渲染进程可读任意文件 |
| `ipcRenderer.invoke('file:writeFile', arbitraryPath, data)` | 渲染进程可写任意文件 |
| `ipcRenderer.invoke('db:query', arbitrarySQL)` | SQL 注入 |
| `ipcRenderer.invoke('shell:exec', arbitraryCommand)` | 任意命令执行 |
| preload 暴露 `shell.openPath` 接受渲染进程传入路径 | 路径穿越 |
| preload 暴露 `fs.readFileSync` | 文件越权访问 |
| 渲染进程直接 `import` better-sqlite3 / fs / path / electron | 破坏隔离 |

### 2.3 允许的白名单操作

| 操作 | 对应的 preload API | 安全约束 |
|---|---|---|
| 查询课程列表 | `courses.list(filters)` | 主进程执行 SQL，过滤条件走参数化查询 |
| 新增课程 | `courses.create(data)` | 主进程验证必填字段 |
| 导入资料 | `resources.selectAndImport(options)` | 主进程调用 dialog.showOpenDialog，用户主动选文件 |
| 打开资料 | `resources.open(resourceId)` | 主进程根据 resourceId 查库获取 stored_path |
| 导出数据 | `data.exportAll()` | 主进程调用 dialog.showSaveDialog，用户选保存位置 |
| 设置 API Key | `settings.setEncrypted('deepseek_api_key', key)` | key 传入后主进程加密，渲染进程无法取回原文 |

### 2.4 文件路径安全检查

任何涉及文件路径的操作，主进程必须：

1. 路径来自数据库（`stored_path`），不接受渲染进程传入的任意路径
2. 文件选择通过系统对话框（`dialog.showOpenDialog`），不允许前端传路径字符串
3. 资源打开时做路径校验（确保路径在 `userData` 或 `resources` 目录内）

```ts
// 主进程：打开资源时的路径校验
ipcMain.handle('resources:open', async (_event, resourceId: string) => {
  const resource = resourceRepo.get(resourceId);
  if (!resource?.stored_path) throw new Error('Resource not found');

  const fullPath = path.join(app.getPath('userData'), resource.stored_path);
  // 安全检查：确保解析后的路径在 userData 内
  if (!fullPath.startsWith(app.getPath('userData'))) {
    throw new Error('Invalid resource path');
  }
  await shell.openPath(fullPath);
});
```

---

## 三、本地文件存储方案

### 3.1 存储目录结构

```
# Windows
%APPDATA%/studyinghelper/          # = app.getPath('userData')
├── studyinghelper.db               # SQLite 数据库
├── studyinghelper.db-wal           # WAL 日志（SQLite 自动管理）
├── studyinghelper.db-shm           # WAL 共享内存
├── resources/                      # 用户导入的资料
│   ├── {uuid-v4-1}/
│   │   └── lecture1.pdf
│   ├── {uuid-v4-2}/
│   │   └── statistics_formula.png
│   └── {uuid-v4-3}/
│       └── psychology101_article.pdf
└── backups/                        # 数据导出备份
    ├── studyinghelper_2025-07-01.json
    └── studyinghelper_2025-07-05.json
```

### 3.2 资料导入流程（主进程执行）

```
1. 渲染进程调用 window.api.resources.selectAndImport()
2. 主进程调用 dialog.showOpenDialog() → 用户选择文件
3. 主进程生成 UUID v4 → resourceId
4. 主进程在 userData/resources/{resourceId}/ 下创建目录
5. 主进程 fs.copyFile 将用户文件复制到该目录
6. 主进程计算 SHA-256 checksum
7. 主进程写入数据库 resources 表：
   {
     id: resourceId,
     stored_path: "resources/{resourceId}/{originalName}",
     original_name: "lecture1.pdf",
     mime_type: "application/pdf",
     file_size: 1234567,
     checksum: "sha256...",
   }
8. 主进程返回 { id, title, type, ... } 给渲染进程（不含 stored_path）
```

### 3.3 资料删除流程

```
1. 渲染进程调用 window.api.resources.delete(resourceId)
2. 主进程查 resources 表获取 stored_path
3. 主进程 fs.unlink 删除文件
4. 主进程 fs.rmdir 删除 resourceId 目录
5. 主进程 DELETE FROM resources WHERE id = resourceId
```

### 3.4 为什么不用原始文件路径

| 方式 | 问题 |
|---|---|
| 数据库只存 `C:\Users\...\Desktop\lecture1.pdf` | 用户移动/删除/重命名文件 → 资料打不开 |
| 存应用内部 `userData/resources/{id}/` | 应用完全掌控副本，原文件与副本解耦 |

### 3.5 数据导出/导入

- **导出**：主进程读全库 → 序列化为 JSON → `dialog.showSaveDialog` 用户选保存位置 → 写入 `.json` 文件
- **导入**：`dialog.showOpenDialog` 用户选 `.json` → 主进程读文件 → 验证结构 → 事务写入当前库
- 导出 JSON 包含：courses, schedule_events, tasks, notes, flashcard_decks, flashcards, error_questions, resources(元信息，不含文件), pomodoro_sessions, ai_conversations, ai_messages, settings(不含加密项)
- 注意：**API Key（encrypted=1 的 settings）不导出**
- 资源文件（PDF 等）不随 JSON 导出，如需迁移需单独复制 `resources/` 目录

---

## 四、DeepSeek API Key 安全方案

### 4.1 存储流程

```
用户在前端 Settings 页面输入 API Key
  ↓
渲染进程 window.api.settings.setEncrypted('deepseek_api_key', 'sk-xxx...')
  ↓
主进程 ipcMain.handle('settings:setEncrypted', (key, value) => {
     const buf = safeStorage.encryptString(value);
     const base64 = buf.toString('base64');
     db.run('INSERT OR REPLACE INTO settings (key, value, encrypted) VALUES (?, ?, 1)',
            [key, base64]);
   })
  ↓
API Key 永远不在渲染进程内存中留存。
渲染进程无法通过任何 IPC 调用取回 API Key 原文。
```

### 4.2 读取流程（仅在主进程内）

```
主进程需要发 AI 请求 → 从 settings 表读 value（base64）
  ↓
const buf = Buffer.from(base64, 'base64');
const apiKey = safeStorage.decryptString(buf);
  ↓
用 apiKey 发起 https 请求 → 请求结束后立即释放变量
```

### 4.3 safeStorage 降级

如果当前系统不支持 `safeStorage`（极少数 Linux 环境），必须：

1. 检测 `safeStorage.isEncryptionAvailable()`
2. 不可用时向用户明确提示："当前系统不支持安全加密存储，不建议在此设备保存 API Key"
3. 提供"仅本次会话使用 API Key"的选项（不持久化）
4. 绝对不能降级为明文存储

### 4.4 API Key 管理

- Settings 页可以输入、更新、删除 API Key
- 更新时直接覆盖旧加密值
- 删除时 `DELETE FROM settings WHERE key = 'deepseek_api_key'`
- 永远不要在任何 UI 上显示 API Key 的原文（哪怕是部分）
- 前端只显示"已设置"或"未设置"

---

## 五、AI 请求安全

### 5.1 主进程代理

所有 AI 请求都必须由主进程发起：

```
渲染进程                              主进程                          DeepSeek
──────                              ──────                         ────────
startChat({messages})  ────IPC────→  加密读取 API Key
                                    发起 POST /v1/chat/completions
                                    stream: true         ────────→  返回 SSE 流
                                    ←── on('data') chunk  ←────────
webContents.send('ai:chatChunk')  ←── 转发 chunk
                                    ...
                                    ←── stream end
webContents.send('ai:chatDone')   ←── 保存对话到 SQLite
```

### 5.2 请求取消

```ts
// 主进程
const activeRequests = new Map<string, ClientRequest>();

ipcMain.handle('ai:startChat', async (event, payload) => {
  const requestId = crypto.randomUUID();
  const req = https.request({...});
  activeRequests.set(requestId, req);
  // ...
  req.on('close', () => activeRequests.delete(requestId));
});

ipcMain.handle('ai:cancelChat', async (_event, requestId) => {
  const req = activeRequests.get(requestId);
  if (req) {
    req.destroy();
    activeRequests.delete(requestId);
  }
});
```

### 5.3 网络错误与重试

- 连接超时（30s）→ 返回 `ai:chatError` + 友好提示
- 401 错误 → 提示"API Key 无效"
- 429 错误 → 提示"请求过于频繁，请稍后再试"
- 5xx 错误 → 提示"DeepSeek 服务异常，请稍后重试"
- 不做自动重试（避免重复扣费）

---

## 六、XSS 与渲染进程安全

### 6.1 Markdown 渲染

- 使用 `react-markdown` 渲染笔记内容
- **不**允许用户注入的 Markdown 执行 `<script>` 标签
- `react-markdown` 默认不渲染 HTML，保持默认配置
- 如果后续需要支持 HTML，使用 `rehype-sanitize` 过滤

### 6.2 第三方链接

- 资料库中的外部链接，点击后用 `shell.openExternal(url)` 在系统浏览器打开
- 主进程校验 URL 协议（只允许 `http:` `https:`）

---

## 七、检查清单

安全审查时对照以下清单逐项验证：

### 主进程安全
- [ ] `contextIsolation: true`
- [ ] `nodeIntegration: false`
- [ ] 不存在 `ipcMain.handle('file:readFile', ...)` 接受任意路径
- [ ] 不存在 `ipcMain.handle('file:writeFile', ...)` 接受任意路径
- [ ] 不存在 `ipcMain.handle('db:query', ...)` 接受任意 SQL
- [ ] 文件打开路径经过 `userData` 前缀校验

### API Key
- [ ] API Key 使用 `safeStorage.encryptString` 加密存储
- [ ] settings 表 `encrypted=1` 正确标记
- [ ] preload 没有 `settings.getEncrypted` 这种可读取原文的 API
- [ ] 渲染进程无法通过任何 IPC 调用拿回 API Key 原文
- [ ] API Key 导出时被排除

### 文件存储
- [ ] 资料导入调用 `dialog.showOpenDialog`
- [ ] 文件复制到 `userData/resources/{id}/`
- [ ] 数据库中不存储外部绝对路径
- [ ] 资源删除时同时清理 userData 中的副本

### AI
- [ ] AI 请求由主进程发起
- [ ] 支持取消请求
- [ ] 网络错误有友好提示
- [ ] 对话持久化保存
