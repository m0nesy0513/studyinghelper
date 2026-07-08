import { useState, useEffect, useRef, useCallback } from 'react'
import { Sparkles, Send, Plus, Trash2, MessageSquare, FileText, Camera, School, Target, Calendar } from 'lucide-react'
import GlassCard from '@/components/layout/GlassCard'
import type { Course } from '@/types'

interface Conv { id: string; title: string; model: string; created_at: string; updated_at: string }
interface Msg { id: string; conversation_id: string; role: string; content: string; created_at: string }

// ── Settings Tab ──
function SettingsTab({ onReady }: { onReady: () => void }) {
  const [key, setKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [hasKey, setHasKey] = useState<boolean | null>(null)
  useEffect(() => { window.api.ai.hasKey().then(h => setHasKey(h)) }, [])
  const save = async () => { if (!key.trim()) return; setSaving(true); await window.api.settings.setEncrypted('deepseek_api_key', key.trim()); setSaving(false); setHasKey(true); setKey(''); onReady() }
  if (hasKey === null) return <div className="text-center py-10 text-sm text-[#52525B]">检测中...</div>
  if (hasKey) return null
  return (
    <GlassCard className="!p-6 max-w-md mx-auto text-center">
      <Sparkles className="w-10 h-10 text-violet-400 mx-auto mb-3" />
      <h3 className="text-sm font-semibold text-[#E4E4E7] mb-2">配置 DeepSeek API Key</h3>
      <p className="text-[10px] text-[#52525B] mb-4">前往 <a href="https://platform.deepseek.com/api_keys" target="_blank" className="text-violet-400 underline">platform.deepseek.com</a> 获取<br />国内直连，无墙。充 1 元够用很久。</p>
      <input className="input-field mb-3" placeholder="sk-..." value={key} onChange={e => setKey(e.target.value)} type="password" />
      <button className="btn-primary text-sm !py-2 !px-6 w-full" onClick={save} disabled={saving}>{saving ? '验证中...' : '保存'}</button>
    </GlassCard>
  )
}

// ── Chat Tab ──
function ChatTab() {
  const [convs, setConvs] = useState<Conv[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const refreshConvs = useCallback(async () => { setConvs(await window.api.conv.list() as Conv[]) }, [])
  const loadMsgs = useCallback(async (id: string) => { setMsgs(await window.api.msg.list(id) as Msg[]) }, [])
  useEffect(() => { refreshConvs() }, [refreshConvs])
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight }, [msgs])

  const send = async () => {
    if (!input.trim() || loading) return
    let id = activeId; if (!id) { const c = await window.api.conv.create(input.slice(0, 30) || '对话') as Conv; id = c.id; setConvs(prev => [c, ...prev]); setActiveId(id) }
    await window.api.msg.create(id, 'user', input.trim())
    const um: Msg = { id: 'u', conversation_id: id, role: 'user', content: input.trim(), created_at: '' }; setMsgs(prev => [...prev, um]); setInput(''); setLoading(true)
    const history = [...msgs, um].map(m => ({ role: m.role, content: m.content }))
    const res = await window.api.ai.chat(history)
    if (res.success && res.content) { await window.api.msg.create(id, 'assistant', res.content); setMsgs(prev => [...prev, { id: 'a', conversation_id: id, role: 'assistant', content: res.content, created_at: '' }]) }
    else setMsgs(prev => [...prev, { id: 'e', conversation_id: id, role: 'assistant', content: `❌ ${res.error || '错误'}`, created_at: '' }])
    setLoading(false); refreshConvs()
  }

  const selectConv = (id: string) => { setActiveId(id); loadMsgs(id) }
  const deleteConv = async (id: string) => { await window.api.conv.delete(id); if (activeId === id) { setActiveId(null); setMsgs([]) }; refreshConvs() }

  return (
    <div className="flex gap-4 h-[calc(100vh-14rem)]">
      <div className="w-44 flex-shrink-0 border-r border-[rgba(255,255,255,0.05)] overflow-y-auto pr-2">
        <button className="btn-primary text-[10px] !py-1.5 !px-3 w-full mb-2" onClick={async () => { const c = await window.api.conv.create('新对话') as Conv; setConvs(prev => [c, ...prev]); selectConv(c.id) }}><Plus className="w-3 h-3" /> 新对话</button>
        {convs.map(c => (
          <div key={c.id} className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer text-xs ${c.id === activeId ? 'bg-white/[0.08] text-white' : 'text-[#A1A1AA] hover:text-white hover:bg-white/[0.03]'}`}
            onClick={() => selectConv(c.id)}>
            <span className="truncate flex-1">{c.title}</span>
            <button className="p-0.5 rounded opacity-0 hover:opacity-100 hover:bg-red-500/20 text-[#52525B] hover:text-red-400" onClick={e => { e.stopPropagation(); deleteConv(c.id) }}><Trash2 className="w-3 h-3" /></button>
          </div>
        ))}
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-3 pr-2">
          {msgs.length === 0 && !loading && <div className="flex flex-col items-center py-16 text-center"><Sparkles className="w-8 h-8 text-[#27272A] mb-3" /><p className="text-xs text-[#52525B]">发送消息开始对话</p></div>}
          {msgs.map(m => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-violet-500/20 text-[#E4E4E7]' : 'bg-white/[0.04] text-[#A1A1AA]'}`}>{m.content}</div>
            </div>
          ))}
          {loading && <p className="text-[10px] text-[#52525B] text-center">思考中...</p>}
        </div>
        <div className="flex gap-2"><input className="input-field flex-1" placeholder="输入消息..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()} /><button className="btn-primary text-xs !py-2 !px-3" onClick={send} disabled={loading || !input.trim()}><Send className="w-3.5 h-3.5" /></button></div>
      </div>
    </div>
  )
}

