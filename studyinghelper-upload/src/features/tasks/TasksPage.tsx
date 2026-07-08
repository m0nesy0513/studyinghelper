import { useState, useEffect } from 'react'
import { Plus, GripVertical, Clock, AlertCircle } from 'lucide-react'
import GlassCard from '@/components/layout/GlassCard'
import type { Task, TaskStatus, Course } from '@/types'
import { TASK_STATUS_LABELS, TASK_TYPE_LABELS } from '@/types'
import { useTaskStore } from '@/stores/taskStore'

const COLUMNS: { status: TaskStatus; color: string }[] = [
  { status: 'todo', color: '#fbbf24' },
  { status: 'in_progress', color: '#3b82f6' },
  { status: 'done', color: '#34d399' },
]

export default function TasksPage(): React.ReactElement {
  const { tasks, loading, load, add, remove, moveTask } = useTaskStore()
  const [courses, setCourses] = useState<Course[]>([])

  useEffect(() => {
    load()
    window.api.courses.list().then(data => setCourses(data as Course[]))
  }, [load])

  const tasksByStatus = (status: TaskStatus) => tasks.filter(t => t.status === status)

  const getCourseColor = (courseId: string | null) => {
    if (!courseId) return 'rgba(255,255,255,0.2)'
    return courses.find(c => c.id === courseId)?.color ?? 'rgba(255,255,255,0.2)'
  }

  const getCourseName = (courseId: string | null) => {
    if (!courseId) return null
    return courses.find(c => c.id === courseId)?.name
  }

  const priorityColors: Record<number, string> = { 0: 'transparent', 1: '#22d3ee', 2: '#fbbf24', 3: '#f87171' }

  return (
    <div className="max-w-full">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold gradient-text">任务管理</h1>
        <button
          className="btn-primary text-xs !py-2 !px-4"
          onClick={async () => {
            const title = prompt('任务标题：')
            if (title?.trim()) {
              await add({ title: title.trim() })
            }
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          新增任务
        </button>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-3 gap-4 h-[calc(100vh-160px)]">
        {COLUMNS.map(col => (
          <div key={col.status} className="flex flex-col">
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
              <span className="text-sm font-medium text-[rgba(255,255,255,0.5)]">{TASK_STATUS_LABELS[col.status]}</span>
              <span className="text-xs text-[rgba(255,255,255,0.2)]">{tasksByStatus(col.status).length}</span>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              {tasksByStatus(col.status).map(task => (
                <GlassCard key={task.id} className="!p-3 group cursor-grab active:cursor-grabbing">
                  {task.priority > 1 && (
                    <div className="w-1 h-full absolute left-0 top-0 rounded-l-[16px]" style={{ background: priorityColors[task.priority] }} />
                  )}
                  <p className="text-sm font-medium text-[rgba(255,255,255,0.8)] mb-1.5">{task.title}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {task.course_id && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${getCourseColor(task.course_id)}18`, color: getCourseColor(task.course_id) }}>
                        {getCourseName(task.course_id) || '...'}
                      </span>
                    )}
                    {task.type !== 'assignment' && (
                      <span className="text-[9px] text-[rgba(255,255,255,0.3)]">{TASK_TYPE_LABELS[task.type] || task.type}</span>
                    )}
                    {task.due_date && (
                      <span className="text-[9px] text-[rgba(255,255,255,0.35)] flex items-center gap-1 ml-auto">
                        <Clock className="w-2.5 h-2.5" />
                        {task.due_date.split('T')[0]}
                      </span>
                    )}
                  </div>
                  {/* Quick actions */}
                  <div className="flex gap-1 mt-2 pt-2 border-t border-[rgba(255,255,255,0.03)] opacity-0 group-hover:opacity-100 transition-opacity">
                    {col.status !== 'todo' && (
                      <button className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] text-[rgba(255,255,255,0.35)] hover:text-white" onClick={() => moveTask(task.id, 'todo')}>← 待办</button>
                    )}
                    {col.status !== 'in_progress' && (
                      <button className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] text-[rgba(255,255,255,0.35)] hover:text-white" onClick={() => moveTask(task.id, 'in_progress')}>进行中</button>
                    )}
                    {col.status !== 'done' && (
                      <button className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] text-emerald-400/50 hover:text-emerald-400" onClick={() => moveTask(task.id, 'done')}>✓ 完成</button>
                    )}
                    <button className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] text-red-400/50 hover:text-red-400 ml-auto" onClick={() => remove(task.id)}>删除</button>
                  </div>
                </GlassCard>
              ))}
              {tasksByStatus(col.status).length === 0 && (
                <div className="text-center py-8 text-xs text-[rgba(255,255,255,0.15)]">暂无任务</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
