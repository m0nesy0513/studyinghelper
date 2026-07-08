import type { Database as SqlJsDatabase } from 'sql.js'

/**
 * Helper: execute SELECT and return all rows as objects.
 * sql.js exec() returns columns + values arrays. This remaps them to objects.
 */
export function queryAll<T = Record<string, unknown>>(db: SqlJsDatabase, sql: string, params?: unknown[]): T[] {
  // Bind params into the SQL if provided
  let finalSql = sql
  if (params && params.length > 0) {
    finalSql = bindParams(sql, params)
  }

  const results: T[] = []
  try {
    const stmt = db.prepare(finalSql)
    if (!stmt) return results
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as T)
    }
    stmt.free()
  } catch {
    // If prepare fails (e.g. on simple pragma), fallback to exec
    const rows = db.exec(finalSql)
    if (rows.length > 0) {
      const { columns, values } = rows[0]
      for (const row of values) {
        const obj = {} as Record<string, unknown>
        columns.forEach((col: string, i: number) => { obj[col] = row[i] })
        results.push(obj as T)
      }
    }
  }
  return results
}

/**
 * Helper: execute SELECT and return first row or null.
 */
export function queryOne<T = Record<string, unknown>>(db: SqlJsDatabase, sql: string, params?: unknown[]): T | null {
  let finalSql = sql
  if (params && params.length > 0) {
    finalSql = bindParams(sql, params)
  }

  try {
    const stmt = db.prepare(finalSql)
    if (!stmt || !stmt.step()) {
      stmt?.free()
      return null
    }
    const obj = stmt.getAsObject() as unknown as T
    stmt.free()
    return obj
  } catch {
    const rows = db.exec(finalSql)
    if (rows.length > 0 && rows[0].values.length > 0) {
      const { columns, values } = rows[0]
      const obj = {} as Record<string, unknown>
      columns.forEach((col, i) => { obj[col] = values[0][i] })
      return obj as T
    }
    return null
  }
}

/**
 * Helper: execute INSERT/UPDATE/DELETE and return changes count.
 */
export function exec(db: SqlJsDatabase, sql: string, params?: unknown[]): number {
  let finalSql = sql
  if (params && params.length > 0) {
    finalSql = bindParams(sql, params)
  }
  db.run(finalSql)
  // Get changes count
  const rows = db.exec('SELECT changes()')
  if (rows.length > 0 && rows[0].values.length > 0) {
    return rows[0].values[0][0] as number
  }
  return 0
}

/**
 * Simple parameter binding: replace ? with escaped values.
 * This is safe for our use case (no user-controlled SQL).
 */
function bindParams(sql: string, params: unknown[]): string {
  let result = sql
  let paramIndex = 0
  result = result.replace(/\?/g, () => {
    const val = params[paramIndex++]
    if (val === null || val === undefined) return 'NULL'
    if (typeof val === 'number') return String(val)
    if (typeof val === 'boolean') return val ? '1' : '0'
    // String: escape single quotes
    return `'${String(val).replace(/'/g, "''")}'`
  })
  return result
}
