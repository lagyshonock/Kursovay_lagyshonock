import { useEffect, useMemo, useState } from "react"
import { fetchCourse, fetchCourses, type Course } from "@/lib/courses-api"

export function useCourses() {
  const [courses, setCourses] = useState<Course[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    fetchCourses()
      .then((c) => {
        if (!alive) return
        setCourses(c)
      })
      .catch((e) => {
        if (!alive) return
        setError(e instanceof Error ? e.message : "unknown_error")
      })
      .finally(() => {
        if (!alive) return
        setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  return useMemo(() => ({ courses, loading, error }), [courses, loading, error])
}

export function useCourse(slug: string | undefined) {
  const [course, setCourse] = useState<Course | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) {
      setCourse(null)
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    setError(null)
    fetchCourse(slug)
      .then((c) => {
        if (!alive) return
        setCourse(c)
      })
      .catch((e) => {
        if (!alive) return
        setError(e instanceof Error ? e.message : "unknown_error")
      })
      .finally(() => {
        if (!alive) return
        setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [slug])

  return useMemo(() => ({ course, loading, error }), [course, loading, error])
}

