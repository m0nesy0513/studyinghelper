import { randomUUID } from 'crypto'
import { getDatabase, saveDatabase } from '../connection'
import { queryAll, queryOne, exec } from '../helpers'

export interface CourseRow {
  id: string
  name: string
  code: string | null
  credits: number
  professor: string | null
  semester: string | null
  category: string
  color: string
  description: string | null
  syllabus_url: string | null
  is_active: number
  score: number | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CourseFilters {
  category?: string
  semester?: string
  is_active?: boolean
  search?: string
}

export const courseRepo = {
  list(filters?: CourseFilters): CourseRow[] {
    const db = getDatabase()
    let sql = 'SELECT * FROM courses WHERE 1=1'
    const params: unknown[] = []

    if (filters?.category) {
      sql += ' AND category = ?'
      params.push(filters.category)
    }
    if (filters?.semester) {
      sql += ' AND semester = ?'
      params.push(filters.semester)
    }
    if (filters?.is_active !== undefined) {
      sql += ' AND is_active = ?'
      params.push(filters.is_active ? 1 : 0)
    }
    if (filters?.search) {
      sql += ' AND (name LIKE ? OR code LIKE ?)'
      const p = `%${filters.search}%`
      params.push(p, p)
    }

    sql += ' ORDER BY sort_order, created_at DESC'
    return queryAll<CourseRow>(db, sql, params)
  },

  get(id: string): CourseRow | null {
    return queryOne<CourseRow>(getDatabase(), 'SELECT * FROM courses WHERE id = ?', [id])
  },

  create(data: {
    name: string
    code?: string
    credits?: number
    professor?: string
    semester?: string
    category: string
    color?: string
    description?: string
    syllabus_url?: string
  }): CourseRow {
    const db = getDatabase()
    const id = randomUUID()
    const now = new Date().toISOString()

    exec(db, `INSERT INTO courses (id, name, code, credits, professor, semester, category, color, description, syllabus_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      id, data.name, data.code ?? null, data.credits ?? 3.0, data.professor ?? null,
      data.semester ?? null, data.category, data.color ?? '#6366f1',
      data.description ?? null, data.syllabus_url ?? null, now, now,
    ])
    saveDatabase()
    return this.get(id)!
  },

  update(id: string, data: Partial<CourseRow>): CourseRow | null {
    const db = getDatabase()
    const existing = this.get(id)
    if (!existing) return null

    const fields = { ...existing, ...data }
    const now = new Date().toISOString()

    exec(db, `UPDATE courses SET name=?, code=?, credits=?, professor=?, semester=?, category=?, color=?, description=?, syllabus_url=?, is_active=?, score=?, sort_order=?, updated_at=? WHERE id=?`, [
      fields.name, fields.code, fields.credits, fields.professor, fields.semester,
      fields.category, fields.color, fields.description, fields.syllabus_url,
      fields.is_active, fields.score, fields.sort_order, now, id,
    ])
    saveDatabase()
    return this.get(id)
  },

  delete(id: string): boolean {
    const db = getDatabase()
    const changes = exec(db, 'DELETE FROM courses WHERE id = ?', [id])
    saveDatabase()
    return changes > 0
  },
}
