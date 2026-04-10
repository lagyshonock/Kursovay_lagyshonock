import "dotenv/config"
import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import path from "node:path"
import crypto from "node:crypto"
import { fileURLToPath } from "node:url"
import multer from "multer"
import { z } from "zod"
import { getDb, getDatabaseDisplayHint } from "./db.js"
import { getCourseIdBySlug, recordCourseView } from "./analytics.js"
import { hashPassword, requireAdmin, requireAuth, signAdminToken, signToken, verifyPassword } from "./auth.js"
import { verifyTelegramAuth } from "./telegram-verify.js"
import { uploadsRoot, coursesUploadDir, ensureCoursesUploadDir } from "./course-image-storage.js"
import { allocateAccountLogin, isValidPublicLogin, loginTakenByOther } from "./student-account.js"
import { sendTelegramDm } from "./telegram-outreach.js"
import { insertChatMessage, listChatMessages, listChatThreads } from "./student-chat.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

ensureCoursesUploadDir()

/** Отправка текста студенту в Telegram и запись в историю чата (админка ↔ бот). */
async function deliverAdminChatToTelegram(db, telegramUserId, text, enrollmentId = null) {
  const result = await sendTelegramDm(telegramUserId, text)
  if (!result.ok) return result
  await insertChatMessage(db, {
    telegram_user_id: telegramUserId,
    enrollment_id: enrollmentId,
    direction: "out",
    body: text,
  })
  return { ok: true }
}

const ALLOWED_IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"])

function extForMime(mime) {
  if (mime === "image/jpeg") return ".jpg"
  if (mime === "image/png") return ".png"
  if (mime === "image/gif") return ".gif"
  if (mime === "image/webp") return ".webp"
  return ""
}

const courseImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, coursesUploadDir),
  filename: (_req, file, cb) => {
    const ext = extForMime(file.mimetype) || path.extname(file.originalname || "").slice(0, 8) || ".bin"
    cb(null, `${crypto.randomUUID()}${ext}`)
  },
})

const courseImageUpload = multer({
  storage: courseImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_MIME.has(file.mimetype)) cb(null, true)
    else cb(null, false)
  },
})

const app = express()

const port = Number(process.env.PORT || 3001)
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173"
const botToken = process.env.TELEGRAM_BOT_TOKEN || ""

app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  })
)
app.use(express.json({ limit: "1mb" }))
app.use(cookieParser())

app.use("/uploads", express.static(uploadsRoot))

app.get("/api/health", (_req, res) => res.json({ ok: true }))

/** Публичная «витринная» статистика для лендинга */
app.get("/api/stats", async (_req, res) => {
  const db = await getDb()
  const courses = Number((await db.get("SELECT COUNT(*)::bigint AS n FROM courses"))?.n) || 0
  const enrollments = Number((await db.get("SELECT COUNT(*)::bigint AS n FROM course_enrollments"))?.n) || 0
  const users = Number((await db.get("SELECT COUNT(*)::bigint AS n FROM users"))?.n) || 0
  const totalViews = Number((await db.get("SELECT COUNT(*)::bigint AS n FROM course_view_events"))?.n) || 0
  return res.json({
    courses,
    enrollments,
    studentsOnPlatform: users,
    totalViews,
    mentorTeams: 14,
    directions: 6,
    employmentRatePercent: 87,
    supportHours: "9:00–21:00 МСК",
  })
})

app.post("/api/admin/login", async (req, res) => {
  const schema = z.object({
    password: z.string().min(1),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" })

  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return res.status(500).json({ error: "admin_not_configured" })

  if (parsed.data.password !== adminPassword) return res.status(401).json({ error: "invalid_credentials" })

  const token = signAdminToken()
  return res.json({ token })
})

function mapCourseRow(r) {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    image: r.image,
    duration: r.duration,
    students: r.students,
    level: r.level,
    color: r.color,
    view_count: r.view_count ?? 0,
    details: {
      about: r.about,
      whatYouLearn: JSON.parse(r.what_you_learn_json || "[]"),
      format: JSON.parse(r.format_json || "[]"),
    },
  }
}

function parseMaterialsJson(raw) {
  try {
    const a = JSON.parse(raw || "[]")
    if (!Array.isArray(a)) return []
    return a
      .filter((x) => x && typeof x === "object")
      .map((x) => ({
        title: String(x.title || "").trim().slice(0, 300),
        body: String(x.body || ""),
      }))
      .filter((x) => x.title.length >= 1)
  } catch {
    return []
  }
}

const courseMaterialSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().max(100000),
})

