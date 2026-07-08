import { randomUUID } from 'crypto'
import { getDatabase, saveDatabase } from '../connection'
import { queryAll, queryOne, exec } from '../helpers'

export interface ResourceRow {
  id: string; course_id: string | null; title: string; type: string
  stored_path: string | null; original_name: string | null; url: string | null
  mime_type: string | null; file_size: number | null; checksum: string | null
  tags: string | null; notes: string | null; created_at: string; updated_at: string
}

export const resourceRepo = {
  list(filters?: { course_id?: string; type?: string }): ResourceRow[] {
    const db = getDatabase()
    let sql = 'SELECT * FROM resources WHERE 1=1'
    const params: unknown[] = []
    if (filters?.course_id) { sql += ' AND course_id = ?'; params.push(filters.course_id) }
    if (filters?.type) { sql += ' AND type = ?'; params.push(filters.type) }
    sql += ' ORDER BY created_at DESC'
    return queryAll<ResourceRow>(db, sql, params)
  },

  get(id: string): ResourceRow | null {
    return queryOne<ResourceRow>(getDatabase(), 'SELECT * FROM resources WHERE id = ?', [id])
  },

  create(data: {
    course_id?: string | null; title: string; type: string
    stored_path?: string; original_name?: string; url?: string
    mime_type?: string; file_size?: number; checksum?: string; tags?: string; notes?: string
  }): ResourceRow {
    const db = getDatabase()
    const id = randomUUID()
    const now = new Date().toISOString()
    exec(db, `INSERT INTO resources (id,course_id,title,type,stored_path,original_name,url,mime_type,file_size,checksum,tags,notes,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
      id, data.course_id ?? null, data.title, data.type,
      data.stored_path ?? null, data.original_name ?? null, data.url ?? null,
      data.mime_type ?? null, data.file_size ?? null, data.checksum ?? null,
      data.tags ?? null, data.notes ?? null, now, now,
    ])
    saveDatabase()
    return this.get(id)!
  },

  delete(id: string): boolean {
    const db = getDatabase()
    const changes = exec(db, 'DELETE FROM resources WHERE id = ?', [id])
    saveDatabase()
    return changes > 0
  },
}
