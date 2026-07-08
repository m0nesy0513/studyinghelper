import { fetchWithTimeout } from '../fetchWithTimeout'

export interface ClipperResult {
  title: string
  content: string
  excerpt: string
  siteName: string | null
}

export async function clipWebPage(rawUrl: string): Promise<ClipperResult> {
  let url: string
  try { url = new URL(rawUrl).href } catch { url = rawUrl }

  // Wikipedia → REST API
  const wikiMatch = url.match(/https?:\/\/([a-z]+)\.wikipedia\.org\/wiki\/(.+)/)
  if (wikiMatch) {
    return clipWikipedia(wikiMatch[1], decodeURIComponent(wikiMatch[2]))
  }

  // Generic web page
  const res = await fetchWithTimeout(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
    },
  }, 10_000)
  if (!res.ok) throw new Error(`HTTP ${res.status}：无法访问该页面`)
  const html = await res.text()

  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  const title = titleMatch?.[1]?.trim() || url
  const ogSite = html.match(/<meta\s+property="og:site_name"\s+content="([^"]*)"/i)

  // Try <article> → <main> → <body>
  let text = ''
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
  if (articleMatch?.[1]) {
    text = stripHtml(articleMatch[1])
  } else {
    const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
    const source = mainMatch?.[1] || html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || html
    text = stripHtml(source)
  }

  if (!text || text.length < 50) throw new Error('页面正文过短或无法提取，可能是需要登录的动态页面')

  return {
    title,
    content: text.slice(0, 50000),
    excerpt: text.slice(0, 300),
    siteName: ogSite?.[1] || new URL(url).hostname || null,
  }
}

async function clipWikipedia(lang: string, title: string): Promise<ClipperResult> {
  const apiUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  const res = await fetchWithTimeout(apiUrl, { headers: { 'User-Agent': 'StudyingHelper/1.0' } }, 10_000)
  if (!res.ok) throw new Error(`Wikipedia API ${res.status}`)
  const json = await res.json() as any
  return {
    title: json.title || title,
    content: json.extract || '',
    excerpt: json.description || '',
    siteName: 'Wikipedia',
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&rsquo;/g, "'").replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"').replace(/&ldquo;/g, '"')
    .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
    .replace(/\s+/g, ' ').trim()
}
