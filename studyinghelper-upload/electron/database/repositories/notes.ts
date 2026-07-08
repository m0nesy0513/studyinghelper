import { randomUUID } from 'crypto'
import { getDatabase, saveDatabase } from '../connection'
import { queryAll, queryOne, exec } from '../helpers'

export interface NoteRow {
  id: string; course_id: string | null; parent_id: string | null
  title: string; content: string | null; plain_text: string | null
  tags: string | null; is_pinned: number; is_folder: number
  sort_order: number; created_at: string; updated_at: string
}

export const noteRepo = {
  list(filters?: { course_id?: string; parent_id?: string; pinned?: boolean }): NoteRow[] {
    const db = getDatabase()
    let sql = 'SELECT * FROM notes WHERE 1=1'
    const params: unknown[] = []
    if (filters?.course_id) { sql += ' AND course_id = ?'; params.push(filters.course_id) }
    if (filters?.parent_id !== undefined) {
      sql += filters.parent_id === null ? ' AND parent_id IS NULL' : ' AND parent_id = ?'
      if (filters.parent_id !== null) params.push(filters.parent_id)
    }
    if (filters?.pinned) { sql += ' AND is_pinned = 1' }
    sql += ' ORDER BY is_pinned DESC, is_folder DESC, sort_order, updated_at DESC'
    return queryAll<NoteRow>(db, sql, params)
  },

  get(id: string): NoteRow | null {
    return queryOne<NoteRow>(getDatabase(), 'SELECT * FROM notes WHERE id = ?', [id])
  },

  create(data: {
    course_id?: string | null; parent_id?: string | null
    title: string; content?: string; tags?: string
    is_folder?: boolean
  }): NoteRow {
    const db = getDatabase()
    const id = randomUUID()
    const now = new Date().toISOString()
    const plainText = (data.content || '').replace(/[#*`\[\]()>!\-|]/g, '').replace(/\s+/g, ' ').trim()
    exec(db, `INSERT INTO notes (id,course_id,parent_id,title,content,plain_text,tags,is_pinned,is_folder,sort_order,created_at,updated_at) VALUES (?,?,?,?,?,?,?,0,?,0,?,?)`, [
      id, data.course_id ?? null, data.parent_id ?? null, data.title,
      data.content ?? null, plainText, data.tags ?? null,
      data.is_folder ? 1 : 0, now, now,
    ])
    saveDatabase()
    return this.get(id)!
  },

  update(id: string, data: Partial<{
    title: string; content: string | null; course_id: string | null
    parent_id: string | null; tags: string | null
    is_pinned: number; is_folder: number; sort_order: number
  }>): NoteRow | null {
    const db = getDatabase()
    const existing = this.get(id)
    if (!existing) return null
    const fields = { ...existing, ...data, updated_at: new Date().toISOString() }
    if (data.content !== undefined) {
      fields.plain_text = (data.content || '').replace(/[#*`\[\]()>!\-|]/g, '').replace(/\s+/g, ' ').trim()
    }
    exec(db, `UPDATE notes SET title=?,content=?,plain_text=?,course_id=?,parent_id=?,tags=?,is_pinned=?,is_folder=?,sort_order=?,updated_at=? WHERE id=?`, [
      fields.title, fields.content, fields.plain_text, fields.course_id, fields.parent_id,
      fields.tags, fields.is_pinned, fields.is_folder, fields.sort_order, fields.updated_at, id,
    ])
    saveDatabase()
    return this.get(id)
  },

  delete(id: string): boolean {
    const db = getDatabase()
    const changes = exec(db, 'DELETE FROM notes WHERE id = ?', [id])
    saveDatabase()
    return changes > 0
  },

  search(query: string): NoteRow[] {
    const db = getDatabase()
    const pattern = `%${query}%`
    return queryAll<NoteRow>(db, `SELECT * FROM notes WHERE title LIKE ? OR plain_text LIKE ? ORDER BY updated_at DESC LIMIT 50`, [pattern, pattern])
  },
}
