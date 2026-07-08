import { randomUUID } from 'crypto'
import { getDatabase, saveDatabase } from '../connection'
import { queryAll, queryOne, exec } from '../helpers'

export interface ExamPrepRow {
  id: string; course_id: string; exam_date: string; target_score: number | null
  auto_generate_tasks: number; created_at: string
}

export const examPrepRepo = {
  list(): ExamPrepRow[] {
    return queryAll(getDatabase(), 'SELECT * FROM exam_prep ORDER BY exam_date ASC')
  },

  get(id: string): ExamPrepRow | null {
    return queryOne(getDatabase(), 'SELECT * FROM exam_prep WHERE id = ?', [id])
  },

  getByCourse(courseId: string): ExamPrepRow | null {
    return queryOne(getDatabase(), 'SELECT * FROM exam_prep WHERE course_id = ?', [courseId])
  },

  create(data: { course_id: string; exam_date: string; target_score?: number; auto_generate_tasks?: number }): ExamPrepRow {
    const db = getDatabase()
    const id = randomUUID()
    exec(db, `INSERT INTO exam_prep (id,course_id,exam_date,target_score,auto_generate_tasks,created_at) VALUES (?,?,?,?,?,?)`, [
      id, data.course_id, data.exam_date, data.target_score ?? null, data.auto_generate_tasks ?? 1, new Date().toISOString(),
    ])
    saveDatabase()
    return this.get(id)!
  },

  update(id: string, data: { exam_date?: string; target_score?: number; auto_generate_tasks?: number }): ExamPrepRow | null {
    const db = getDatabase()
    const e = this.get(id); if (!e) return null
    exec(db, `UPDATE exam_prep SET exam_date=?,target_score=?,auto_generate_tasks=? WHERE id=?`, [
      data.exam_date ?? e.exam_date, data.target_score ?? e.target_score, data.auto_generate_tasks ?? e.auto_generate_tasks, id,
    ])
    saveDatabase()
    return this.get(id)
  },

  delete(id: string): boolean {
    const changes = exec(getDatabase(), 'DELETE FROM exam_prep WHERE id = ?', [id])
    saveDatabase()
    return changes > 0
  },

  /** Get upcoming exams sorted by days remaining */
  getUpcoming(): Array<ExamPrepRow & { course_name: string; days_left: number }> {
    return queryAll(getDatabase(), `
      SELECT e.*, c.name as course_name, CAST(julianday(e.exam_date) - julianday('now') AS INTEGER) as days_left
      FROM exam_prep e JOIN courses c ON c.id = e.course_id
      WHERE e.exam_date >= date('now') ORDER BY e.exam_date ASC LIMIT 10
    `)
  },
}
