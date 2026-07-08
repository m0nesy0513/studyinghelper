import { create } from 'zustand'
import type { Task } from '@/types'

interface TaskState {
  tasks: Task[]
  loading: boolean
  error: string | null
  load: (filters?: Record<string, unknown>) => Promise<void>
  add: (data: Record<string, unknown>) => Promise<Task | null>
  update: (id: string, data: Record<string, unknown>) => Promise<void>
  remove: (id: string) => Promise<void>
  moveTask: (id: string, newStatus: string) => Promise<void>
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  load: async (filters) => {
    set({ loading: true, error: null })
    try {
      const tasks = await window.api.tasks.list(filters)
      set({ tasks: tasks as Task[], loading: false })
    } catch (e) {
      set({ error: String(e), loading: false })
    }
  },

  add: async (data) => {
    try {
      const task = await window.api.tasks.create(data)
      await get().load()
      return task as Task
    } catch (e) {
      set({ error: String(e) })
      return null
    }
  },

  update: async (id, data) => {
    try {
      await window.api.tasks.update(id, data)
      await get().load()
    } catch (e) {
      set({ error: String(e) })
    }
  },

  remove: async (id) => {
    try {
      await window.api.tasks.delete(id)
      set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
    } catch (e) {
      set({ error: String(e) })
    }
  },

  moveTask: async (id, newStatus) => {
    try {
      await window.api.tasks.update(id, { status: newStatus })
      await get().load()
    } catch (e) {
      set({ error: String(e) })
    }
  },
}))
