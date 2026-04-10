const ADMIN_TOKEN_KEY = "admin_token"

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY)
}

export function setAdminToken(token: string) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token)
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY)
}

async function adminFetch(path: string, init: RequestInit = {}) {
  const token = getAdminToken()
  const headers = new Headers(init.headers)
  headers.set("Content-Type", "application/json")
  if (token) headers.set("Authorization", `Bearer ${token}`)

  const res = await fetch(path, { ...init, headers })
  const isJson = (res.headers.get("content-type") || "").includes("application/json")
  const data = isJson ? await res.json().catch(() => null) : null
  if (!res.ok) {
    const err = (data && typeof data === "object" && "error" in data && typeof data.error === "string" && data.error) || `http_${res.status}`
    throw new Error(err)
  }
  return data
}

export async function adminLogin(password: string) {
  const data = await adminFetch("/api/admin/login", { method: "POST", body: JSON.stringify({ password }) })
  return data as { token: string }
}

export async function adminListCourses() {
  const data = await adminFetch("/api/admin/courses")
  return data as { courses: any[] }
}

export async function adminCreateCourse(input: any) {
  const data = await adminFetch("/api/admin/courses", { method: "POST", body: JSON.stringify(input) })
  return data as { id: number }
}

export async function adminDeleteCourse(id: number) {
  const data = await adminFetch(`/api/admin/courses/${id}`, { method: "DELETE" })
  return data as { ok: true }
}

export type CourseMaterial = { title: string; body: string }

export async function adminPatchCourseMaterials(id: number, materials: CourseMaterial[]) {
  const data = await adminFetch(`/api/admin/courses/${id}/materials`, {
    method: "PATCH",
    body: JSON.stringify({ materials }),
  })
  return data as { materials: CourseMaterial[] }
}

export type AdminCourseFullPayload = {
  slug: string
  title: string
  description: string
  image: string
  duration: string
  students: string
  level: string
  color: string
  about: string
  whatYouLearn: string[]
  format: string[]
  materials: CourseMaterial[]
}

