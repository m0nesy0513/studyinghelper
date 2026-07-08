import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { Plus, Search, FolderPlus, MoreHorizontal, Pin, Trash2, Edit3, FileText, Folder, Layers } from 'lucide-react'
import GlassCard from '@/components/layout/GlassCard'
import { NOTE_TEMPLATES } from '@/lib/noteTemplates'
import type { Note, Course } from '@/types'

// ── Inline editor ──
function NoteEditor({
  note, courses, onSave, onClose,
}: {
  note: Note | null
  courses: Course[]
  onSave: (data: Record<string, unknown>) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(note?.title ?? '')
  const [content, setContent] = useState(note?.content ?? '')
  const [courseId, setCourseId] = useState<string>(note?.course_id ?? '')
  const [preview, setPreview] = useState(false)

  const handleSave = () => {
    if (!title.trim()) return
    onSave({ title: title.trim(), content, course_id: courseId || null })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex bg-[#09090B]/90 backdrop-blur-sm" onKeyDown={e => e.key === 'Escape' && onClose()}>
      {/* Left: editor */}
      <div className="flex-1 flex flex-col p-8">
        <input
          className="text-2xl font-bold bg-transparent border-none outline-none text-[#FAFAFA] placeholder-[#52525B] mb-4"
          value={title} onChange={e => setTitle(e.target.value)} placeholder="笔记标题" autoFocus
        />
        {preview ? (
          <div className="flex-1 overflow-y-auto prose-sm text-[#A1A1AA] whitespace-pre-wrap font-mono text-sm">
            {content || '(空)'}
          </div>
        ) : (
          <textarea
            className="flex-1 w-full bg-transparent border-none outline-none resize-none text-[#A1A1AA] text-sm font-mono leading-relaxed placeholder-[#52525B]"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Markdown 内容..."
          />
        )}
      </div>
      {/* Right: toolbar */}
      <div className="w-64 border-l border-[rgba(255,255,255,0.06)] p-4 flex flex-col gap-3">
        <button className={`btn-ghost text-xs !py-1.5 !px-3 ${preview ? 'text-white' : ''}`} onClick={() => setPreview(!preview)}>
          {preview ? '✏️ 编辑' : '👁 预览'}
        </button>
        <div className="text-xs text-[#52525B]">关联课程</div>
        <select className="input-field h-8 text-xs" value={courseId} onChange={e => setCourseId(e.target.value)}>
          <option value="">无</option>
          {courses.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>
        <div className="text-xs text-[#52525B]">模板</div>
        {NOTE_TEMPLATES.map(t => (
          <button key={t.id} className="btn-ghost text-xs !py-1.5 !px-3 !justify-start" onClick={() => setContent(t.content)}>
            {t.icon} {t.name}
          </button>
        ))}
        <div className="flex-1" />
        <div className="flex gap-2">
          <button className="btn-ghost text-xs !py-2 flex-1" onClick={onClose}>取消</button>
          <button className="btn-primary text-xs !py-2 flex-1" onClick={handleSave}>保存</button>
        </div>
      </div>
    </div>
  )
}

// ── Note list item ──
function NoteCard({
  note, courses, onOpen, onTogglePin, onDelete,
}: {
  note: Note; courses: Course[]; onOpen: () => void
  onTogglePin: () => void; onDelete: () => void
}) {
  const course = courses.find(c => c.id === note.course_id)
  return (
    <GlassCard className="!p-3 group cursor-pointer" onClick={onOpen}>
      <div className="flex items-start gap-2">
        {note.is_folder ? <Folder className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" /> : <FileText className="w-4 h-4 text-[#52525B] flex-shrink-0 mt-0.5" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-[#E4E4E7] truncate">{note.title}</p>
            {note.is_pinned === 1 && <Pin className="w-3 h-3 text-violet-400 flex-shrink-0" />}
          </div>
          <p className="text-xs text-[#52525B] mt-0.5 truncate">{note.plain_text?.slice(0, 80) || '空笔记'}</p>
          {course && <span className="text-[10px] text-[#A1A1AA] mt-1 inline-block" style={{ color: course.color }}>{course.name}</span>}
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button className="p-1 rounded hover:bg-white/[0.08] text-[#52525B] hover:text-white" onClick={e => { e.stopPropagation(); onTogglePin() }}><Pin className="w-3 h-3" /></button>
          <button className="p-1 rounded hover:bg-red-500/20 text-[#52525B] hover:text-red-400" onClick={e => { e.stopPropagation(); onDelete() }}><Trash2 className="w-3 h-3" /></button>
        </div>
      </div>
    </GlassCard>
  )
}

// ── Main page ──
export default function NotesPage(): React.ReactElement {
  const { id: routeId } = useParams()
  const [notes, setNotes] = useState<Note[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Note | null | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'all' | 'folders' | 'pinned'>('all')

  const refresh = useCallback(async () => {
    const filters: Record<string, unknown> = {}
    if (view === 'pinned') filters.pinned = true
    if (view === 'folders') filters.is_folder = true
    const data = await window.api.notes.list(filters) as Note[]
    setNotes(data)
    setLoading(false)
  }, [view])

  useEffect(() => {
    refresh()
    window.api.courses.list().then(d => setCourses(d as Course[]))
  }, [refresh])

  // If route has :id param, load that note into editor on mount
  useEffect(() => {
    if (routeId && routeId !== 'new') {
      window.api.notes.get(routeId).then(note => {
        if (note) setEditing(note as Note)
      }).catch(() => {})
    } else if (routeId === 'new') {
      setEditing(null)
    }
  }, [routeId])

  const handleSave = async (data: Record<string, unknown>) => {
    if (editing) {
      await window.api.notes.update(editing.id, data)
    } else {
      await window.api.notes.create({ ...data, is_folder: false })
    }
    refresh()
  }

  const displayed = search
    ? notes.filter(n => n.title.toLowerCase().includes(search.toLowerCase()) || (n.plain_text ?? '').toLowerCase().includes(search.toLowerCase()))
    : notes

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold gradient-text">笔记</h1>
        <div className="flex gap-2">
          <button className="btn-secondary text-xs !py-2 !px-4" onClick={async () => {
            const name = prompt('文件夹名称：')
            if (name?.trim()) {
              await window.api.notes.create({ title: name.trim(), is_folder: true })
              refresh()
            }
          }}>
            <FolderPlus className="w-3.5 h-3.5" />
            新建文件夹
          </button>
          <button className="btn-primary text-xs !py-2 !px-4" onClick={() => setEditing(null)}>
            <Plus className="w-3.5 h-3.5" />
            新建笔记
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#52525B]" />
          <input className="input-field !pl-9" value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索笔记..." />
        </div>
        <div className="flex gap-1">
          {(['all', 'pinned', 'folders'] as const).map(v => (
            <button key={v} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === v ? 'bg-white/[0.08] text-white' : 'text-[#52525B] hover:text-white'}`} onClick={() => setView(v)}>
              {v === 'all' ? '全部' : v === 'pinned' ? '已置顶' : '文件夹'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-16 text-sm text-[#52525B]">加载中...</div>
      ) : displayed.length === 0 ? (
        <GlassCard className="flex flex-col items-center py-14 text-center">
          <FileText className="w-10 h-10 text-[#27272A] mb-3" />
          <p className="text-[#A1A1AA] font-medium mb-1">{search ? '没有匹配的笔记' : '还没有笔记'}</p>
          <p className="text-xs text-[#52525B]">{search ? '试试其他关键词' : '点击"新建笔记"开始记录'}</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {displayed.map(n => (
            <NoteCard
              key={n.id}
              note={n}
              courses={courses}
              onOpen={() => setEditing(n)}
              onTogglePin={async () => { await window.api.notes.update(n.id, { is_pinned: n.is_pinned ? 0 : 1 }); refresh() }}
              onDelete={async () => { if (confirm(`删除"${n.title}"？`)) { await window.api.notes.delete(n.id); refresh() } }}
            />
          ))}
        </div>
      )}

      {/* Editor modal — portaled to body to escape parent stacking context */}
      {editing !== undefined && (!editing || editing.is_folder === 0) && createPortal(
        <NoteEditor note={editing} courses={courses} onSave={handleSave} onClose={() => setEditing(undefined)} />,
        document.body
      )}
    </div>
  )
}
