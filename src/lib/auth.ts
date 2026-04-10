/** Краткие данные курса в ответе /api/me (записи) */
export type MeCourseSummary = {
  id: number
  slug: string
  title: string
  description: string
  image: string
  duration: string
  level: string
  color: string
}

export type MeEnrollment = {
  id: number
  course_slug: string
  source: string | null
  phone: string | null
  note: string | null
  created_at: string
  course: MeCourseSummary | null
}

export type MeLibraryItem = {
  grant_id: number
  granted_at: string
  note: string | null
  course: MeCourseSummary
}

export type AuthUser = {
  id: number
  name: string
  email: string | null
  /** Ник для входа (как в Telegram или сгенерированный); при регистрации только по e-mail может быть null */
  account_login?: string | null
  telegram_id?: number | null
  telegram_username?: string | null
  /** Приходит с GET /api/me */
  has_password?: boolean
  /** Заявки с бота, сопоставленные по Telegram ID аккаунта */
  enrollments?: MeEnrollment[]
  /** Доступ к материалам курсов (выдаётся в админке) */
  library?: MeLibraryItem[]
}

const TOKEN_KEY = "auth_token"

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

type ApiError = {
  error: string
}

async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getToken()
  const headers = new Headers(init.headers)
  headers.set("Content-Type", "application/json")
  if (token) headers.set("Authorization", `Bearer ${token}`)

  const res = await fetch(path, { ...init, headers })
  const isJson = (res.headers.get("content-type") || "").includes("application/json")
  const data = isJson ? await res.json().catch(() => null) : null

  if (!res.ok) {
    const err = (data as ApiError | null)?.error || `http_${res.status}`
    throw new Error(err)
  }

  return data
}

export async function loginWithTelegram(user: Record<string, unknown>) {
  const data = await apiFetch("/api/auth/telegram", {
    method: "POST",
    body: JSON.stringify(user),
  })
  return data as { token: string; user: AuthUser }
}

export async function fetchMe() {
  const data = await apiFetch("/api/me")
  return data as {
    user: AuthUser & {
      created_at: string
      telegram_first_name?: string
      enrollments: MeEnrollment[]
      library?: MeLibraryItem[]
    }
  }
}

export type StudyMaterial = { title: string; body: string }

export async function fetchCourseStudy(slug: string) {
  const data = await apiFetch(`/api/study/${encodeURIComponent(slug)}`)
  return data as {
    course: { id: number; slug: string; title: string }
    materials: StudyMaterial[]
  }
}

/** Логин — ник (после бота / Telegram) или e-mail (классическая регистрация) */
export async function loginWithPassword(login: string, password: string) {
  const data = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ login: login.trim(), password }),
  })
  return data as { token: string; user: AuthUser }
}

export async function changePassword(currentPassword: string, newPassword: string) {
  await apiFetch("/api/me/password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}

export async function updateAccountLogin(account_login: string) {
  const data = await apiFetch("/api/me", {
    method: "PATCH",
    body: JSON.stringify({ account_login }),
  })
  return data as { user: AuthUser & { created_at: string; has_password?: boolean; enrollments: MeEnrollment[] } }
}