async function userHasCourseAccess(db, userId, courseId) {
  const r = await db.get(`SELECT 1 AS ok FROM course_access WHERE user_id = ? AND course_id = ?`, userId, courseId)
  return Boolean(r)
}

/** Пользователь для GET/PATCH /api/me: профиль + записи на курсы (по telegram_user_id заявок) */
async function buildMeUser(db, userId) {
  const row = await db.get(
    `SELECT id, name, email, account_login, telegram_id, telegram_username, telegram_first_name, created_at,
            CASE WHEN password_hash IS NOT NULL AND length(password_hash) > 0 THEN 1 ELSE 0 END AS has_password
     FROM users WHERE id = ?`,
    userId
  )
  if (!row) return null
  const { has_password, ...rest } = row
  let enrollments = []
  if (row.telegram_id != null) {
    const enRows = await db.all(
      `SELECT ce.id, ce.course_slug, ce.source, ce.phone, ce.note, ce.created_at,
              c.id AS cid, c.slug AS course_table_slug, c.title, c.description, c.image, c.duration, c.level, c.color
       FROM course_enrollments ce
       LEFT JOIN courses c ON c.slug = ce.course_slug
       WHERE ce.telegram_user_id = ?
       ORDER BY ce.created_at DESC`,
      row.telegram_id
    )
    enrollments = enRows.map((r) => ({
      id: r.id,
      course_slug: r.course_slug,
      source: r.source,
      phone: r.phone,
      note: r.note,
      created_at: r.created_at,
      course: r.cid
        ? {
            id: r.cid,
            slug: r.course_table_slug || r.course_slug,
            title: r.title,
            description: r.description,
            image: r.image,
            duration: r.duration,
            level: r.level,
            color: r.color,
          }
        : null,
    }))
  }

  const accessRows = await db.all(
    `SELECT ca.id AS grant_id, ca.created_at AS granted_at, ca.note,
            c.id AS cid, c.slug, c.title, c.description, c.image, c.duration, c.level, c.color
     FROM course_access ca
     JOIN courses c ON c.id = ca.course_id
     WHERE ca.user_id = ?
     ORDER BY ca.created_at DESC`,
    userId
  )
  const library = accessRows.map((r) => ({
    grant_id: r.grant_id,
    granted_at: r.granted_at,
    note: r.note,
    course: {
      id: r.cid,
      slug: r.slug,
      title: r.title,
      description: r.description,
      image: r.image,
      duration: r.duration,
      level: r.level,
      color: r.color,
    },
  }))

  return {
    ...rest,
    has_password: Boolean(has_password),
    enrollments,
    library,
  }
}

app.get("/api/courses", async (_req, res) => {
  const db = await getDb()
  const rows = await db.all(
    "SELECT id, slug, title, description, image, duration, students, level, color, about, what_you_learn_json, format_json, view_count FROM courses ORDER BY view_count DESC, id ASC"
  )
  const courses = rows.map(mapCourseRow)
  return res.json({ courses })
})

app.get("/api/courses/featured", async (_req, res) => {
  const db = await getDb()
  const r = await db.get(
    "SELECT id, slug, title, description, image, duration, students, level, color, about, what_you_learn_json, format_json, view_count FROM courses ORDER BY view_count DESC, id ASC LIMIT 1"
  )
  if (!r) return res.json({ featured: null, others: [] })
  const others = await db.all(
    "SELECT id, slug, title, description, image, duration, students, level, color, about, what_you_learn_json, format_json, view_count FROM courses WHERE id != ? ORDER BY view_count DESC, id ASC LIMIT 20",
    r.id
  )
  return res.json({ featured: mapCourseRow(r), others: others.map(mapCourseRow) })
})

app.post("/api/courses/:slug/view", async (req, res) => {
  const id = await getCourseIdBySlug(req.params.slug)
  if (!id) return res.status(404).json({ error: "not_found" })
  await recordCourseView(id)
  return res.json({ ok: true })
})

