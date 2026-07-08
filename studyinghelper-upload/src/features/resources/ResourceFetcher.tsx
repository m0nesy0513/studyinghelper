import { useState, useEffect } from 'react'
import { Globe, GraduationCap, Rss, School, Plus, Trash2, ExternalLink, FileText, RefreshCw } from 'lucide-react'
import GlassCard from '@/components/layout/GlassCard'
import type { Course } from '@/types'

type Tab = 'clipper' | 'scholar' | 'rss' | 'moodle'

interface FetchSource {
  id: string; course_id: string | null; type: string; name: string; url: string
  credentials_encrypted: string | null; last_fetched_at: string | null
  fetch_interval_minutes: number | null; is_active: number; created_at: string
}

// ── Web Clipper ──
function WebClipperTab() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ title: string; content: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const handleClip = async () => {
    if (!url.trim()) return
    setLoading(true); setResult(null)
    try {
      const res = await window.api.fetch.clipPage(url.trim())
      if (res.success && res.data) {
        setResult(res.data as any)
      } else {
        alert('剪藏失败：' + (res.error || '未知错误'))
      }
    } catch (e: any) {
      alert('剪藏出错：' + (e?.message || '未知'))
    } finally { setLoading(false) }
  }

  const handleSave = async () => {
    if (!result) return
    setSaving(true)
    await window.api.fetch.saveAsNote({ title: result.title, content: result.content })
    setSaving(false)
    alert('已保存为笔记！')
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input className="input-field flex-1" placeholder="粘贴网页 URL (https://...)" value={url}
          onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleClip()} />
        <button className="btn-primary text-xs !py-2" onClick={handleClip} disabled={loading}>
          {loading ? '提取中...' : '提取正文'}
        </button>
      </div>
      {result && (
        <GlassCard className="!p-4">
          <h3 className="text-sm font-semibold text-[#E4E4E7] mb-2">{result.title}</h3>
          <pre className="text-xs text-[#A1A1AA] whitespace-pre-wrap max-h-64 overflow-y-auto font-mono leading-relaxed">{result.content.slice(0, 3000)}</pre>
          <button className="btn-primary text-xs !py-1.5 mt-3" onClick={handleSave} disabled={saving}>
            <FileText className="w-3 h-3" /> 保存为笔记
          </button>
        </GlassCard>
      )}
    </div>
  )
}

