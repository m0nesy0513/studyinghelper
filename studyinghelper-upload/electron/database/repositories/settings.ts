import { getDatabase, saveDatabase } from '../connection'
import { queryOne, exec } from '../helpers'

export const settingsRepo = {
  get(key: string): { key: string; value: string; encrypted: number } | null {
    const db = getDatabase()
    return queryOne<{ key: string; value: string; encrypted: number }>(db, 'SELECT * FROM settings WHERE key = ?', [key])
  },

  set(key: string, value: string): void {
    const db = getDatabase()
    exec(db, 'INSERT OR REPLACE INTO settings (key, value, encrypted, updated_at) VALUES (?, ?, 0, ?)', [key, value, new Date().toISOString()])
    saveDatabase()
  },

  setEncrypted(key: string, plainText: string): void {
    // sql.js runs in main process which has Node.js safeStorage access
    // But for simplicity in stage 1-3, we store in a simple obfuscated way
    // Stage 7 will add proper safeStorage integration
    const db = getDatabase()
    const encoded = Buffer.from(plainText).toString('base64')
    exec(db, 'INSERT OR REPLACE INTO settings (key, value, encrypted, updated_at) VALUES (?, ?, 1, ?)', [key, encoded, new Date().toISOString()])
    saveDatabase()
  },

  getDecrypted(key: string): string | null {
    const row = this.get(key)
    if (!row) return null
    if (!row.encrypted) return row.value
    return Buffer.from(row.value, 'base64').toString('utf8')
  },

  delete(key: string): void {
    exec(getDatabase(), 'DELETE FROM settings WHERE key = ?', [key])
    saveDatabase()
  },
}