app.get("/api/courses/:slug", async (req, res) => {
  const db = await getDb()
  const r = await db.get(
    "SELECT id, slug, title, description, image, duration, students, level, color, about, what_you_learn_json, format_json, view_count FROM courses WHERE slug = ?",
    req.params.slug
  )
  if (!r) return res.status(404).json({ error: "not_found" })

  const course = mapCourseRow(r)
  return res.json({ course })
})

/** Материалы курса: только при записи в course_access и JWT пользователя. */
app.get("/api/study/:slug", requireAuth, async (req, res) => {
  const db = await getDb()
  const slug = String(req.params.slug || "")
  const r = await db.get(`SELECT id, slug, title, materials_json FROM courses WHERE slug = ?`, slug)
  if (!r) return res.status(404).json({ error: "not_found" })
  const allowed = await userHasCourseAccess(db, req.user.sub, r.id)
  if (!allowed) return res.status(403).json({ error: "no_access" })
  const materials = parseMaterialsJson(r.materials_json)
  return res.json({
    course: { id: r.id, slug: r.slug, title: r.title },
    materials,
  })
})

app.get("/api/admin/analytics", requireAdmin, async (_req, res) => {
  const db = await getDb()
  const totals = await db.all(`
    SELECT c.id, c.slug, c.title, c.view_count,
      (SELECT COUNT(*) FROM course_view_events e WHERE e.course_id = c.id) AS event_count
    FROM courses c
    ORDER BY c.view_count DESC
  `)
  const last7 = await db.all(`
    SELECT (created_at::date)::text AS day, COUNT(*)::bigint AS cnt
    FROM course_view_events
    WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY created_at::date
    ORDER BY day ASC
  `)
  const top = await db.all(`
    SELECT c.slug, c.title, c.view_count
    FROM courses c
    ORDER BY c.view_count DESC
    LIMIT 10
  `)
  return res.json({
    totals: totals.map((t) => ({
      ...t,
      view_count: Number(t.view_count) || 0,
      event_count: Number(t.event_count) || 0,
    })),
    viewsByDay: last7.map((r) => ({ day: r.day, cnt: Number(r.cnt) || 0 })),
    topCourses: top.map((t) => ({ ...t, view_count: Number(t.view_count) || 0 })),
  })
})

app.get("/api/admin/courses", requireAdmin, async (_req, res) => {
  const db = await getDb()
  const rows = await db.all(
    "SELECT id, slug, title, description, image, duration, students, level, color, about, what_you_learn_json, format_json, materials_json, view_count, created_at, updated_at FROM courses ORDER BY id DESC"
  )
  return res.json({ courses: rows })
})

const adminCourseFullSchema = z.object({
  slug: z.string().trim().min(2).max(64).regex(/^[a-z0-9-]+$/),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(500),
  image: z.string().trim().min(1).max(500),
  duration: z.string().trim().min(2).max(40),
  students: z.string().trim().min(1).max(40),
  level: z.string().trim().min(1).max(40),
  color: z.string().trim().min(1).max(20),
  about: z.string().trim().min(10).max(1000),
  whatYouLearn: z.array(z.string().trim().min(2)).min(1).max(30),
  format: z.array(z.string().trim().min(2)).min(1).max(30),
  materials: z.array(courseMaterialSchema).max(200),
})

/** Полное редактирование курса (витрина + программа + материалы). */
app.put("/api/admin/courses/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) return res.status(400).json({ error: "invalid_input" })

  const parsed = adminCourseFullSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" })

  const db = await getDb()
  const existing = await db.get(`SELECT id, slug FROM courses WHERE id = ?`, id)
  if (!existing) return res.status(404).json({ error: "not_found" })

  const taken = await db.get(`SELECT id FROM courses WHERE slug = ? AND id != ?`, parsed.data.slug, id)
  if (taken) return res.status(409).json({ error: "slug_taken" })

  if (existing.slug !== parsed.data.slug) {
    await db.run(`UPDATE course_enrollments SET course_slug = ? WHERE course_slug = ?`, parsed.data.slug, existing.slug)
  }

  const c = parsed.data
  await db.run(
    `UPDATE courses SET
       slug = ?, title = ?, description = ?, image = ?, duration = ?, students = ?, level = ?, color = ?,
       about = ?, what_you_learn_json = ?, format_json = ?, materials_json = ?, updated_at = NOW()
     WHERE id = ?`,
    c.slug,
    c.title,
    c.description,
    c.image,
    c.duration,
    c.students,
    c.level,
    c.color,
    c.about,
    JSON.stringify(c.whatYouLearn),
    JSON.stringify(c.format),
    JSON.stringify(c.materials),
    id
  )
  return res.json({ ok: true })
})

