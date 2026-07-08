export interface NoteTemplate {
  id: string
  name: string
  icon: string
  content: string
}

export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: 'cornell',
    name: '康奈尔笔记',
    icon: '📝',
    content: `# 课题\n\n## 笔记区\n\n\n## 关键词 / 问题列\n\n\n## 总结\n\n`,
  },
  {
    id: 'lecture',
    name: '课堂笔记',
    icon: '🎓',
    content: `# 课程：\n日期：\n教授：\n\n## 要点\n\n\n## 疑问\n\n\n## 课后待办\n\n`,
  },
  {
    id: 'reading',
    name: '文献阅读',
    icon: '📖',
    content: `# 文献信息\n\n- 标题：\n- 作者：\n- 年份：\n- DOI：\n\n## 核心论点\n\n\n## 方法与数据\n\n\n## 批判与思考\n\n\n## 引用摘录\n\n`,
  },
  {
    id: 'experiment',
    name: '心理学实验',
    icon: '🧪',
    content: `# 实验名称\n\n## 假设\n\n\n## 自变量 / 因变量\n\n\n## 被试\n\n\n## 方法\n\n\n## 结果\n\n\n## 局限性\n\n`,
  },
  {
    id: 'blank',
    name: '空白笔记',
    icon: '📄',
    content: '',
  },
]
