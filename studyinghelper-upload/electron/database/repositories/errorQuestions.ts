import { randomUUID } from 'crypto'
import { getDatabase, saveDatabase } from '../connection'
import { queryAll, queryOne, exec } from '../helpers'

export interface ErrorQuestionRow {
  id: string; course_id: string | null; question: string; correct_answer: string
  wrong_answer: string | null; reason: string | null; source: string | null
  tags: string | null; mastery: number; review_count: number
  last_reviewed: string | null; created_at: string; updated_at: string
}

export const errorQuestionRepo = {
  list(filters?: { course_id?: string; mastery?: number }): ErrorQuestionRow[] {
    const db = getDatabase()
    let sql = 'SELECT * FROM error_questions WHERE 1=1'
    const params: unknown[] = []
    if (filters?.course_id) { sql += ' AND course_id = ?'; params.push(filters.course_id) }
    if (filters?.mastery !== undefined && filters.mastery < 3) {
      sql += ' AND mastery < 3'
    }
    sql += ' ORDER BY mastery ASC, created_at DESC'
    return queryAll<ErrorQuestionRow>(db, sql, params)
  },

  get(id: string): ErrorQuestionRow | null {
    return queryOne<ErrorQuestionRow>(getDatabase(), 'SELECT * FROM error_questions WHERE id = ?', [id])
  },

  create(data: {
    course_id?: string | null; question: string; correct_answer: string
    wrong_answer?: string; reason?: string; source?: string; tags?: string
  }): ErrorQuestionRow {
    const db = getDatabase()
    const id = randomUUID()
    const now = new Date().toISOString()
    exec(db, `INSERT INTO error_questions (id,course_id,question,correct_answer,wrong_answer,reason,source,tags,mastery,review_count,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,0,0,?,?)`, [
      id, data.course_id ?? null, data.question, data.correct_answer,
      data.wrong_answer ?? null, data.reason ?? null, data.source ?? null,
      data.tags ?? null, now, now,
    ])
    saveDatabase()
    return this.get(id)!
  },

  update(id: string, data: {
    question?: string; correct_answer?: string; wrong_answer?: string
    reason?: string; source?: string; tags?: string
    mastery?: number; review_count?: number; last_reviewed?: string
  }): ErrorQuestionRow | null {
    const db = getDatabase()
    const e = this.get(id); if (!e) return null
    const now = new Date().toISOString()
    exec(db, `UPDATE error_questions SET question=?,correct_answer=?,wrong_answer=?,reason=?,source=?,tags=?,mastery=?,review_count=?,last_reviewed=?,updated_at=? WHERE id=?`, [
      data.question ?? e.question, data.correct_answer ?? e.correct_answer,
      data.wrong_answer ?? e.wrong_answer, data.reason ?? e.reason,
      data.source ?? e.source, data.tags ?? e.tags,
      data.mastery ?? e.mastery, data.review_count ?? e.review_count,
      data.last_reviewed ?? e.last_reviewed, now, id,
    ])
    saveDatabase()
    return this.get(id)
  },

  /** Mark as reviewed with mastery level 0-3 */
  markReviewed(id: string, mastery: number): ErrorQuestionRow | null {
    const db = getDatabase()
    const e = this.get(id); if (!e) return null
    const now = new Date().toISOString()
    const count = (e.review_count || 0) + 1
    exec(db, 'UPDATE error_questions SET mastery=?,review_count=?,last_reviewed=?,updated_at=? WHERE id=?', [
      mastery, count, now, now, id,
    ])
    saveDatabase()
    return this.get(id)
  },

  delete(id: string): boolean {
    const db = getDatabase()
    const changes = exec(db, 'DELETE FROM error_questions WHERE id = ?', [id])
    saveDatabase()
    return changes > 0
  },
}
