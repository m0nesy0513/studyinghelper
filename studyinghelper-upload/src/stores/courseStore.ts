import { create } from 'zustand'
import type { Course, CourseCategory } from '@/types'

interface CourseState {
  courses: Course[]
  loading: boolean
  error: string | null
  load: (category?: CourseCategory) => Promise<void>
  add: (data: Record<string, unknown>) => Promise<Course | null>
  update: (id: string, data: Record<string, unknown>) => Promise<void>
  remove: (id: string) => Promise<void>
  refresh: () => Promise<void>
  lastCategory: CourseCategory | undefined
}

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  loading: false,
  error: null,
  lastCategory: undefined,

  load: async (category) => {
    set({ loading: true, error: null, lastCategory: category })
    try {
      const courses = await window.api.courses.list(category ? { category } : undefined)
      set({ courses: courses as Course[], loading: false })
    } catch (e) {
      set({ error: String(e), loading: false })
    }
  },

  add: async (data) => {
    try {
      const course = await window.api.courses.create(data)
      await get().refresh()
      return course as Course
    } catch (e) {
      set({ error: String(e) })
      return null
    }
  },

  update: async (id, data) => {
    try {
      await window.api.courses.update(id, data)
      await get().refresh()
    } catch (e) {
      set({ error: String(e) })
    }
  },

  remove: async (id) => {
    try {
      await window.api.courses.delete(id)
      set((s) => ({ courses: s.courses.filter((c) => c.id !== id) }))
    } catch (e) {
      set({ error: String(e) })
    }
  },

  refresh: async () => {
    const { lastCategory } = get()
    await get().load(lastCategory)
  },
}))
