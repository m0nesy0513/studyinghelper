import type { Database as SqlJsDatabase } from 'sql.js'
import { randomUUID } from 'crypto'

interface Migration {
  version: number
  name: string
  up: (db: SqlJsDatabase) => void
}

const migrations: Migration[] = [
  {
    version: 9,
    name: 'seed_default_rss_sources',
    up: (db) => {
      const now = new Date().toISOString()
      const feeds: [string, string][] = [
        ['少数派',         'https://sspai.com/feed'],
        ['阮一峰的网络日志', 'https://feeds.feedburner.com/ruanyifeng'],
        ['IT之家',         'https://www.ithome.com/rss/'],
        ['36氪',           'https://36kr.com/feed'],
        ['果壳网',         'https://www.guokr.com/rss/'],
        ['知乎每日精选',   'https://www.zhihu.com/rss'],
        ['Hacker News',   'https://hnrss.org/frontpage'],
        ['Dev.to',        'https://dev.to/feed'],
      ]

      let seeded = 0
      for (const [name, url] of feeds) {
        // Skip if this exact URL already exists
        const result = db.exec(`SELECT 1 FROM fetch_sources WHERE url = '${url.replace(/'/g, "''")}'`)
        const exists = result.length > 0 && result[0].values.length > 0
        if (exists) continue
        const id = randomUUID()
        db.run(`INSERT INTO fetch_sources (id, type, name, url, fetch_interval_minutes, is_active, created_at) VALUES ('${id}', 'rss', '${name.replace(/'/g, "''")}', '${url.replace(/'/g, "''")}', 60, 1, '${now}')`)
        seeded++
      }

      if (seeded > 0) console.log(`[DB] Seeded ${seeded} new default RSS sources.`)
    },
  },
  {
    version: 8,
    name: 'create_ai_and_exam_prep',
    up: (db) => {
      db.run(`
        CREATE TABLE ai_conversations (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          model TEXT DEFAULT 'deepseek-chat',
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )
      `)
      db.run(`
        CREATE TABLE ai_messages (
          id TEXT PRIMARY KEY,
          conversation_id TEXT NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TEXT DEFAULT (datetime('now'))
        )
      `)
      db.run('CREATE INDEX idx_ai_messages_conv ON ai_messages(conversation_id)')
      db.run(`
        CREATE TABLE exam_prep (
          id TEXT PRIMARY KEY,
          course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
          exam_date TEXT NOT NULL,
          target_score REAL,
          auto_generate_tasks INTEGER DEFAULT 1,
          created_at TEXT DEFAULT (datetime('now'))
        )
      `)
      db.run('CREATE INDEX idx_exam_prep_course ON exam_prep(course_id)')
    },
  },
  {
    version: 7,
    name: 'create_pomodoro_sessions',
    up: (db) => {
      db.run(`
        CREATE TABLE pomodoro_sessions (
          id TEXT PRIMARY KEY,
          task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
          start_time TEXT NOT NULL,
          end_time TEXT,
          duration_minutes INTEGER DEFAULT 25,
          type TEXT DEFAULT 'focus',
          status TEXT DEFAULT 'pending',
          created_at TEXT DEFAULT (datetime('now'))
        )
      `)
      db.run('CREATE INDEX idx_pomodoro_task ON pomodoro_sessions(task_id)')
      db.run('CREATE INDEX idx_pomodoro_created ON pomodoro_sessions(created_at)')
    },
  },
  {
    version: 6,
    name: 'create_flashcards_and_errorbook',
    up: (db) => {
      db.run(`
        CREATE TABLE flashcard_decks (
          id TEXT PRIMARY KEY,
          course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
          name TEXT NOT NULL,
          description TEXT,
          color TEXT DEFAULT '#6366f1',
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )
      `)
      db.run('CREATE INDEX idx_flashcard_decks_course ON flashcard_decks(course_id)')

      db.run(`
        CREATE TABLE flashcards (
          id TEXT PRIMARY KEY,
          deck_id TEXT NOT NULL REFERENCES flashcard_decks(id) ON DELETE CASCADE,
          front TEXT NOT NULL,
          back TEXT NOT NULL,
          ease REAL DEFAULT 2.5,
          interval INTEGER DEFAULT 0,
          repetitions INTEGER DEFAULT 0,
          next_review TEXT DEFAULT (datetime('now')),
          lapses INTEGER DEFAULT 0,
          last_review TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )
      `)
      db.run('CREATE INDEX idx_flashcards_deck ON flashcards(deck_id)')
      db.run('CREATE INDEX idx_flashcards_review ON flashcards(next_review)')

      db.run(`
        CREATE TABLE error_questions (
          id TEXT PRIMARY KEY,
          course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
          question TEXT NOT NULL,
          correct_answer TEXT NOT NULL,
          wrong_answer TEXT,
          reason TEXT,
          source TEXT,
          tags TEXT,
          mastery INTEGER DEFAULT 0,
          review_count INTEGER DEFAULT 0,
          last_reviewed TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )
      `)
      db.run('CREATE INDEX idx_error_questions_course ON error_questions(course_id)')
      db.run('CREATE INDEX idx_error_questions_mastery ON error_questions(mastery)')
    },
  },
  {
    version: 3,
    name: 'create_notes_and_resources',
    up: (db) => {
      db.run(`
        CREATE TABLE notes (
          id TEXT PRIMARY KEY,
          course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
          parent_id TEXT REFERENCES notes(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          content TEXT,
          plain_text TEXT,
          tags TEXT,
          is_pinned INTEGER DEFAULT 0,
          is_folder INTEGER DEFAULT 0,
          sort_order INTEGER DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )
      `)
      db.run('CREATE INDEX idx_notes_course ON notes(course_id)')
      db.run('CREATE INDEX idx_notes_parent ON notes(parent_id)')
      db.run('CREATE INDEX idx_notes_updated ON notes(updated_at)')
      db.run('CREATE INDEX idx_notes_pinned ON notes(is_pinned)')

      db.run(`
        CREATE TABLE resources (
          id TEXT PRIMARY KEY,
          course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
          title TEXT NOT NULL,
          type TEXT NOT NULL,
          stored_path TEXT,
          original_name TEXT,
          url TEXT,
          mime_type TEXT,
          file_size INTEGER,
          checksum TEXT,
          tags TEXT,
          notes TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )
      `)
      db.run('CREATE INDEX idx_resources_course ON resources(course_id)')
      db.run('CREATE INDEX idx_resources_type ON resources(type)')
    },
  },
  {
    version: 4,
    name: 'create_pdf_annotations',
    up: (db) => {
      db.run(`
        CREATE TABLE pdf_annotations (
          id TEXT PRIMARY KEY,
          resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
          type TEXT NOT NULL,
          page_number INTEGER NOT NULL,
          rect_json TEXT,
          color TEXT DEFAULT '#fbbf24',
          text TEXT,
          comment TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )
      `)
      db.run('CREATE INDEX idx_pdf_annotations_resource ON pdf_annotations(resource_id)')
    },
  },
  {
    version: 5,
    name: 'create_fetch_sources',
    up: (db) => {
      db.run(`
        CREATE TABLE fetch_sources (
          id TEXT PRIMARY KEY,
          course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
          type TEXT NOT NULL,
          name TEXT NOT NULL,
          url TEXT NOT NULL,
          credentials_encrypted TEXT,
          last_fetched_at TEXT,
          fetch_interval_minutes INTEGER,
          is_active INTEGER DEFAULT 1,
          created_at TEXT DEFAULT (datetime('now'))
        )
      `)
      db.run('CREATE INDEX idx_fetch_sources_course ON fetch_sources(course_id)')
      db.run('CREATE INDEX idx_fetch_sources_type ON fetch_sources(type)')

      db.run(`
        CREATE TABLE fetch_logs (
          id TEXT PRIMARY KEY,
          source_id TEXT REFERENCES fetch_sources(id) ON DELETE CASCADE,
          status TEXT NOT NULL,
          items_found INTEGER DEFAULT 0,
          items_new INTEGER DEFAULT 0,
          error_message TEXT,
          fetched_at TEXT DEFAULT (datetime('now'))
        )
      `)
      db.run('CREATE INDEX idx_fetch_logs_source ON fetch_logs(source_id)')
    },
  },
  {
    version: 1,
    name: 'create_courses_and_settings',
    up: (db) => {
      db.run(`
        CREATE TABLE courses (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          code TEXT,
          credits REAL DEFAULT 3.0,
          professor TEXT,
          semester TEXT,
          category TEXT NOT NULL,
          color TEXT DEFAULT '#6366f1',
          description TEXT,
          syllabus_url TEXT,
          is_active INTEGER DEFAULT 1,
          score REAL,
          sort_order INTEGER DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )
      `)
      db.run('CREATE INDEX idx_courses_semester ON courses(semester)')
      db.run('CREATE INDEX idx_courses_category ON courses(category)')
      db.run('CREATE INDEX idx_courses_active ON courses(is_active)')

      db.run(`
        CREATE TABLE settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          encrypted INTEGER DEFAULT 0,
          updated_at TEXT DEFAULT (datetime('now'))
        )
      `)
    },
  },
  {
    version: 2,
    name: 'create_schedule_and_tasks',
    up: (db) => {
      db.run(`
        CREATE TABLE schedule_events (
          id TEXT PRIMARY KEY,
          course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          type TEXT DEFAULT 'lecture',
          location TEXT,
          day_of_week INTEGER NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL,
          start_date TEXT NOT NULL,
          end_date TEXT NOT NULL,
          weeks TEXT,
          repeat_rule TEXT DEFAULT 'WEEKLY',
          specific_date TEXT,
          is_cancelled INTEGER DEFAULT 0,
          color TEXT,
          notes TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )
      `)
      db.run('CREATE INDEX idx_schedule_events_course ON schedule_events(course_id)')
      db.run('CREATE INDEX idx_schedule_events_day ON schedule_events(day_of_week)')
      db.run('CREATE INDEX idx_schedule_events_dates ON schedule_events(start_date, end_date)')

      db.run(`
        CREATE TABLE tasks (
          id TEXT PRIMARY KEY,
          course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
          title TEXT NOT NULL,
          description TEXT,
          type TEXT DEFAULT 'assignment',
          due_date TEXT,
          priority INTEGER DEFAULT 0,
          status TEXT DEFAULT 'todo',
          estimated_minutes INTEGER,
          actual_minutes INTEGER,
          weight REAL,
          grade REAL,
          tags TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )
      `)
      db.run('CREATE INDEX idx_tasks_course ON tasks(course_id)')
      db.run('CREATE INDEX idx_tasks_due_date ON tasks(due_date)')
      db.run('CREATE INDEX idx_tasks_status ON tasks(status)')
      db.run('CREATE INDEX idx_tasks_priority ON tasks(priority)')
      db.run('CREATE INDEX idx_tasks_status_due ON tasks(status, due_date)')
    },
  },
]

export function runMigrations(db: SqlJsDatabase): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version INTEGER NOT NULL UNIQUE,
      name TEXT NOT NULL,
      applied_at TEXT DEFAULT (datetime('now'))
    )
  `)

  let currentVersion = 0
  try {
    const result = db.exec('SELECT COALESCE(MAX(version), 0) as version FROM migrations')
    if (result.length > 0 && result[0].values.length > 0) {
      currentVersion = result[0].values[0][0] as number
    }
  } catch { /* table may not exist yet, that's fine */ }

  for (const m of migrations) {
    if (m.version > currentVersion) {
      m.up(db)
      db.run('INSERT INTO migrations (version, name) VALUES (?, ?)', [m.version, m.name])
      console.log(`[DB] Migration v${m.version} "${m.name}" applied.`)
    }
  }
}
