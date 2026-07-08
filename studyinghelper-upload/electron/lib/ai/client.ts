import { settingsRepo } from '../../database/repositories/settings'

const BASE_URL = 'https://api.deepseek.com'

// Read API key from settings
function getApiKey(): string | null {
  return settingsRepo.getDecrypted('deepseek_api_key')
}

export function hasApiKey(): boolean {
  return !!getApiKey()
}

// ── Chat (streaming) ──
export async function* streamChat(messages: Array<{ role: string; content: string }>): AsyncGenerator<string> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('请先在设置中配置 DeepSeek API Key')

  const res = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'deepseek-chat', messages, stream: true, temperature: 0.7, max_tokens: 4096 }),
  })
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    if (res.status === 401) throw new Error('API Key 无效，请检查设置')
    throw new Error(`DeepSeek API ${res.status}: ${err.slice(0, 200)}`)
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error('No response body')
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()
      if (data === '[DONE]') return
      try {
        const json = JSON.parse(data)
        const content = json.choices?.[0]?.delta?.content
        if (content) yield content
      } catch { /* skip malformed */ }
    }
  }
}

// ── Non-streaming (for structured outputs) ──
export async function chatCompletion(messages: Array<{ role: string; content: string }>): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('请先在设置中配置 DeepSeek API Key')

  const res = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'deepseek-chat', messages, temperature: 0.7, max_tokens: 4096 }),
  })
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    if (res.status === 401) throw new Error('API Key 无效')
    throw new Error(`DeepSeek API ${res.status}`)
  }
  const json = await res.json() as any
  return json.choices?.[0]?.message?.content || ''
}

// ── OCR (Vision API) ──
export async function ocrImage(base64Image: string, mimeType = 'image/png'): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('请先在设置中配置 DeepSeek API Key')

  const res = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: [
        { type: 'text', text: '请识别图片中的文字，输出为纯文本。如有公式，保留原始格式。' },
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
      ]}],
      temperature: 0.1, max_tokens: 4096,
    }),
  })
  if (!res.ok) {
    if (res.status === 401) throw new Error('API Key 无效')
    throw new Error(`OCR API ${res.status}`)
  }
  const json = await res.json() as any
  return json.choices?.[0]?.message?.content || '(未识别到文字)'
}