// ── Scholar Search ──
function ScholarTab() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [papers, setPapers] = useState<any[]>([])

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true); setPapers([])
    try {
      const res = await window.api.fetch.searchScholar(query.trim())
      if (res.success && res.data) {
        setPapers(res.data as any[])
      } else {
        alert('搜索失败：' + (res.error || '未知错误'))
      }
    } catch (e: any) {
      alert('搜索出错：' + (e?.message || '未知'))
    } finally { setLoading(false) }
  }

  const handleSave = async (paper: any) => {
    const content = `# ${paper.title}\n\n**作者**: ${(paper.authors || []).join(', ')}\n**年份**: ${paper.year || '未知'}\n**期刊**: ${paper.venue || '未知'}\n**引用数**: ${paper.citationCount ?? 'N/A'}\n**DOI**: ${paper.doi || 'N/A'}\n\n## 摘要\n\n${paper.abstract || '(无摘要)'}\n\n[原文链接](${paper.url})`
    await window.api.fetch.saveAsNote({ title: paper.title, content })
    alert('论文信息已保存为笔记！')
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input className="input-field flex-1" placeholder="搜索论文关键词..." value={query}
          onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
        <button className="btn-primary text-xs !py-2" onClick={handleSearch} disabled={loading}>
          <GraduationCap className="w-3.5 h-3.5" /> 搜索
        </button>
      </div>
      {loading && <p className="text-xs text-[#52525B]">搜索中...</p>}
      <div className="space-y-2">
        {papers.map((p: any, i: number) => (
          <GlassCard key={p.paperId || i} className="!p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#E4E4E7] truncate">{p.title}</p>
                <p className="text-[10px] text-[#A1A1AA] mt-0.5">{(p.authors || []).slice(0, 3).join(', ')} · {p.year || '?'} · {p.venue || ''}</p>
                <p className="text-[10px] text-[#52525B] mt-0.5 line-clamp-2">{p.abstract?.slice(0, 200)}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <a href={p.url} target="_blank" className="p-1 rounded text-[#52525B] hover:text-white"><ExternalLink className="w-3 h-3" /></a>
                <button className="p-1 rounded text-[#52525B] hover:text-violet-400" onClick={() => handleSave(p)} title="保存引用"><FileText className="w-3 h-3" /></button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}

// ── RSS ──
function RssTab() {
  const [sources, setSources] = useState<FetchSource[]>([])
  const [url, setUrl] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [feedTitle, setFeedTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const [fetchingId, setFetchingId] = useState<string | null>(null)
  const [urlError, setUrlError] = useState('')
  const [initError, setInitError] = useState('')

  const refresh = async () => {
    try {
      const data = await window.api.fetchSources.list({ type: 'rss' }) as FetchSource[]
      setSources(data)
      setInitError('')
    } catch (e: any) {
      console.error('[RSS] Failed to load sources:', e)
      setInitError('加载 RSS 源失败，请确认数据库已初始化')
    }
  }

  useEffect(() => { refresh() }, [])

  const handleAdd = async () => {
    if (!url.trim()) {
      setUrlError('请输入 RSS 订阅地址')
      return
    }
    setUrlError('')
    setAdding(true)
    try {
      // First, try to fetch the feed to get its real title as the source name
      const res = await window.api.fetch.fetchRss(url.trim())
      const feedName = (res.success && res.data) ? (res.data as any).title || url.trim() : url.trim()
      await window.api.fetchSources.create({ type: 'rss', name: feedName, url: url.trim(), fetch_interval_minutes: 60, is_active: 1 })
      setUrl('')
      refresh()
    } catch (e: any) {
      alert('添加失败：' + (e?.message || '未知错误'))
    } finally { setAdding(false) }
  }

  const handleFetch = async (source: FetchSource) => {
    setFetchingId(source.id); setItems([]); setFeedTitle('')
    try {
      const res = await window.api.fetch.fetchRss(source.url)
      // Also try to update source name if it was a raw URL
      if (res.success && res.data) {
        const d = res.data as any
        setFeedTitle(d.title || source.name)
        setItems(d.items || [])
        await window.api.fetchSources.update(source.id, { last_fetched_at: new Date().toISOString() })
      } else {
        alert('获取失败：' + (res.error || '未知错误'))
      }
    } catch (e: any) {
      alert('抓取出错：' + (e?.message || '未知'))
    } finally {
      setFetchingId(null)
    }
  }

  const handleSaveItem = async (item: any) => {
    try {
      const content = `# ${item.title}\n\n> 来源: ${feedTitle}\n\n${item.content || item.contentSnippet || ''}\n\n[原文链接](${item.link})`
      await window.api.fetch.saveAsNote({ title: item.title, content })
      alert('已保存为笔记！')
    } catch (e: any) {
      alert('保存失败：' + (e?.message || '未知错误'))
    }
  }

  return (
    <div className="space-y-4">
      {/* Add source: single URL input, feed name auto-detected */}
      <div className="flex gap-2">
        <div className="flex-1">
          <input className={`input-field ${urlError ? '!border-red-400' : ''}`} placeholder="粘贴 RSS 订阅地址 (https://...)" value={url}
            onChange={e => { setUrl(e.target.value); setUrlError('') }} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          {urlError && <p className="text-[10px] text-red-400 mt-1">{urlError}</p>}
        </div>
        <button className="btn-primary text-xs !py-2 flex-shrink-0" onClick={handleAdd} disabled={adding}>
          <Plus className={`w-3.5 h-3.5 ${adding ? 'hidden' : ''}`} />
          <RefreshCw className={`w-3.5 h-3.5 ${adding ? 'animate-spin' : 'hidden'}`} />
          {adding ? '检测中...' : '添加订阅'}
        </button>
      </div>
      <p className="text-[10px] text-[#52525B] -mt-3">粘贴 RSS 地址即可自动识别订阅源名称，无需手动填写</p>
      {/* Init error */}
      {initError && <p className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{initError}</p>}
      {/* Source list */}
      {sources.map(s => (
        <GlassCard key={s.id} className="!p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#E4E4E7]">{s.name}</p>
              <p className="text-[10px] text-[#52525B] truncate max-w-xs">{s.url}</p>
            </div>
            <div className="flex gap-1">
              <button className="btn-secondary text-xs !py-1 !px-2" onClick={() => handleFetch(s)} disabled={fetchingId === s.id}>
                <RefreshCw className={`w-3 h-3 ${fetchingId === s.id ? 'animate-spin' : ''}`} /> {fetchingId === s.id ? '抓取中...' : '抓取'}
              </button>
              <button className="p-1.5 rounded text-[#52525B] hover:text-red-400"
                onClick={async () => { await window.api.fetchSources.delete(s.id); refresh() }}><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
        </GlassCard>
      ))}
      {/* RSS items */}
      {feedTitle && <p className="text-xs text-[#A1A1AA] font-medium">{feedTitle} ({items.length} 条)</p>}
      {items.map((item: any, i: number) => (
        <GlassCard key={i} className="!p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#E4E4E7] truncate">{item.title}</p>
              <p className="text-[10px] text-[#52525B] mt-0.5 line-clamp-2">{item.contentSnippet?.slice(0, 200)}</p>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              {item.link && <a href={item.link} target="_blank" className="p-1 rounded text-[#52525B] hover:text-white"><ExternalLink className="w-3 h-3" /></a>}
              <button className="p-1 rounded text-[#52525B] hover:text-violet-400" onClick={() => handleSaveItem(item)} title="保存为笔记"><FileText className="w-3 h-3" /></button>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  )
}

// ── Moodle ──
function MoodleTab() {
  const [url, setUrl] = useState('')
  const [cookie, setCookie] = useState('')
  const [loading, setLoading] = useState(false)
  const [resources, setResources] = useState<any[]>([])

  const handleScan = async () => {
    if (!url.trim()) return
    setLoading(true); setResources([])
    try {
      const res = await window.api.fetch.scanMoodle(url.trim(), cookie.trim() || undefined)
      if (res.success && res.data) {
        setResources(res.data as any[])
      } else {
        alert('扫描失败：' + (res.error || '未知错误'))
      }
    } catch (e: any) {
      alert('扫描出错：' + (e?.message || '未知'))
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <input className="input-field w-full" placeholder="Moodle 课程页面 URL" value={url} onChange={e => setUrl(e.target.value)} />
        <input className="input-field w-full" placeholder="Cookie (可选，用于登录验证)" value={cookie} onChange={e => setCookie(e.target.value)} />
      </div>
      <button className="btn-primary text-xs !py-2" onClick={handleScan} disabled={loading}>
        <School className="w-3.5 h-3.5" /> {loading ? '扫描中...' : '扫描资源'}
      </button>
      <div className="space-y-2">
        {resources.map((r: any, i: number) => (
          <GlassCard key={i} className="!p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#E4E4E7]">{r.title}</p>
                <p className="text-[10px] text-[#52525B]">{r.type} · {r.url.slice(0, 60)}...</p>
              </div>
              <a href={r.url} target="_blank" className="p-1.5 rounded text-[#52525B] hover:text-white"><ExternalLink className="w-3.5 h-3.5" /></a>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}

// ── Main Page ──
const TABS: { key: Tab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { key: 'clipper', label: '网页剪藏', icon: Globe },
  { key: 'scholar', label: '学术检索', icon: GraduationCap },
  { key: 'rss', label: 'RSS 订阅', icon: Rss },
  { key: 'moodle', label: 'Moodle', icon: School },
]

export default function ResourceFetcherPage(): React.ReactElement {
  const [tab, setTab] = useState<Tab>('clipper')

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold gradient-text mb-5">资源抓取</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${tab === t.key ? 'bg-white/[0.08] text-white' : 'text-[#52525B] hover:text-white hover:bg-white/[0.03]'}`}
            onClick={() => setTab(t.key)}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-[20rem]">
        {tab === 'clipper' && <WebClipperTab />}
        {tab === 'scholar' && <ScholarTab />}
        {tab === 'rss' && <RssTab />}
        {tab === 'moodle' && <MoodleTab />}
      </div>
    </div>
  )
}
