import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import GlassCard from '@/components/layout/GlassCard'
import type { Course, CourseCategory } from '@/types'
import { CATEGORY_LABELS } from '@/types'

interface CourseFormProps {
  onClose: () => void
  onSave: (data: Record<string, unknown>) => Promise<void>
  course?: Course | null
}

const CATEGORIES: CourseCategory[] = ['psychology', 'ge', 'fe', 'language', 'other']
const COLORS = ['#a78bfa', '#22d3ee', '#34d399', '#fbbf24', '#f87171', '#fb923c', '#818cf8', '#e879f9']

export default function CourseForm({ onClose, onSave, course }: CourseFormProps): React.ReactElement {
  const [name, setName] = useState(course?.name ?? '')
  const [code, setCode] = useState(course?.code ?? '')
  const [credits, setCredits] = useState(course?.credits ?? 3)
  const [professor, setProfessor] = useState(course?.professor ?? '')
  const [semester, setSemester] = useState(course?.semester ?? '')
  const [category, setCategory] = useState<CourseCategory>(course?.category ?? 'psychology')
  const [color, setColor] = useState(course?.color ?? '#a78bfa')
  const [description, setDescription] = useState(course?.description ?? '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return
    setSaving(true)
    await onSave({ name: name.trim(), code: code.trim() || undefined, credits, professor: professor.trim() || undefined, semester: semester.trim() || undefined, category, color, description: description.trim() || undefined })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <GlassCard className="w-full max-w-md !p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">{course ? '编辑课程' : '新增课程'}</h2>
          <button className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-[rgba(255,255,255,0.4)]" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-[rgba(255,255,255,0.4)] mb-1.5 block">课程名称 *</label>
            <input className="w-full h-9 px-3 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-sm text-white/80 placeholder:text-[rgba(255,255,255,0.2)] outline-none focus:border-[rgba(139,92,246,0.3)] transition-colors" value={name} onChange={e => setName(e.target.value)} placeholder="如 普通心理学" autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[rgba(255,255,255,0.4)] mb-1.5 block">课程代码</label>
              <input className="w-full h-9 px-3 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-sm text-white/80 outline-none focus:border-[rgba(139,92,246,0.3)] transition-colors" value={code} onChange={e => setCode(e.target.value)} placeholder="如 PSYC1000" />
            </div>
            <div>
              <label className="text-xs text-[rgba(255,255,255,0.4)] mb-1.5 block">学分</label>
              <input type="number" step="0.5" min="0" max="10" className="w-full h-9 px-3 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-sm text-white/80 outline-none focus:border-[rgba(139,92,246,0.3)] transition-colors" value={credits} onChange={e => setCredits(Number(e.target.value))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[rgba(255,255,255,0.4)] mb-1.5 block">教授</label>
              <input className="w-full h-9 px-3 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-sm text-white/80 outline-none focus:border-[rgba(139,92,246,0.3)] transition-colors" value={professor} onChange={e => setProfessor(e.target.value)} placeholder="如 Prof. Zhang" />
            </div>
            <div>
              <label className="text-xs text-[rgba(255,255,255,0.4)] mb-1.5 block">学期</label>
              <input className="w-full h-9 px-3 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-sm text-white/80 outline-none focus:border-[rgba(139,92,246,0.3)] transition-colors" value={semester} onChange={e => setSemester(e.target.value)} placeholder="如 2025-2026-S1" />
            </div>
          </div>

          <div>
            <label className="text-xs text-[rgba(255,255,255,0.4)] mb-1.5 block">类别</label>
            <div className="grid grid-cols-5 gap-1.5">
              {CATEGORIES.map(cat => (
                <button key={cat} className={`h-8 rounded-lg text-xs font-medium transition-all ${category === cat ? 'bg-white/[0.08] border border-[rgba(139,92,246,0.3)] text-white' : 'bg-white/[0.02] border border-transparent text-[rgba(255,255,255,0.4)] hover:text-white'}`} onClick={() => setCategory(cat)}>
                  {CATEGORY_LABELS[cat].slice(0, 2)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-[rgba(255,255,255,0.4)] mb-1.5 block">颜色标记</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} className={`w-7 h-7 rounded-full transition-all ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#020617] scale-110' : 'hover:scale-105'}`} style={{ background: c }} onClick={() => setColor(c)} />
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-[rgba(255,255,255,0.4)] mb-1.5 block">描述</label>
            <textarea className="w-full h-20 px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-sm text-white/80 outline-none focus:border-[rgba(139,92,246,0.3)] transition-colors resize-none" value={description} onChange={e => setDescription(e.target.value)} placeholder="课程简介或备注..." />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button className="btn-ghost text-xs !py-2 !px-4" onClick={onClose}>取消</button>
          <button className="btn-primary text-xs !py-2 !px-5" onClick={handleSubmit} disabled={!name.trim() || saving}>
            {saving ? '保存中...' : course ? '保存修改' : '创建课程'}
          </button>
        </div>
      </GlassCard>
    </div>
  )
}
