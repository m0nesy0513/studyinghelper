import { useState, useEffect, useRef } from 'react'
import { TrendingUp, PieChart, GitGraph } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RePie, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts'
import GlassCard from '@/components/layout/GlassCard'

interface DayMinutes { day: string; minutes: number }
interface TaskStat { status: string; count: number }
interface GpaPoint { semester: string; gpa: number }
interface GraphNode { id: string; label: string; color: string; type: string }
interface GraphEdge { source: string; target: string }

const TASK_COLORS: Record<string, string> = { todo: '#fbbf24', in_progress: '#3b82f6', done: '#34d399', cancelled: '#6b7280' }
const TASK_LABELS: Record<string, string> = { todo: '待办', in_progress: '进行中', done: '已完成', cancelled: '已取消' }
const CHART_THEME = { background: 'transparent', text: '#A1A1AA', grid: 'rgba(255,255,255,0.04)', axis: '#52525B' }

// ── Force-directed graph ──
function KnowledgeGraph({ data }: { data: { nodes: GraphNode[]; edges: GraphEdge[] } }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map())
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    // Simple circular layout for courses, spring-like for children
    const pos = new Map<string, { x: number; y: number }>()
    const courses = data.nodes.filter(n => n.type === 'course')
    const others = data.nodes.filter(n => n.type !== 'course')
    const cx = 400; const cy = 300; const r = 120

    // Courses in a circle
    courses.forEach((c, i) => {
      const angle = (2 * Math.PI * i) / Math.max(courses.length, 1) - Math.PI / 2
      pos.set(c.id, { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) })
    })

    // Group children near their parent course
    for (const n of others) {
      const edge = data.edges.find(e => e.target === n.id)
      const parentPos = edge ? pos.get(edge.source) : null
      if (parentPos) {
        const angle = Math.random() * 2 * Math.PI
        const dist = 60 + Math.random() * 80
        pos.set(n.id, { x: parentPos.x + dist * Math.cos(angle), y: parentPos.y + dist * Math.sin(angle) })
      } else {
        pos.set(n.id, { x: 100 + Math.random() * 600, y: 100 + Math.random() * 400 })
      }
    }
    setPositions(pos)
  }, [data])

  if (data.nodes.length === 0) {
    return <p className="text-xs text-[#52525B] text-center py-8">添加课程后自动生成知识图谱</p>
  }

  // Filter to only show relevant part when selected
  let displayNodes = data.nodes
  let displayEdges = data.edges
  if (selected) {
    const connectedNodeIds = new Set<string>([selected])
    for (const e of data.edges) {
      if (e.source === selected) connectedNodeIds.add(e.target)
      if (e.target === selected) connectedNodeIds.add(e.source)
    }
    displayNodes = data.nodes.filter(n => connectedNodeIds.has(n.id))
    displayEdges = data.edges.filter(e => connectedNodeIds.has(e.source) && connectedNodeIds.has(e.target))
  }

  const nodeRadius: Record<string, number> = { course: 20, note: 12, deck: 10, resource: 10, error: 8 }

  return (
    <div className="relative">
      {selected && (
        <button className="absolute top-2 left-2 z-10 text-[10px] text-[#52525B] hover:text-white bg-[#020617]/80 px-2 py-1 rounded-lg" onClick={() => setSelected(null)}>显示全部</button>
      )}
      <svg ref={svgRef} viewBox="0 0 800 600" className="w-full h-auto" style={{ background: 'transparent' }}>
        {/* Edges */}
        {displayEdges.map((e, i) => {
          const s = positions.get(e.source); const t = positions.get(e.target)
          if (!s || !t) return null
          return <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
        })}
        {/* Nodes */}
        {displayNodes.map(n => {
          const p = positions.get(n.id); if (!p) return null
          const r = nodeRadius[n.type] || 8
          return (
            <g key={n.id} className="cursor-pointer" onClick={() => setSelected(selected === n.id ? null : n.id)}>
              <circle cx={p.x} cy={p.y} r={r} fill={n.color + '40'} stroke={n.color} strokeWidth={selected === n.id ? 2 : 1} />
              {n.type === 'course' && (
                <text x={p.x} y={p.y + 4} textAnchor="middle" fill="#E4E4E7" fontSize={9} fontWeight={600}>
                  {n.label.slice(0, 6)}
                </text>
              )}
              {selected === n.id && (
                <text x={p.x} y={p.y - r - 6} textAnchor="middle" fill="#A1A1AA" fontSize={9}>
                  {n.label}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <div className="flex items-center justify-center gap-4 mt-3">
        {['course','note','deck','resource','error'].map(t => (
          <div key={t} className="flex items-center gap-1.5 text-[10px] text-[#52525B]">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: t==='course'?'#a78bfa':t==='note'?'#3b82f6':t==='deck'?'#22d3ee':t==='resource'?'#fbbf24':'#f87171' }} />
            {t==='course'?'课程':t==='note'?'笔记':t==='deck'?'闪卡':t==='resource'?'资源':'错题'}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main ──
export default function AnalyticsPage(): React.ReactElement {
  const [studyData, setStudyData] = useState<DayMinutes[]>([])
  const [taskData, setTaskData] = useState<TaskStat[]>([])
  const [gpaData, setGpaData] = useState<GpaPoint[]>([])
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] }>({ nodes: [], edges: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const [study, tasks, gpa, graph] = await Promise.all([
        window.api.analytics.weeklyStudy(),
        window.api.analytics.taskStats(),
        window.api.analytics.gpaTrend(),
        window.api.analytics.knowledgeGraph(),
      ])
      setStudyData(study as DayMinutes[] || [])
      setTaskData(tasks as TaskStat[] || [])
      setGpaData(gpa as GpaPoint[] || [])
      setGraphData(graph as any || { nodes: [], edges: [] })
      setLoading(false)
    })()
  }, [])

  if (loading) return <div className="text-center py-16 text-sm text-[#52525B]">加载中...</div>

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold gradient-text mb-6">学习分析</h1>

      {/* Row 1: Study time + Task pie */}
      <div className="grid grid-cols-2 gap-5 mb-5">
        {/* Weekly study time */}
        <GlassCard className="!p-5">
          <h3 className="text-sm font-semibold text-[#E4E4E7] mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-400" /> 本周学习时长
          </h3>
          {studyData.length === 0 ? (
            <p className="text-xs text-[#52525B] text-center py-8">暂无番茄钟数据</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={studyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} />
                <XAxis dataKey="day" tick={{ fill: CHART_THEME.axis, fontSize: 10 }} />
                <YAxis tick={{ fill: CHART_THEME.axis, fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }} labelStyle={{ color: '#A1A1AA' }} />
                <Bar dataKey="minutes" fill="#a78bfa" radius={[6, 6, 0, 0]} name="分钟" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </GlassCard>

        {/* Task completion */}
        <GlassCard className="!p-5">
          <h3 className="text-sm font-semibold text-[#E4E4E7] mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-cyan-400" /> 任务分布
          </h3>
          {taskData.length === 0 ? (
            <p className="text-xs text-[#52525B] text-center py-8">暂无任务数据</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <RePie>
                <Pie data={taskData} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={({ status, count }) => `${TASK_LABELS[status] || status} ${count}`}>
                  {taskData.map(t => <Cell key={t.status} fill={TASK_COLORS[t.status] || '#6b7280'} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }} />
              </RePie>
            </ResponsiveContainer>
          )}
        </GlassCard>
      </div>

      {/* Row 2: GPA trend */}
      <GlassCard className="!p-5 mb-5">
        <h3 className="text-sm font-semibold text-[#E4E4E7] mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" /> GPA 走势
        </h3>
        {gpaData.length === 0 ? (
          <p className="text-xs text-[#52525B] text-center py-8">暂无成绩数据，请在课程中输入成绩</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={gpaData}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} />
              <XAxis dataKey="semester" tick={{ fill: CHART_THEME.axis, fontSize: 10 }} />
              <YAxis domain={[0, 4.3]} tick={{ fill: CHART_THEME.axis, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="gpa" stroke="#34d399" strokeWidth={2} dot={{ fill: '#34d399', r: 4 }} name="GPA" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </GlassCard>

      {/* Row 3: Knowledge Graph */}
      <GlassCard className="!p-5">
        <h3 className="text-sm font-semibold text-[#E4E4E7] mb-4 flex items-center gap-2">
          <GitGraph className="w-4 h-4 text-amber-400" /> 知识图谱
        </h3>
        <KnowledgeGraph data={graphData} />
      </GlassCard>
    </div>
  )
}
