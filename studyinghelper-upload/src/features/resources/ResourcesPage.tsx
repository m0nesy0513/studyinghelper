import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, ExternalLink, Trash2, File, FileText, Image, Link, Film, ArrowLeft, Eye } from 'lucide-react'
import GlassCard from '@/components/layout/GlassCard'
import PdfViewer from './PdfViewer'
import type { Resource, Course } from '@/types'
import { RESOURCE_TYPE_LABELS } from '@/types'

const TYPE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  pdf: FileText, image: Image, link: Link, video: Film, file: File,
}

// ── Resource Card (list view) ──
function ResourceCard({ resource, courses, onDelete, onClick }: {
  resource: Resource; courses: Course[]; onDelete: () => void; onClick: () => void
}) {
  const course = courses.find(c => c.id === resource.course_id)
  const Icon = TYPE_ICONS[resource.type] || File
  return (
    <GlassCard className="!p-4 group cursor-pointer" onClick={onClick}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-[#A1A1AA]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#E4E4E7] truncate">{resource.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-[#A1A1AA]">{RESOURCE_TYPE_LABELS[resource.type] || resource.type}</span>
            {resource.file_size != null && <span className="text-[10px] text-[#52525B]">{Math.round(resource.file_size / 1024)}KB</span>}
            {course && <span className="text-[10px]" style={{ color: course.color }}>{course.name}</span>}
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {resource.type === 'pdf' && <button className="p-1.5 rounded-lg hover:bg-violet-500/20 text-[#52525B] hover:text-violet-400" onClick={e => { e.stopPropagation(); onClick() }} title="查看"><Eye className="w-3.5 h-3.5" /></button>}
          {resource.url && <a href={resource.url} target="_blank" className="p-1.5 rounded-lg hover:bg-white/[0.08] text-[#52525B] hover:text-white" onClick={e => e.stopPropagation()}><ExternalLink className="w-3.5 h-3.5" /></a>}
          <button className="p-1.5 rounded-lg hover:bg-red-500/20 text-[#52525B] hover:text-red-400" onClick={e => { e.stopPropagation(); onDelete() }}><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    </GlassCard>
  )
}

// ── Resource List View ──
function ResourceListView() {
  const navigate = useNavigate()
  const [resources, setResources] = useState<Resource[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const data = await window.api.resources.list() as Resource[]
    setResources(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
    window.api.courses.list().then(d => setCourses(d as Course[]))
  }, [refresh])

  const handleAddLink = async () => {
    const url = prompt('链接地址（https://...）：')
    if (!url?.trim()) return
    const title = prompt('链接名称：') || url
    await window.api.resources.create({ title, type: 'link', url: url.trim() })
    refresh()
  }

  const handleImportFile = async () => {
    const result = await window.api.dialog.openFile()
    if (result) refresh()
  }

  const handleDelete = async (r: Resource) => {
    if (confirm(`删除"${r.title}"？`)) {
      await window.api.resources.delete(r.id)
      refresh()
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold gradient-text">资料库</h1>
        <div className="flex gap-2">
          <button className="btn-secondary text-xs !py-2 !px-4" onClick={handleAddLink}>
            <Link className="w-3.5 h-3.5" />
            添加链接
          </button>
          <button className="btn-primary text-xs !py-2 !px-4" onClick={handleImportFile}>
            <Plus className="w-3.5 h-3.5" />
            导入文件
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-sm text-[#52525B]">加载中...</div>
      ) : resources.length === 0 ? (
        <GlassCard className="flex flex-col items-center py-14 text-center">
          <File className="w-10 h-10 text-[#27272A] mb-3" />
          <p className="text-[#A1A1AA] font-medium mb-1">还没有资料</p>
          <p className="text-xs text-[#52525B]">导入文件或添加链接开始整理资料</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {resources.map(r => (
            <ResourceCard
              key={r.id}
              resource={r}
              courses={courses}
              onDelete={() => handleDelete(r)}
              onClick={() => {
                if (r.type === 'pdf') navigate(`/resources/${r.id}`)
                else if (r.url) window.open(r.url, '_blank')
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── PDF Detail View ──
function ResourceDetailView() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [resource, setResource] = useState<Resource | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    (async () => {
      const r = await window.api.resources.get(id) as Resource | null
      setResource(r)
      setLoading(false)
    })()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-[#52525B]">加载中...</div>
    )
  }

  if (!resource) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-sm text-[#52525B]">资料未找到</p>
        <button className="btn-secondary text-xs" onClick={() => navigate('/resources')}>返回</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-1 mb-3">
        <button onClick={() => navigate('/resources')} className="p-1.5 rounded-lg text-[#52525B] hover:text-white hover:bg-white/[0.06] transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-sm font-semibold text-[#E4E4E7]">{resource.title}</h1>
          <span className="text-[10px] text-[#52525B]">{RESOURCE_TYPE_LABELS[resource.type]}</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.06)]">
        {resource.type === 'pdf' && resource.stored_path ? (
          <PdfViewer resource={resource} />
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-[#52525B]">
            此文件类型暂不支持预览
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page Router ──
export default function ResourcesPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>()

  if (id) {
    return <ResourceDetailView />
  }

  return <ResourceListView />
}
