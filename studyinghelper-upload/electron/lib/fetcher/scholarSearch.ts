import { fetchWithTimeout } from '../fetchWithTimeout'

export interface ScholarPaper {
  paperId: string
  title: string
  authors: string[]
  year: number | null
  venue: string | null
  citationCount: number | null
  abstract: string | null
  url: string
  doi: string | null
}

export async function searchScholar(query: string, limit = 20): Promise<ScholarPaper[]> {
  const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per_page=${limit}&sort=cited_by_count:desc`

  const res = await fetchWithTimeout(url, {
    headers: { 'User-Agent': 'StudyingHelper/1.0', 'Accept': 'application/json' },
  }, 10_000)

  if (!res.ok) throw new Error(`OpenAlex API 错误 ${res.status}，请稍后重试`)

  const json = await res.json() as {
    meta?: { count: number }
    results?: Array<{
      id: string; doi?: string; title: string; display_name?: string
      publication_year?: number; cited_by_count?: number
      primary_location?: { source?: { display_name?: string }; landing_page_url?: string }
      authorships?: Array<{ author?: { display_name: string } }>
      abstract_inverted_index?: Record<string, number[]>
    }>
  }

  const results = json.results || []
  if (results.length === 0) throw new Error('未找到相关论文，试试其他关键词')

  return results.map(p => ({
    paperId: p.id.replace('https://openalex.org/', ''),
    title: p.title || p.display_name || '(无标题)',
    authors: (p.authorships || []).map(a => a.author?.display_name || '未知').filter(Boolean),
    year: p.publication_year || null,
    venue: p.primary_location?.source?.display_name || null,
    citationCount: p.cited_by_count ?? null,
    abstract: p.abstract_inverted_index ? invertAbstract(p.abstract_inverted_index) : null,
    url: p.doi || p.primary_location?.landing_page_url || p.id,
    doi: p.doi || null,
  }))
}

function invertAbstract(inv: Record<string, number[]> | null): string | null {
  if (!inv) return null
  const entries = Object.entries(inv).map(([word, pos]) => ({ word, pos: pos[0] ?? 0 }))
  entries.sort((a, b) => a.pos - b.pos)
  return entries.map(e => e.word).join(' ').slice(0, 2000) || null
}
