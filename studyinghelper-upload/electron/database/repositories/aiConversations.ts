import { randomUUID } from 'crypto'
import { getDatabase, saveDatabase } from '../connection'
import { queryAll, queryOne, exec } from '../helpers'

export interface ConversationRow {
  id: string; title: string; model: string; created_at: string; updated_at: string
}

export interface MessageRow {
  id: string; conversation_id: string; role: string; content: string; created_at: string
}

export const convRepo = {
  list(): ConversationRow[] {
    return queryAll(getDatabase(), 'SELECT * FROM ai_conversations ORDER BY updated_at DESC')
  },

  get(id: string): ConversationRow | null {
    return queryOne(getDatabase(), 'SELECT * FROM ai_conversations WHERE id = ?', [id])
  },

  create(title: string): ConversationRow {
    const db = getDatabase()
    const id = randomUUID()
    const now = new Date().toISOString()
    exec(db, `INSERT INTO ai_conversations (id,title,created_at,updated_at) VALUES (?,?,?,?)`, [id, title, now, now])
    saveDatabase()
    return this.get(id)!
  },

  delete(id: string): boolean {
    const changes = exec(getDatabase(), 'DELETE FROM ai_conversations WHERE id = ?', [id])
    saveDatabase()
    return changes > 0
  },
}

export const msgRepo = {
  list(conversationId: string): MessageRow[] {
    return queryAll(getDatabase(),
      'SELECT * FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC',
      [conversationId]
    )
  },

  create(conversationId: string, role: 'user' | 'assistant', content: string): MessageRow {
    const db = getDatabase()
    const id = randomUUID()
    const now = new Date().toISOString()
    exec(db, `INSERT INTO ai_messages (id,conversation_id,role,content,created_at) VALUES (?,?,?,?,?)`, [id, conversationId, role, content, now])
    exec(db, 'UPDATE ai_conversations SET updated_at = ? WHERE id = ?', [now, conversationId])
    saveDatabase()
    return queryOne<MessageRow>(db, 'SELECT * FROM ai_messages WHERE id = ?', [id])!
  },

  deleteByConversation(conversationId: string): number {
    const changes = exec(getDatabase(), 'DELETE FROM ai_messages WHERE conversation_id = ?', [conversationId])
    saveDatabase()
    return changes
  },
}
