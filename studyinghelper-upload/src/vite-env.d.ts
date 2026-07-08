/// <reference types="vite/client" />

interface Window {
  api: {
    app: {
      getVersion: () => Promise<string>
      minimize: () => Promise<void>
      maximize: () => Promise<void>
      close: () => Promise<void>
    }
    courses: {
      list: (filters?: Record<string, unknown>) => Promise<unknown[]>
      get: (id: string) => Promise<unknown>
      create: (data: Record<string, unknown>) => Promise<unknown>
      update: (id: string, data: Record<string, unknown>) => Promise<unknown>
      delete: (id: string) => Promise<boolean>
    }
    schedule: {
      list: (filters?: Record<string, unknown>) => Promise<unknown[]>
      get: (id: string) => Promise<unknown>
      create: (data: Record<string, unknown>) => Promise<unknown>
      update: (id: string, data: Record<string, unknown>) => Promise<unknown>
      delete: (id: string) => Promise<boolean>
    }
    tasks: {
      list: (filters?: Record<string, unknown>) => Promise<unknown[]>
      get: (id: string) => Promise<unknown>
      create: (data: Record<string, unknown>) => Promise<unknown>
      update: (id: string, data: Record<string, unknown>) => Promise<unknown>
      delete: (id: string) => Promise<boolean>
    }
    settings: {
      get: (key: string) => Promise<string | null>
      set: (key: string, value: string) => Promise<void>
      setEncrypted: (key: string, value: string) => Promise<void>
      hasApiKey: () => Promise<boolean>
      delete: (key: string) => Promise<void>
    }
    notes: {
      list: (filters?: Record<string, unknown>) => Promise<unknown[]>
      get: (id: string) => Promise<unknown>
      create: (data: Record<string, unknown>) => Promise<unknown>
      update: (id: string, data: Record<string, unknown>) => Promise<unknown>
      delete: (id: string) => Promise<boolean>
      search: (query: string) => Promise<unknown[]>
    }
    resources: {
      list: (filters?: Record<string, unknown>) => Promise<unknown[]>
      get: (id: string) => Promise<unknown>
      create: (data: Record<string, unknown>) => Promise<unknown>
      delete: (id: string) => Promise<boolean>
      readFile: (resourceId: string) => Promise<string | null>
    }
    annotations: {
      listByResource: (resourceId: string) => Promise<unknown[]>
      create: (data: Record<string, unknown>) => Promise<unknown>
      update: (id: string, data: Record<string, unknown>) => Promise<unknown>
      delete: (id: string) => Promise<boolean>
    }
    dialog: {
      openFile: () => Promise<unknown | null>
    }
    fetchSources: {
      list: (filters?: Record<string, unknown>) => Promise<unknown[]>
      get: (id: string) => Promise<unknown>
      create: (data: Record<string, unknown>) => Promise<unknown>
      update: (id: string, data: Record<string, unknown>) => Promise<unknown>
      delete: (id: string) => Promise<boolean>
    }
    fetchLogs: {
      list: (sourceId: string) => Promise<unknown[]>
    }
    fetch: {
      clipPage: (url: string) => Promise<{ success: boolean; data?: unknown; error?: string }>
      searchScholar: (query: string) => Promise<{ success: boolean; data?: unknown; error?: string }>
      fetchRss: (url: string) => Promise<{ success: boolean; data?: unknown; error?: string }>
      scanMoodle: (url: string, cookie?: string) => Promise<{ success: boolean; data?: unknown; error?: string }>
      saveAsNote: (data: { title: string; content: string; course_id?: string | null }) => Promise<unknown>
    }
    rss: {
      getCachedArticles: () => Promise<{ articles: Array<{ title: string; link: string | null; contentSnippet: string | null; pubDate: string | null; creator: string | null; sourceName: string; sourceUrl: string }>; updatedAt: string | null }>
      refreshAll: () => Promise<{ articles: Array<{ title: string; link: string | null; contentSnippet: string | null; pubDate: string | null; creator: string | null; sourceName: string; sourceUrl: string }>; updatedAt: string }>
    }
    decks: {
      list: (filters?: Record<string, unknown>) => Promise<unknown[]>
      get: (id: string) => Promise<unknown>
      create: (data: Record<string, unknown>) => Promise<unknown>
      update: (id: string, data: Record<string, unknown>) => Promise<unknown>
      delete: (id: string) => Promise<boolean>
    }
    cards: {
      list: (deckId: string) => Promise<unknown[]>
      listDue: (deckId: string) => Promise<unknown[]>
      create: (data: Record<string, unknown>) => Promise<unknown>
      update: (id: string, data: Record<string, unknown>) => Promise<unknown>
      delete: (id: string) => Promise<boolean>
      countDue: () => Promise<{ deck_id: string; count: number }[]>
    }
    errors: {
      list: (filters?: Record<string, unknown>) => Promise<unknown[]>
      get: (id: string) => Promise<unknown>
      create: (data: Record<string, unknown>) => Promise<unknown>
      update: (id: string, data: Record<string, unknown>) => Promise<unknown>
      markReviewed: (id: string, mastery: number) => Promise<unknown>
      delete: (id: string) => Promise<boolean>
    }
    pomodoro: {
      list: (limit?: number) => Promise<unknown[]>
      listToday: () => Promise<unknown[]>
      create: (data: Record<string, unknown>) => Promise<unknown>
      complete: (id: string, duration?: number) => Promise<unknown>
      cancel: (id: string) => Promise<unknown>
      getStreak: () => Promise<{ current_streak: number; longest_streak: number; today_minutes: number; total_sessions_today: number }>
    }
    analytics: {
      weeklyStudy: () => Promise<{ day: string; minutes: number }[]>
      taskStats: () => Promise<{ status: string; count: number }[]>
      gpaTrend: () => Promise<{ semester: string; gpa: number }[]>
      knowledgeGraph: () => Promise<{ nodes: { id: string; label: string; color: string; type: string }[]; edges: { source: string; target: string }[] }>
    }
    ai: {
      hasKey: () => Promise<boolean>
      chat: (messages: Array<{ role: string; content: string }>) => Promise<{ success: boolean; content?: string; error?: string }>
      ocr: (base64: string, mime?: string) => Promise<{ success: boolean; text?: string; error?: string }>
    }
    conv: {
      list: () => Promise<unknown[]>
      get: (id: string) => Promise<unknown>
      create: (title: string) => Promise<unknown>
      delete: (id: string) => Promise<boolean>
    }
    msg: {
      list: (convId: string) => Promise<unknown[]>
      create: (convId: string, role: 'user' | 'assistant', content: string) => Promise<unknown>
    }
    exam: {
      list: () => Promise<unknown[]>
      get: (id: string) => Promise<unknown>
      getByCourse: (courseId: string) => Promise<unknown>
      create: (data: Record<string, unknown>) => Promise<unknown>
      update: (id: string, data: Record<string, unknown>) => Promise<unknown>
      delete: (id: string) => Promise<boolean>
      upcoming: () => Promise<unknown[]>
    }
  }
}
