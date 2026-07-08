import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, X, CheckCircle, AlertCircle, Search } from 'lucide-react'
import GlassCard from '@/components/layout/GlassCard'
import type { ErrorQuestion, Course } from '@/types'
import { MASTERY_LABELS } from '@/types'

// ── Error Form ──
function ErrorForm({ courses, onSave, onClose, initial }: {
  courses: Course[]; onSave: (data: Record<string, unknown>) => void; onClose: () => void
  initial?: ErrorQuestion | null
}) {
  const [question, setQuestion] = useState(initial?.question || '')
  const [correct, setCorrect] = useState(initial?.correct_answer || '')
  const [wrong, setWrong] = useState(initial?.wrong_answer || '')
  const [reason, setReason] = useState(initial?.reason || '')
  const [source, setSource] = useState(initial?.source || '')
  const [courseId, setCourseId] = useState(initial?.course_id || '')
  const [tags, setTags] = useState(initial?.tags || '')

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60" onClick={onClose}>
      <GlassCard className="!p-6 w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#E4E4E7]">{initial ? '编辑错题' : '新增错题'}</h3>
          <button className="p-1 rounded-lg text-[#52525B] hover:text-white" onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        <textarea className="w-full bg-[#0b0b10] border border-[rgba(255,255,255,0.08)] rounded-xl p-3 text-sm text-[#E4E4E7] resize-none focus:outline-none focus:border-red-500/40 mb-3"
          rows={4} placeholder="题目" value={question} onChange={e => setQuestion(e.target.value)} autoFocus />
        <textarea className="w-full bg-[#0b0b10] border border-[rgba(255,255,255,0.08)] rounded-xl p-3 text-sm text-[#E4E4E7] resize-none focus:outline-none focus:border-green-500/40 mb-3"
          rows={2} placeholder="正确答案" value={correct} onChange={e => setCorrect(e.target.value)} />
        <textarea className="w-full bg-[#0b0b10] border border-[rgba(255,255,255,0.08)] rounded-xl p-3 text-sm text-[#E4E4E7] resize-none focus:outline-none focus:border-amber-500/40 mb-3"
          rows={2} placeholder="做错时填写的答案（可选）" value={wrong} onChange={e => setWrong(e.target.value)} />
        <textarea className="w-full bg-[#0b0b10] border border-[rgba(255,255,255,0.08)] rounded-xl p-3 text-sm text-[#E4E4E7] resize-none focus:outline-none focus:border-violet-500/40 mb-3"
          rows={2} placeholder="错误原因（可选）" value={reason} onChange={e => setReason(e.target.value)} />
        <input className="input-field mb-3" placeholder="题目来源（可选）" value={source} onChange={e => setSource(e.target.value)} />
        <input className="input-field mb-3" placeholder="标签，逗号分隔（可选）" value={tags} onChange={e => setTags(e.target.value)} />
        <select className="input-field mb-4" value={courseId} onChange={e => setCourseId(e.target.value)}>
          <option value="">不关联课程</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="flex justify-end gap-2">
          <button className="btn-ghost text-xs !py-2" onClick={onClose}>取消</button>
          <button className="btn-primary text-xs !py-2" onClick={() => {
            if (!question.trim() || !correct.trim()) return
            onSave({ question: question.trim(), correct_answer: correct.trim(), wrong_answer: wrong.trim() || undefined, reason: reason.trim() || undefined, source: source.trim() || undefined, course_id: courseId || undefined, tags: tags.trim() || undefined })
          }}>保存</button>
        </div>
      </GlassCard>
    </div>
  )
}

