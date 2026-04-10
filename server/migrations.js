/** @param {import('sqlite').Database} db */
export async function runMigrations(db) {
  await migrateUsers(db)
  await migrateCourses(db)
  await migrateCourseMaterialsAndAccess(db)
  await migrateTelegramChat(db)
}

async function migrateUsers(db) {
  const cols = await db.all("PRAGMA table_info(users)")
  if (!cols.length) return

  const names = new Set(cols.map((c) => c.name))
  const emailCol = cols.find((c) => c.name === "email")

  if (!names.has("telegram_id")) {
    await db.exec("ALTER TABLE users ADD COLUMN telegram_id INTEGER")
  }
  if (!names.has("telegram_username")) {
    await db.exec("ALTER TABLE users ADD COLUMN telegram_username TEXT")
  }
  if (!names.has("telegram_first_name")) {
    await db.exec("ALTER TABLE users ADD COLUMN telegram_first_name TEXT")
  }
  if (!names.has("telegram_last_name")) {
    await db.exec("ALTER TABLE users ADD COLUMN telegram_last_name TEXT")
  }
  if (!names.has("telegram_photo_url")) {
    await db.exec("ALTER TABLE users ADD COLUMN telegram_photo_url TEXT")
  }
  if (!names.has("account_login")) {
    await db.exec("ALTER TABLE users ADD COLUMN account_login TEXT")
  }

  if (emailCol && emailCol.notnull === 1) {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users_migrated (
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
      INSERT INTO users_migrated (id, name, email, password_hash, telegram_id, telegram_username, telegram_first_name, telegram_last_name, telegram_photo_url, account_login, created_at)
      SELECT id, name, email, password_hash, telegram_id, telegram_username, telegram_first_name, telegram_last_name, telegram_photo_url, account_login, created_at FROM users;
    `)
    await db.exec("DROP TABLE users;")
    await db.exec("ALTER TABLE users_migrated RENAME TO users;")
  }

  const finalCols = await db.all("PRAGMA table_info(users)")
  const finalNames = new Set(finalCols.map((c) => c.name))
  if (!finalNames.has("account_login")) {
    await db.exec("ALTER TABLE users ADD COLUMN account_login TEXT")
  }

  const { allocateAccountLogin } = await import("./student-account.js")
  const need = await db.all(
    "SELECT id, telegram_username FROM users WHERE telegram_id IS NOT NULL AND (account_login IS NULL OR TRIM(account_login) = '')"
  )
  for (const r of need) {
    const al = await allocateAccountLogin(db, r.telegram_username, r.id)
    await db.run("UPDATE users SET account_login = ? WHERE id = ?", al, r.id)
  }
}

async function migrateCourses(db) {
  const cols = await db.all("PRAGMA table_info(courses)")
  if (!cols.length) return
  const names = new Set(cols.map((c) => c.name))
  if (!names.has("view_count")) {
    await db.exec("ALTER TABLE courses ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0")
  }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS course_view_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );
  `)
}

/** Материалы курса (JSON) и выдача доступа студентам платформы (users). */
async function migrateCourseMaterialsAndAccess(db) {
  const cols = await db.all("PRAGMA table_info(courses)")
  if (cols.length) {
    const names = new Set(cols.map((c) => c.name))
    if (!names.has("materials_json")) {
      await db.exec("ALTER TABLE courses ADD COLUMN materials_json TEXT NOT NULL DEFAULT '[]'")
    }
  }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS course_access (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      UNIQUE(user_id, course_id)
    );
  `)

  await seedDefaultCourseMaterialsIfEmpty(db)
}

/** Сообщения админ↔студент (Telegram), для чата на сайте. */
async function migrateTelegramChat(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS telegram_chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_user_id INTEGER NOT NULL,
      enrollment_id INTEGER,
      direction TEXT NOT NULL CHECK(direction IN ('in', 'out')),
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_tcm_user_id ON telegram_chat_messages(telegram_user_id);`)
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_tcm_user_id_created ON telegram_chat_messages(telegram_user_id, id);`)
}

/** Подставляет демо-уроки из default-courses.js, если materials_json ещё пустой. */
async function seedDefaultCourseMaterialsIfEmpty(db) {
  const { defaultCourses } = await import("./default-courses.js")
  for (const c of defaultCourses) {
    const materials = c.materials
    if (!Array.isArray(materials) || materials.length === 0) continue
    const row = await db.get("SELECT id, materials_json FROM courses WHERE slug = ?", c.slug)
    if (!row) continue
    const raw = String(row.materials_json ?? "").trim()
    if (raw !== "" && raw !== "[]" && raw !== "null") continue
    await db.run(
      `UPDATE courses SET materials_json = ?, updated_at = datetime('now') WHERE id = ?`,
      JSON.stringify(materials),
      row.id
    )
  }
}
