/**
 * SM-2 间隔重复算法
 * 输入: 卡片当前参数 + 用户评分 (0-3)
 * 输出: 更新后的参数
 *
 * 评分:
 *   0 — 完全忘记 (lapse)
 *   1 — 困难，但回忆起了
 *   2 — 一般
 *   3 — 轻松
 */

export interface Sm2Params {
  ease: number       // 2.5 初始，最小 1.3
  interval: number   // 天数
  repetitions: number
  nextReview: string
  lapses: number
}

export interface Sm2Input {
  ease: number
  interval: number
  repetitions: number
  lapses: number
}

/**
 * Apply SM-2 to compute updated card parameters.
 * Returns new params — caller is responsible for writing to DB.
 */
export function applySm2(card: Sm2Input, rating: 0 | 1 | 2 | 3): Sm2Params {
  let { ease, interval, repetitions, lapses } = card

  if (rating === 0) {
    // Lapse — reset
    repetitions = 0
    interval = 1
    lapses += 1
    ease = Math.max(1.3, ease - 0.2)
  } else {
    // Successful recall
    const q = rating // 1, 2, or 3

    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 1  // or 3 — keeping it simple: 1 day first
    } else {
      interval = Math.round(interval * ease)
    }

    repetitions += 1
    // Ease adjustment
    ease = ease + (0.1 - (3 - q) * (0.08 + (3 - q) * 0.02))
    ease = Math.max(1.3, ease)
  }

  // Cap at 365 days
  interval = Math.min(interval, 365)

  // Compute next review date
  const now = new Date()
  now.setDate(now.getDate() + interval)
  const nextReview = now.toISOString()

  return { ease, interval, repetitions, nextReview, lapses }
}

/** UI helper: format next-review date */
export function formatNextReview(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / 86400000)

  if (diffDays <= 0) return '今天'
  if (diffDays === 1) return '明天'
  if (diffDays <= 7) return `${diffDays} 天后`
  if (diffDays <= 30) return `${Math.round(diffDays / 7)} 周后`
  return `${Math.round(diffDays / 30)} 月后`
}
