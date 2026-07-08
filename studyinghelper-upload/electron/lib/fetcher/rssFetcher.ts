import { fetchWithTimeout } from '../fetchWithTimeout'

export interface RssItem {
  title: string
  link: string | null
  contentSnippet: string | null
  pubDate: string | null
  creator: string | null
}

export async function fetchRss(url: string): Promise<{ title: string; items: RssItem[] }> {
  const res = await fetchWithTimeout(url, {
    headers: { 'User-Agent': 'StudyingHelper/1.0', 'Accept': 'application/rss+xml, application/xml, text/xml, */*' },
  }, 12_000)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const xml = await res.text()
  if (!xml.trim()) throw new Error('返回内容为空')

  if (/<feed\s[^>]*xmlns="http:\/\/www\.w3\.org\/2005\/Atom"/i.test(xml)) {
    return parseAtom(xml, url)
  }
  return parseRss(xml, url)
}

function parseRss(xml: string, fallbackTitle: string): { title: string; items: RssItem[] } {
  const channelTitle = extractTag(xml, 'title')
  const items: RssItem[] = []

  const parts = xml.split(/<item[>\s]/i)
  for (let i = 1; i < parts.length; i++) {
    const end = parts[i].lastIndexOf('</item>')
    const block = end > 0 ? parts[i].slice(0, end) : parts[i]

    const title = extractTag(block, 'title')
    if (!title) continue

    const link = extractTag(block, 'link')
    const desc = extractTag(block, 'description') || extractTag(block, 'content:encoded') || ''
    const snippet = stripHtml(desc).slice(0, 300) || null

    items.push({
      title,
      link,
      contentSnippet: snippet,
      pubDate: extractTag(block, 'pubDate') || extractTag(block, 'dc:date') || null,
      creator: extractTag(block, 'dc:creator') || extractTag(block, 'author') || null,
    })
  }

  if (items.length === 0) throw new Error('未找到任何条目，Feed 为空或格式不支持')
  return { title: channelTitle || fallbackTitle, items }
}

function parseAtom(xml: string, fallbackTitle: string): { title: string; items: RssItem[] } {
  const feedTitle = extractTag(xml, 'title') || fallbackTitle
  const items: RssItem[] = []

  const parts = xml.split(/<entry[>\s]/i)
  for (let i = 1; i < parts.length; i++) {
    const end = parts[i].lastIndexOf('</entry>')
    const block = end > 0 ? parts[i].slice(0, end) : parts[i]

    const title = extractTag(block, 'title')
    if (!title) continue

    let link: string | null = null
    const hrefMatch = block.match(/<link[^>]*href="([^"]*)"[^>]*\/?>/i)
    if (hrefMatch) link = hrefMatch[1]
    if (!link) link = extractTag(block, 'link')

    const summary = extractTag(block, 'summary') || extractTag(block, 'content') || ''

    items.push({
      title, link,
      contentSnippet: stripHtml(summary).slice(0, 300) || null,
      pubDate: extractTag(block, 'published') || extractTag(block, 'updated') || null,
      creator: extractTag(block, 'name') || extractTag(block, 'author') || null,
    })
  }

  if (items.length === 0) throw new Error('未找到任何条目，Feed 为空或格式不支持')
  return { title: feedTitle, items }
}

function extractTag(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i')
  const m = xml.match(re)
  if (!m?.[1]) return null
  return decodeEntities(m[1].trim()) || null
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&rsquo;/g, "'").replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"').replace(/&ldquo;/g, '"')
}