/** Только уроки (быстрое сохранение из свёрнутого блока). */
app.patch("/api/admin/courses/:id/materials", requireAdmin, async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) return res.status(400).json({ error: "invalid_input" })

  const schema = z.object({
    materials: z.array(courseMaterialSchema).max(200),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" })

  const db = await getDb()
  const result = await db.run(
    `UPDATE courses SET materials_json = ?, updated_at = NOW() WHERE id = ?`,
    JSON.stringify(parsed.data.materials),
    id
  )
  if (result.changes === 0) return res.status(404).json({ error: "not_found" })
  return res.json({ materials: parsed.data.materials })
})

app.post("/api/admin/courses", requireAdmin, async (req, res) => {
  const schema = z.object({
    slug: z.string().trim().min(2).max(64).regex(/^[a-z0-9-]+$/),
    title: z.string().trim().min(2).max(120),
    description: z.string().trim().min(10).max(500),
    image: z.string().trim().min(1).max(500),
    duration: z.string().trim().min(2).max(40),
    students: z.string().trim().min(1).max(40),
    level: z.string().trim().min(1).max(40),
    color: z.string().trim().min(1).max(20),
    about: z.string().trim().min(10).max(1000),
    whatYouLearn: z.array(z.string().trim().min(2)).min(1).max(30),
    format: z.array(z.string().trim().min(2)).min(1).max(30),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" })

  const db = await getDb()
  try {
    const c = parsed.data
    const result = await db.run(
      `INSERT INTO courses
        (slug, title, description, image, duration, students, level, color, about, what_you_learn_json, format_json, updated_at)
       VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
       RETURNING id`,
      c.slug,
      c.title,
      c.description,
      c.image,
      c.duration,
      c.students,
      c.level,
      c.color,
      c.about,
      JSON.stringify(c.whatYouLearn),
      JSON.stringify(c.format)
    )
    return res.status(201).json({ id: result.lastID })
  } catch (e) {
    if (e?.code === "23505") return res.status(409).json({ error: "slug_taken" })
    const msg = String(e?.message || "")
    if (msg.includes("UNIQUE") || msg.includes("unique")) return res.status(409).json({ error: "slug_taken" })
    throw e
  }
})

app.post("/api/admin/upload/course-image", requireAdmin, (req, res) => {
  courseImageUpload.single("image")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ error: "file_too_large" })
      return res.status(400).json({ error: "upload_error" })
    }
    if (err) return res.status(500).json({ error: "upload_error" })
    if (!req.file) return res.status(400).json({ error: "invalid_file" })
    const url = `/uploads/courses/${req.file.filename}`
    return res.json({ url })
  })
})

app.delete("/api/admin/courses/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) return res.status(400).json({ error: "invalid_input" })
  const db = await getDb()
  const result = await db.run("DELETE FROM courses WHERE id = ?", id)
  if (result.changes === 0) return res.status(404).json({ error: "not_found" })
  return res.json({ ok: true })
})

/** Поиск пользователей платформы для выдачи доступа. */
app.get("/api/admin/users/search", requireAdmin, async (req, res) => {
  const raw = String(req.query.q || "")
    .trim()
    .slice(0, 80)
    .replace(/[%_\\]/g, "")
  if (raw.length < 2) return res.json({ users: [] })
  const needle = `%${raw.toLowerCase()}%`
  const db = await getDb()
  const users = await db.all(
    `SELECT id, name, email, account_login, telegram_username, telegram_id
     FROM users
     WHERE lower(name) LIKE ?
        OR lower(COALESCE(email, '')) LIKE ?
        OR lower(COALESCE(account_login, '')) LIKE ?
        OR lower(COALESCE(telegram_username, '')) LIKE ?
     ORDER BY id DESC
     LIMIT 40`,
    needle,
    needle,
    needle,
    needle
  )
  return res.json({ users })
})