export async function adminUpdateCourse(id: number, body: AdminCourseFullPayload) {
  const data = await adminFetch(`/api/admin/courses/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  })
  return data as { ok: true }
}

export type AdminAnalytics = {
  totals: { id: number; slug: string; title: string; view_count: number; event_count: number }[]
  viewsByDay: { day: string; cnt: number }[]
  topCourses: { slug: string; title: string; view_count: number }[]
}

export async function adminGetAnalytics() {
  const data = await adminFetch("/api/admin/analytics")
  return data as AdminAnalytics
}

/** Загрузка обложки курса (JPEG/PNG/GIF/WebP, до 5 МБ). */
export type AdminDbOverview = {
  file: string
  tables: { name: string; count: number }[]
}

export async function adminGetDbOverview(): Promise<AdminDbOverview> {
  const data = await adminFetch("/api/admin/db/overview")
  return data as AdminDbOverview
}

export type AdminDbTable = {
  name: string
  file: string
  total: number
  limit: number
  offset: number
  rows: Record<string, unknown>[]
}

export async function adminGetDbTable(name: string, opts?: { limit?: number; offset?: number }): Promise<AdminDbTable> {
  const q = new URLSearchParams()
  if (opts?.limit != null) q.set("limit", String(opts.limit))
  if (opts?.offset != null) q.set("offset", String(opts.offset))
  const qs = q.toString()
  const data = await adminFetch(`/api/admin/db/table/${encodeURIComponent(name)}${qs ? `?${qs}` : ""}`)
  return data as AdminDbTable
}

export type AdminEnrollmentRow = {
  id: number
  telegram_user_id: number
  telegram_username: string | null
  telegram_first_name: string | null
  telegram_last_name: string | null
  course_slug: string | null
  source: string | null
  phone: string | null
  note: string | null
  created_at: string
  course_title: string | null
  course_table_id?: number | null
  linked_user_id?: number | null
  linked_login?: string | null
  linked_user_name?: string | null
}

export async function adminListEnrollments(limit = 100): Promise<{ enrollments: AdminEnrollmentRow[] }> {
  const data = await adminFetch(`/api/admin/enrollments?limit=${limit}`)
  return data as { enrollments: AdminEnrollmentRow[] }
}

export async function adminMessageEnrollment(id: number, text: string): Promise<{ ok: true }> {
  const data = await adminFetch(`/api/admin/enrollments/${id}/message`, {
    method: "POST",
    body: JSON.stringify({ text }),
  })
  return data as { ok: true }
}

export type AdminChatThread = {
  telegram_user_id: number
  last_message_id: number
  last_at: string
  last_body: string
  last_direction: "in" | "out"
  user_telegram_username: string | null
  linked_login: string | null
  user_name: string | null
}

export type AdminChatMessage = {
  id: number
  telegram_user_id: number
  enrollment_id: number | null
  direction: "in" | "out"
  body: string
  created_at: string
}

export async function adminListChatThreads(): Promise<{ threads: AdminChatThread[] }> {
  const data = await adminFetch("/api/admin/chat/threads")
  return data as { threads: AdminChatThread[] }
}

export async function adminListChatMessages(telegramUserId: number, afterId = 0): Promise<{ messages: AdminChatMessage[] }> {
  const q = afterId > 0 ? `?after=${afterId}` : ""
  const data = await adminFetch(`/api/admin/chat/thread/${telegramUserId}${q}`)
  return data as { messages: AdminChatMessage[] }
}

export async function adminSendChatMessage(
  telegramUserId: number,
  text: string,
  enrollmentId?: number | null
): Promise<{ ok: true }> {
  const data = await adminFetch("/api/admin/chat/send", {
    method: "POST",
    body: JSON.stringify({
      telegram_user_id: telegramUserId,
      text,
      enrollment_id: enrollmentId ?? null,
    }),
  })
  return data as { ok: true }
}

export async function adminGrantEnrollmentAccess(id: number): Promise<{ id: number }> {
  const data = await adminFetch(`/api/admin/enrollments/${id}/grant-access`, { method: "POST", body: JSON.stringify({}) })
  return data as { id: number }
}

export type AdminUserSearchRow = {
  id: number
  name: string
  email: string | null
  account_login: string | null
  telegram_username: string | null
  telegram_id: number | null
}

export async function adminSearchUsers(q: string): Promise<{ users: AdminUserSearchRow[] }> {
  const data = await adminFetch(`/api/admin/users/search?q=${encodeURIComponent(q.trim())}`)
  return data as { users: AdminUserSearchRow[] }
}

export type AdminCourseAccessGrant = {
  id: number
  user_id: number
  course_id: number
  note: string | null
  created_at: string
  user_name: string
  user_email: string | null
  account_login: string | null
  telegram_username: string | null
  course_slug: string
  course_title: string
}

export async function adminListCourseAccess(): Promise<{ grants: AdminCourseAccessGrant[] }> {
  const data = await adminFetch("/api/admin/course-access")
  return data as { grants: AdminCourseAccessGrant[] }
}

export async function adminCreateCourseAccess(userId: number, courseId: number, note?: string): Promise<{ id: number }> {
  const data = await adminFetch("/api/admin/course-access", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, course_id: courseId, note }),
  })
  return data as { id: number }
}

export async function adminDeleteCourseAccess(grantId: number): Promise<{ ok: true }> {
  const data = await adminFetch(`/api/admin/course-access/${grantId}`, { method: "DELETE" })
  return data as { ok: true }
}

export async function adminUploadCourseImage(file: File): Promise<{ url: string }> {
  const token = getAdminToken()
  const fd = new FormData()
  fd.append("image", file)
  const headers = new Headers()
  if (token) headers.set("Authorization", `Bearer ${token}`)

  const res = await fetch("/api/admin/upload/course-image", { method: "POST", body: fd, headers })
  const isJson = (res.headers.get("content-type") || "").includes("application/json")
  const data = isJson ? await res.json().catch(() => null) : null
  if (!res.ok) {
    const err =
      (data && typeof data === "object" && "error" in data && typeof data.error === "string" && data.error) ||
      `http_${res.status}`
    throw new Error(err)
  }
  return data as { url: string }
}

