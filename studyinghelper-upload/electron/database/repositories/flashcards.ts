import { randomUUID } from 'crypto'
import { getDatabase, saveDatabase } from '../connection'
import { queryAll, queryOne, exec } from '../helpers'

// ── Deck ──
export interface DeckRow {
  id: string; course_id: string | null; name: string; description: string | null
  color: string; created_at: string; updated_at: string
}

// ── Card ──
export interface CardRow {
  id: string; deck_id: string; front: string; back: string
  ease: number; interval: number; repetitions: number
  next_review: string; lapses: number; last_review: string | null
  created_at: string; updated_at: string
}

export const deckRepo = {
  list(filters?: { course_id?: string }): DeckRow[] {
    const db = getDatabase()
    let sql = 'SELECT * FROM flashcard_decks WHERE 1=1'
    const params: unknown[] = []
    if (filters?.course_id) { sql += ' AND course_id = ?'; params.push(filters.course_id) }
    sql += ' ORDER BY created_at DESC'
    return queryAll<DeckRow>(db, sql, params)
  },

  get(id: string): DeckRow | null {
    return queryOne<DeckRow>(getDatabase(), 'SELECT * FROM flashcard_decks WHERE id = ?', [id])
  },

  create(data: { course_id?: string | null; name: string; description?: string; color?: string }): DeckRow {
    const db = getDatabase()
    const id = randomUUID()
    const now = new Date().toISOString()
    exec(db, `INSERT INTO flashcard_decks (id,course_id,name,description,color,created_at,updated_at) VALUES (?,?,?,?,?,?,?)`, [
      id, data.course_id ?? null, data.name, data.description ?? null, data.color ?? '#6366f1', now, now,
    ])
    saveDatabase()
    return this.get(id)!
  },

  update(id: string, data: { name?: string; description?: string; color?: string }): DeckRow | null {
    const db = getDatabase()
    const e = this.get(id); if (!e) return null
    const now = new Date().toISOString()
    exec(db, `UPDATE flashcard_decks SET name=?,description=?,color=?,updated_at=? WHERE id=?`, [
      data.name ?? e.name, data.description ?? e.description, data.color ?? e.color, now, id,
    ])
    saveDatabase()
    return this.get(id)
  },

  delete(id: string): boolean {
    const db = getDatabase()
    const changes = exec(db, 'DELETE FROM flashcard_decks WHERE id = ?', [id])
    saveDatabase()
    return changes > 0
  },
}

export const cardRepo = {
  list(deckId: string): CardRow[] {
    return queryAll<CardRow>(getDatabase(),
      'SELECT * FROM flashcards WHERE deck_id = ? ORDER BY created_at DESC', [deckId]
    )
  },

  /** Cards due for review in the given deck */
  listDue(deckId: string): CardRow[] {
    return queryAll<CardRow>(getDatabase(),
      "SELECT * FROM flashcards WHERE deck_id = ? AND next_review <= datetime('now') ORDER BY next_review ASC",
      [deckId]
    )
  },

  /** Count due cards per deck */
  countDue(): { deck_id: string; count: number }[] {
    return queryAll<{ deck_id: string; count: number }>(getDatabase(),
      "SELECT deck_id, COUNT(*) as count FROM flashcards WHERE next_review <= datetime('now') GROUP BY deck_id"
    )
  },

  get(id: string): CardRow | null {
    return queryOne<CardRow>(getDatabase(), 'SELECT * FROM flashcards WHERE id = ?', [id])
  },

  create(data: { deck_id: string; front: string; back: string; ease?: number; interval?: number }): CardRow {
    const db = getDatabase()
    const id = randomUUID()
    const now = new Date().toISOString()
    exec(db, `INSERT INTO flashcards (id,deck_id,front,back,ease,interval,repetitions,next_review,lapses,created_at,updated_at) VALUES (?,?,?,?,?,?,0,?,0,?,?)`, [
      id, data.deck_id, data.front, data.back,
      data.ease ?? 2.5, data.interval ?? 0,
      now, now, now,
    ])
    saveDatabase()
    return this.get(id)!
  },

  update(id: string, data: {
    front?: string; back?: string; ease?: number; interval?: number
    repetitions?: number; next_review?: string; lapses?: number; last_review?: string
  }): CardRow | null {
    const db = getDatabase()
    const e = this.get(id); if (!e) return null
    const now = new Date().toISOString()
    exec(db, `UPDATE flashcards SET front=?,back=?,ease=?,interval=?,repetitions=?,next_review=?,lapses=?,last_review=?,updated_at=? WHERE id=?`, [
      data.front ?? e.front, data.back ?? e.back, data.ease ?? e.ease,
      data.interval ?? e.interval, data.repetitions ?? e.repetitions,
      data.next_review ?? e.next_review, data.lapses ?? e.lapses,
      data.last_review ?? e.last_review, now, id,
    ])
    saveDatabase()
    return this.get(id)
  },

  delete(id: string): boolean {
    const db = getDatabase()
    const changes = exec(db, 'DELETE FROM flashcards WHERE id = ?', [id])
    saveDatabase()
    return changes > 0
  },

  /** Get all due card counts grouped by deck, for display badges */
  getDueCounts(): { deck_id: string; count: number }[] {
    return queryAll(getDatabase(),
      "SELECT deck_id, COUNT(*) as count FROM flashcards WHERE next_review <= datetime('now') GROUP BY deck_id"
    )
  },
}