/** Выданный доступ к материалам курсов. */
app.get("/api/admin/course-access", requireAdmin, async (_req, res) => {
  const db = await getDb()
  const rows = await db.all(
    `SELECT ca.id, ca.user_id, ca.course_id, ca.note, ca.created_at,
            u.name AS user_name, u.email AS user_email, u.account_login, u.telegram_username,
            c.slug AS course_slug, c.title AS course_title
     FROM course_access ca
     JOIN users u ON u.id = ca.user_id
     JOIN courses c ON c.id = ca.course_id
     ORDER BY ca.created_at DESC
     LIMIT 500`
  )
  return res.json({ grants: rows })
})

app.post("/api/admin/course-access", requireAdmin, async (req, res) => {
  const schema = z.object({
    user_id: z.coerce.number().int().positive(),
    course_id: z.coerce.number().int().positive(),
    note: z.string().max(500).optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" })

  const db = await getDb()
  const u = await db.get("SELECT id FROM users WHERE id = ?", parsed.data.user_id)
  if (!u) return res.status(400).json({ error: "user_not_found" })
  const c = await db.get("SELECT id FROM courses WHERE id = ?", parsed.data.course_id)
  if (!c) return res.status(400).json({ error: "course_not_found" })

  try {
    const result = await db.run(
      `INSERT INTO course_access (user_id, course_id, note) VALUES (?, ?, ?) RETURNING id`,
      parsed.data.user_id,
      parsed.data.course_id,
      parsed.data.note?.trim() || null
    )
    return res.status(201).json({ id: result.lastID })
  } catch (e) {
    if (e?.code === "23505") return res.status(409).json({ error: "already_granted" })
    const msg = String(e?.message || "")
    if (msg.includes("UNIQUE") || msg.includes("unique")) return res.status(409).json({ error: "already_granted" })
    throw e
  }
})

app.delete("/api/admin/course-access/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) return res.status(400).json({ error: "invalid_input" })
  const db = await getDb()
  const result = await db.run("DELETE FROM course_access WHERE id = ?", id)
  if (result.changes === 0) return res.status(404).json({ error: "not_found" })
  return res.json({ ok: true })
})

/** Заявки на курсы (для связи со студентами в Telegram). */
app.get("/api/admin/enrollments", requireAdmin, async (req, res) => {
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 100))
  const db = await getDb()
  const enrollments = await db.all(
    `SELECT e.id, e.telegram_user_id, e.telegram_username, e.telegram_first_name, e.telegram_last_name,
            e.course_slug, e.source, e.phone, e.note, e.created_at,
            c.title AS course_title, c.id AS course_table_id,
            u.id AS linked_user_id, u.account_login AS linked_login, u.name AS linked_user_name
     FROM course_enrollments e
     LEFT JOIN courses c ON c.slug = e.course_slug
     LEFT JOIN users u ON u.telegram_id = e.telegram_user_id
     ORDER BY e.created_at DESC
     LIMIT ?`,
    limit
  )
  return res.json({ enrollments })
})

/** Выдать доступ по заявке: пользователь с тем же Telegram ID, курс по slug из заявки. */
app.post("/api/admin/enrollments/:id/grant-access", requireAdmin, async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) return res.status(400).json({ error: "invalid_input" })
  const db = await getDb()
  const row = await db.get(
    `SELECT e.telegram_user_id, e.course_slug FROM course_enrollments e WHERE e.id = ?`,
    id
  )
  if (!row?.course_slug) return res.status(404).json({ error: "not_found" })
  const user = await db.get(`SELECT id FROM users WHERE telegram_id = ?`, row.telegram_user_id)
  if (!user) return res.status(400).json({ error: "no_linked_user" })
  const course = await db.get(`SELECT id FROM courses WHERE slug = ?`, row.course_slug)
  if (!course) return res.status(400).json({ error: "course_not_found" })
  try {
    const result = await db.run(
      `INSERT INTO course_access (user_id, course_id, note) VALUES (?, ?, ?) RETURNING id`,
      user.id,
      course.id,
      `заявка #${id}`
    )
    return res.status(201).json({ id: result.lastID })
  } catch (e) {
    if (e?.code === "23505") return res.status(409).json({ error: "already_granted" })
    const msg = String(e?.message || "")
    if (msg.includes("UNIQUE") || msg.includes("unique")) return res.status(409).json({ error: "already_granted" })
    throw e
  }
})

