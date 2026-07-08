import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, RotateCcw, CheckCircle, XCircle, Timer, Zap, Flame } from 'lucide-react'
import GlassCard from '@/components/layout/GlassCard'
import type { Course } from '@/types'

interface Session {
  id: string; task_id: string | null; start_time: string; end_time: string | null
  duration_minutes: number; type: string; status: string; created_at: string
}

interface StreakInfo {
  current_streak: number; longest_streak: number; today_minutes: number; total_sessions_today: number
}

const FOCUS_MINUTES = 25
const BREAK_MINUTES = 5

export default function PomodoroPage(): React.ReactElement {
  const [streak, setStreak] = useState<StreakInfo>({ current_streak: 0, longest_streak: 0, today_minutes: 0, total_sessions_today: 0 })
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [paused, setPaused] = useState(true)
  const [running, setRunning] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_MINUTES * 60)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refresh = useCallback(async () => {
    const [s, st] = await Promise.all([
      window.api.pomodoro.list(20) as Promise<Session[]>,
      window.api.pomodoro.getStreak() as Promise<StreakInfo>,
    ])
    setSessions(s); setStreak(st); setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  // Start a new session
  const start = async () => {
    if (running) return
    const mins = isBreak ? BREAK_MINUTES : FOCUS_MINUTES
    const session = await window.api.pomodoro.create({ duration_minutes: mins, type: isBreak ? 'break' : 'focus' }) as Session
    setActiveSessionId(session.id)
    setSecondsLeft(mins * 60)
    setRunning(true); setPaused(false)
    startTimer(session.id, mins * 60)
  }

  const startTimer = (sessionId: string, totalSeconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current)
    let remaining = totalSeconds
    timerRef.current = setInterval(() => {
      remaining--
      setSecondsLeft(remaining)
      if (remaining <= 0) {
        clearInterval(timerRef.current!)
        completeSession(sessionId)
      }
    }, 1000)
  }

  const completeSession = async (sessionId: string) => {
    const mins = isBreak ? BREAK_MINUTES : FOCUS_MINUTES
    await window.api.pomodoro.complete(sessionId, mins)
    setRunning(false); setPaused(true); setActiveSessionId(null)
    setSecondsLeft(isBreak ? FOCUS_MINUTES * 60 : BREAK_MINUTES * 60)
    setIsBreak(v => !v)
    refresh()
    // Auto-notify for focus completed
    if (!isBreak && window.Notification) {
      try { new Notification('🍅 专注完成！', { body: '休息一下，5分钟后继续' }) } catch {}
    }
  }

  const togglePause = () => {
    if (!running) return
    setPaused(p => {
      if (!p) {
        // Pausing
        if (timerRef.current) clearInterval(timerRef.current)
      } else {
        // Resuming
        startTimer(activeSessionId!, secondsLeft)
      }
      return !p
    })
  }

  const cancelSession = async () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (activeSessionId) await window.api.pomodoro.cancel(activeSessionId)
    setRunning(false); setPaused(true); setActiveSessionId(null)
    setSecondsLeft(isBreak ? BREAK_MINUTES * 60 : FOCUS_MINUTES * 60)
    refresh()
  }

  // Cleanup
  useEffect(() => { return () => { if (timerRef.current) clearInterval(timerRef.current) } }, [])

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  // Streak badges
  const streakBadge = () => {
    const s = streak.current_streak
    if (s >= 365) return { emoji: '💎', color: 'text-sky-400', label: '365天传奇' }
    if (s >= 100) return { emoji: '👑', color: 'text-yellow-400', label: '100天王者' }
    if (s >= 30) return { emoji: '🏆', color: 'text-amber-400', label: '30天达人' }
    if (s >= 7) return { emoji: '⭐', color: 'text-violet-400', label: '7天新秀' }
    return { emoji: '🔥', color: 'text-orange-400', label: '坚持中' }
  }

  const badge = streakBadge()

  if (loading) return <div className="text-center py-16 text-sm text-[#52525B]">加载中...</div>

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold gradient-text mb-6 text-center">番茄钟</h1>

      {/* Streak Card */}
      <GlassCard className="!p-4 mb-5 text-center">
        <div className="flex items-center justify-center gap-6">
          <div className="flex flex-col items-center">
            <span className={`text-2xl ${badge.color}`}>{badge.emoji}</span>
            <span className="text-lg font-bold text-[#E4E4E7] mt-1">{streak.current_streak} 天</span>
            <span className="text-[10px] text-[#52525B]">当前连击</span>
          </div>
          <div className="w-px h-10 bg-[rgba(255,255,255,0.06)]" />
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-[#E4E4E7]">{streak.longest_streak} 天</span>
            <span className="text-[10px] text-[#52525B]">最长记录</span>
          </div>
          <div className="w-px h-10 bg-[rgba(255,255,255,0.06)]" />
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-[#E4E4E7]">{streak.today_minutes} 分钟</span>
            <span className="text-[10px] text-[#52525B]">今日专注</span>
          </div>
        </div>
        {streak.current_streak > 0 && <p className="text-[10px] text-[#3F3F46] mt-3">{badge.emoji} {badge.label}</p>}
      </GlassCard>

      {/* Timer */}
      <GlassCard className="!p-8 mb-5 text-center">
        <div className={`text-[10px] uppercase tracking-wider mb-2 ${isBreak ? 'text-green-400' : 'text-violet-400'}`}>
          {isBreak ? '☕ 休息时间' : '🍅 专注时间'}
        </div>
        <div className={`text-6xl font-bold font-mono tracking-wider mb-6 ${paused && running ? 'text-amber-400' : 'text-[#FAFAFA]'}`}>
          {formatTime(secondsLeft)}
        </div>

        {/* Progress ring */}
        <div className="w-48 h-48 mx-auto mb-6 relative">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
            <circle cx="50" cy="50" r="44" fill="none"
              stroke={isBreak ? '#34d399' : '#a78bfa'}
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - (1 - secondsLeft / ((isBreak ? BREAK_MINUTES : FOCUS_MINUTES) * 60)))}`}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className={`w-8 h-8 ${isBreak ? 'text-green-400/60' : 'text-violet-400/60'}`} />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button className="btn-secondary text-xs !py-2 !px-4" onClick={() => {
            setIsBreak(b => !b); setSecondsLeft(b => isBreak ? FOCUS_MINUTES * 60 : BREAK_MINUTES * 60)
          }} disabled={running}>
            {isBreak ? <Timer className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
            {isBreak ? '切回专注' : '切换休息'}
          </button>

          {!running ? (
            <button className="btn-primary text-sm !py-3 !px-8" onClick={start}>
              <Play className="w-5 h-5" /> 开始
            </button>
          ) : (
            <>
              <button className="btn-primary text-sm !py-3 !px-6" onClick={togglePause}>
                {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                {paused ? '继续' : '暂停'}
              </button>
              <button className="btn-ghost text-xs !py-2 !px-3 text-[#52525B] hover:text-red-400" onClick={cancelSession}>
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {running && paused && <p className="text-[10px] text-amber-400/60 mt-3">已暂停</p>}
      </GlassCard>

      {/* History */}
      <GlassCard className="!p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#E4E4E7]">最近记录</h3>
          <span className="text-[10px] text-[#52525B]">今日 {streak.total_sessions_today} 次</span>
        </div>
        {sessions.length === 0 ? (
          <p className="text-xs text-[#52525B] text-center py-4">还没有番茄钟记录</p>
        ) : (
          <div className="space-y-1.5">
            {sessions.slice(0, 10).map(s => {
              const d = new Date(s.created_at)
              const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
              return (
                <div key={s.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{s.type === 'focus' ? '🍅' : '☕'}</span>
                    <span className="text-xs text-[#A1A1AA]">{s.duration_minutes} 分钟</span>
                    {s.status === 'completed' && <CheckCircle className="w-3 h-3 text-green-400" />}
                    {s.status === 'cancelled' && <XCircle className="w-3 h-3 text-red-400" />}
                  </div>
                  <span className="text-[10px] text-[#52525B]">{time}</span>
                </div>
              )
            })}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
