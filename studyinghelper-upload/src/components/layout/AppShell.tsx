import { type ReactNode, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import StarryBackground from './StarryBackground'

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps): React.ReactElement {
  const location = useLocation()
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let ticking = false
    function onMove(e: MouseEvent) {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const g = glowRef.current
        if (g) {
          g.style.left = e.clientX + 'px'
          g.style.top = e.clientY + 'px'
          g.style.opacity = '1'
        }
        ticking = false
      })
    }
    function onLeave() {
      const g = glowRef.current
      if (g) g.style.opacity = '0'
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseleave', onLeave)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <div className="flex h-screen w-screen bg-[#0F1119] overflow-hidden relative">
      <div className="nebula-bg" />
      <StarryBackground />
      <div className="cursor-glow" ref={glowRef} />

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 relative z-[2]">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