app.post("/api/admin/enrollments/:id/message", requireAdmin, async (req, res) => {
  try {
    const schema = z.object({ text: z.string().trim().min(1).max(3900) })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: "invalid_input" })

    const id = Number(req.params.id)
    if (!Number.isFinite(id)) return res.status(400).json({ error: "invalid_input" })

    const db = await getDb()
    const row = await db.get("SELECT id, telegram_user_id FROM course_enrollments WHERE id = ?", id)
    if (!row) return res.status(404).json({ error: "not_found" })
    if (row.telegram_user_id == null) return res.status(400).json({ error: "no_telegram_id" })

    const result = await deliverAdminChatToTelegram(db, row.telegram_user_id, parsed.data.text, id)
    if (!result.ok) {
      if (result.error === "no_token") return res.status(500).json({ error: "telegram_not_configured" })
      if (result.error === "blocked") return res.status(409).json({ error: "telegram_blocked" })
      if (result.error === "chat_not_found") return res.status(409).json({ error: "telegram_chat_not_found" })
      if (result.error === "timeout") return res.status(504).json({ error: "telegram_timeout" })
      return res.status(502).json({ error: "telegram_send_failed", detail: result.description })
    }
    return res.json({ ok: true })
  } catch (e) {
    console.error("[api] POST /api/admin/enrollments/:id/message", e)
    if (!res.headersSent) return res.status(500).json({ error: "server_error" })
  }
})

/** Треды чата (студент = telegram_user_id). */
app.get("/api/admin/chat/threads", requireAdmin, async (_req, res) => {
  const db = await getDb()
  const threads = await listChatThreads(db)
  return res.json({ threads })
})

/** История сообщений с одним студентом; after — id, новее которого подтянуть (для опроса). */
app.get("/api/admin/chat/thread/:telegramUserId", requireAdmin, async (req, res) => {
  const tid = Number(req.params.telegramUserId)
  if (!Number.isFinite(tid) || tid <= 0) return res.status(400).json({ error: "invalid_input" })
  const afterId = Math.max(0, Number(req.query.after) || 0)
  const db = await getDb()
  const messages = await listChatMessages(db, tid, { afterId, limit: 500 })
  return res.json({ messages })
})

/** Сообщение студенту из чата на сайте. */
app.post("/api/admin/chat/send", requireAdmin, async (req, res) => {
  try {
    const schema = z.object({
      telegram_user_id: z.number().int().positive(),
      text: z.string().trim().min(1).max(3900),
      enrollment_id: z.number().int().positive().optional().nullable(),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: "invalid_input" })

    const db = await getDb()
    const { telegram_user_id, text, enrollment_id } = parsed.data
    if (enrollment_id != null) {
      const er = await db.get(
        `SELECT id FROM course_enrollments WHERE id = ? AND telegram_user_id = ?`,
        enrollment_id,
        telegram_user_id
      )
      if (!er) return res.status(400).json({ error: "enrollment_mismatch" })
    }

    const result = await deliverAdminChatToTelegram(db, telegram_user_id, text, enrollment_id ?? null)
    if (!result.ok) {
      if (result.error === "no_token") return res.status(500).json({ error: "telegram_not_configured" })
      if (result.error === "blocked") return res.status(409).json({ error: "telegram_blocked" })
      if (result.error === "chat_not_found") return res.status(409).json({ error: "telegram_chat_not_found" })
      if (result.error === "timeout") return res.status(504).json({ error: "telegram_timeout" })
      return res.status(502).json({ error: "telegram_send_failed", detail: result.description })
    }
    return res.json({ ok: true })
  } catch (e) {
    console.error("[api] POST /api/admin/chat/send", e)
    if (!res.headersSent) return res.status(500).json({ error: "server_error" })
  }
})

