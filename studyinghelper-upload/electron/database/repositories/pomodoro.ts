import { randomUUID } from 'crypto'
import { getDatabase, saveDatabase } from '../connection'
import { queryAll, queryOne, exec } from '../helpers'

export interface PomodoroSessionRow {
  id: string; task_id: string | null; start_time: string; end_time: string | null
  duration_minutes: number; type: string; status: string; created_at: string
}

export interface StreakInfo {
  current_streak: number
  longest_streak: number
  today_minutes: number
  total_sessions_today: number
}

export const pomodoroRepo = {
  list(limit = 20): PomodoroSessionRow[] {
    return queryAll<PomodoroSessionRow>(getDatabase(),
      'SELECT * FROM pomodoro_sessions ORDER BY created_at DESC LIMIT ?', [limit])
  },

  listToday(): PomodoroSessionRow[] {
    return queryAll<PomodoroSessionRow>(getDatabase(),
      "SELECT * FROM pomodoro_sessions WHERE date(created_at) = date('now') ORDER BY created_at DESC"
    )
  },

  get(id: string): PomodoroSessionRow | null {
    return queryOne<PomodoroSessionRow>(getDatabase(), 'SELECT * FROM pomodoro_sessions WHERE id = ?', [id])
  },

  create(data: {
    task_id?: string | null; duration_minutes?: number; type?: string; start_time?: string
  }): PomodoroSessionRow {
    const db = getDatabase()
    const id = randomUUID()
    const now = new Date().toISOString()
    exec(db, `INSERT INTO pomodoro_sessions (id,task_id,start_time,duration_minutes,type,status,created_at) VALUES (?,?,?,?,?,'pending',?)`, [
      id, data.task_id ?? null, data.start_time ?? now, data.duration_minutes ?? 25, data.type ?? 'focus', now,
    ])
    saveDatabase()
    return this.get(id)!
  },

  complete(id: string, durationMinutes?: number): PomodoroSessionRow | null {
    const db = getDatabase()
    const existing = this.get(id)
    if (!existing) return null
    const now = new Date().toISOString()
    exec(db, 'UPDATE pomodoro_sessions SET status=?, end_time=?, duration_minutes=? WHERE id=?', [
      'completed', now, durationMinutes ?? existing.duration_minutes, id,
    ])
    saveDatabase()
    return this.get(id)
  },

  cancel(id: string): PomodoroSessionRow | null {
    const db = getDatabase()
    const existing = this.get(id)
    if (!existing) return null
    const now = new Date().toISOString()
    exec(db, 'UPDATE pomodoro_sessions SET status=?, end_time=? WHERE id=?', [
      'cancelled', now, id,
    ])
    saveDatabase()
    return this.get(id)
  },

  /** Compute streak: count consecutive days with ≥25 min focus time */
  getStreak(): StreakInfo {
    const db = getDatabase()
    // Today's total focus minutes
    const todayRow = db.exec("SELECT COALESCE(SUM(duration_minutes),0) FROM pomodoro_sessions WHERE status='completed' AND date(created_at)=date('now')")
    const todayMinutes = (todayRow.length > 0 && todayRow[0].values.length > 0) ? Number(todayRow[0].values[0][0]) : 0

    const todaySessions = db.exec("SELECT COUNT(*) FROM pomodoro_sessions WHERE status='completed' AND date(created_at)=date('now')")
    const todayCount = (todaySessions.length > 0 && todaySessions[0].values.length > 0) ? Number(todaySessions[0].values[0][0]) : 0

    // Days with ≥25 min study (sorted desc)
    const dayRows = db.exec(`
      SELECT date(created_at) as study_date, SUM(duration_minutes) as total
      FROM pomodoro_sessions WHERE status='completed'
      GROUP BY study_date HAVING total >= 25
      ORDER BY study_date DESC
    `)

    let currentStreak = 0
    let longestStreak = 0

    if (dayRows.length > 0 && dayRows[0].values.length > 0) {
      const today = new Date().toISOString().slice(0, 10)
      let expected = today
      let consecutive = 0

      for (const row of dayRows[0].values) {
        const day = row[0] as string
        // Rewind: compute longest streak from all days
      }

      // Compute streaks
      let streak = 0
      let best = 0
      let prev = ''

      for (const row of dayRows[0].values) {
        const day = row[0] as string
        if (!prev) {
          streak = 1
        } else {
          const diff = Math.round((new Date(prev).getTime() - new Date(day).getTime()) / 86400000)
          if (diff === 1) { streak++ } else { streak = 1 }
        }
        if (streak > best) best = streak
        prev = day
      }
      longestStreak = best

      // Current streak: count from today backwards
      const check = new Date(today)
      currentStreak = 0
      const days = new Set(dayRows[0].values.map(r => r[0] as string))
      while (days.has(check.toISOString().slice(0, 10))) {
        currentStreak++
        check.setDate(check.getDate() - 1)
      }
    }

    return { current_streak: currentStreak, longest_streak: longestStreak, today_minutes: todayMinutes, total_sessions_today: todayCount }
  },
}
