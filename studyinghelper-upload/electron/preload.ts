const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    minimize: () => ipcRenderer.invoke('app:minimize'),
    maximize: () => ipcRenderer.invoke('app:maximize'),
    close: () => ipcRenderer.invoke('app:close'),
  },

  courses: {
    list: (filters?: Record<string, unknown>) => ipcRenderer.invoke('courses:list', filters),
    get: (id: string) => ipcRenderer.invoke('courses:get', id),
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('courses:create', data),
    update: (id: string, data: Record<string, unknown>) => ipcRenderer.invoke('courses:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('courses:delete', id),
  },

  schedule: {
    list: (filters?: Record<string, unknown>) => ipcRenderer.invoke('schedule:list', filters),
    get: (id: string) => ipcRenderer.invoke('schedule:get', id),
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('schedule:create', data),
    update: (id: string, data: Record<string, unknown>) => ipcRenderer.invoke('schedule:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('schedule:delete', id),
  },

  tasks: {
    list: (filters?: Record<string, unknown>) => ipcRenderer.invoke('tasks:list', filters),
    get: (id: string) => ipcRenderer.invoke('tasks:get', id),
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('tasks:create', data),
    update: (id: string, data: Record<string, unknown>) => ipcRenderer.invoke('tasks:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('tasks:delete', id),
  },

  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),
    setEncrypted: (key: string, value: string) => ipcRenderer.invoke('settings:setEncrypted', key, value),
    hasApiKey: () => ipcRenderer.invoke('settings:hasApiKey'),
    delete: (key: string) => ipcRenderer.invoke('settings:delete', key),
  },

  notes: {
    list: (filters?: Record<string, unknown>) => ipcRenderer.invoke('notes:list', filters),
    get: (id: string) => ipcRenderer.invoke('notes:get', id),
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('notes:create', data),
    update: (id: string, data: Record<string, unknown>) => ipcRenderer.invoke('notes:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('notes:delete', id),
    search: (query: string) => ipcRenderer.invoke('notes:search', query),
  },

  resources: {
    list: (filters?: Record<string, unknown>) => ipcRenderer.invoke('resources:list', filters),
    get: (id: string) => ipcRenderer.invoke('resources:get', id),
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('resources:create', data),
    delete: (id: string) => ipcRenderer.invoke('resources:delete', id),
    readFile: (resourceId: string) => ipcRenderer.invoke('resources:readFile', resourceId) as Promise<string | null>,
  },

  annotations: {
    listByResource: (resourceId: string) => ipcRenderer.invoke('annotations:listByResource', resourceId),
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('annotations:create', data),
    update: (id: string, data: Record<string, unknown>) => ipcRenderer.invoke('annotations:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('annotations:delete', id),
  },

  dialog: {
    openFile: () => ipcRenderer.invoke('dialog:openFile'),
  },

  fetchSources: {
    list: (filters?: Record<string, unknown>) => ipcRenderer.invoke('fetchSources:list', filters),
    get: (id: string) => ipcRenderer.invoke('fetchSources:get', id),
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('fetchSources:create', data),
    update: (id: string, data: Record<string, unknown>) => ipcRenderer.invoke('fetchSources:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('fetchSources:delete', id),
  },

  fetchLogs: {
    list: (sourceId: string) => ipcRenderer.invoke('fetchLogs:list', sourceId),
  },

  fetch: {
    clipPage: (url: string) => ipcRenderer.invoke('fetch:clipPage', url),
    searchScholar: (query: string) => ipcRenderer.invoke('fetch:searchScholar', query),
    fetchRss: (url: string) => ipcRenderer.invoke('fetch:fetchRss', url),
    scanMoodle: (url: string, cookie?: string) => ipcRenderer.invoke('fetch:scanMoodle', url, cookie),
    saveAsNote: (data: { title: string; content: string; course_id?: string | null }) => ipcRenderer.invoke('fetch:saveAsNote', data),
  },

  rss: {
    getCachedArticles: () => ipcRenderer.invoke('rss:getCachedArticles'),
    refreshAll: () => ipcRenderer.invoke('rss:refreshAll'),
  },

  decks: {
    list: (filters?: Record<string, unknown>) => ipcRenderer.invoke('decks:list', filters),
    get: (id: string) => ipcRenderer.invoke('decks:get', id),
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('decks:create', data),
    update: (id: string, data: Record<string, unknown>) => ipcRenderer.invoke('decks:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('decks:delete', id),
  },

  cards: {
    list: (deckId: string) => ipcRenderer.invoke('cards:list', deckId),
    listDue: (deckId: string) => ipcRenderer.invoke('cards:listDue', deckId),
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('cards:create', data),
    update: (id: string, data: Record<string, unknown>) => ipcRenderer.invoke('cards:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('cards:delete', id),
    countDue: () => ipcRenderer.invoke('cards:countDue'),
  },

  errors: {
    list: (filters?: Record<string, unknown>) => ipcRenderer.invoke('errors:list', filters),
    get: (id: string) => ipcRenderer.invoke('errors:get', id),
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('errors:create', data),
    update: (id: string, data: Record<string, unknown>) => ipcRenderer.invoke('errors:update', id, data),
    markReviewed: (id: string, mastery: number) => ipcRenderer.invoke('errors:markReviewed', id, mastery),
    delete: (id: string) => ipcRenderer.invoke('errors:delete', id),
  },

  pomodoro: {
    list: (limit?: number) => ipcRenderer.invoke('pomodoro:list', limit),
    listToday: () => ipcRenderer.invoke('pomodoro:listToday'),
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('pomodoro:create', data),
    complete: (id: string, duration?: number) => ipcRenderer.invoke('pomodoro:complete', id, duration),
    cancel: (id: string) => ipcRenderer.invoke('pomodoro:cancel', id),
    getStreak: () => ipcRenderer.invoke('pomodoro:getStreak'),
  },

  analytics: {
    weeklyStudy: () => ipcRenderer.invoke('analytics:weeklyStudy'),
    taskStats: () => ipcRenderer.invoke('analytics:taskStats'),
    gpaTrend: () => ipcRenderer.invoke('analytics:gpaTrend'),
    knowledgeGraph: () => ipcRenderer.invoke('analytics:knowledgeGraph'),
  },

  ai: {
    hasKey: () => ipcRenderer.invoke('ai:hasKey') as Promise<boolean>,
    chat: (messages: Array<{ role: string; content: string }>) => ipcRenderer.invoke('ai:chat', messages) as Promise<{ success: boolean; content?: string; error?: string }>,
    ocr: (base64: string, mime?: string) => ipcRenderer.invoke('ai:ocr', base64, mime) as Promise<{ success: boolean; text?: string; error?: string }>,
  },

  conv: {
    list: () => ipcRenderer.invoke('conv:list'),
    get: (id: string) => ipcRenderer.invoke('conv:get', id),
    create: (title: string) => ipcRenderer.invoke('conv:create', title),
    delete: (id: string) => ipcRenderer.invoke('conv:delete', id),
  },

  msg: {
    list: (convId: string) => ipcRenderer.invoke('msg:list', convId),
    create: (convId: string, role: 'user' | 'assistant', content: string) => ipcRenderer.invoke('msg:create', convId, role, content),
  },

  exam: {
    list: () => ipcRenderer.invoke('exam:list'),
    get: (id: string) => ipcRenderer.invoke('exam:get', id),
    getByCourse: (courseId: string) => ipcRenderer.invoke('exam:getByCourse', courseId),
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('exam:create', data),
    update: (id: string, data: Record<string, unknown>) => ipcRenderer.invoke('exam:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('exam:delete', id),
    upcoming: () => ipcRenderer.invoke('exam:upcoming'),
  },
})
