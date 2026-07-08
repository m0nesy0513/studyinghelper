import { randomUUID } from 'crypto'
import { getDatabase, saveDatabase } from '../connection'
import { queryAll, queryOne, exec } from '../helpers'

export interface FetchSourceRow {
  id: string; course_id: string | null; type: string
  name: string; url: string; credentials_encrypted: string | null
  last_fetched_at: string | null; fetch_interval_minutes: number | null
  is_active: number; created_at: string
}

export interface FetchLogRow {
  id: string; source_id: string; status: string
  items_found: number; items_new: number
  error_message: string | null; fetched_at: string
}

export const fetchSourceRepo = {
  list(filters?: { type?: string; is_active?: number }): FetchSourceRow[] {
    const db = getDatabase()
    let sql = 'SELECT * FROM fetch_sources WHERE 1=1'
    const params: unknown[] = []
    if (filters?.type) { sql += ' AND type = ?'; params.push(filters.type) }
    if (filters?.is_active !== undefined) { sql += ' AND is_active = ?'; params.push(filters.is_active) }
    sql += ' ORDER BY created_at DESC'
    return queryAll<FetchSourceRow>(db, sql, params)
  },

  get(id: string): FetchSourceRow | null {
    return queryOne<FetchSourceRow>(getDatabase(), 'SELECT * FROM fetch_sources WHERE id = ?', [id])
  },

  create(data: {
    course_id?: string | null; type: string; name: string; url: string
    credentials_encrypted?: string; fetch_interval_minutes?: number
  }): FetchSourceRow {
    const db = getDatabase()
    const id = randomUUID()
    const now = new Date().toISOString()
    exec(db, `INSERT INTO fetch_sources (id,course_id,type,name,url,credentials_encrypted,fetch_interval_minutes,is_active,created_at) VALUES (?,?,?,?,?,?,?,1,?)`, [
      id, data.course_id ?? null, data.type, data.name, data.url,
      data.credentials_encrypted ?? null, data.fetch_interval_minutes ?? 60, now,
    ])
    saveDatabase()
    return this.get(id)!
  },

  update(id: string, data: {
    name?: string; url?: string; credentials_encrypted?: string
    fetch_interval_minutes?: number; is_active?: number; last_fetched_at?: string
  }): FetchSourceRow | null {
    const db = getDatabase()
    const existing = this.get(id)
    if (!existing) return null
    exec(db, `UPDATE fetch_sources SET name=?,url=?,credentials_encrypted=?,fetch_interval_minutes=?,is_active=?,last_fetched_at=? WHERE id=?`, [
      data.name ?? existing.name, data.url ?? existing.url,
      data.credentials_encrypted ?? existing.credentials_encrypted,
      data.fetch_interval_minutes ?? existing.fetch_interval_minutes,
      data.is_active ?? existing.is_active,
      data.last_fetched_at ?? existing.last_fetched_at, id,
    ])
    saveDatabase()
    return this.get(id)
  },

  delete(id: string): boolean {
    const db = getDatabase()
    const changes = exec(db, 'DELETE FROM fetch_sources WHERE id = ?', [id])
    saveDatabase()
    return changes > 0
  },
}

export const fetchLogRepo = {
  list(sourceId: string, limit = 50): FetchLogRow[] {
    return queryAll<FetchLogRow>(getDatabase(),
      'SELECT * FROM fetch_logs WHERE source_id = ? ORDER BY fetched_at DESC LIMIT ?', [sourceId, limit])
  },

  create(data: {
    source_id: string; status: string; items_found?: number; items_new?: number; error_message?: string
  }): FetchLogRow {
    const db = getDatabase()
    const id = randomUUID()
    const now = new Date().toISOString()
    exec(db, `INSERT INTO fetch_logs (id,source_id,status,items_found,items_new,error_message,fetched_at) VALUES (?,?,?,?,?,?,?)`, [
      id, data.source_id, data.status, data.items_found ?? 0, data.items_new ?? 0, data.error_message ?? null, now,
    ])
    saveDatabase()
    return queryOne<FetchLogRow>(db, 'SELECT * FROM fetch_logs WHERE id = ?', [id])!
  },
}
