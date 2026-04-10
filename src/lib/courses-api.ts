export type Course = {
  id: number
  slug: string
  title: string
  description: string
  image: string
  duration: string
  students: string
  level: string
  color: string
  view_count?: number
  details: {
    about: string
    whatYouLearn: string[]
    format: string[]
  }
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`http_${res.status}`)
  return (await res.json()) as T
}

export async function fetchCourses() {
  const data = await apiGet<{ courses: Course[] }>("/api/courses")
  return data.courses
}

export async function fetchCourse(slug: string) {
  const data = await apiGet<{ course: Course }>(`/api/courses/${slug}`)
  return data.course
}

export async function fetchFeatured() {
  return apiGet<{ featured: Course | null; others: Course[] }>("/api/courses/featured")
}

export async function postCourseView(slug: string) {
  await fetch(`/api/courses/${encodeURIComponent(slug)}/view`, { method: "POST" })
}

