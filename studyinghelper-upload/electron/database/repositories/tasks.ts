import { randomUUID } from 'crypto'
import { getDatabase, saveDatabase } from '../connection'
import { queryAll, queryOne, exec } from '../helpers'

export interface TaskRow {
  id: string
  course_id: string | null
  title: string
  description: string | null
  type: string
  due_date: string | null
  priority: number
  status: string
  estimated_minutes: number | null
  actual_minutes: number | null
  weight: number | null
  grade: number | null
  tags: string | null
  created_at: string
  updated_at: string
}

export interface TaskFilters {
  course_id?: string
  status?: string
  priority?: number
  search?: string
}

export const taskRepo = {
  list(filters?: TaskFilters): TaskRow[] {
    const db = getDatabase()
    let sql = 'SELECT * FROM tasks WHERE 1=1'
    const params: unknown[] = []

    if (filters?.course_id) { sql += ' AND course_id = ?'; params.push(filters.course_id) }
    if (filters?.status) { sql += ' AND status = ?'; params.push(filters.status) }
    if (filters?.priority !== undefined) { sql += ' AND priority = ?'; params.push(filters.priority) }
    if (filters?.search) { sql += ' AND title LIKE ?'; params.push(`%${filters.search}%`) }

    sql += ' ORDER BY due_date ASC, priority DESC'
    return queryAll<TaskRow>(db, sql, params)
  },

  get(id: string): TaskRow | null {
    return queryOne<TaskRow>(getDatabase(), 'SELECT * FROM tasks WHERE id = ?', [id])
  },

  create(data: {
    course_id?: string | null; title: string; description?: string; type?: string
    due_date?: string; priority?: number; status?: string; estimated_minutes?: number
    weight?: number; tags?: string
  }): TaskRow {
    const db = getDatabase()
    const id = randomUUID()
    const now = new Date().toISOString()

    exec(db, `INSERT INTO tasks (id, course_id, title, description, type, due_date, priority, status, estimated_minutes, weight, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      id, data.course_id ?? null, data.title, data.description ?? null, data.type ?? 'assignment',
      data.due_date ?? null, data.priority ?? 0, data.status ?? 'todo',
      data.estimated_minutes ?? null, data.weight ?? null, data.tags ?? null, now, now,
    ])
    saveDatabase()
    return this.get(id)!
  },

  update(id: string, data: Partial<TaskRow>): TaskRow | null {
    const db = getDatabase()
    const existing = this.get(id)
    if (!existing) return null
    const fields = { ...existing, ...data }

    exec(db, `UPDATE tasks SET course_id=?, title=?, description=?, type=?, due_date=?, priority=?, status=?, estimated_minutes=?, actual_minutes=?, weight=?, grade=?, tags=?, updated_at=? WHERE id=?`, [
      fields.course_id, fields.title, fields.description, fields.type, fields.due_date,
      fields.priority, fields.status, fields.estimated_minutes, fields.actual_minutes,
      fields.weight, fields.grade, fields.tags, new Date().toISOString(), id,
    ])
    saveDatabase()
    return this.get(id)
  },

  delete(id: string): boolean {
    const db = getDatabase()
    const changes = exec(db, 'DELETE FROM tasks WHERE id = ?', [id])
    saveDatabase()
    return changes > 0
  },

  getUpcoming(limit = 5): TaskRow[] {
    const db = getDatabase()
    return queryAll<TaskRow>(db, `SELECT * FROM tasks WHERE status IN ('todo', 'in_progress') AND due_date IS NOT NULL ORDER BY due_date ASC LIMIT ?`, [limit])
  },

  getTodayCount(): number {
    const db = getDatabase()
    const row = queryOne<{ count: number }>(db, `SELECT COUNT(*) as count FROM tasks WHERE status IN ('todo', 'in_progress') AND due_date <= date('now')`)
    return row?.count ?? 0
  },
}
