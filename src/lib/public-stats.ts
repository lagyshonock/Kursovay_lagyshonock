export type PublicStats = {
  courses: number
  enrollments: number
  studentsOnPlatform: number
  totalViews: number
  mentorTeams: number
  directions: number
  employmentRatePercent: number
  supportHours: string
}

export async function fetchPublicStats(): Promise<PublicStats | null> {
  try {
    const res = await fetch("/api/stats")
    if (!res.ok) return null
    return (await res.json()) as PublicStats
  } catch {
    return null
  }
}
