import { open } from "sqlite"
import sqlite3 from "sqlite3"
import path from "node:path"
import { defaultCourses } from "./default-courses.js"
import { runMigrations } from "./migrations.js"

/** Абсолютный путь к SQLite (задаётся `DB_PATH` или `server/data.sqlite` от cwd процесса). */
export const dbFilePath = process.env.DB_PATH || path.resolve(process.cwd(), "server", "data.sqlite")

let dbPromise

export async function getDb() {
  if (!dbPromise) {
    dbPromise = open({
      filename: dbFilePath,
      driver: sqlite3.Database,
    })
      .then(async (db) => {
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
        `)
        await db.exec(`
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
        `)

        await db.exec(`
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
            view_count INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
          );
        `)

        await db.exec(`
          CREATE TABLE IF NOT EXISTS course_view_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            course_id INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
          );
        `)

        const countRow = await db.get("SELECT COUNT(*) as cnt FROM courses")
        if ((countRow?.cnt || 0) === 0) {
          const stmt = await db.prepare(`
            INSERT INTO courses
              (slug, title, description, image, duration, students, level, color, about, what_you_learn_json, format_json)
            VALUES
              (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `)
          try {
            for (const c of defaultCourses) {
              await stmt.run(
                c.slug,
                c.title,
                c.description,
                c.image,
                c.duration,
                c.students,
                c.level,
                c.color,
                c.about,
                JSON.stringify(c.what_you_learn),
                JSON.stringify(c.format)
              )
            }
          } finally {
            await stmt.finalize()
          }
        }

        await runMigrations(db)
        return db
      })
      .catch((e) => {
        dbPromise = undefined
        throw e
      })
  }
  return dbPromise
}

