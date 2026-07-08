import { useState, useEffect } from 'react'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import GlassCard from '@/components/layout/GlassCard'
import type { ScheduleEvent } from '@/types'
import { DAY_LABELS, EVENT_TYPE_LABELS } from '@/types'

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8) // 8:00 - 21:00

export default function SchedulePage(): React.ReactElement {
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    window.api.schedule.list().then(data => setEvents(data as ScheduleEvent[]))
  }, [])

  // Get current week's Monday
  const getMonday = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
    return d
  }

  const monday = getMonday(currentDate)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })

  const dateStr = (d: Date) => d.toISOString().split('T')[0]

  const goPrevWeek = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() - 7)
    setCurrentDate(d)
  }

  const goNextWeek = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + 7)
    setCurrentDate(d)
  }

  const goToday = () => setCurrentDate(new Date())

  const todayStr = dateStr(new Date())
  const isToday = (d: Date) => dateStr(d) === todayStr

  // Filter events active on a given day
  const getEventsForDay = (dayIndex: number, dateStr: string) => {
    return events.filter(e => {
      if (e.specific_date) return e.specific_date === dateStr
      return e.day_of_week === dayIndex && e.start_date <= dateStr && e.end_date >= dateStr && !e.is_cancelled
    })
  }

  const hourToTop = (time: string) => {
    const [h, m] = time.split(':').map(Number)
    return ((h - 8) * 4 + (m / 15)) * 1.5 + 'rem'
  }

  const durationHeight = (start: string, end: string) => {
    const [sh, sm] = start.split(':').map(Number)
    const [eh, em] = end.split(':').map(Number)
    return (((eh - sh) * 60 + (em - sm)) / 15) * 1.5 + 'rem'
  }

  return (
    <div className="max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold gradient-text">课表</h1>
        <div className="flex items-center gap-2">
          <button className="btn-ghost text-xs !py-1.5 !px-3" onClick={goToday}>今天</button>
          <button className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-[rgba(255,255,255,0.4)]" onClick={goPrevWeek}><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm text-[rgba(255,255,255,0.5)] min-w-[120px] text-center">
            {dateStr(monday)} ~ {dateStr(days[6])}
          </span>
          <button className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-[rgba(255,255,255,0.4)]" onClick={goNextWeek}><ChevronRight className="w-4 h-4" /></button>
          <button className="btn-primary text-xs !py-1.5 !px-3 ml-2">
            <Plus className="w-3 h-3" />
            新增事件
          </button>
        </div>
      </div>

      {/* Week grid */}
      <GlassCard className="!p-0 overflow-auto">
        <div className="flex min-w-[800px]">
          {/* Time column */}
          <div className="w-16 flex-shrink-0 border-r border-[rgba(255,255,255,0.04)]">
            <div className="h-10" />
            {HOURS.map(h => (
              <div key={h} className="h-[6rem] flex items-start justify-center pt-0">
                <span className="text-[10px] text-[rgba(255,255,255,0.2)]">{`${h}:00`}</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day, dayIndex) => (
            <div key={dayIndex} className="flex-1 border-r border-[rgba(255,255,255,0.04)] last:border-r-0 relative">
              {/* Day header */}
              <div className={`h-10 flex flex-col items-center justify-center border-b border-[rgba(255,255,255,0.04)] ${isToday(day) ? 'bg-[rgba(139,92,246,0.06)]' : ''}`}>
                <span className="text-[10px] text-[rgba(255,255,255,0.3)]">{DAY_LABELS[dayIndex]}</span>
                <span className={`text-sm font-semibold ${isToday(day) ? 'text-violet-400' : 'text-[rgba(255,255,255,0.6)]'}`}>{day.getDate()}</span>
              </div>

              {/* Time grid + events */}
              <div className="relative" style={{ height: `${14 * 6}rem` }}>
                {/* Hour lines */}
                {HOURS.map(h => (
                  <div key={h} className="absolute w-full border-t border-[rgba(255,255,255,0.02)]" style={{ top: `${(h - 8) * 6}rem` }} />
                ))}

                {/* Event cards */}
                {getEventsForDay(dayIndex, dateStr(day)).map(event => {
                  const colors: Record<string, string> = { lecture: '#8b5cf6', tutorial: '#22d3ee', lab: '#34d399', exam: '#f87171', other: '#94a3b8' }
                  const bgColor = colors[event.type] || '#6366f1'
                  return (
                    <div
                      key={event.id}
                      className="absolute left-1 right-1 rounded-lg px-2 py-1 overflow-hidden cursor-pointer hover:brightness-110 transition-all z-10"
                      style={{
                        top: hourToTop(event.start_time),
                        height: durationHeight(event.start_time, event.end_time),
                        background: `${bgColor}18`,
                        border: `1px solid ${bgColor}30`,
                      }}
                      title={`${event.title}\n${event.location || ''}`}
                    >
                      <p className="text-[10px] font-semibold truncate" style={{ color: bgColor }}>{event.title}</p>
                      <p className="text-[9px] text-[rgba(255,255,255,0.35)] truncate">{event.start_time}-{event.end_time}</p>
                      {event.location && (
                        <p className="text-[8px] text-[rgba(255,255,255,0.2)] truncate">{event.location}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
