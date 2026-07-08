const { app } = require('electron')
import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js'
import path from 'path'
import fs from 'fs'

let db: SqlJsDatabase | null = null
let dbPath: string = ''

export async function initDatabase(): Promise<SqlJsDatabase> {
  if (db) return db

  dbPath = path.join(app.getPath('userData'), 'studyinghelper.db')
  const SQL = await initSqlJs()

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  db.run('PRAGMA journal_mode = WAL')
  db.run('PRAGMA foreign_keys = ON')
  db.run('PRAGMA busy_timeout = 5000')

  return db
}

export function getDatabase(): SqlJsDatabase {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.')
  return db
}

export function saveDatabase(): void {
  if (!db) return
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  fs.writeFileSync(dbPath, buffer)
}

export function closeDatabase(): void {
  if (db) {
    saveDatabase()
    db.close()
    db = null
  }
}

// Auto-save every 30 seconds
let autoSaveTimer: NodeJS.Timeout | null = null
export function startAutoSave(): void {
  if (autoSaveTimer) return
  autoSaveTimer = setInterval(() => {
    if (db) saveDatabase()
  }, 30_000)
}

export function stopAutoSave(): void {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
    autoSaveTimer = null
  }
}
