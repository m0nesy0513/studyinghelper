import { useLocation } from 'react-router-dom'

const pageTitles: Record<string, string> = {
  '/': '首页',
  '/courses': '课程管理',
  '/schedule': '课表',
  '/tasks': '任务',
  '/notes': '笔记',
  '/resources': '资料库',
  '/fetcher': '资源抓取',
  '/newsroom': '资讯室',
  '/flashcards': '闪卡',
  '/errorbook': '错题本',
  '/pomodoro': '番茄钟',
  '/analytics': '学习分析',
  '/ai': 'AI 助手',
  '/settings': '设置',
}

export default function Topbar(): React.ReactElement {
  const location = useLocation()

  // Find matching title by longest matching prefix
  const title = Object.entries(pageTitles)
    .filter(([path]) => location.pathname.startsWith(path))
    .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ?? ''

  return (
    <header className="h-12 flex items-center px-6 border-b border-[rgba(255,255,255,0.05)] bg-[#020617]/60 backdrop-blur-sm flex-shrink-0">
      {/* Breadcrumb / page title */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-[rgba(255,255,255,0.3)]">StudyingHelper</span>
        {title && (
          <>
            <span className="text-[rgba(255,255,255,0.15)] text-xs">/</span>
            <span className="text-sm text-[rgba(255,255,255,0.7)]">{title}</span>
          </>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Version badge */}
      <span className="text-[10px] text-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.03)] px-2 py-0.5 rounded-full">
        v1.0.0
      </span>
    </header>
  )
}
