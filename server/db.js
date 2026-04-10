import { open } from "sqlite"
import sqlite3 from "sqlite3"
import pg from "pg"
import path from "node:path"
import { defaultCourses } from "./default-courses.js"
import { allocateAccountLogin } from "./student-account.js"

const { Pool } = pg

function qmark(sql) {
  let i = 0
  return sql.replace(/\?/g, () => `$${++i}`)
}

function getDatabaseUrl() {
  return String(process.env.DATABASE_URL || "").trim()
}

export const dbFilePath = process.env.DB_PATH || path.resolve(process.cwd(), "server", "data.sqlite")

function isPostgresMode() {
  return Boolean(getDatabaseUrl())
}

export function getDatabaseDisplayHint() {
  if (!isPostgresMode()) return `SQLite @ ${dbFilePath}`
  try {
    const raw = getDatabaseUrl()
    const normalized = raw.replace(/^postgres(ql)?:\/\//i, "https://")
    const url = new URL(normalized)
    return `PostgreSQL @ ${url.hostname}${url.port ? `:${url.port}` : ""}`
  } catch {
    return "PostgreSQL"
  }
}

function poolOptions() {
  const connectionString = getDatabaseUrl()
  const useSsl =
    process.env.DATABASE_SSL !== "false" &&
    (connectionString.includes("supabase.co") || process.env.DATABASE_SSL === "true")
  return {
    connectionString,
    max: 12,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  }
}

function normalizeSqlForSqlite(sql) {
  return String(sql)
    .replace(/created_at\s*>=\s*NOW\(\)\s*-\s*INTERVAL\s*'7 days'/gi, "created_at >= datetime('now', '-7 days')")
    .replace(/::bigint/gi, "")
    .replace(/\bNOW\(\)/gi, "datetime('now')")
    .replace(/\(created_at::date\)::text/gi, "date(created_at)")
    .replace(/GROUP BY created_at::date/gi, "GROUP BY date(created_at)")
}

function wrapQueryablePg(q) {
  return {
    dialect: "postgres",
    async get(sql, ...params) {
      const r = await q.query(qmark(sql), params)
      return r.rows[0]
    },
    async all(sql, ...params) {
      const r = await q.query(qmark(sql), params)
      return r.rows
    },
    async run(sql, ...params) {
      const r = await q.query(qmark(sql), params)
      return { changes: r.rowCount ?? 0, lastID: r.rows[0]?.id }
    },
    async exec(sql) {
      await q.query(sql)
    },
    async listTables() {
      const r = await q.query(`
        SELECT table_name AS name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name ASC
      `)
      return r.rows.map((x) => x.name)
    },
    async tableExists(name) {
      const r = await q.query(
        `SELECT table_name AS name FROM information_schema.tables
         WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name = $1`,
        [name]
      )
      return Boolean(r.rows[0])
    },
    async tableRows(name, { limit, offset }) {
      const safe = String(name)
      const r = await q.query(`SELECT * FROM "${safe}" ORDER BY id DESC LIMIT $1 OFFSET $2`, [limit, offset])
      return r.rows
    },
  }
}

function wrapQueryableSqlite(db) {
  return {
    dialect: "sqlite",
    async get(sql, ...params) {
      return db.get(normalizeSqlForSqlite(sql), params)
    },
    async all(sql, ...params) {
      return db.all(normalizeSqlForSqlite(sql), params)
    },
    async run(sql, ...params) {
      const r = await db.run(normalizeSqlForSqlite(sql), params)
      return { changes: r?.changes ?? 0, lastID: r?.lastID }
    },
    async exec(sql) {
      await db.exec(normalizeSqlForSqlite(sql))
    },
    async listTables() {
      const rows = await db.all(
        `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name ASC`
      )
      return rows.map((x) => x.name)
    },
    async tableExists(name) {
      const row = await db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name = ?`, name)
      return Boolean(row)
    },
    async tableRows(name, { limit, offset }) {
      const safe = String(name)
      try {
        return await db.all(`SELECT * FROM "${safe}" ORDER BY id DESC LIMIT ? OFFSET ?`, limit, offset)
      } catch {
        return await db.all(`SELECT * FROM "${safe}" ORDER BY rowid DESC LIMIT ? OFFSET ?`, limit, offset)
      }
    },
  }
}

async function ensureSchema(c) {
  const stmts = [
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT,
      telegram_id BIGINT UNIQUE,
      telegram_username TEXT,
      telegram_first_name TEXT,
      telegram_last_name TEXT,
      telegram_photo_url TEXT,
      account_login TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS course_enrollments (
      id SERIAL PRIMARY KEY,
      telegram_user_id BIGINT NOT NULL,
      telegram_username TEXT,
      telegram_first_name TEXT,
      telegram_last_name TEXT,
      course_slug TEXT,
      source TEXT,
      phone TEXT,
      note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS courses (
      id SERIAL PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      image TEXT NOT NULL,
      duration TEXT NOT NULL,
      students TEXT NOT NULL,
      level TEXT NOT NULL,
      color TEXT NOT NULL,
      about TEXT NOT NULL,
      what_you_learn_json TEXT NOT NULL,
      format_json TEXT NOT NULL,
      materials_json TEXT NOT NULL DEFAULT '[]',
      view_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS course_view_events (
      id SERIAL PRIMARY KEY,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS course_access (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, course_id)
    )`,
    `CREATE TABLE IF NOT EXISTS telegram_chat_messages (
      id SERIAL PRIMARY KEY,
      telegram_user_id BIGINT NOT NULL,
      enrollment_id INTEGER,
      direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_tcm_user_id ON telegram_chat_messages(telegram_user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_tcm_user_id_created ON telegram_chat_messages(telegram_user_id, id)`,
  ]
  for (const sql of stmts) await c.query(sql)
}

async function seedCoursesIfEmpty(c) {
  const db = c.query ? wrapQueryablePg(c) : wrapQueryableSqlite(c)
  const countRow = await db.get("SELECT COUNT(*) AS cnt FROM courses")
  const cnt = Number(countRow?.cnt ?? 0)
  if (cnt > 0) return

  for (const course of defaultCourses) {
    await db.run(
      `INSERT INTO courses
        (slug, title, description, image, duration, students, level, color, about, what_you_learn_json, format_json, materials_json, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', datetime('now'))`,
      course.slug,
      course.title,
      course.description,
      course.image,
      course.duration,
      course.students,
      course.level,
      course.color,
      course.about,
      JSON.stringify(course.what_you_learn),
      JSON.stringify(course.format)
    )
  }
}

async function seedDefaultCourseMaterialsIfEmpty(db) {
  for (const c of defaultCourses) {
    const materials = c.materials
    if (!Array.isArray(materials) || materials.length === 0) continue
    const row = await db.get("SELECT id, materials_json FROM courses WHERE slug = ?", c.slug)
    if (!row) continue
    const raw = String(row.materials_json ?? "").trim()
    if (raw !== "" && raw !== "[]" && raw !== "null") continue
    await db.run(`UPDATE courses SET materials_json = ?, updated_at = datetime('now') WHERE id = ?`, JSON.stringify(materials), row.id)
  }
}

async function backfillAccountLogins(db) {
  const need = await db.all(
    "SELECT id, telegram_username FROM users WHERE telegram_id IS NOT NULL AND (account_login IS NULL OR TRIM(account_login) = '')"
  )
  for (const r of need) {
    const al = await allocateAccountLogin(db, r.telegram_username, r.id)
    await db.run("UPDATE users SET account_login = ? WHERE id = ?", al, r.id)
  }
}

let poolPromise
let sqlitePromise

async function initPool() {
  const pool = new Pool(poolOptions())
  const client = await pool.connect()
  try {
    await ensureSchema(client)
    const db = wrapQueryablePg(client)
    await seedCoursesIfEmpty(client)
    await seedDefaultCourseMaterialsIfEmpty(db)
    await backfillAccountLogins(db)
  } finally {
    client.release()
  }
  return pool
}

async function initSqlite() {
  const db = await open({ filename: dbFilePath, driver: sqlite3.Database })
  await db.exec("PRAGMA foreign_keys = ON;")
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT,
      telegram_id INTEGER UNIQUE,
      telegram_username TEXT,
      telegram_first_name TEXT,
      telegram_last_name TEXT,
      telegram_photo_url TEXT,
      account_login TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS course_enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_user_id INTEGER NOT NULL,
      telegram_username TEXT,
      telegram_first_name TEXT,
      telegram_last_name TEXT,
      course_slug TEXT,
      source TEXT,
      phone TEXT,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      image TEXT NOT NULL,
      duration TEXT NOT NULL,
      students TEXT NOT NULL,
      level TEXT NOT NULL,
      color TEXT NOT NULL,
      about TEXT NOT NULL,
      what_you_learn_json TEXT NOT NULL,
      format_json TEXT NOT NULL,
      materials_json TEXT NOT NULL DEFAULT '[]',
      view_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS course_view_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS course_access (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, course_id)
    );
    CREATE TABLE IF NOT EXISTS telegram_chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_user_id INTEGER NOT NULL,
      enrollment_id INTEGER,
      direction TEXT NOT NULL CHECK(direction IN ('in', 'out')),
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_tcm_user_id ON telegram_chat_messages(telegram_user_id);
    CREATE INDEX IF NOT EXISTS idx_tcm_user_id_created ON telegram_chat_messages(telegram_user_id, id);
  `)
  const wrapped = wrapQueryableSqlite(db)
  await seedCoursesIfEmpty(db)
  await seedDefaultCourseMaterialsIfEmpty(wrapped)
  await backfillAccountLogins(wrapped)
  return db
}

export async function getDb() {
  if (isPostgresMode()) {
    if (!poolPromise) {
      poolPromise = initPool().catch((e) => {
        poolPromise = undefined
        throw e
      })
    }
    const pool = await poolPromise
    return wrapQueryablePg(pool)
  }
  if (!sqlitePromise) {
    sqlitePromise = initSqlite().catch((e) => {
      sqlitePromise = undefined
      throw e
    })
  }
  const sqlite = await sqlitePromise
  return wrapQueryableSqlite(sqlite)
}