// ── Error Card ──
function ErrorCard({ err, course, onEdit, onDelete, onMark }: {
  err: ErrorQuestion; course?: Course; onEdit: () => void; onDelete: () => void
  onMark: (mastery: number) => void
}) {
  const masteryColor = ['text-red-400', 'text-amber-400', 'text-green-400', 'text-violet-400']
  return (
    <GlassCard className="!p-4 group">
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 mt-0.5 ${masteryColor[err.mastery] || 'text-red-400'}`}>
          {err.mastery >= 2 ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[#E4E4E7] font-medium line-clamp-2">{err.question}</p>
          <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
            {course && <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04]" style={{ color: course.color }}>{course.name}</span>}
            <span className="text-[9px] text-[#52525B]">{MASTERY_LABELS[err.mastery]}</span>
            <span className="text-[9px] text-[#52525B]">· 复习 {err.review_count} 次</span>
            {err.tags && <span className="text-[9px] text-[#52525B]">· {err.tags.split(',')[0]}</span>}
          </div>

          {/* Inline review buttons */}
          <div className="flex items-center gap-1 mt-2">
            <span className="text-[9px] text-[#52525B] mr-1">掌握度：</span>
            {[0, 1, 2, 3].map(level => (
              <button key={level}
                className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${err.mastery === level ? 'bg-white/[0.1] text-white' : 'text-[#52525B] hover:text-white hover:bg-white/[0.04]'}`}
                onClick={e => { e.stopPropagation(); onMark(level) }}>
                {MASTERY_LABELS[level]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button className="p-1.5 rounded-lg hover:bg-white/[0.08] text-[#52525B] hover:text-white" onClick={e => { e.stopPropagation(); onEdit() }}>✏️</button>
          <button className="p-1.5 rounded-lg hover:bg-red-500/20 text-[#52525B] hover:text-red-400" onClick={e => { e.stopPropagation(); onDelete() }}><Trash2 className="w-3 h-3" /></button>
        </div>
      </div>
    </GlassCard>
  )
}

// ── Main ──
export default function ErrorBookPage({ hideHeader }: { hideHeader?: boolean }): React.ReactElement {
  const [errors, setErrors] = useState<ErrorQuestion[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ErrorQuestion | null>(null)
  const [filter, setFilter] = useState<'all' | 'weak' | 'mastered'>('all')

  const refresh = useCallback(async () => {
    const [e, c] = await Promise.all([
      window.api.errors.list() as Promise<ErrorQuestion[]>,
      window.api.courses.list() as Promise<Course[]>,
    ])
    setErrors(e); setCourses(c); setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const filtered = filter === 'all' ? errors
    : filter === 'weak' ? errors.filter(e => e.mastery < 2)
      : errors.filter(e => e.mastery >= 2)

  if (loading) return <div className="text-center py-16 text-sm text-[#52525B]">加载中...</div>

  return (
    <div className="max-w-2xl mx-auto">
      {!hideHeader && (
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold gradient-text">错题本</h1>
          <button className="btn-primary text-xs !py-2 !px-4" onClick={() => { setEditing(null); setShowForm(true) }}>
            <Plus className="w-3.5 h-3.5" /> 新增错题
          </button>
        </div>
      )}

      <div className="flex gap-1 mb-4">
        {([['all', '全部'], ['weak', '未掌握'], ['mastered', '已掌握']] as const).map(([k, label]) => (
          <button key={k}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === k ? 'bg-white/[0.08] text-white' : 'text-[#52525B] hover:text-white'}`}
            onClick={() => setFilter(k)}>{label} ({k === 'all' ? errors.length : k === 'weak' ? errors.filter(e => e.mastery < 2).length : errors.filter(e => e.mastery >= 2).length})</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <GlassCard className="flex flex-col items-center py-14 text-center">
          <AlertCircle className="w-10 h-10 text-[#27272A] mb-3" />
          <p className="text-[#A1A1AA] font-medium mb-1">{filter === 'all' ? '还没有错题' : filter === 'weak' ? '不错！所有错题都已掌握' : '还没有已掌握的错题'}</p>
          <p className="text-xs text-[#52525B]">出现错误就来记录，反复复习直到掌握</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {filtered.map(e => {
            const course = courses.find(c => c.id === e.course_id)
            return (
              <ErrorCard key={e.id} err={e} course={course}
                onEdit={() => { setEditing(e); setShowForm(true) }}
                onDelete={async () => { if (confirm('删除？')) { await window.api.errors.delete(e.id); refresh() } }}
                onMark={async mastery => { await window.api.errors.markReviewed(e.id, mastery); refresh() }}
              />
            )
          })}
        </div>
      )}

      {showForm && (
        <ErrorForm courses={courses} initial={editing} onClose={() => { setShowForm(false); setEditing(null) }}
          onSave={async data => {
            if (editing) {
              await window.api.errors.update(editing.id, data)
            } else {
              await window.api.errors.create(data as any)
            }
            setShowForm(false); setEditing(null); refresh()
          }} />
      )}
    </div>
  )
}
