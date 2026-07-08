export interface Course {
  id: string
  name: string
  code: string | null
  credits: number
  professor: string | null
  semester: string | null
  category: CourseCategory
  color: string
  description: string | null
  syllabus_url: string | null
  is_active: number
  score: number | null
  sort_order: number
  created_at: string
  updated_at: string
}

export type CourseCategory = 'psychology' | 'ge' | 'fe' | 'language' | 'other'

export const CATEGORY_LABELS: Record<CourseCategory, string> = {
  psychology: '心理学',
  ge: '通识教育 (GE)',
  fe: '自由选修 (FE)',
  language: '语言',
  other: '其他',
}

export const CATEGORY_COLORS: Record<CourseCategory, string> = {
  psychology: '#a78bfa',
  ge: '#22d3ee',
  fe: '#34d399',
  language: '#fbbf24',
  other: '#94a3b8',
}

export interface ScheduleEvent {
  id: string
  course_id: string | null
  title: string
  type: string
  location: string | null
  day_of_week: number
  start_time: string
  end_time: string
  start_date: string
  end_date: string
  weeks: string | null
  repeat_rule: string
  specific_date: string | null
  is_cancelled: number
  color: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export const EVENT_TYPE_LABELS: Record<string, string> = {
  lecture: '讲座',
  tutorial: '辅导',
  lab: '实验',
  exam: '考试',
  other: '其他',
}

export const DAY_LABELS: Record<number, string> = {
  0: '周日', 1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五', 6: '周六',
}

export interface Task {
  id: string
  course_id: string | null
  title: string
  description: string | null
  type: string
  due_date: string | null
  priority: number
  status: TaskStatus
  estimated_minutes: number | null
  actual_minutes: number | null
  weight: number | null
  grade: number | null
  tags: string | null
  created_at: string
  updated_at: string
}

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled'

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: '待办',
  in_progress: '进行中',
  done: '已完成',
  cancelled: '已取消',
}

export const TASK_TYPE_LABELS: Record<string, string> = {
  assignment: '作业',
  exam: '考试',
  quiz: '测验',
  paper: '论文',
  project: '项目',
  reading: '阅读',
  other: '其他',
}

// ── 笔记 ──
export interface Note {
  id: string; course_id: string | null; parent_id: string | null
  title: string; content: string | null; plain_text: string | null
  tags: string | null; is_pinned: number; is_folder: number
  sort_order: number; created_at: string; updated_at: string
}

// ── 资源 ──
export interface Resource {
  id: string; course_id: string | null; title: string; type: string
  stored_path: string | null; original_name: string | null; url: string | null
  mime_type: string | null; file_size: number | null; checksum: string | null
  tags: string | null; notes: string | null; created_at: string; updated_at: string
}

export const RESOURCE_TYPE_LABELS: Record<string, string> = {
  pdf: 'PDF', image: '图片', link: '链接', video: '视频', file: '文件',
}

// ── PDF 标注 ──
export interface PdfAnnotation {
  id: string; resource_id: string; type: AnnotationType
  page_number: number; rect_json: string | null; color: string
  text: string | null; comment: string | null
  created_at: string; updated_at: string
}

export type AnnotationType = 'highlight' | 'underline' | 'note' | 'free_text'

export const ANNOTATION_TYPE_LABELS: Record<AnnotationType, string> = {
  highlight: '高亮',
  underline: '下划线',
  note: '批注',
  free_text: '自由文本',
}

// ── 闪卡 ──
export interface Deck {
  id: string; course_id: string | null; name: string; description: string | null
  color: string; created_at: string; updated_at: string
}

export interface Card {
  id: string; deck_id: string; front: string; back: string
  ease: number; interval: number; repetitions: number
  next_review: string; lapses: number; last_review: string | null
  created_at: string; updated_at: string
}

// ── 错题本 ──
export interface ErrorQuestion {
  id: string; course_id: string | null; question: string; correct_answer: string
  wrong_answer: string | null; reason: string | null; source: string | null
  tags: string | null; mastery: number; review_count: number
  last_reviewed: string | null; created_at: string; updated_at: string
}

export const MASTERY_LABELS: Record<number, string> = {
  0: '未掌握',
  1: '模糊',
  2: '基本掌握',
  3: '已掌握',
}
