import { useState, useEffect } from 'react'
import { Plus, RefreshCw, ExternalLink, FileText, Trash2, Rss, Globe, GraduationCap } from 'lucide-react'
import { Link } from 'react-router-dom'
import GlassCard from '@/components/layout/GlassCard'

interface FeedSource {
  id: string; name: string; url: string; last_fetched_at: string | null
}

interface Article {
  title: string; link: string | null; contentSnippet: string | null
  pubDate: string | null; creator: string | null
  sourceName: string
}

function formatDate(d: string | null): string {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }
  catch { return d.slice(0, 16) }
}

export default function NewsroomPage(): React.ReactElement {
  const [sources, setSources] = useState<FeedSource[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [refreshOk, setRefreshOk] = useState(false)
  const [refreshError, setRefreshError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [addUrl, setAddUrl] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [selectedSource, setSelectedSource] = useState<string | null>(null) // null = all
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [translations, setTranslations] = useState<Record<number, string>>({})
  const [transErrors, setTransErrors] = useState<Record<number, string>>({})
  const [translating, setTranslating] = useState<Set<number>>(new Set())
  const [editingSource, setEditingSource] = useState<FeedSource | null>(null)
  const [editName, setEditName] = useState('')
  const [editUrl, setEditUrl] = useState('')

  const loadSources = async () => {
    const data = await window.api.fetchSources.list({ type: 'rss' }) as FeedSource[]
    setSources(data)
    return data
  }

  const loadCached = async () => {
    try {
      const cached = await window.api.rss.getCachedArticles()
      if (cached.articles && cached.articles.length > 0) {
        setArticles(cached.articles as Article[])
        setLastUpdated(cached.updatedAt)
        setLoading(false)
        return true
      }
    } catch { /* no cache yet */ }
    return false
  }

  const handleRefresh = async () => {
    setFetching(true)
    setRefreshOk(false)
    setRefreshError('')
    setLoading(true)
    try {
      const fresh = await window.api.rss.refreshAll()
      // force new array so React always re-renders even if data is identical
      setArticles([...fresh.articles] as Article[])
      setLastUpdated(fresh.updatedAt)
      setRefreshOk(true)
      setTimeout(() => setRefreshOk(false), 2000)
    } catch (e: any) {
      console.error('Refresh failed:', e)
      setRefreshError(e?.message || '刷新失败')
    } finally {
      setLoading(false)
      setFetching(false)
    }
  }

  useEffect(() => {
    (async () => {
      await loadSources()
      const hasCache = await loadCached()
      if (!hasCache) {
        await handleRefresh()
      } else {
        setLoading(false)
        // Polling module already refreshes on startup — no need to re-fetch
      }
    })()
  }, [])

  const handleAdd = async () => {
    if (!addUrl.trim()) { setAddError('请输入 RSS 地址'); return }
    setAddError('')
    setAdding(true)
    try {
      const res = await window.api.fetch.fetchRss(addUrl.trim())
      const feedName = (res.success && res.data) ? (res.data as any).title || addUrl.trim() : addUrl.trim()
      await window.api.fetchSources.create({ type: 'rss', name: feedName, url: addUrl.trim(), fetch_interval_minutes: 60, is_active: 1 })
      setAddUrl('')
      await loadSources()
      await handleRefresh()
    } catch (e: any) {
      setAddError(e?.message || '添加失败')
    } finally { setAdding(false) }
  }

  const handleSaveNote = async (a: Article) => {
    const content = `# ${a.title}\n\n> 来源: ${a.sourceName}${a.creator ? ` · ${a.creator}` : ''}\n\n${a.contentSnippet || ''}\n\n[原文链接](${a.link})`
    await window.api.fetch.saveAsNote({ title: a.title, content })
    alert('已保存为笔记！')
  }

  const handleTranslate = async (i: number, title: string, snippet: string | null) => {
    // Auto-expand so user sees the result
    setExpanded(prev => new Set(prev).add(i))
    setTranslations(prev => { const n = { ...prev }; delete n[i]; return n })
    setTransErrors(prev => { const n = { ...prev }; delete n[i]; return n })
    setTranslating(prev => new Set(prev).add(i))
    try {
      const hasKey = await window.api.ai.hasKey()
      if (!hasKey) {
        setTransErrors(prev => ({ ...prev, [i]: '请先在 AI 助手页面配置 DeepSeek API Key' }))
        return
      }
      const text = `${title}\n\n${snippet || ''}`
      const res = await window.api.ai.chat([
        { role: 'system', content: '你是一个专业的翻译助手。请将以下英文内容翻译成简洁流畅的中文。保留原文的关键术语和人名。只输出翻译结果，不要加解释。' },
        { role: 'user', content: `请翻译成中文：\n\n${text.slice(0, 2000)}` },
      ])
      if (res.success && res.content) {
        setTranslations(prev => ({ ...prev, [i]: res.content! }))
      } else {
        setTransErrors(prev => ({ ...prev, [i]: res.error || 'AI 未返回结果' }))
      }
    } catch (e: any) {
      setTransErrors(prev => ({ ...prev, [i]: e?.message || '翻译出错' }))
    } finally {
      setTranslating(prev => { const next = new Set(prev); next.delete(i); return next })
    }
  }

  const displayed = selectedSource
    ? articles.filter(a => a.sourceName === selectedSource)
    : articles

  const handleDeleteSource = async (id: string, name: string) => {
    if (!confirm(`删除订阅源"${name}"？`)) return
    await window.api.fetchSources.delete(id)
    if (selectedSource === name) setSelectedSource(null)
    await loadSources()
    await handleRefresh()
  }

  const toggleExpand = (i: number) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i); else next.add(i)
      return next
    })
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold gradient-text">资讯室</h1>
          <p className="text-[10px] text-[#52525B] mt-0.5">
            {refreshOk ? '✓ 已刷新' : lastUpdated ? `上次更新 ${formatDate(lastUpdated)}` : ''}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {refreshError && <span className="text-[10px] text-red-400">{refreshError}</span>}
          <button className="btn-secondary text-xs !py-2 !px-3" onClick={handleRefresh} disabled={fetching}>
            <RefreshCw className={`w-3.5 h-3.5 ${fetching ? 'animate-spin' : ''}`} />
            {fetching ? '刷新中...' : '刷新全部'}
          </button>
        </div>
      </div>

      {/* Add source */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1">
          <input
            className={`input-field text-xs ${addError ? '!border-red-400' : ''}`}
            placeholder="添加 RSS 订阅地址..."
            value={addUrl}
            onChange={e => { setAddUrl(e.target.value); setAddError('') }}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          {addError && <p className="text-[10px] text-red-400 mt-1">{addError}</p>}
        </div>
        <button className="btn-primary text-xs !py-2 flex-shrink-0" onClick={handleAdd} disabled={adding}>
          <Plus className="w-3.5 h-3.5" />
          {adding ? '检测中...' : '添加'}
        </button>
      </div>

      {/* Source filter bar */}
      {sources.length > 0 && (
        <div className="flex items-center gap-1.5 mb-4 flex-wrap">
          <span className="text-[10px] text-[#52525B] mr-1">筛选：</span>
          <button
            className={`text-[10px] px-2.5 py-1 rounded-full transition-colors ${selectedSource === null ? 'bg-violet-500/20 text-violet-300' : 'bg-white/[0.04] text-[#A1A1AA] hover:text-white'}`}
            onClick={() => setSelectedSource(null)}
          >
            全部
          </button>
          {sources.map(s => {
            const active = selectedSource === s.name
            return (
              <button
                key={s.id}
                className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full transition-colors group ${active ? 'bg-violet-500/20 text-violet-300' : 'bg-white/[0.04] text-[#A1A1AA] hover:text-white'}`}
                onClick={() => setSelectedSource(active ? null : s.name)}
              >
                {s.name}
                <span className="opacity-0 group-hover:opacity-100 text-[#52525B] hover:text-violet-400"
                  onClick={e => { e.stopPropagation(); setEditingSource(s); setEditName(s.name); setEditUrl(s.url) }}
                  title="编辑">
                  ✎
                </span>
                <span className="opacity-0 group-hover:opacity-100 text-[#52525B] hover:text-red-400"
                  onClick={e => { e.stopPropagation(); handleDeleteSource(s.id, s.name) }}
                  title="删除">
                  ×
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Edit source modal */}
      {editingSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setEditingSource(null)}>
          <GlassCard className="!p-6 w-96" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-[#E4E4E7] mb-4">编辑订阅源</h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] text-[#52525B] mb-1 block">名称</label>
                <input className="input-field text-xs" value={editName} onChange={e => setEditName(e.target.value)} placeholder="订阅源名称" />
              </div>
              <div>
                <label className="text-[10px] text-[#52525B] mb-1 block">RSS 地址</label>
                <input className="input-field text-xs" value={editUrl} onChange={e => setEditUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button className="btn-ghost text-xs !py-2 !px-4" onClick={() => setEditingSource(null)}>取消</button>
                <button className="btn-primary text-xs !py-2 !px-4" onClick={async () => {
                  const newName = editName.trim()
                  const newUrl = editUrl.trim()
                  if (!newName || !newUrl) return
                  await window.api.fetchSources.update(editingSource.id, { name: newName, url: newUrl })
                  if (selectedSource === editingSource.name) setSelectedSource(newName)
                  // Update cached article sourceNames if name changed
                  if (newName !== editingSource.name) {
                    setArticles(prev => prev.map(a => a.sourceName === editingSource.name ? { ...a, sourceName: newName } : a))
                  }
                  await loadSources()
                  setEditingSource(null)
                }}>保存</button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Content */}
      {loading && articles.length === 0 ? (
        <div className="text-center py-16">
          <RefreshCw className="w-8 h-8 text-[#27272A] mx-auto mb-3 animate-spin" />
          <p className="text-sm text-[#52525B]">加载资讯中...</p>
        </div>
      ) : sources.length === 0 ? (
        <GlassCard className="flex flex-col items-center py-14 text-center">
          <Rss className="w-10 h-10 text-[#27272A] mb-3" />
          <p className="text-[#A1A1AA] font-medium mb-1">还没有订阅源</p>
          <p className="text-xs text-[#52525B] mb-4">在上方输入 RSS 地址添加订阅</p>
          <p className="text-[10px] text-[#52525B]">推荐：少数派 sspai.com/feed · 阮一峰 ruanyifeng.com/blog/atom.xml · IT之家 ithome.com/rss</p>
        </GlassCard>
      ) : displayed.length === 0 ? (
        <GlassCard className="flex flex-col items-center py-14 text-center">
          <Globe className="w-10 h-10 text-[#27272A] mb-3" />
          <p className="text-[#A1A1AA] font-medium mb-1">{selectedSource ? '该源暂无文章' : '暂无文章'}</p>
          <p className="text-xs text-[#52525B]">{selectedSource ? '试试其他订阅源' : '点击"刷新全部"获取最新文章'}</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {displayed.map((a, i) => (
            <GlassCard key={i} className="!p-3 cursor-pointer hover:bg-white/[0.02] transition-colors" onClick={() => toggleExpand(i)}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#E4E4E7] leading-snug">{a.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-violet-400">{a.sourceName}</span>
                    {a.pubDate && <span className="text-[10px] text-[#52525B]">{formatDate(a.pubDate)}</span>}
                    {a.creator && <span className="text-[10px] text-[#52525B]">· {a.creator}</span>}
                  </div>
                  {/* Expandable snippet + translation */}
                  {expanded.has(i) && (
                    <div className="mt-2 border-t border-[rgba(255,255,255,0.05)] pt-2">
                      {a.contentSnippet && (
                        <p className="text-xs text-[#A1A1AA] leading-relaxed">
                          {a.contentSnippet.length > 500 ? a.contentSnippet.slice(0, 500) + '...' : a.contentSnippet}
                        </p>
                      )}
                      {translations[i] && (
                        <div className="mt-2 p-2 rounded-lg bg-amber-500/[0.06] border border-amber-500/10">
                          <p className="text-[10px] text-amber-400/60 mb-1">AI 翻译</p>
                          <p className="text-xs text-[#D4D4D8] leading-relaxed">{translations[i]}</p>
                        </div>
                      )}
                      {transErrors[i] && (
                        <p className="text-[10px] text-red-400 mt-1">{transErrors[i]}</p>
                      )}
                      {translating.has(i) && !translations[i] && !transErrors[i] && (
                        <p className="text-[10px] text-amber-400/60 mt-1 animate-pulse">翻译中...</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-0.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <button
                    className={`p-1.5 rounded-lg text-[#52525B] hover:text-amber-400 hover:bg-white/[0.06] ${translating.has(i) ? 'animate-pulse text-amber-400' : ''}`}
                    onClick={() => handleTranslate(i, a.title, a.contentSnippet)}
                    disabled={translating.has(i)}
                    title="AI 翻译"
                  >
                    {translating.has(i) ? '⏳' : '🌐'}
                  </button>
                  {a.link && (
                    <a href={a.link} target="_blank" className="p-1.5 rounded-lg text-[#52525B] hover:text-white hover:bg-white/[0.06]" title="浏览器打开">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button className="p-1.5 rounded-lg text-[#52525B] hover:text-violet-400 hover:bg-white/[0.06]" onClick={() => handleSaveNote(a)} title="保存为笔记">
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Footer links to other fetcher tools */}
      {!loading && (
        <div className="mt-6 pt-4 border-t border-[rgba(255,255,255,0.04)] flex items-center justify-center gap-4">
          <span className="text-[10px] text-[#52525B]">更多工具：</span>
          <Link to="/fetcher" className="flex items-center gap-1 text-[10px] text-[#52525B] hover:text-violet-400 transition-colors">
            <Globe className="w-3 h-3" /> 网页剪藏
          </Link>
          <Link to="/fetcher" className="flex items-center gap-1 text-[10px] text-[#52525B] hover:text-violet-400 transition-colors">
            <GraduationCap className="w-3 h-3" /> 学术检索
          </Link>
        </div>
      )}
    </div>
  )
}
