import type { Course } from '@/types'

/**
 * UM grade point mapping (standard 4.0 scale)
 */
const GRADE_POINTS: Record<string, number> = {
  'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0,
  'F': 0.0,
}

export function scoreToLetter(score: number): string {
  if (score >= 93) return 'A'
  if (score >= 88) return 'A-'
  if (score >= 83) return 'B+'
  if (score >= 78) return 'B'
  if (score >= 73) return 'B-'
  if (score >= 68) return 'C+'
  if (score >= 63) return 'C'
  if (score >= 58) return 'C-'
  if (score >= 53) return 'D+'
  if (score >= 50) return 'D'
  return 'F'
}

export function letterToGPA(letter: string): number {
  return GRADE_POINTS[letter] ?? 0
}

export function scoreToGPA(score: number): number {
  return letterToGPA(scoreToLetter(score))
}

/**
 * Calculate current GPA from courses that have scores
 */
export function calculateGPA(courses: Course[]): { gpa: number; totalCredits: number } {
  const scored = courses.filter(c => c.score != null && c.score > 0)
  if (scored.length === 0) return { gpa: 0, totalCredits: 0 }

  let totalPoints = 0
  let totalCredits = 0

  for (const c of scored) {
    const gpa = scoreToGPA(c.score!)
    totalPoints += gpa * c.credits
    totalCredits += c.credits
  }

  return {
    gpa: totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : 0,
    totalCredits,
  }
}

/**
 * Predict final GPA if a specific course gets a certain score
 */
export function predictGPA(courses: Course[], targetCourseId: string, predictedScore: number): {
  currentGPA: number
  predictedGPA: number
  totalCredits: number
} {
  const { gpa: currentGPA, totalCredits } = calculateGPA(courses)

  const updated = courses.map(c =>
    c.id === targetCourseId ? { ...c, score: predictedScore } : c,
  )
  const { gpa: predictedGPA } = calculateGPA(updated)

  return { currentGPA, predictedGPA, totalCredits }
}

/**
 * Reverse calculate: what score is needed on a course to reach target GPA
 */
export function requiredScore(courses: Course[], targetCourseId: string, targetGPA: number): number | null {
  const otherCourses = courses.filter(c => c.id !== targetCourseId && c.score != null && c.score > 0)
  const target = courses.find(c => c.id === targetCourseId)
  if (!target) return null

  let otherPoints = 0
  let otherCredits = 0

  for (const c of otherCourses) {
    otherPoints += scoreToGPA(c.score!) * c.credits
    otherCredits += c.credits
  }

  const totalCredits = otherCredits + target.credits
  const neededPoints = targetGPA * totalCredits - otherPoints
  const neededGPA = neededPoints / target.credits

  if (neededGPA > 4.0) return null // impossible
  if (neededGPA < 0) return 0      // already above target

  // Convert GPA back to approximate score
  for (let score = 50; score <= 100; score++) {
    if (scoreToGPA(score) >= neededGPA) return score
  }
  return 100
}
