type TelegramOptions = {
  course?: string
  source?: string
}

function encodeStartPayload(payload: string) {
  // Telegram start payload is limited and should be URL-safe.
  // Keep it short and ASCII to avoid issues.
  return encodeURIComponent(payload)
}

export function getTelegramEnrollUrl(opts: TelegramOptions = {}) {
  const botUsername =
    (import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string | undefined) || "cursovay_lagyshonock_bot"
  const source = opts.source ? `s_${opts.source}` : "s_site"
  /** Без курса — только маркер источника (бот не привязывает заявку к несуществующему slug). */
  const payload = opts.course?.trim() ? `c_${opts.course.trim()}__${source}` : source

  return `https://t.me/${botUsername}?start=${encodeStartPayload(payload)}`
}

