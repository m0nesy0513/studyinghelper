import { randomUUID } from 'crypto'
import { getDatabase, saveDatabase } from '../connection'
import { queryAll, queryOne, exec } from '../helpers'

export interface AnnotationRow {
  id: string; resource_id: string; type: string
  page_number: number; rect_json: string | null; color: string
  text: string | null; comment: string | null
  created_at: string; updated_at: string
}

export const annotationRepo = {
  listByResource(resourceId: string): AnnotationRow[] {
    const db = getDatabase()
    return queryAll<AnnotationRow>(db,
      'SELECT * FROM pdf_annotations WHERE resource_id = ? ORDER BY page_number, created_at',
      [resourceId]
    )
  },

  get(id: string): AnnotationRow | null {
    return queryOne<AnnotationRow>(getDatabase(),
      'SELECT * FROM pdf_annotations WHERE id = ?', [id]
    )
  },

  create(data: {
    resource_id: string; type: string; page_number: number
    rect_json?: string; color?: string; text?: string; comment?: string
  }): AnnotationRow {
    const db = getDatabase()
    const id = randomUUID()
    const now = new Date().toISOString()
    exec(db, `INSERT INTO pdf_annotations (id,resource_id,type,page_number,rect_json,color,text,comment,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`, [
      id, data.resource_id, data.type, data.page_number,
      data.rect_json ?? null, data.color ?? '#fbbf24',
      data.text ?? null, data.comment ?? null, now, now,
    ])
    saveDatabase()
    return this.get(id)!
  },

  update(id: string, data: {
    rect_json?: string; color?: string; text?: string; comment?: string
  }): AnnotationRow | null {
    const db = getDatabase()
    const existing = this.get(id)
    if (!existing) return null

    const now = new Date().toISOString()
    exec(db, `UPDATE pdf_annotations SET rect_json=?, color=?, text=?, comment=?, updated_at=? WHERE id=?`, [
      data.rect_json ?? existing.rect_json,
      data.color ?? existing.color,
      data.text ?? existing.text,
      data.comment ?? existing.comment,
      now, id,
    ])
    saveDatabase()
    return this.get(id)
  },

  delete(id: string): boolean {
    const db = getDatabase()
    const changes = exec(db, 'DELETE FROM pdf_annotations WHERE id = ?', [id])
    saveDatabase()
    return changes > 0
  },

  deleteByResource(resourceId: string): number {
    const db = getDatabase()
    const changes = exec(db, 'DELETE FROM pdf_annotations WHERE resource_id = ?', [resourceId])
    saveDatabase()
    return changes
  },
}