const TABLE_NAME_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/

/** Обзор БД: подключение и число строк по таблицам public (только админ). */
app.get("/api/admin/db/overview", requireAdmin, async (_req, res) => {
  const db = await getDb()
  const tables = await db.listTables()
  const list = []
  for (const name of tables) {
    if (!TABLE_NAME_RE.test(name)) continue
    const r = await db.get(`SELECT COUNT(*) AS n FROM "${name}"`)
    list.push({ name, count: Number(r?.n) || 0 })
  }
  return res.json({ file: getDatabaseDisplayHint(), tables: list })
})

/** Просмотр строк таблицы (read-only). Пароли в `users` маскируются. */
app.get("/api/admin/db/table/:name", requireAdmin, async (req, res) => {
  const name = String(req.params.name || "")
  if (!TABLE_NAME_RE.test(name)) return res.status(400).json({ error: "invalid_table" })

  const db = await getDb()
  const exists = await db.tableExists(name)
  if (!exists) return res.status(404).json({ error: "not_found" })

  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50))
  const offset = Math.max(0, Number(req.query.offset) || 0)

  const totalRow = await db.get(`SELECT COUNT(*) AS n FROM "${name}"`)
  const total = Number(totalRow?.n) || 0
  const rows = await db.tableRows(name, { limit, offset })

  let out = rows
  if (name === "users") {
    out = rows.map((row) => ({
      ...row,
      password_hash: row.password_hash ? "[скрыто]" : null,
    }))
  }

  return res.json({ name, file: getDatabaseDisplayHint(), total, limit, offset, rows: out })
})

app.post("/api/auth/telegram", async (req, res) => {
  if (!botToken) return res.status(500).json({ error: "telegram_not_configured" })

  const schema = z.object({
    id: z.coerce.number().int().positive(),
    first_name: z.string().min(1).max(200),
    last_name: z.string().max(200).optional(),
    username: z.string().max(200).optional(),
    photo_url: z.string().max(500).optional(),
    auth_date: z.coerce.number().int(),
    hash: z.string().min(1),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" })

  const data = parsed.data
  if (!verifyTelegramAuth(data, botToken)) return res.status(401).json({ error: "invalid_telegram_auth" })

  const db = await getDb()
  const tgId = data.id
  const name = [data.first_name, data.last_name].filter(Boolean).join(" ").trim() || data.username || `user_${tgId}`

  let row = await db.get("SELECT * FROM users WHERE telegram_id = ?", tgId)
  if (!row) {
    const account_login = await allocateAccountLogin(db, data.username || null, null)
    await db.run(
      `INSERT INTO users (name, email, password_hash, telegram_id, telegram_username, telegram_first_name, telegram_last_name, telegram_photo_url, account_login)
       VALUES (?, NULL, NULL, ?, ?, ?, ?, ?, ?)`,
      name,
      tgId,
      data.username || null,
      data.first_name,
      data.last_name || null,
      data.photo_url || null,
      account_login
    )
    row = await db.get("SELECT * FROM users WHERE telegram_id = ?", tgId)
  } else {
    await db.run(
      `UPDATE users SET name = ?, telegram_username = ?, telegram_first_name = ?, telegram_last_name = ?, telegram_photo_url = ? WHERE id = ?`,
      name,
      data.username || null,
      data.first_name,
      data.last_name || null,
      data.photo_url || null,
      row.id
    )
    row = await db.get("SELECT * FROM users WHERE id = ?", row.id)
    if (!row.account_login) {
      const account_login = await allocateAccountLogin(db, data.username || null, row.id)
      await db.run("UPDATE users SET account_login = ? WHERE id = ?", account_login, row.id)
      row = await db.get("SELECT * FROM users WHERE id = ?", row.id)
    }
  }

  const user = {
    id: row.id,
    name: row.name,
    email: row.email,
    account_login: row.account_login ?? null,
    telegram_id: row.telegram_id,
    telegram_username: row.telegram_username,
  }
  const token = signToken({ ...user, telegram_id: row.telegram_id })

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      account_login: user.account_login,
      telegram_id: user.telegram_id,
      telegram_username: user.telegram_username,
    },
  })
})

