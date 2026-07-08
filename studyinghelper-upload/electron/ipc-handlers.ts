const { ipcMain, BrowserWindow, app, dialog } = require('electron')
import type { IpcMainInvokeEvent } from 'electron'
import path from 'path'
import fs from 'fs'
import { courseRepo } from './database/repositories/courses'
import { scheduleRepo } from './database/repositories/schedule'
import { taskRepo } from './database/repositories/tasks'
import { settingsRepo } from './database/repositories/settings'
import { noteRepo } from './database/repositories/notes'
import { resourceRepo } from './database/repositories/resources'
import { annotationRepo } from './database/repositories/annotations'
import { fetchSourceRepo, fetchLogRepo } from './database/repositories/fetchSources'
import { deckRepo, cardRepo } from './database/repositories/flashcards'
import { errorQuestionRepo } from './database/repositories/errorQuestions'
import { pomodoroRepo } from './database/repositories/pomodoro'
import { convRepo, msgRepo } from './database/repositories/aiConversations'
import { examPrepRepo } from './database/repositories/examPrep'
import { exec, queryAll } from './database/helpers'
import { getDatabase, saveDatabase } from './database/connection'
import { clipWebPage } from './lib/fetcher/webClipper'
import { searchScholar } from './lib/fetcher/scholarSearch'
import { fetchRss } from './lib/fetcher/rssFetcher'
import { scanMoodle } from './lib/fetcher/moodleFetcher'
import { getCachedArticles, refreshAll } from './lib/fetcher/rssPolling'
import { chatCompletion, ocrImage, hasApiKey } from './lib/ai/client'

type Handler = (event: IpcMainInvokeEvent, ...args: any[]) => any

