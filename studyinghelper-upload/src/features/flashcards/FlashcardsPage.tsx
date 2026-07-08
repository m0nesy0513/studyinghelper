import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Layers, Trash2, Play, BookOpen, ChevronLeft, X, Upload, Save, Edit3, AlertCircle } from 'lucide-react'
import GlassCard from '@/components/layout/GlassCard'
import { applySm2 } from '@/lib/spaced-repetition'
import type { Deck, Card, Course } from '@/types'
import ErrorBookPage from '@/features/errorbook/ErrorBookPage'

// ═══ Deck List ═══
function DeckList({ decks, dueMap, courses, onSelect, onDelete, onCreate }: {
  decks: Deck[]; dueMap: Record<string, number>; courses: Course[]
  onSelect: (id: string) => void; onDelete: (id: string) => void; onCreate: () => void
}) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold gradient-text">闪卡</h1>
        <button className="btn-primary text-xs !py-2 !px-4" onClick={onCreate}><Plus className="w-3.5 h-3.5" /> 新建牌组</button>
      </div>
      {decks.length === 0 ? (
        <GlassCard className="flex flex-col items-center py-14 text-center">
          <Layers className="w-10 h-10 text-[#27272A] mb-3" />
          <p className="text-[#A1A1AA] font-medium mb-1">还没有牌组</p>
          <p className="text-xs text-[#52525B]">创建牌组开始添加闪卡</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {decks.map(d => {
            const course = courses.find(c => c.id === d.course_id)
            const due = dueMap[d.id] || 0
            return (
              <GlassCard key={d.id} className="!p-4 cursor-pointer group" onClick={() => onSelect(d.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: d.color + '20' }}>
                      <Layers className="w-5 h-5" style={{ color: d.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#E4E4E7]">{d.name}</p>
                      {course && <span className="text-[10px] mt-0.5 inline-block" style={{ color: course.color }}>{course.name}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {due > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 font-bold">{due} 待复习</span>}
                    <button className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-[#52525B] hover:text-red-400 hover:bg-red-500/10"
                      onClick={e => { e.stopPropagation(); onDelete(d.id) }}><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </GlassCard>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ═══ Card List — browse (default) vs manage modes ═══
function CardList({ deck, cards, dueCount, onBack, onAdd, onDelete, onSaveCard, onStudy, onBatch, onStudyOne }: {
  deck: Deck; cards: Card[]; dueCount: number
  onBack: () => void; onAdd: () => void; onDelete: (id: string) => void
  onSaveCard: (id: string, front: string, back: string) => void
  onStudy: () => void; onBatch: () => void; onStudyOne: (card: Card) => void
}) {
  const [manageMode, setManageMode] = useState(false)
  const [drafts, setDrafts] = useState<Record<string, { front: string; back: string; dirty: boolean }>>({})

  useEffect(() => {
    const init: Record<string, { front: string; back: string; dirty: boolean }> = {}
    for (const c of cards) {
      if (!drafts[c.id] || !drafts[c.id].dirty) init[c.id] = { front: c.front, back: c.back, dirty: false }
    }
    if (Object.keys(init).length > 0) setDrafts(prev => ({ ...prev, ...init }))
  }, [cards])

  const setDraft = (id: string, field: 'front' | 'back', value: string) => {
    setDrafts(prev => ({ ...prev, [id]: { ...prev[id] || { front: '', back: '', dirty: false }, [field]: value, dirty: true } }))
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <button onClick={onBack} className="p-1.5 rounded-lg text-[#52525B] hover:text-white hover:bg-white/[0.06]"><ChevronLeft className="w-4 h-4" /></button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-[#E4E4E7] truncate">{deck.name}</h1>
          <p className="text-[10px] text-[#52525B]">{cards.length} 张 · {dueCount} 待复习</p>
        </div>
        <button className={`text-xs !py-2 !px-3 rounded-lg transition-colors ${manageMode ? 'bg-white/[0.08] text-white' : 'btn-ghost'}`} onClick={() => setManageMode(!manageMode)}>
          <Edit3 className="w-3.5 h-3.5" /><span className="ml-1.5">{manageMode ? '预览' : '管理'}</span>
        </button>
        <button className="btn-ghost text-xs !py-2 !px-3" onClick={onBatch}><Upload className="w-3.5 h-3.5" /> 批量导入</button>
        <button className="btn-secondary text-xs !py-2 !px-4" onClick={onAdd}><Plus className="w-3.5 h-3.5" /> 卡片</button>
        {dueCount > 0 && <button className="btn-primary text-xs !py-2 !px-4" onClick={onStudy}><Play className="w-3.5 h-3.5" /> 复习全部</button>}
      </div>

      {cards.length === 0 ? (
        <GlassCard className="flex flex-col items-center py-14 text-center">
          <BookOpen className="w-10 h-10 text-[#27272A] mb-3" />
          <p className="text-[#A1A1AA] font-medium mb-1">空牌组</p>
          <p className="text-xs text-[#52525B]">添加第一张闪卡</p>
        </GlassCard>
      ) : manageMode ? (
        <div className="space-y-3">
          {cards.map((c, i) => {
            const d = drafts[c.id] || { front: c.front, back: c.back, dirty: false }
            const due = new Date(c.next_review) <= new Date()
            return (
              <GlassCard key={c.id} className="!p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] text-[#52525B]">#{i + 1} {due && <span className="text-violet-400 font-bold ml-1">· 待复习</span>} {d.dirty && <span className="text-amber-400 ml-1">· 已修改</span>}</span>
                  <div className="flex items-center gap-1">
                    {d.dirty && <button className="btn-primary text-[10px] !py-1 !px-2" onClick={() => { onSaveCard(c.id, d.front, d.back); setDrafts(prev => ({ ...prev, [c.id]: { ...prev[c.id], dirty: false } })) }}><Save className="w-3 h-3" /> 保存</button>}
                    <button className="btn-ghost text-[10px] !py-1 !px-1 text-[#52525B] hover:text-red-400" onClick={() => { if (confirm('删除？')) onDelete(c.id) }}><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
                <div className="mb-2"><p className="text-[10px] text-[#52525B] mb-1">正面（问题）</p><textarea className="w-full bg-[#0b0b10] border border-[rgba(255,255,255,0.06)] rounded-lg p-2.5 text-sm text-[#E4E4E7] resize-none focus:outline-none focus:border-violet-500/40 leading-relaxed" rows={2} value={d.front} onChange={e => setDraft(c.id, 'front', e.target.value)} /></div>
                <div><p className="text-[10px] text-[#52525B] mb-1">背面（答案）</p><textarea className="w-full bg-[#0b0b10] border border-[rgba(255,255,255,0.06)] rounded-lg p-2.5 text-sm text-[#E4E4E7] resize-none focus:outline-none focus:border-violet-500/40 leading-relaxed" rows={2} value={d.back} onChange={e => setDraft(c.id, 'back', e.target.value)} /></div>
                <div className="flex items-center gap-3 mt-2"><span className="text-[9px] text-[#52525B]">间隔 {c.interval}d · 复习 {c.repetitions} 次</span>{c.lapses > 0 && <span className="text-[9px] text-amber-400/60">· 遗忘 {c.lapses} 次</span>}</div>
              </GlassCard>
            )
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {cards.map(c => {
            const due = new Date(c.next_review) <= new Date()
            return (
              <GlassCard key={c.id} className="!p-3 group cursor-pointer hover:!border-violet-500/25" onClick={() => onStudyOne(c)}>
                <div className="flex gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#E4E4E7] font-medium line-clamp-2">{c.front}</p>
                    <div className="flex items-center gap-2 mt-1.5"><span className="text-[9px] text-[#52525B]">间隔 {c.interval}d · 复习 {c.repetitions} 次</span>{due && <span className="text-[9px] text-violet-400 font-bold">· 待复习</span>}{c.lapses > 0 && <span className="text-[9px] text-amber-400/60">· 遗忘 {c.lapses} 次</span>}</div>
                  </div>
                  <button className="p-1 rounded opacity-0 group-hover:opacity-100 text-[#52525B] hover:text-red-400" onClick={e => { e.stopPropagation(); if (confirm('删除？')) onDelete(c.id) }}><Trash2 className="w-3 h-3" /></button>
                </div>
              </GlassCard>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ═══ Study Session ═══
function StudySession({ deck, cards: initialCards, onFinish, onRate }: {
  deck: Deck; cards: Card[]; onFinish: () => void
  onRate: (cardId: string, rating: 0 | 1 | 2 | 3) => void
}) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(new Set<string>())
  if (initialCards.length === 0) return null

  if (done.size === initialCards.length) {
    return (
      <div className="max-w-md mx-auto">
        <GlassCard className="flex flex-col items-center py-16 text-center !p-8">
          <div className="text-5xl mb-4">🎉</div><p className="text-[#E4E4E7] font-bold mb-2">复习完成！</p><p className="text-xs text-[#52525B] mb-6">今天完成了 {initialCards.length} 张</p>
          <button className="btn-primary text-sm !py-3 !px-8" onClick={onFinish}>返回牌组</button>
        </GlassCard>
      </div>
    )
  }

  const current = initialCards[index]
  if (!current) return null

  const handleRate = (rating: 0 | 1 | 2 | 3) => {
    onRate(current.id, rating)
    const nd = new Set(done); nd.add(current.id); setDone(nd); setFlipped(false)
    const rem = initialCards.filter(c => !nd.has(c.id))
    if (rem.length > 0) setIndex(initialCards.indexOf(rem[0]))
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onFinish} className="flex items-center gap-1 text-xs text-[#52525B] hover:text-white"><ChevronLeft className="w-3.5 h-3.5" /> 退出</button>
        <p className="text-xs text-[#52525B]">{done.size + 1} / {initialCards.length}</p>
      </div>
      <div className="cursor-pointer" onClick={() => setFlipped(!flipped)}>
        <GlassCard className={`!p-8 min-h-[16rem] flex flex-col items-center justify-center text-center transition-all duration-300 ${flipped ? '!border-violet-500/40' : ''}`}>
          {!flipped ? (<><p className="text-[10px] text-[#52525B] mb-3 uppercase tracking-wider">问题</p><p className="text-[#E4E4E7] text-lg leading-relaxed whitespace-pre-wrap">{current.front}</p><p className="text-[10px] text-[#3F3F46] mt-6">点击翻转</p></>) : (<><p className="text-[10px] text-[#52525B] mb-3 uppercase tracking-wider">答案</p><p className="text-[#E4E4E7] text-lg leading-relaxed whitespace-pre-wrap">{current.back}</p></>)}
        </GlassCard>
      </div>
      {flipped && (
        <div className="grid grid-cols-4 gap-2 mt-4">
          <button className="btn-ghost text-xs !py-3 !px-2 flex-col gap-1 !rounded-xl border border-[rgba(255,255,255,0.06)] hover:border-red-500/30" onClick={() => handleRate(0)}><span className="text-lg">😵</span><span className="text-[10px]">忘了</span></button>
          <button className="btn-ghost text-xs !py-3 !px-2 flex-col gap-1 !rounded-xl border border-[rgba(255,255,255,0.06)] hover:border-amber-500/30" onClick={() => handleRate(1)}><span className="text-lg">😐</span><span className="text-[10px]">困难</span></button>
          <button className="btn-ghost text-xs !py-3 !px-2 flex-col gap-1 !rounded-xl border border-[rgba(255,255,255,0.06)] hover:border-green-500/30" onClick={() => handleRate(2)}><span className="text-lg">😊</span><span className="text-[10px]">一般</span></button>
          <button className="btn-ghost text-xs !py-3 !px-2 flex-col gap-1 !rounded-xl border border-[rgba(255,255,255,0.06)] hover:border-violet-500/30" onClick={() => handleRate(3)}><span className="text-lg">🤩</span><span className="text-[10px]">轻松</span></button>
        </div>
      )}
    </div>
  )
}

// ═══ Deck Create ═══
function DeckCreate({ courses, onSave, onClose }: { courses: Course[]; onSave: (d: any) => void; onClose: () => void }) {
  const [n, setN] = useState(''); const [d, setD] = useState(''); const [c, setC] = useState('')
  return createPortal(<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60" onClick={onClose}><GlassCard className="!p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between mb-4"><h3 className="text-sm font-semibold text-[#E4E4E7]">新建牌组</h3><button className="p-1 rounded-lg text-[#52525B] hover:text-white" onClick={onClose}><X className="w-4 h-4" /></button></div><input className="input-field mb-3" placeholder="名称" value={n} onChange={e => setN(e.target.value)} autoFocus /><input className="input-field mb-3" placeholder="描述" value={d} onChange={e => setD(e.target.value)} /><select className="input-field mb-4" value={c} onChange={e => setC(e.target.value)}><option value="">不关联课程</option>{courses.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select><div className="flex justify-end gap-2"><button className="btn-ghost text-xs !py-2" onClick={onClose}>取消</button><button className="btn-primary text-xs !py-2" onClick={() => { if (!n.trim()) return; onSave({ name: n.trim(), description: d.trim()||undefined, course_id: c||undefined }) }}>创建</button></div></GlassCard></div>, document.body)
}

// ═══ Batch Import ═══
function BatchImport({ onSave, onClose }: { onSave: (c: {front:string;back:string}[]) => void; onClose: () => void }) {
  const [t, setT] = useState(''); const [p, setP] = useState<{front:string;back:string}[]>([])
  const parse = (s: string) => { const r: {front:string;back:string}[] = []; for (const b of s.split(/\n{2,}/)) { const trimmed = b.trim(); if (!trimmed) continue; const parts = trimmed.split(/\n---\n/); if (parts.length>=2) { const front = parts[0].trim(); const back = parts.slice(1).join('\n---\n').trim(); if (front&&back) r.push({front,back}) } } setP(r) }
  return createPortal(<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60" onClick={onClose}><GlassCard className="!p-6 w-full max-w-lg mx-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between mb-4"><h3 className="text-sm font-semibold text-[#E4E4E7]">批量导入</h3><button className="p-1 rounded-lg text-[#52525B] hover:text-white" onClick={onClose}><X className="w-4 h-4" /></button></div><p className="text-[10px] text-[#52525B] mb-2">格式：<code className="text-[#A1A1AA]">正面 --- 背面</code>，卡片间空一行</p><textarea className="flex-1 min-h-[10rem] w-full bg-[#0b0b10] border border-[rgba(255,255,255,0.08)] rounded-xl p-3 text-xs text-[#E4E4E7] resize-none focus:outline-none focus:border-violet-500/40 mb-3 font-mono leading-relaxed" value={t} onChange={e=>{setT(e.target.value);parse(e.target.value)}} placeholder="问题1&#10;---&#10;答案1&#10;&#10;问题2&#10;---&#10;答案2" autoFocus />{p.length>0&&<p className="text-[10px] text-[#A1A1AA] mb-3">识别到 <span className="text-violet-400 font-bold">{p.length}</span> 张</p>}<div className="flex justify-end gap-2"><button className="btn-ghost text-xs !py-2" onClick={onClose}>取消</button><button className="btn-primary text-xs !py-2" onClick={()=>{if(p.length===0)return;onSave(p)}}>导入 {p.length} 张</button></div></GlassCard></div>, document.body)
}

// ═══ Main (Flashcards Content) ═══
function FlashcardsContent(): React.ReactElement {
  const [view, setView] = useState<'decks'|'cards'|'study'>('decks')
  const [deckId, setDeckId] = useState<string|null>(null)
  const [deck, setDeck] = useState<Deck|null>(null)
  const [decks, setDecks] = useState<Deck[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [dueCards, setDueCards] = useState<Card[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [dueMap, setDueMap] = useState<Record<string,number>>({})
  const [loading, setLoading] = useState(true)
  const [showDeckCreate, setShowDeckCreate] = useState(false)
  const [showBatchImport, setShowBatchImport] = useState(false)
  const [showNewCardForm, setShowNewCardForm] = useState(false)
  const [newFront, setNewFront] = useState('')
  const [newBack, setNewBack] = useState('')

  const refresh = useCallback(async () => {
    const [d,c,due] = await Promise.all([window.api.decks.list() as Promise<Deck[]>,window.api.courses.list() as Promise<Course[]>,window.api.cards.countDue() as Promise<{deck_id:string;count:number}[]>])
    setDecks(d);setCourses(c);const m:Record<string,number>={};for(const x of due)m[x.deck_id]=x.count;setDueMap(m);setLoading(false)
  },[])
  useEffect(()=>{refresh()},[refresh])

  const openDeck = useCallback(async (id:string)=>{setDeckId(id);setView('cards');const [d,c]=await Promise.all([window.api.decks.get(id) as Promise<Deck>,window.api.cards.list(id) as Promise<Card[]>]);setDeck(d);setCards(c)},[])
  const reloadCards = useCallback(async ()=>{if(!deckId)return;const c=await window.api.cards.list(deckId) as Card[];setCards(c)},[deckId])

  const startStudy = useCallback(async ()=>{if(!deckId)return;const due=await window.api.cards.listDue(deckId) as Card[];setDueCards(due);setView('study')},[deckId])
  const startStudyOne = useCallback((card:Card)=>{setDueCards([card]);setView('study')},[])

  if (loading) return <div className="text-center py-16 text-sm text-[#52525B]">加载中...</div>

  return (<>
    {view==='decks' && <DeckList decks={decks} dueMap={dueMap} courses={courses} onSelect={openDeck} onDelete={async id=>{if(confirm('删除牌组及所有卡片？')){await window.api.decks.delete(id);refresh()}}} onCreate={()=>setShowDeckCreate(true)} />}
    {view==='cards' && deck && <CardList deck={deck} cards={cards} dueCount={dueMap[deck.id]||0} onBack={()=>{setView('decks');setDeckId(null);setShowNewCardForm(false)}} onAdd={()=>setShowNewCardForm(v=>!v)} onBatch={()=>setShowBatchImport(true)} onDelete={async id=>{await window.api.cards.delete(id);reloadCards()}} onSaveCard={async (id,front,back)=>{await window.api.cards.update(id,{front,back});reloadCards()}} onStudy={startStudy} onStudyOne={startStudyOne} />}
    {showNewCardForm && deckId && deck && view==='cards' && <div className="max-w-2xl mx-auto -mt-1 mb-4"><GlassCard className="!p-4 !border-violet-500/25"><p className="text-[10px] text-[#A1A1AA] mb-3 font-medium">新建卡片</p><div className="mb-2"><p className="text-[10px] text-[#52525B] mb-1">正面（问题）</p><textarea className="w-full bg-[#0b0b10] border border-[rgba(255,255,255,0.06)] rounded-lg p-2.5 text-sm text-[#E4E4E7] resize-none focus:outline-none focus:border-violet-500/40 leading-relaxed" rows={2} value={newFront} onChange={e=>setNewFront(e.target.value)} placeholder="输入问题..." /></div><div className="mb-3"><p className="text-[10px] text-[#52525B] mb-1">背面（答案）</p><textarea className="w-full bg-[#0b0b10] border border-[rgba(255,255,255,0.06)] rounded-lg p-2.5 text-sm text-[#E4E4E7] resize-none focus:outline-none focus:border-violet-500/40 leading-relaxed" rows={2} value={newBack} onChange={e=>setNewBack(e.target.value)} placeholder="输入答案..." /></div><div className="flex justify-end gap-2"><button className="btn-ghost text-xs !py-2" onClick={()=>setShowNewCardForm(false)}>取消</button><button className="btn-primary text-xs !py-2" onClick={async ()=>{if(!newFront.trim()||!newBack.trim())return;await window.api.cards.create({front:newFront.trim(),back:newBack.trim(),deck_id:deckId});setNewFront('');setNewBack('');setShowNewCardForm(false);reloadCards()}}>添加</button></div></GlassCard></div>}
    {view==='study' && deck && <StudySession deck={deck} cards={dueCards} onFinish={()=>{openDeck(deck.id);refresh()}} onRate={(cardId,rating)=>{const card=dueCards.find(c=>c.id===cardId);if(!card)return;const sm2=applySm2(card,rating);window.api.cards.update(cardId,{ease:sm2.ease,interval:sm2.interval,repetitions:sm2.repetitions,next_review:sm2.nextReview,lapses:sm2.lapses,last_review:new Date().toISOString()})}} />}
    {showDeckCreate && <DeckCreate courses={courses} onClose={()=>setShowDeckCreate(false)} onSave={async d=>{await window.api.decks.create(d as any);setShowDeckCreate(false);refresh()}} />}
    {showBatchImport && deckId && <BatchImport onClose={()=>setShowBatchImport(false)} onSave={async cards=>{for(const c of cards)await window.api.cards.create({...c,deck_id:deckId});setShowBatchImport(false);reloadCards()}} />}
  </>)
}

// ═══ Tabbed Wrapper (Flashcards + ErrorBook) ═══
type PageTab = 'flashcards' | 'errorbook'

const TABS: { key: PageTab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { key: 'flashcards', label: '闪卡牌组', icon: Layers },
  { key: 'errorbook', label: '错题本', icon: AlertCircle },
]

export default function FlashcardsPage(): React.ReactElement {
  const [tab, setTab] = useState<PageTab>('flashcards')

  return (
    <div className="max-w-2xl mx-auto">
      {/* Tab bar */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold gradient-text">记忆</h1>
        <div className="flex gap-1">
          {TABS.map(t => (
            <button key={t.key}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${tab === t.key ? 'bg-white/[0.08] text-white' : 'text-[#52525B] hover:text-white hover:bg-white/[0.03]'}`}
              onClick={() => setTab(t.key)}
            >
              <t.icon className="w-3.5 h-3.5" />{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {tab === 'flashcards' && <FlashcardsContent />}
      {tab === 'errorbook' && <ErrorBookPage hideHeader />}
    </div>
  )
}
