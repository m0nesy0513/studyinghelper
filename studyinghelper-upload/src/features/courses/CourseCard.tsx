import { Edit, Trash2, GraduationCap } from 'lucide-react'
import GlassCard from '@/components/layout/GlassCard'
import type { Course } from '@/types'
import { CATEGORY_LABELS } from '@/types'

interface CourseCardProps {
  course: Course
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export default function CourseCard({ course, onClick, onEdit, onDelete }: CourseCardProps): React.ReactElement {
  return (
    <GlassCard className="!p-5 cursor-pointer group" onClick={onClick}>
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${course.color}20` }}
        >
          <GraduationCap className="w-5 h-5" style={{ color: course.color }} />
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-[rgba(255,255,255,0.4)] hover:text-white transition-colors"
              onClick={(e) => { e.stopPropagation(); onEdit() }}
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-red-500/20 flex items-center justify-center text-[rgba(255,255,255,0.4)] hover:text-red-400 transition-colors"
              onClick={(e) => { e.stopPropagation(); onDelete() }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <h3 className="font-semibold text-[rgba(255,255,255,0.85)] text-sm mb-1 truncate">{course.name}</h3>
      {course.code && (
        <p className="text-xs text-[rgba(255,255,255,0.4)] mb-2 font-mono">{course.code}</p>
      )}

      <div className="flex items-center gap-2 mt-3">
        <span
          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
          style={{ background: `${course.color}18`, color: course.color }}
        >
          {CATEGORY_LABELS[course.category] ?? course.category}
        </span>
        <span className="text-[10px] text-[rgba(255,255,255,0.3)]">
          {course.credits} 学分
        </span>
        {course.score != null && (
          <span className="text-[10px] text-[rgba(255,255,255,0.5)] ml-auto font-mono">
            {course.score.toFixed(0)}分
          </span>
        )}
      </div>

      {course.professor && (
        <p className="text-[11px] text-[rgba(255,255,255,0.25)] mt-2">{course.professor}</p>
      )}
    </GlassCard>
  )
}
