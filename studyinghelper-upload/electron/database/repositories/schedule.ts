import { randomUUID } from 'crypto'
import { getDatabase, saveDatabase } from '../connection'
import { queryAll, queryOne, exec } from '../helpers'

export interface ScheduleRow {
  id: string
  course_id: string | null
  title: string
  type: string
  location: string | null
  day_of_week: number
  start_time: string
  end_time: string
  start_date: string
  end_date: string
  weeks: string | null
  repeat_rule: string
  specific_date: string | null
  is_cancelled: number
  color: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ScheduleFilters {
  course_id?: string
  day_of_week?: number
  date?: string
}

export const scheduleRepo = {
  list(filters?: ScheduleFilters): ScheduleRow[] {
    const db = getDatabase()
    let sql = 'SELECT * FROM schedule_events WHERE 1=1'
    const params: unknown[] = []

    if (filters?.course_id) { sql += ' AND course_id = ?'; params.push(filters.course_id) }
    if (filters?.day_of_week !== undefined) { sql += ' AND day_of_week = ?'; params.push(filters.day_of_week) }
    if (filters?.date) {
      sql += " AND start_date <= ? AND end_date >= ? AND is_cancelled = 0"
      params.push(filters.date, filters.date)
    }

    sql += ' ORDER BY day_of_week, start_time'
    return queryAll<ScheduleRow>(db, sql, params)
  },

  get(id: string): ScheduleRow | null {
    return queryOne<ScheduleRow>(getDatabase(), 'SELECT * FROM schedule_events WHERE id = ?', [id])
  },

  create(data: {
    course_id?: string | null; title: string; type?: string; location?: string
    day_of_week: number; start_time: string; end_time: string; start_date: string
    end_date: string; weeks?: string; specific_date?: string; color?: string; notes?: string
  }): ScheduleRow {
    const db = getDatabase()
    const id = randomUUID()
    const now = new Date().toISOString()

    exec(db, `INSERT INTO schedule_events (id, course_id, title, type, location, day_of_week, start_time, end_time, start_date, end_date, weeks, repeat_rule, specific_date, color, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'WEEKLY', ?, ?, ?, ?, ?)`, [
      id, data.course_id ?? null, data.title, data.type ?? 'lecture', data.location ?? null,
      data.day_of_week, data.start_time, data.end_time, data.start_date, data.end_date,
      data.weeks ?? null, data.specific_date ?? null, data.color ?? null, data.notes ?? null, now, now,
    ])
    saveDatabase()
    return this.get(id)!
  },

  update(id: string, data: Partial<ScheduleRow>): ScheduleRow | null {
    const db = getDatabase()
    const existing = this.get(id)
    if (!existing) return null
    const fields = { ...existing, ...data }

    exec(db, `UPDATE schedule_events SET course_id=?, title=?, type=?, location=?, day_of_week=?, start_time=?, end_time=?, start_date=?, end_date=?, weeks=?, specific_date=?, is_cancelled=?, color=?, notes=?, updated_at=? WHERE id=?`, [
      fields.course_id, fields.title, fields.type, fields.location, fields.day_of_week,
      fields.start_time, fields.end_time, fields.start_date, fields.end_date,
      fields.weeks, fields.specific_date, fields.is_cancelled, fields.color, fields.notes,
      new Date().toISOString(), id,
    ])
    saveDatabase()
    return this.get(id)
  },

  delete(id: string): boolean {
    const db = getDatabase()
    const changes = exec(db, 'DELETE FROM schedule_events WHERE id = ?', [id])
    saveDatabase()
    return changes > 0
  },
}
