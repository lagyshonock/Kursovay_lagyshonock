import { getDb } from "./db.js"

export async function recordCourseView(courseId) {
  const db = await getDb()
  await db.run("UPDATE courses SET view_count = view_count + 1, updated_at = NOW() WHERE id = ?", courseId)
  await db.run("INSERT INTO course_view_events (course_id) VALUES (?)", courseId)
}

export async function getCourseIdBySlug(slug) {
  const db = await getDb()
  const row = await db.get("SELECT id FROM courses WHERE slug = ?", slug)
  return row?.id ?? null
}
