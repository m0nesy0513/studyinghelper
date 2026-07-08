import { useState, useEffect } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import GlassCard from '@/components/layout/GlassCard'
import CourseCard from './CourseCard'
import CourseForm from './CourseForm'
import CourseDetail from './CourseDetail'
import GradeCalculator from './GradeCalculator'
import { useCourseStore } from '@/stores/courseStore'
import type { Course, CourseCategory } from '@/types'
import { CATEGORY_LABELS } from '@/types'

const CATEGORIES: (CourseCategory | 'all')[] = ['all', 'psychology', 'ge', 'fe', 'language', 'other']

export default function CoursesPage(): React.ReactElement {
  const { courses, loading, load, add, update, remove } = useCourseStore()
  const [selectedCategory, setSelectedCategory] = useState<CourseCategory | undefined>()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null)

  useEffect(() => {
    load(selectedCategory)
  }, [selectedCategory, load])

  const filtered = courses.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return c.name.toLowerCase().includes(q) || (c.code && c.code.toLowerCase().includes(q))
  })

  const handleSave = async (data: Record<string, unknown>) => {
    if (editingCourse) {
      await update(editingCourse.id, data)
    } else {
      await add(data)
    }
    setEditingCourse(null)
  }

  if (viewingCourse) {
    return (
      <CourseDetail
        course={viewingCourse}
        onBack={() => setViewingCourse(null)}
        onEdit={() => { setEditingCourse(viewingCourse); setViewingCourse(null); setShowForm(true) }}
      />
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold gradient-text">课程管理</h1>
        <button className="btn-primary text-xs !py-2 !px-4" onClick={() => { setEditingCourse(null); setShowForm(true) }}>
          <Plus className="w-3.5 h-3.5" />
          新增课程
        </button>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-1.5 mb-5">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`h-7 px-3 rounded-full text-xs font-medium transition-all ${
              (cat === 'all' && !selectedCategory) || cat === selectedCategory
                ? 'bg-white/[0.08] border border-[rgba(139,92,246,0.3)] text-white'
                : 'bg-white/[0.02] border border-transparent text-[rgba(255,255,255,0.4)] hover:text-white'
            }`}
            onClick={() => setSelectedCategory(cat === 'all' ? undefined : cat)}
          >
            {cat === 'all' ? '全部' : CATEGORY_LABELS[cat]}
          </button>
        ))}
        <div className="flex-1" />
        <div className="relative w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[rgba(255,255,255,0.2)]" />
          <input
            className="w-full h-8 pl-8 pr-3 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-[10px] text-xs text-white/80 placeholder:text-[rgba(255,255,255,0.2)] outline-none focus:border-[rgba(139,92,246,0.3)]"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索课程..."
          />
        </div>
      </div>

      {/* Course grid */}
      {loading ? (
        <div className="text-center py-12 text-sm text-[rgba(255,255,255,0.25)]">加载中...</div>
      ) : filtered.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center py-14 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4">
            <Filter className="w-7 h-7 text-[rgba(255,255,255,0.12)]" />
          </div>
          <p className="text-[rgba(255,255,255,0.35)] font-medium mb-1">
            {courses.length === 0 ? '还没有添加课程' : '没有匹配的课程'}
          </p>
          <p className="text-xs text-[rgba(255,255,255,0.2)]">
            {courses.length === 0 ? '点击"新增课程"开始录入' : '试试更换筛选条件'}
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map(c => (
            <CourseCard
              key={c.id}
              course={c}
              onClick={() => setViewingCourse(c)}
              onEdit={() => { setEditingCourse(c); setShowForm(true) }}
              onDelete={async () => {
                if (confirm(`确定删除"${c.name}"？关联的课表事件将一并删除，任务将取消关联。`)) {
                  await remove(c.id)
                }
              }}
            />
          ))}
        </div>
      )}

      {/* GPA Calculator section */}
      {courses.length > 0 && (
        <div className="mt-8">
          <GradeCalculator courses={courses} />
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <CourseForm
          course={editingCourse}
          onClose={() => { setShowForm(false); setEditingCourse(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
