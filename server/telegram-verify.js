import crypto from "node:crypto"

/**
 * Проверка данных Telegram Login Widget
 * @see https://core.telegram.org/widgets/login#checking-authorization
 */
export function verifyTelegramAuth(data, botToken) {
  if (!botToken) return false
  const { hash, ...rest } = data
  if (!hash || typeof hash !== "string") return false

  const checkArr = []
  for (const key of Object.keys(rest).sort()) {
    const v = rest[key]
    if (v === undefined || v === null) continue
    checkArr.push(`${key}=${String(v)}`)
  }
  const dataCheckString = checkArr.join("\n")

  const secretKey = crypto.createHash("sha256").update(botToken).digest()
  const hmac = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex")

  if (hmac !== hash) return false

  const authDate = Number(rest.auth_date)
  if (!Number.isFinite(authDate)) return false
  const ageSec = Math.floor(Date.now() / 1000) - authDate
  if (ageSec > 86400) return false

  return true
}