// ── OCR Tab ──
function OcrTab() {
  const [img, setImg] = useState<string | null>(null)
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = async () => { const url = r.result as string; setImg(url); setLoading(true); const res = await window.api.ai.ocr(url.split(',')[1], f.type); setLoading(false); if (res.success) setResult(res.text || ''); else alert(res.error) }; r.readAsDataURL(f) }
  return (
    <div className="max-w-lg mx-auto space-y-4">
      <label className="block"><GlassCard className="flex flex-col items-center py-10 text-center cursor-pointer hover:!border-violet-500/25 !p-6"><Camera className="w-10 h-10 text-[#52525B] mb-3" /><p className="text-sm text-[#A1A1AA]">点击上传图片</p><p className="text-[10px] text-[#52525B] mt-1">JPG/PNG — 拍照识字</p><input type="file" accept="image/*" className="hidden" onChange={handleFile} /></GlassCard></label>
      {img && <img src={img} className="w-full rounded-xl" alt="preview" />}
      {loading && <p className="text-xs text-[#52525B] text-center">识别中...</p>}
      {result && <GlassCard className="!p-4"><pre className="text-xs text-[#A1A1AA] whitespace-pre-wrap max-h-64 overflow-y-auto">{result}</pre><button className="btn-primary text-xs !py-1.5 mt-3" onClick={async () => { await window.api.fetch.saveAsNote({ title: 'OCR 识别', content: result }); alert('已保存') }}><FileText className="w-3 h-3" /> 保存为笔记</button></GlassCard>}
    </div>
  )
}

