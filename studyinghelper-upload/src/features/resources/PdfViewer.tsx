import { useState, useEffect } from 'react'
import type { Resource } from '@/types'

interface PdfViewerProps {
  resource: Resource
}

export default function PdfViewer({ resource }: PdfViewerProps): React.ReactElement {
  const [error, setError] = useState(false)

  // Chromium built-in PDF viewer (same engine as Edge) handles rendering,
  // zoom, text selection, search, page navigation — all natively.
  const pdfUrl = `pdf://${resource.id}`

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-sm text-[#A1A1AA]">
        <p>PDF 无法加载</p>
        <p className="text-xs text-[#52525B]">{resource.stored_path || '(无路径)'}</p>
      </div>
    )
  }

  return (
    <iframe
      src={pdfUrl}
      className="w-full h-full border-none"
      title={resource.title}
      onError={() => setError(true)}
    />
  )
}
