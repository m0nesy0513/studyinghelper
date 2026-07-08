export interface MoodleResource {
  title: string
  url: string
  type: string  // 'file' | 'link' | 'page' | 'folder' | 'assignment' | 'forum' | 'other'
}

export async function scanMoodle(moodleUrl: string, cookie?: string): Promise<MoodleResource[]> {
  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (compatible; StudyingHelper/1.0)',
  }
  if (cookie) headers['Cookie'] = cookie

  const res = await fetch(moodleUrl, { headers })
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error('需要登录凭据，请在设置中提供 Moodle Cookie')
    }
    throw new Error(`HTTP ${res.status}: 无法访问 Moodle 页面`)
  }

  const html = await res.text()
  const resources: MoodleResource[] = []

  // Find all anchor links inside activity items
  const activityPatterns = [
    /<li[^>]*class="[^"]*activity[^"]*"[^>]*>[\s\S]*?<\/li>/gi,
    /<div[^>]*class="[^"]*activityinstance[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
    /<span[^>]*class="[^"]*instancename[^"]*"[^>]*>[\s\S]*?<\/span>/gi,
  ]

  for (const pattern of activityPatterns) {
    let match
    while ((match = pattern.exec(html)) !== null) {
      const block = match[0]
      const linkMatch = block.match(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i)
      if (!linkMatch) continue

      const href = linkMatch[1]
      const title = decodeEntities(stripHtml(linkMatch[2]).trim()) || '(无标题)'
      const fullUrl = href.startsWith('http') ? href : new URL(href, moodleUrl).href

      let type = 'other'
      const hrefLower = href.toLowerCase()
      if (hrefLower.includes('/resource/')) type = 'file'
      else if (hrefLower.includes('/url/')) type = 'link'
      else if (hrefLower.includes('/page/')) type = 'page'
      else if (hrefLower.includes('/folder/')) type = 'folder'
      else if (hrefLower.includes('/assign/')) type = 'assignment'
      else if (hrefLower.includes('/forum/')) type = 'forum'

      resources.push({ title, url: fullUrl, type })
    }
  }

  // Fallback: scan all section content links
  if (resources.length === 0) {
    const linkRegex = /<a[^>]*href="(https?:\/\/[^"]*\/mod\/[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi
    let match
    while ((match = linkRegex.exec(html)) !== null) {
      const title = stripHtml(match[2]).trim()
      if (!title) continue
      let type = 'link'
      const href = match[1].toLowerCase()
      if (href.includes('/resource/')) type = 'file'
      else if (href.includes('/assign/')) type = 'assignment'
      else if (href.includes('/forum/')) type = 'forum'
      resources.push({ title, url: match[1], type })
    }
  }

  if (resources.length === 0) throw new Error('未找到课程资源，请确认 URL 是正确的 Moodle 课程页面')
  return resources.slice(0, 100)
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
}
