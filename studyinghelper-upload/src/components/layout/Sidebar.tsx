import { NavLink, useLocation } from 'react-router-dom'
import {
  Home, BookOpen, FileText, Rss, Layers, Timer, Sparkles, Settings,
} from 'lucide-react'
import type { FC } from 'react'

interface NavItem {
  to: string
  icon: FC<{ className?: string }>
  label: string
}

const navItems: NavItem[] = [
  { to: '/', icon: Home, label: '首页' },
  { to: '/courses', icon: BookOpen, label: '课程' },
  { to: '/notes', icon: FileText, label: '笔记' },
  { to: '/newsroom', icon: Rss, label: '资讯室' },
  { to: '/flashcards', icon: Layers, label: '闪卡' },
  { to: '/pomodoro', icon: Timer, label: '番茄钟' },
  { to: '/ai', icon: Sparkles, label: 'AI 助手' },
]

export default function Sidebar(): React.ReactElement {
  const location = useLocation()

  return (
    <aside style={{ backdropFilter: 'url(#liquid-glass) blur(0.25px) contrast(1.15) brightness(1.15) saturate(1.1)', WebkitBackdropFilter: 'url(#liquid-glass) blur(0.25px) contrast(1.15) brightness(1.15) saturate(1.1)' }}
      className="w-14 flex flex-col items-center py-4 gap-1 border-r border-[rgba(255,255,255,0.05)] bg-[#020617]/80 flex-shrink-0 z-10 overflow-y-auto">
      {/* Logo */}
      <div className="mb-3 w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
        SH
      </div>

      {/* Nav items */}
      {navItems.map((item) => {
        const isActive = item.to === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(item.to)

        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={`
              relative w-9 h-9 flex items-center justify-center rounded-[10px]
              transition-all duration-200 group
              ${isActive
                ? 'text-white bg-white/[0.06] border border-[rgba(139,92,246,0.25)]'
                : 'text-[rgba(255,255,255,0.35)] hover:text-white hover:bg-white/[0.03] border border-transparent'
              }
            `}
            title={item.label}
          >
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full bg-gradient-to-b from-violet-400 to-fuchsia-400" />
            )}
            <item.icon className="w-[18px] h-[18px]" />
          </NavLink>
        )
      })}

      {/* Spacer pushes settings to bottom */}
      <div className="flex-1" />

      {/* Settings at bottom */}
      <NavLink
        to="/settings"
        className={`
          relative w-9 h-9 flex items-center justify-center rounded-[10px]
          transition-all duration-200 group
          ${location.pathname.startsWith('/settings')
            ? 'text-white bg-white/[0.06] border border-[rgba(139,92,246,0.25)]'
            : 'text-[rgba(255,255,255,0.35)] hover:text-white hover:bg-white/[0.03] border border-transparent'
          }
        `}
        title="设置"
      >
        {location.pathname.startsWith('/settings') && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full bg-gradient-to-b from-violet-400 to-fuchsia-400" />
        )}
        <Settings className="w-[18px] h-[18px]" />
      </NavLink>
    </aside>
  )
}