export function registerAllHandlers(): void {
  // ====== App ======
  ipcMain.handle('app:getVersion', (() => process.env.npm_package_version || '1.0.0') as Handler)
  ipcMain.handle('app:minimize', ((event: IpcMainInvokeEvent) => BrowserWindow.fromWebContents(event.sender)?.minimize()) as Handler)
  ipcMain.handle('app:maximize', ((event: IpcMainInvokeEvent) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.isMaximized() ? win.unmaximize() : win?.maximize()
  }) as Handler)
  ipcMain.handle('app:close', ((event: IpcMainInvokeEvent) => BrowserWindow.fromWebContents(event.sender)?.close()) as Handler)

  // ====== Courses ======
  ipcMain.handle('courses:list', ((_e: IpcMainInvokeEvent, filters: any) => courseRepo.list(filters)) as Handler)
  ipcMain.handle('courses:get', ((_e: IpcMainInvokeEvent, id: string) => courseRepo.get(id)) as Handler)
  ipcMain.handle('courses:create', ((_e: IpcMainInvokeEvent, data: any) => courseRepo.create(data)) as Handler)
  ipcMain.handle('courses:update', ((_e: IpcMainInvokeEvent, id: string, data: any) => courseRepo.update(id, data)) as Handler)
  ipcMain.handle('courses:delete', ((_e: IpcMainInvokeEvent, id: string) => courseRepo.delete(id)) as Handler)

  // ====== Schedule ======
  ipcMain.handle('schedule:list', ((_e: IpcMainInvokeEvent, filters: any) => scheduleRepo.list(filters)) as Handler)
  ipcMain.handle('schedule:get', ((_e: IpcMainInvokeEvent, id: string) => scheduleRepo.get(id)) as Handler)
  ipcMain.handle('schedule:create', ((_e: IpcMainInvokeEvent, data: any) => scheduleRepo.create(data)) as Handler)
  ipcMain.handle('schedule:update', ((_e: IpcMainInvokeEvent, id: string, data: any) => scheduleRepo.update(id, data)) as Handler)
  ipcMain.handle('schedule:delete', ((_e: IpcMainInvokeEvent, id: string) => scheduleRepo.delete(id)) as Handler)

  // ====== Tasks ======
  ipcMain.handle('tasks:list', ((_e: IpcMainInvokeEvent, filters: any) => taskRepo.list(filters)) as Handler)
  ipcMain.handle('tasks:get', ((_e: IpcMainInvokeEvent, id: string) => taskRepo.get(id)) as Handler)
  ipcMain.handle('tasks:create', ((_e: IpcMainInvokeEvent, data: any) => taskRepo.create(data)) as Handler)
  ipcMain.handle('tasks:update', ((_e: IpcMainInvokeEvent, id: string, data: any) => taskRepo.update(id, data)) as Handler)
  ipcMain.handle('tasks:delete', ((_e: IpcMainInvokeEvent, id: string) => taskRepo.delete(id)) as Handler)

  // ====== Settings ======
  ipcMain.handle('settings:get', ((_e: IpcMainInvokeEvent, key: string) => {
    const row = settingsRepo.get(key)
    if (!row || row.encrypted) return null
    return row.value
  }) as Handler)

  ipcMain.handle('settings:set', ((_e: IpcMainInvokeEvent, key: string, value: string) => settingsRepo.set(key, value)) as Handler)
  ipcMain.handle('settings:setEncrypted', ((_e: IpcMainInvokeEvent, key: string, value: string) => settingsRepo.setEncrypted(key, value)) as Handler)

  ipcMain.handle('settings:hasApiKey', (() => {
    const row = settingsRepo.get('deepseek_api_key')
    return !!(row && row.encrypted)
  }) as Handler)

  ipcMain.handle('settings:delete', ((_e: IpcMainInvokeEvent, key: string) => settingsRepo.delete(key)) as Handler)

  // ====== Notes ======
  ipcMain.handle('notes:list', ((_e: IpcMainInvokeEvent, filters: any) => noteRepo.list(filters)) as Handler)
  ipcMain.handle('notes:get', ((_e: IpcMainInvokeEvent, id: string) => noteRepo.get(id)) as Handler)
  ipcMain.handle('notes:create', ((_e: IpcMainInvokeEvent, data: any) => noteRepo.create(data)) as Handler)
  ipcMain.handle('notes:update', ((_e: IpcMainInvokeEvent, id: string, data: any) => noteRepo.update(id, data)) as Handler)
  ipcMain.handle('notes:delete', ((_e: IpcMainInvokeEvent, id: string) => noteRepo.delete(id)) as Handler)
  ipcMain.handle('notes:search', ((_e: IpcMainInvokeEvent, query: string) => noteRepo.search(query)) as Handler)

  // ====== Resources ======
  ipcMain.handle('resources:list', ((_e: IpcMainInvokeEvent, filters: any) => resourceRepo.list(filters)) as Handler)
  ipcMain.handle('resources:get', ((_e: IpcMainInvokeEvent, id: string) => resourceRepo.get(id)) as Handler)
  ipcMain.handle('resources:create', ((_e: IpcMainInvokeEvent, data: any) => resourceRepo.create(data)) as Handler)
  ipcMain.handle('resources:delete', ((_e: IpcMainInvokeEvent, id: string) => resourceRepo.delete(id)) as Handler)
  ipcMain.handle('resources:readFile', ((_e: IpcMainInvokeEvent, resourceId: string) => {
    const resource = resourceRepo.get(resourceId)
    if (!resource || !resource.stored_path) return null
    try {
      const buffer = fs.readFileSync(resource.stored_path)
      return buffer.toString('base64')
    } catch { return null }
  }) as Handler)

  // ====== Annotations ======
  ipcMain.handle('annotations:listByResource', ((_e: IpcMainInvokeEvent, resourceId: string) => annotationRepo.listByResource(resourceId)) as Handler)
  ipcMain.handle('annotations:create', ((_e: IpcMainInvokeEvent, data: any) => annotationRepo.create(data)) as Handler)
  ipcMain.handle('annotations:update', ((_e: IpcMainInvokeEvent, id: string, data: any) => annotationRepo.update(id, data)) as Handler)
  ipcMain.handle('annotations:delete', ((_e: IpcMainInvokeEvent, id: string) => annotationRepo.delete(id)) as Handler)

  // ====== Dialog ======
  ipcMain.handle('dialog:openFile', (async () => {
    const result = await dialog.showOpenDialog({
      title: '导入文件',
      properties: ['openFile'],
      filters: [
        { name: '支持的文件', extensions: ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'mp4', 'webm', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'md', 'csv'] },
        { name: '全部文件', extensions: ['*'] },
      ],
    })
    if (result.canceled || result.filePaths.length === 0) return null

    const srcPath = result.filePaths[0]
    const originalName = path.basename(srcPath)
    const ext = path.extname(originalName).toLowerCase()

    // Determine type
    let type = 'file'
    if (['.pdf'].includes(ext)) type = 'pdf'
    else if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext)) type = 'image'
    else if (['.mp4', '.webm', '.mov'].includes(ext)) type = 'video'

    // Determine mime type
    const mimeMap: Record<string, string> = {
      '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp',
      '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webm': 'video/webm',
    }

    // Create resource first to get an ID
    const resource = resourceRepo.create({
      title: originalName,
      type,
      original_name: originalName,
      mime_type: mimeMap[ext] || 'application/octet-stream',
      file_size: fs.statSync(srcPath).size,
      stored_path: '', // temporary
    })

    // Copy to userData/resources/{id}/
    const destDir = path.join(app.getPath('userData'), 'resources', resource.id)
    fs.mkdirSync(destDir, { recursive: true })
    const destPath = path.join(destDir, originalName)
    fs.copyFileSync(srcPath, destPath)

    // Update stored_path
    exec(getDatabase(), "UPDATE resources SET stored_path = ? WHERE id = ?", [destPath, resource.id])
    saveDatabase()

    return resourceRepo.get(resource.id)
  }) as Handler)

  // ====== Fetch Sources CRUD ======
  ipcMain.handle('fetchSources:list', ((_e: IpcMainInvokeEvent, filters: any) => fetchSourceRepo.list(filters)) as Handler)
  ipcMain.handle('fetchSources:get', ((_e: IpcMainInvokeEvent, id: string) => fetchSourceRepo.get(id)) as Handler)
  ipcMain.handle('fetchSources:create', ((_e: IpcMainInvokeEvent, data: any) => fetchSourceRepo.create(data)) as Handler)
  ipcMain.handle('fetchSources:update', ((_e: IpcMainInvokeEvent, id: string, data: any) => fetchSourceRepo.update(id, data)) as Handler)
  ipcMain.handle('fetchSources:delete', ((_e: IpcMainInvokeEvent, id: string) => fetchSourceRepo.delete(id)) as Handler)
  ipcMain.handle('fetchLogs:list', ((_e: IpcMainInvokeEvent, sourceId: string) => fetchLogRepo.list(sourceId)) as Handler)

  // ====== Fetch Operations ======
  ipcMain.handle('fetch:clipPage', (async (_e: IpcMainInvokeEvent, url: string) => {
    try {
      return { success: true, data: await clipWebPage(url) }
    } catch (e: any) {
      console.error('[clipPage]', url, e)
      return { success: false, error: e?.message || String(e) || '未知错误' }
    }
  }) as Handler)

  ipcMain.handle('fetch:searchScholar', (async (_e: IpcMainInvokeEvent, query: string) => {
    try {
      return { success: true, data: await searchScholar(query) }
    } catch (e: any) {
      console.error('[searchScholar]', query, e)
      return { success: false, error: e?.message || String(e) || '未知错误' }
    }
  }) as Handler)

  ipcMain.handle('fetch:fetchRss', (async (_e: IpcMainInvokeEvent, url: string) => {
    try {
      return { success: true, data: await fetchRss(url) }
    } catch (e: any) {
      console.error('[fetchRss]', url, e)
      return { success: false, error: e?.message || String(e) || '未知错误' }
    }
  }) as Handler)

  ipcMain.handle('fetch:scanMoodle', (async (_e: IpcMainInvokeEvent, url: string, cookie?: string) => {
    try {
      return { success: true, data: await scanMoodle(url, cookie) }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }) as Handler)

  // Save clip/tranScript result directly as a note
  ipcMain.handle('fetch:saveAsNote', (async (_e: IpcMainInvokeEvent, data: { title: string; content: string; course_id?: string | null }) => {
    const note = noteRepo.create({
      title: data.title,
      content: data.content,
      plain_text: data.content.replace(/[#*>`_\-\[\]()!|]/g, ''),
      course_id: data.course_id ?? null,
    })
    return note
  }) as Handler)

  // ====== RSS Polling (cached articles) ======
  ipcMain.handle('rss:getCachedArticles', (async () => {
    return getCachedArticles()
  }) as Handler)

  ipcMain.handle('rss:refreshAll', (async () => {
    return refreshAll()
  }) as Handler)

  // ====== Flashcard Decks ======
  ipcMain.handle('decks:list', ((_e: IpcMainInvokeEvent, filters: any) => deckRepo.list(filters)) as Handler)
  ipcMain.handle('decks:get', ((_e: IpcMainInvokeEvent, id: string) => deckRepo.get(id)) as Handler)
  ipcMain.handle('decks:create', ((_e: IpcMainInvokeEvent, data: any) => deckRepo.create(data)) as Handler)
  ipcMain.handle('decks:update', ((_e: IpcMainInvokeEvent, id: string, data: any) => deckRepo.update(id, data)) as Handler)
  ipcMain.handle('decks:delete', ((_e: IpcMainInvokeEvent, id: string) => deckRepo.delete(id)) as Handler)

  // ====== Flashcards ======
  ipcMain.handle('cards:list', ((_e: IpcMainInvokeEvent, deckId: string) => cardRepo.list(deckId)) as Handler)
  ipcMain.handle('cards:listDue', ((_e: IpcMainInvokeEvent, deckId: string) => cardRepo.listDue(deckId)) as Handler)
  ipcMain.handle('cards:create', ((_e: IpcMainInvokeEvent, data: any) => cardRepo.create(data)) as Handler)
  ipcMain.handle('cards:update', ((_e: IpcMainInvokeEvent, id: string, data: any) => cardRepo.update(id, data)) as Handler)
  ipcMain.handle('cards:delete', ((_e: IpcMainInvokeEvent, id: string) => cardRepo.delete(id)) as Handler)
  ipcMain.handle('cards:countDue', (async () => cardRepo.countDue()) as Handler)

  // ====== Error Questions ======
  ipcMain.handle('errors:list', ((_e: IpcMainInvokeEvent, filters: any) => errorQuestionRepo.list(filters)) as Handler)
  ipcMain.handle('errors:get', ((_e: IpcMainInvokeEvent, id: string) => errorQuestionRepo.get(id)) as Handler)
  ipcMain.handle('errors:create', ((_e: IpcMainInvokeEvent, data: any) => errorQuestionRepo.create(data)) as Handler)
  ipcMain.handle('errors:update', ((_e: IpcMainInvokeEvent, id: string, data: any) => errorQuestionRepo.update(id, data)) as Handler)
  ipcMain.handle('errors:markReviewed', ((_e: IpcMainInvokeEvent, id: string, mastery: number) => errorQuestionRepo.markReviewed(id, mastery)) as Handler)
  ipcMain.handle('errors:delete', ((_e: IpcMainInvokeEvent, id: string) => errorQuestionRepo.delete(id)) as Handler)

  // ====== Pomodoro ======
  ipcMain.handle('pomodoro:list', ((_e, limit) => pomodoroRepo.list(limit)) as Handler)
  ipcMain.handle('pomodoro:listToday', (async () => pomodoroRepo.listToday()) as Handler)
  ipcMain.handle('pomodoro:create', ((_e, data) => pomodoroRepo.create(data)) as Handler)
  ipcMain.handle('pomodoro:complete', ((_e, id, duration) => pomodoroRepo.complete(id, duration)) as Handler)
  ipcMain.handle('pomodoro:cancel', ((_e, id) => pomodoroRepo.cancel(id)) as Handler)
  ipcMain.handle('pomodoro:getStreak', (async () => pomodoroRepo.getStreak()) as Handler)

  // ====== Analytics ======
  ipcMain.handle('analytics:weeklyStudy', ((_e) => {
    const db = getDatabase()
    return queryAll(db, `
      SELECT date(created_at) as day, SUM(duration_minutes) as minutes
      FROM pomodoro_sessions WHERE status='completed' AND created_at >= date('now','-7 days')
      GROUP BY day ORDER BY day
    `)
  }) as Handler)

  ipcMain.handle('analytics:taskStats', ((_e) => {
    const db = getDatabase()
    return queryAll(db, `
      SELECT status, COUNT(*) as count FROM tasks GROUP BY status
    `)
  }) as Handler)

  ipcMain.handle('analytics:gpaTrend', ((_e) => {
    const db = getDatabase()
    return queryAll<{ semester: string; gpa: number }>(db, `
      SELECT COALESCE(semester,'未知') as semester, ROUND(SUM(credits*score)/SUM(credits), 2) as gpa
      FROM courses WHERE score IS NOT NULL GROUP BY semester ORDER BY semester
    `)
  }) as Handler)

  ipcMain.handle('analytics:knowledgeGraph', ((_e) => {
    const db = getDatabase()
    const courses = queryAll<{ id: string; name: string; color: string }>(db, 'SELECT id, name, color FROM courses')
    const notes = queryAll<{ id: string; title: string; course_id: string | null }>(db, 'SELECT id, title, course_id FROM notes WHERE is_folder=0')
    const decks = queryAll<{ id: string; name: string; course_id: string | null }>(db, 'SELECT id, name, course_id FROM flashcard_decks')
    const resources = queryAll<{ id: string; title: string; course_id: string | null }>(db, 'SELECT id, title, course_id FROM resources')
    const errors = queryAll<{ id: string; question: string; course_id: string | null }>(db, 'SELECT id, question, course_id FROM error_questions')
    const edges: { source: string; target: string }[] = []
    const nodes: { id: string; label: string; color: string; type: string }[] = []
    for (const c of courses) { nodes.push({ id: c.id, label: c.name, color: c.color, type: 'course' }) }
    for (const n of notes) {
      nodes.push({ id: n.id, label: n.title.slice(0, 24) || '(无标题)', color: '#3b82f6', type: 'note' })
      if (n.course_id) edges.push({ source: n.course_id, target: n.id })
    }
    for (const d of decks) {
      nodes.push({ id: d.id, label: d.name.slice(0, 24), color: '#22d3ee', type: 'deck' })
      if (d.course_id) edges.push({ source: d.course_id, target: d.id })
    }
    for (const r of resources) {
      nodes.push({ id: r.id, label: r.title.slice(0, 24), color: '#fbbf24', type: 'resource' })
      if (r.course_id) edges.push({ source: r.course_id, target: r.id })
    }
    for (const e of errors) {
      nodes.push({ id: e.id, label: e.question.slice(0, 24), color: '#f87171', type: 'error' })
      if (e.course_id) edges.push({ source: e.course_id, target: e.id })
    }
    // Limit nodes to avoid huge graphs
    const maxNodes = 80
    if (nodes.length > maxNodes) {
      const keep = new Set<string>()
      for (const c of courses) keep.add(c.id)
      for (let i = courses.length; i < Math.min(maxNodes, nodes.length); i++) keep.add(nodes[i].id)
      return { nodes: nodes.filter(n => keep.has(n.id)), edges: edges.filter(e => keep.has(e.source) && keep.has(e.target)) }
    }
    return { nodes, edges }
  }) as Handler)
  // ====== AI ======
  ipcMain.handle('ai:hasKey', (async () => hasApiKey()) as Handler)
  ipcMain.handle('ai:chat', (async (_e, messages: Array<{ role: string; content: string }>) => {
    try {
      return { success: true, content: await chatCompletion(messages) }
    } catch (e: any) { return { success: false, error: e?.message || String(e) } }
  }) as Handler)
  ipcMain.handle('ai:ocr', (async (_e, base64: string, mime?: string) => {
    try {
      return { success: true, text: await ocrImage(base64, mime || 'image/png') }
    } catch (e: any) { return { success: false, error: e?.message || String(e) } }
  }) as Handler)
  // ====== Conversations ======
  ipcMain.handle('conv:list', (async () => convRepo.list()) as Handler)
  ipcMain.handle('conv:get', ((_e, id) => convRepo.get(id)) as Handler)
  ipcMain.handle('conv:create', ((_e, title) => convRepo.create(title)) as Handler)
  ipcMain.handle('conv:delete', ((_e, id) => convRepo.delete(id)) as Handler)
  // ====== Messages ======
  ipcMain.handle('msg:list', ((_e, convId) => msgRepo.list(convId)) as Handler)
  ipcMain.handle('msg:create', ((_e, convId, role, content) => msgRepo.create(convId, role, content)) as Handler)
  // ====== Exam Prep ======
  ipcMain.handle('exam:list', (async () => examPrepRepo.list()) as Handler)
  ipcMain.handle('exam:get', ((_e, id) => examPrepRepo.get(id)) as Handler)
  ipcMain.handle('exam:getByCourse', ((_e, courseId) => examPrepRepo.getByCourse(courseId)) as Handler)
  ipcMain.handle('exam:create', ((_e, data) => examPrepRepo.create(data)) as Handler)
  ipcMain.handle('exam:update', ((_e, id, data) => examPrepRepo.update(id, data)) as Handler)
  ipcMain.handle('exam:delete', ((_e, id) => examPrepRepo.delete(id)) as Handler)
  ipcMain.handle('exam:upcoming', (async () => examPrepRepo.getUpcoming()) as Handler)
}