app.post("/api/auth/register", async (req, res) => {
  const schema = z.object({
    name: z.string().trim().min(2),
    email: z.string().trim().email(),
    password: z.string().min(6),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" })

  const { name, email, password } = parsed.data
  const db = await getDb()

  const existing = await db.get("SELECT id FROM users WHERE email = ?", email.toLowerCase())
  if (existing) return res.status(409).json({ error: "email_taken" })

  const passwordHash = await hashPassword(password)
  const result = await db.run(
    "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?) RETURNING id",
    name,
    email.toLowerCase(),
    passwordHash
  )

  const user = {
    id: result.lastID,
    name,
    email: email.toLowerCase(),
    account_login: null,
    telegram_id: null,
    telegram_username: null,
  }
  const token = signToken(user)

  return res.status(201).json({ token, user })
})

app.post("/api/auth/login", async (req, res) => {
  const schema = z
    .object({
      /** Ник с Telegram / account_login или e-mail при регистрации на сайте */
      login: z.string().trim().min(2).max(254).optional(),
      email: z.string().trim().min(2).max(254).optional(),
      password: z.string().min(6).max(128),
    })
    .refine((b) => Boolean((b.login && b.login.trim()) || (b.email && b.email.trim())), { message: "invalid_input" })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" })

  const key = (parsed.data.login || parsed.data.email || "").trim().toLowerCase()
  const { password } = parsed.data
  const db = await getDb()

  const row = await db.get(
    `SELECT id, name, email, account_login, password_hash, telegram_id, telegram_username FROM users
     WHERE (account_login IS NOT NULL AND lower(account_login) = ?)
        OR (email IS NOT NULL AND lower(email) = ?)`,
    key,
    key
  )
  if (!row || !row.password_hash) return res.status(401).json({ error: "invalid_credentials" })

  const ok = await verifyPassword(password, row.password_hash)
  if (!ok) return res.status(401).json({ error: "invalid_credentials" })

  const user = {
    id: row.id,
    name: row.name,
    email: row.email,
    account_login: row.account_login ?? null,
    telegram_id: row.telegram_id ?? null,
    telegram_username: row.telegram_username ?? null,
  }
  const token = signToken(user)

  return res.json({ token, user })
})

app.get("/api/me", requireAuth, async (req, res) => {
  const db = await getDb()
  const user = await buildMeUser(db, req.user.sub)
  if (!user) return res.status(404).json({ error: "not_found" })
  return res.json({ user })
})

app.patch("/api/me", requireAuth, async (req, res) => {
  const schema = z.object({
    account_login: z.string().trim().min(3).max(32),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" })

  const next = parsed.data.account_login.trim()
  if (!isValidPublicLogin(next)) return res.status(400).json({ error: "invalid_login_format" })

  const db = await getDb()
  if (await loginTakenByOther(db, next, req.user.sub)) return res.status(409).json({ error: "login_taken" })

  await db.run("UPDATE users SET account_login = ? WHERE id = ?", next.toLowerCase(), req.user.sub)
  const user = await buildMeUser(db, req.user.sub)
  if (!user) return res.status(404).json({ error: "not_found" })
  return res.json({ user })
})

app.post("/api/me/password", requireAuth, async (req, res) => {
  const schema = z.object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(8).max(128),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" })

  const db = await getDb()
  const row = await db.get("SELECT password_hash FROM users WHERE id = ?", req.user.sub)
  if (!row) return res.status(404).json({ error: "not_found" })
  if (!row.password_hash) return res.status(400).json({ error: "no_password_set" })

  const ok = await verifyPassword(parsed.data.currentPassword, row.password_hash)
  if (!ok) return res.status(401).json({ error: "invalid_credentials" })

  const nextHash = await hashPassword(parsed.data.newPassword)
  await db.run("UPDATE users SET password_hash = ? WHERE id = ?", nextHash, req.user.sub)
  return res.json({ ok: true })
})

if (process.env.NODE_ENV === "production") {
  const dist = path.join(__dirname, "../dist")
  app.use(express.static(dist, { index: false }))
  app.get("/*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next()
    res.sendFile(path.join(dist, "index.html"))
  })
}

app.listen(port, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`[api] listening on http://0.0.0.0:${port}`)
})

export { app }
