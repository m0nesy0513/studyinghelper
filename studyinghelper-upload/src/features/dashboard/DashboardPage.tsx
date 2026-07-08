import { useState, useEffect } from 'react'
import { BookOpen, Calendar, CheckSquare, Layout, Clock, Zap, Flame, FolderOpen, Globe, BarChart3 } from 'lucide-react'
import GlassCard from '@/components/layout/GlassCard'
import type { Course, ScheduleEvent, Task } from '@/types'
import { DAY_LABELS } from '@/types'

export default function DashboardPage(): React.ReactElement {
  const [courses, setCourses] = useState<Course[]>([])
  const [todayEvents, setTodayEvents] = useState<ScheduleEvent[]>([])
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([])
  const [streak, setStreak] = useState({ current_streak: 0, today_minutes: 0 })

  useEffect(() => {
    window.api.courses.list().then(d => setCourses(d as Course[]))
    const today = new Date().toISOString().split('T')[0]
    const dow = new Date().getDay()
    window.api.schedule.list({ date: today, day_of_week: dow }).then(d => setTodayEvents(d as ScheduleEvent[]))
    window.api.tasks.list({ status: 'todo' }).then(d => {
      const sorted = (d as Task[]).filter(t => t.due_date).sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))
      setUpcomingTasks(sorted.slice(0, 5))
    })
    window.api.pomodoro.getStreak().then(s => setStreak(s as any))
  }, [])

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const dow = today.getDay()

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold gradient-text mb-6">首页</h1>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <GlassCard className="flex items-center gap-4 !p-5">
          <div className="w-11 h-11 rounded-xl bg-[rgba(139,92,246,0.1)] flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[rgba(255,255,255,0.85)]">{courses.length}</p>
            <p className="text-xs text-[rgba(255,255,255,0.35)]">在读课程</p>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-4 !p-5">
          <div className="w-11 h-11 rounded-xl bg-[rgba(34,211,238,0.1)] flex items-center justify-center flex-shrink-0">
            <CheckSquare className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[rgba(255,255,255,0.85)]">{upcomingTasks.length}</p>
            <p className="text-xs text-[rgba(255,255,255,0.35)]">待完成 DDL</p>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-4 !p-5">
          <div className="w-11 h-11 rounded-xl bg-[rgba(52,211,153,0.1)] flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[rgba(255,255,255,0.85)]">{todayEvents.length}</p>
            <p className="text-xs text-[rgba(255,255,255,0.35)]">今日课程</p>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-4 !p-5">
          <div className="w-11 h-11 rounded-xl bg-[rgba(251,191,36,0.1)] flex items-center justify-center flex-shrink-0">
            <Flame className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[rgba(255,255,255,0.85)]">{streak.current_streak}天</p>
            <p className="text-xs text-[rgba(255,255,255,0.35)]">学习连击 · {streak.today_minutes}分钟</p>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Today's schedule */}
        <div>
          <h2 className="text-sm font-semibold text-[rgba(255,255,255,0.5)] mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            今日课程 · {DAY_LABELS[dow]} {todayStr}
          </h2>
          {todayEvents.length === 0 ? (
            <GlassCard className="flex flex-col items-center py-8 text-center">
              <Calendar className="w-8 h-8 text-[rgba(255,255,255,0.12)] mb-3" />
              <p className="text-sm text-[rgba(255,255,255,0.3)]">今天没有课程</p>
              <p className="text-xs text-[rgba(255,255,255,0.15)] mt-1">享受自由安排的一天</p>
            </GlassCard>
          ) : (
            <div className="space-y-2">
              {todayEvents.map(ev => (
                <GlassCard key={ev.id} className="!p-3 flex items-center gap-3">
                  <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: ev.color || '#8b5cf6' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[rgba(255,255,255,0.8)] truncate">{ev.title}</p>
                    <p className="text-xs text-[rgba(255,255,255,0.3)]">
                      {ev.start_time} - {ev.end_time}
                      {ev.location ? ` · ${ev.location}` : ''}
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-[rgba(255,255,255,0.35)]">
                    {ev.type}
                  </span>
                </GlassCard>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming DDL */}
        <div>
          <h2 className="text-sm font-semibold text-[rgba(255,255,255,0.5)] mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            近期截止
          </h2>
          {upcomingTasks.length === 0 ? (
            <GlassCard className="flex flex-col items-center py-8 text-center">
              <CheckSquare className="w-8 h-8 text-[rgba(255,255,255,0.12)] mb-3" />
              <p className="text-sm text-[rgba(255,255,255,0.3)]">没有待办任务</p>
              <p className="text-xs text-[rgba(255,255,255,0.15)] mt-1">进入任务页添加新任务</p>
            </GlassCard>
          ) : (
            <div className="space-y-2">
              {upcomingTasks.map(task => {
                const isOverdue = task.due_date && task.due_date < todayStr
                return (
                  <GlassCard key={task.id} className={`!p-3 flex items-center gap-3 ${isOverdue ? 'border-[rgba(248,113,113,0.15)]' : ''}`}>
                    <div className={`w-1 h-10 rounded-full flex-shrink-0 ${isOverdue ? 'bg-rose-400' : 'bg-amber-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[rgba(255,255,255,0.8)] truncate">{task.title}</p>
                      <p className={`text-xs ${isOverdue ? 'text-rose-400' : 'text-[rgba(255,255,255,0.3)]'}`}>
                        {task.due_date ? task.due_date.split('T')[0] : '无截止日期'}
                        {isOverdue ? ' · 已逾期' : ''}
                      </p>
                    </div>
                  </GlassCard>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-[rgba(255,255,255,0.5)] mb-3">快捷操作</h2>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: '课程管理', path: '#/courses', icon: BookOpen },
            { label: '查看课表', path: '#/schedule', icon: Calendar },
            { label: '管理任务', path: '#/tasks', icon: CheckSquare },
            { label: '资料库', path: '#/resources', icon: FolderOpen },
            { label: '资源抓取', path: '#/fetcher', icon: Globe },
            { label: '学习分析', path: '#/analytics', icon: BarChart3 },
            { label: '番茄钟', path: '#/pomodoro', icon: Clock },
            { label: '应用设置', path: '#/settings', icon: Layout },
          ].map(item => (
            <a key={item.label} href={item.path}>
              <GlassCard className="flex flex-col items-center py-5 text-center hover:border-[rgba(255,255,255,0.12)] transition-all">
                <item.icon className="w-5 h-5 text-[rgba(255,255,255,0.3)] mb-2" />
                <span className="text-xs text-[rgba(255,255,255,0.45)]">{item.label}</span>
              </GlassCard>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
