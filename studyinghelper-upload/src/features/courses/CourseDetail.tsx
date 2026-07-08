import { ArrowLeft, Edit } from 'lucide-react'
import GlassCard from '@/components/layout/GlassCard'
import type { Course } from '@/types'
import { CATEGORY_LABELS } from '@/types'

interface CourseDetailProps {
  course: Course
  onBack: () => void
  onEdit: () => void
}

export default function CourseDetail({ course, onBack, onEdit }: CourseDetailProps): React.ReactElement {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-[rgba(255,255,255,0.4)]" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold gradient-text">{course.name}</h1>
        <button className="btn-ghost text-xs !py-1.5 !px-3 ml-auto" onClick={onEdit}>
          <Edit className="w-3.5 h-3.5" />
          编辑
        </button>
      </div>

      <GlassCard className="!p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-[rgba(255,255,255,0.3)] mb-1">课程代码</p>
            <p className="text-sm font-mono text-[rgba(255,255,255,0.7)]">{course.code || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-[rgba(255,255,255,0.3)] mb-1">学分</p>
            <p className="text-sm text-[rgba(255,255,255,0.7)]">{course.credits}</p>
          </div>
          <div>
            <p className="text-xs text-[rgba(255,255,255,0.3)] mb-1">教授</p>
            <p className="text-sm text-[rgba(255,255,255,0.7)]">{course.professor || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-[rgba(255,255,255,0.3)] mb-1">学期</p>
            <p className="text-sm text-[rgba(255,255,255,0.7)]">{course.semester || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-[rgba(255,255,255,0.3)] mb-1">类别</p>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${course.color}18`, color: course.color }}>
              {CATEGORY_LABELS[course.category]}
            </span>
          </div>
          <div>
            <p className="text-xs text-[rgba(255,255,255,0.3)] mb-1">成绩</p>
            <p className="text-sm text-[rgba(255,255,255,0.7)]">{course.score != null ? `${course.score}分` : '—'}</p>
          </div>
        </div>
        {course.description && (
          <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.05)]">
            <p className="text-xs text-[rgba(255,255,255,0.3)] mb-2">描述</p>
            <p className="text-sm text-[rgba(255,255,255,0.5)]">{course.description}</p>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
