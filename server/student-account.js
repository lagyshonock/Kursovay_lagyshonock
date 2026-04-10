import crypto from "node:crypto"
import { hashPassword } from "./auth.js"

const RESERVED = new Set([
  "admin",
  "api",
  "me",
  "login",
  "register",
  "profile",
  "courses",
  "help",
  "support",
  "www",
  "null",
  "system",
  "bot",
])

/** Из Telegram @username → логин (5–32 символа, a-z 0-9 _). Невалидно → null */
export function loginFromTelegramUsername(raw) {
  if (!raw || typeof raw !== "string") return null
  const s = raw.replace(/^@/, "").toLowerCase()
  if (!/^[a-z0-9_]{5,32}$/.test(s)) return null
  if (RESERVED.has(s)) return null
  return s
}

export function generateRandomAccountLogin() {
  return `user_${crypto.randomBytes(6).toString("hex")}`
}

/** Публичный логин в профиле: 3–32, латиница, цифры, _. */
export function isValidPublicLogin(s) {
  if (typeof s !== "string") return false
  const t = s.toLowerCase()
  if (!/^[a-z0-9_]{3,32}$/.test(t)) return false
  if (RESERVED.has(t)) return false
  return true
}

async function loginTaken(db, login, excludeUserId) {
  const low = login.toLowerCase()
  const ex = excludeUserId != null && excludeUserId !== ""
  const byAccount = ex
    ? await db.get(
        "SELECT id FROM users WHERE account_login IS NOT NULL AND lower(account_login) = ? AND id != ?",
        low,
        excludeUserId
      )
    : await db.get("SELECT id FROM users WHERE account_login IS NOT NULL AND lower(account_login) = ?", low)
  if (byAccount) return true
  const byEmail = ex
    ? await db.get("SELECT id FROM users WHERE email IS NOT NULL AND lower(email) = ? AND id != ?", low, excludeUserId)
    : await db.get("SELECT id FROM users WHERE email IS NOT NULL AND lower(email) = ?", low)
  return Boolean(byEmail)
}

/** Занят ли логин другим пользователем (или совпадает с чужим e-mail). */
export async function loginTakenByOther(db, login, excludeUserId) {
  return loginTaken(db, login, excludeUserId)
}

/**
 * Уникальный account_login (для excludeUserId — при обновлении своей записи).
 * @param {{ get: Function }} db
 */
export async function allocateAccountLogin(db, telegramUsername, excludeUserId) {
  const fromTg = loginFromTelegramUsername(telegramUsername)
  let base = fromTg || generateRandomAccountLogin()

  for (let i = 0; i < 40; i++) {
    if (!(await loginTaken(db, base, excludeUserId))) return base
    base = `${(fromTg || "user").slice(0, 18)}_${crypto.randomBytes(3).toString("hex")}`
  }
  return generateRandomAccountLogin()
}

export function generateStudentPassword() {
  return crypto.randomBytes(12).toString("base64url").slice(0, 18)
}

/**
 * Создаёт или дополняет пользователя после заявки из Telegram.
 * Логин для сайта — Telegram @username или случайный user_xxx; e-mail не подставляем.
 * @returns {Promise<{ login: string, passwordPlain: string | null, issuedNewPassword: boolean }>}
 */
export async function upsertStudentFromEnrollment(db, en) {
  const tgId = en.telegram_user_id
  const displayName =
    [en.telegram_first_name, en.telegram_last_name].filter(Boolean).join(" ").trim() ||
    (en.telegram_username ? `@${en.telegram_username}` : null) ||
    `Ученик ${tgId}`

  let row = await db.get("SELECT * FROM users WHERE telegram_id = ?", tgId)
  const passwordPlain = generateStudentPassword()

  if (!row) {
    const account_login = await allocateAccountLogin(db, en.telegram_username ?? null, null)
    const hash = await hashPassword(passwordPlain)
    await db.run(
      `INSERT INTO users (name, email, password_hash, telegram_id, telegram_username, telegram_first_name, telegram_last_name, account_login)
       VALUES (?, NULL, ?, ?, ?, ?, ?, ?)`,
      displayName,
      hash,
      tgId,
      en.telegram_username ?? null,
      en.telegram_first_name ?? null,
      en.telegram_last_name ?? null,
      account_login
    )
    return { login: account_login, passwordPlain, issuedNewPassword: true }
  }

  let account_login = row.account_login
  if (!account_login) {
    account_login = await allocateAccountLogin(db, en.telegram_username ?? null, row.id)
    await db.run("UPDATE users SET account_login = ? WHERE id = ?", account_login, row.id)
  }

  if (displayName && !row.name) {
    await db.run("UPDATE users SET name = ? WHERE id = ?", displayName, row.id)
  }

  if (!row.password_hash) {
    const hash = await hashPassword(passwordPlain)
    await db.run("UPDATE users SET password_hash = ? WHERE id = ?", hash, row.id)
    return { login: account_login, passwordPlain, issuedNewPassword: true }
  }

  return { login: account_login, passwordPlain: null, issuedNewPassword: false }
}