// ── Generator Tab ──
function GeneratorTab() {
  const [notes, setNotes] = useState<Array<{ id: string; title: string }>>([])
  const [sid, setSid] = useState(''); const [mode, setMode] = useState<'flashcards' | 'quiz' | 'summary'>('flashcards')
  const [result, setResult] = useState(''); const [loading, setLoading] = useState(false)
  const [decks, setDecks] = useState<Array<{ id: string; name: string }>>([]); const [did, setDid] = useState('')
  useEffect(() => { window.api.notes.list().then(d => setNotes(d as any)); window.api.decks.list().then(d => setDecks(d as any)) }, [])
  const generate = async () => {
    if (!sid) return; setLoading(true); setResult('')
    const full = await window.api.notes.get(sid) as any
    const text = (full?.content || full?.plain_text || '').slice(0, 4000)
    if (!text) { alert('笔记为空'); setLoading(false); return }
    const prompts: Record<string, string> = { flashcards: '根据以下笔记生成5-8张闪卡。格式："问题 --- 答案"，卡片间空一行。只输出卡片。', quiz: '根据以下笔记出5道选择题(A/B/C/D)，最后给答案。', summary: '用中文总结以下笔记核心要点，分点列出。' }
    const res = await window.api.ai.chat([{ role: 'user', content: `${prompts[mode]}\n\n标题：${full.title}\n\n${text}` }])
    setLoading(false); if (res.success) setResult(res.content || ''); else alert(res.error)
  }
  const importDeck = async () => { if (!did || !result) return; let c = 0; for (const b of result.split(/\n{2,}/)) { const p = b.split(/\n---\n/); if (p.length >= 2) { await window.api.cards.create({ front: p[0].trim(), back: p.slice(1).join('\n---\n').trim(), deck_id: did }); c++ } } alert(`导入 ${c} 张`) }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-2"><select className="input-field flex-1" value={sid} onChange={e => setSid(e.target.value)}><option value="">选择笔记...</option>{notes.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}</select><button className="btn-primary text-xs !py-2" onClick={generate} disabled={loading || !sid}>{loading ? '生成中...' : '生成'}</button></div>
      <div className="flex gap-1">{(['flashcards', 'quiz', 'summary'] as const).map(m => <button key={m} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${mode === m ? 'bg-white/[0.08] text-white' : 'text-[#52525B] hover:text-white'}`} onClick={() => setMode(m)}>{m === 'flashcards' ? '闪卡' : m === 'quiz' ? '选题' : '摘要'}</button>)}</div>
      {result && mode === 'flashcards' && <div className="flex gap-2"><select className="input-field flex-1" value={did} onChange={e => setDid(e.target.value)}><option value="">选择牌组...</option>{decks.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select><button className="btn-primary text-xs !py-2" onClick={importDeck} disabled={!did}>导入</button></div>}
      {result && <GlassCard className="!p-4"><pre className="text-xs text-[#A1A1AA] whitespace-pre-wrap max-h-80 overflow-y-auto">{result}</pre></GlassCard>}
    </div>
  )
}

// ── Exam Tab ──
function ExamTab() {
  const [exams, setExams] = useState<any[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [cid, setCid] = useState(''); const [date, setDate] = useState(''); const [score, setScore] = useState('')
  const refresh = useCallback(async () => { const [e, c, u] = await Promise.all([window.api.exam.list() as Promise<any[]>, window.api.courses.list() as Promise<Course[]>, window.api.exam.upcoming() as Promise<any[]>]); setExams(u.length > 0 ? u : e); setCourses(c); setLoading(false) }, [])
  useEffect(() => { refresh() }, [refresh])
  if (loading) return <div className="text-center py-10 text-sm text-[#52525B]">加载中...</div>
  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-[#E4E4E7]">考试倒计时</h3><button className="btn-primary text-xs !py-2 !px-4" onClick={() => setShowForm(v => !v)}><Calendar className="w-3.5 h-3.5" /> {showForm ? '取消' : '添加'}</button></div>
      {showForm && <GlassCard className="!p-4 space-y-3"><select className="input-field" value={cid} onChange={e => setCid(e.target.value)}><option value="">选择课程</option>{courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><input className="input-field" type="date" value={date} onChange={e => setDate(e.target.value)} /><input className="input-field" placeholder="目标分数" value={score} onChange={e => setScore(e.target.value)} /><button className="btn-primary text-xs !py-2 w-full" onClick={async () => { if (!cid || !date) return; await window.api.exam.create({ course_id: cid, exam_date: date, target_score: score ? parseFloat(score) : undefined }); setShowForm(false); setCid(''); setDate(''); setScore(''); refresh() }}>保存</button></GlassCard>}
      {exams.length === 0 ? (
        <GlassCard className="flex flex-col items-center py-10 text-center"><Target className="w-8 h-8 text-[#27272A] mb-2" /><p className="text-xs text-[#52525B]">还没有考试安排</p></GlassCard>
      ) : <div className="space-y-2">
        {exams.map((e: any) => {
          const course = courses.find(c => c.id === e.course_id)
          const dl = e.days_left ?? Math.ceil((new Date(e.exam_date).getTime() - Date.now()) / 86400000)
          const u = dl <= 7
          return (
            <GlassCard key={e.id} className={`!p-4 ${u ? '!border-red-500/20' : ''}`}>
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-[#E4E4E7]">{course?.name || '未知'}</p><p className="text-[10px] text-[#52525B]">{e.exam_date?.split('T')[0]} {e.target_score ? `· 目标：${e.target_score}` : ''}</p></div>
                <div className="text-right"><p className={`text-lg font-bold ${u ? 'text-red-400' : dl <= 30 ? 'text-amber-400' : 'text-[#A1A1AA]'}`}>{dl <= 0 ? '今天' : dl + '天'}</p><button className="text-[10px] text-[#52525B] hover:text-red-400" onClick={async () => { await window.api.exam.delete(e.id); refresh() }}>删除</button></div>
              </div>
              {dl <= 0 && <p className="text-[10px] text-green-400 mt-2">考试已到，祝顺利！🎯</p>}
              {dl > 0 && u && <p className="text-[10px] text-red-400 mt-2">⏰ 冲刺阶段！</p>}
            </GlassCard>
          )
        })}
      </div>}
    </div>
  )
}

// ── Main ──
type TabMode = 'chat' | 'ocr' | 'generator' | 'exam'
export default function AIPage(): React.ReactElement {
  const [tab, setTab] = useState<TabMode>('chat')
  const [keyReady, setKeyReady] = useState(false)
  useEffect(() => { window.api.ai.hasKey().then(h => setKeyReady(h)) }, [])
  const tabs: Array<{ key: TabMode; label: string; icon: React.FC<{ className?: string }> }> = [
    { key: 'chat', label: '对话', icon: MessageSquare }, { key: 'ocr', label: 'OCR', icon: Camera },
    { key: 'generator', label: '生成', icon: Sparkles }, { key: 'exam', label: '考试', icon: Target },
  ]
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold gradient-text mb-5">AI 助手</h1>
      {!keyReady ? <SettingsTab onReady={() => setKeyReady(true)} /> : <>
        <div className="flex gap-1 mb-4">{tabs.map(t => <button key={t.key} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap ${tab === t.key ? 'bg-white/[0.08] text-white' : 'text-[#52525B] hover:text-white hover:bg-white/[0.03]'}`} onClick={() => setTab(t.key)}><t.icon className="w-3.5 h-3.5" />{t.label}</button>)}</div>
        {tab === 'chat' && <ChatTab />}{tab === 'ocr' && <OcrTab />}{tab === 'generator' && <GeneratorTab />}{tab === 'exam' && <ExamTab />}
      </>}
    </div>
  )
}
