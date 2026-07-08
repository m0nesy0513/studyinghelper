import { useState } from 'react'
import { Calculator, TrendingUp, Target } from 'lucide-react'
import GlassCard from '@/components/layout/GlassCard'
import type { Course } from '@/types'
import { calculateGPA, predictGPA, requiredScore } from '@/lib/gpa'

interface GradeCalculatorProps {
  courses: Course[]
}

export default function GradeCalculator({ courses }: GradeCalculatorProps): React.ReactElement {
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id ?? '')
  const [predictedScore, setPredictedScore] = useState(85)
  const [targetGPA, setTargetGPA] = useState(3.5)

  const { gpa: currentGPA, totalCredits } = calculateGPA(courses)
  const { predictedGPA } = predictGPA(courses, selectedCourseId, predictedScore)
  const needed = requiredScore(courses, selectedCourseId, targetGPA)

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-[rgba(255,255,255,0.5)] flex items-center gap-2">
        <Calculator className="w-4 h-4" />
        成绩测算
      </h3>

      {/* Current GPA */}
      <GlassCard className="!p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-[rgba(255,255,255,0.3)]" />
        </div>
        <div>
          <p className="text-xl font-bold text-[rgba(255,255,255,0.8)]">{currentGPA.toFixed(2)}</p>
          <p className="text-xs text-[rgba(255,255,255,0.3)]">当前 GPA · {totalCredits} 学分</p>
        </div>
      </GlassCard>

      {/* Predict */}
      <GlassCard className="!p-4">
        <p className="text-xs text-[rgba(255,255,255,0.35)] mb-3">如果某门课考 XXX 分...</p>
        <div className="flex items-center gap-3">
          <select
            className="flex-1 h-9 px-3 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-sm text-white/80 outline-none"
            value={selectedCourseId}
            onChange={e => setSelectedCourseId(e.target.value)}
          >
            {courses.filter(c => c.score == null).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
            {courses.filter(c => c.score != null).map(c => (
              <option key={c.id} value={c.id}>{c.name} (已有{c.score}分)</option>
            ))}
          </select>
          <input
            type="number" min="0" max="100"
            className="w-20 h-9 px-3 bg-white/[0.04] border border-[rgba(255,255,255,0.12)] rounded-[10px] text-sm text-white/80 text-center outline-none focus:border-[rgba(139,92,246,0.3)]"
            value={predictedScore}
            onChange={e => setPredictedScore(Number(e.target.value))}
          />
          <span className="text-sm text-[rgba(255,255,255,0.4)]">→</span>
          <span className="text-lg font-bold gradient-text w-14 text-center">{predictedGPA.toFixed(2)}</span>
        </div>
      </GlassCard>

      {/* Reverse */}
      <GlassCard className="!p-4">
        <p className="text-xs text-[rgba(255,255,255,0.35)] mb-3">要达到目标 GPA，需要多少分？</p>
        <div className="flex items-center gap-3">
          <Target className="w-4 h-4 text-[rgba(255,255,255,0.3)]" />
          <input
            type="number" step="0.1" min="0" max="4"
            className="w-20 h-9 px-3 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-sm text-white/80 text-center outline-none"
            value={targetGPA}
            onChange={e => setTargetGPA(Number(e.target.value))}
          />
          <span className="text-xs text-[rgba(255,255,255,0.35)]">
            {needed === null
              ? <span className="text-rose-400">无法达到（当前课程已不够）</span>
              : needed === 0
                ? <span className="text-emerald-400">已超过目标！</span>
                : <span>需要至少 <span className="text-white font-bold">{needed}</span> 分</span>
            }
          </span>
        </div>
      </GlassCard>
    </div>
  )
}
