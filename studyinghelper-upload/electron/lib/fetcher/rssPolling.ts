/**
 * RSS background polling — fetches all active RSS sources on a timer,
 * caches articles to disk, and exposes them for instant frontend display.
 */
import { fetchSourceRepo } from '../../database/repositories/fetchSources'
import { fetchRss, type RssItem } from './rssFetcher'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'

// ── Types ──
export interface CachedArticle {
  title: string
  link: string | null
  contentSnippet: string | null
  pubDate: string | null
  creator: string | null
  sourceName: string
  sourceUrl: string
}

interface RssCache {
  updatedAt: string
  articles: CachedArticle[]
}

// ── In-memory cache ──
let cache: CachedArticle[] = []
let lastUpdated: string | null = null
let pollingTimer: ReturnType<typeof setInterval> | null = null
let pollingInterval = 30 * 60 * 1000 // default 30 min

// ── Path helpers ──
function getCachePath(): string {
  return path.join(app.getPath('userData'), 'rss_cache.json')
}

// ── Save / Load ──
function saveCache(articles: CachedArticle[]): void {
  const data: RssCache = { updatedAt: new Date().toISOString(), articles }
  try {
    fs.writeFileSync(getCachePath(), JSON.stringify(data), 'utf-8')
  } catch {
    // non-critical
  }
}

function loadCache(): CachedArticle[] {
  try {
    const raw = fs.readFileSync(getCachePath(), 'utf-8')
    const data = JSON.parse(raw) as RssCache
    lastUpdated = data.updatedAt
    return data.articles || []
  } catch {
    return []
  }
}

// ── Poll ──
export async function pollAll(): Promise<{ articles: CachedArticle[]; updatedAt: string }> {
  const sources = fetchSourceRepo.list({ type: 'rss', is_active: 1 })
  if (sources.length === 0) return { articles: cache, updatedAt: lastUpdated || new Date().toISOString() }

  // Fetch all sources in parallel
  const results = await Promise.allSettled(
    sources.map(async (src) => {
      const result = await fetchRss(src.url)
      const feedTitle = result.title || src.name
      fetchSourceRepo.update(src.id, { last_fetched_at: new Date().toISOString() })
      return result.items.map((item: RssItem) => ({
        title: item.title,
        link: item.link,
        contentSnippet: item.contentSnippet,
        pubDate: item.pubDate,
        creator: item.creator,
        sourceName: feedTitle,
        sourceUrl: src.url,
      }))
    })
  )

  // Collect all articles from successful fetches
  const all: CachedArticle[] = []
  let successCount = 0
  for (const r of results) {
    if (r.status === 'fulfilled') {
      all.push(...r.value)
      successCount++
    }
  }

  // Don't clear cache if ALL sources failed
  if (successCount === 0) {
    console.warn('[rssPolling] All sources failed — keeping existing cache')
    return { articles: cache, updatedAt: lastUpdated || new Date().toISOString() }
  }

  // Sort by date descending
  all.sort((a, b) => {
    if (!a.pubDate && !b.pubDate) return 0
    if (!a.pubDate) return 1
    if (!b.pubDate) return -1
    return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  })

  // Deduplicate by link
  const seen = new Set<string>()
  const deduped: CachedArticle[] = []
  for (const a of all) {
    const key = a.link || a.title
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(a)
  }

  cache = deduped
  lastUpdated = new Date().toISOString()
  saveCache(deduped)

  return { articles: deduped, updatedAt: lastUpdated }
}

// ── Start / Stop ──
export function startPolling(intervalMs?: number): void {
  if (pollingTimer) return
  if (intervalMs) pollingInterval = intervalMs

  // Load existing cache on startup
  cache = loadCache()

  // Do an initial poll 3 seconds after startup
  setTimeout(() => { pollAll() }, 3000)

  // Then poll on interval
  pollingTimer = setInterval(() => { pollAll() }, pollingInterval)
  console.log(`[rssPolling] Started — interval ${Math.round(pollingInterval / 60000)} min, cached ${cache.length} articles`)
}

export function stopPolling(): void {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}

export function setPollingInterval(ms: number): void {
  pollingInterval = ms
  stopPolling()
  startPolling(ms)
}

// ── Public API (called from IPC) ──
export function getCachedArticles(): { articles: CachedArticle[]; updatedAt: string | null } {
  return { articles: cache, updatedAt: lastUpdated }
}

export async function refreshAll(): Promise<{ articles: CachedArticle[]; updatedAt: string }> {
  return pollAll()
}
