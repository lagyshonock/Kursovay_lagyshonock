/**
 * Двусторонний чат: админ на сайте ↔ студент в Telegram (бот).
 * Сообщения хранятся в telegram_chat_messages.
 */

const MAX_BODY = 3900

/**
 * @param {{ run: Function }} db
 * @param {{ telegram_user_id: number, enrollment_id?: number | null, direction: 'in' | 'out', body: string }} row
 */
export async function insertChatMessage(db, row) {
  const body = String(row.body || "").slice(0, MAX_BODY)
  const r = await db.run(
    `INSERT INTO telegram_chat_messages (telegram_user_id, enrollment_id, direction, body)
     VALUES (?, ?, ?, ?) RETURNING id`,
    row.telegram_user_id,
    row.enrollment_id ?? null,
    row.direction,
    body
  )
  return r.lastID
}

/**
 * @param {{ get: Function }} db
 * @param {number} telegramUserId
 */
export async function isEligibleForSupportChat(db, telegramUserId) {
  const row = await db.get(
    `SELECT
      CASE
        WHEN EXISTS (SELECT 1 FROM course_enrollments WHERE telegram_user_id = ? LIMIT 1) THEN 1
        WHEN EXISTS (SELECT 1 FROM users WHERE telegram_id = ? LIMIT 1) THEN 1
        WHEN EXISTS (SELECT 1 FROM telegram_chat_messages WHERE telegram_user_id = ? LIMIT 1) THEN 1
        ELSE 0
      END AS ok`,
    telegramUserId,
    telegramUserId,
    telegramUserId
  )
  return Boolean(row?.ok)
}

/**
 * @param {{ all: Function }} db
 * @param {number} telegramUserId
 * @param {{ afterId?: number, limit?: number }} opts
 */
export async function listChatMessages(db, telegramUserId, opts = {}) {
  const afterId = Math.max(0, Number(opts.afterId) || 0)
  const limit = Math.min(500, Math.max(1, Number(opts.limit) || 300))
  return db.all(
    `SELECT id, telegram_user_id, enrollment_id, direction, body, created_at
     FROM telegram_chat_messages
     WHERE telegram_user_id = ? AND id > ?
     ORDER BY id ASC
     LIMIT ?`,
    telegramUserId,
    afterId,
    limit
  )
}

/**
 * @param {{ all: Function }} db
 */
export async function listChatThreads(db) {
  return db.all(
    `SELECT
       t.telegram_user_id,
       m.id AS last_message_id,
       m.created_at AS last_at,
       m.body AS last_body,
       m.direction AS last_direction,
       u.telegram_username AS user_telegram_username,
       u.account_login AS linked_login,
       u.name AS user_name
     FROM (
       SELECT telegram_user_id, MAX(id) AS max_id
       FROM telegram_chat_messages
       GROUP BY telegram_user_id
     ) AS t
     JOIN telegram_chat_messages AS m ON m.id = t.max_id
     LEFT JOIN users AS u ON u.telegram_id = t.telegram_user_id
     ORDER BY m.created_at DESC
     LIMIT 200`
  )
}
