import { type ReactNode, type CSSProperties, type MouseEvent as ReactMouseEvent } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  onClick?: (e: ReactMouseEvent) => void
}

export default function GlassCard({ children, className = '', style, onClick }: GlassCardProps): React.ReactElement {
  return (
    <div
      className={`glass-card p-6 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={style}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick(e as unknown as ReactMouseEvent) } : undefined}
    >
      {children}
    </div>
  )
}
