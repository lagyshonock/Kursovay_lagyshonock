/**
 * Личные сообщения пользователям от имени бота (тот же токен, что и у server/bot.js).
 */
export async function sendTelegramDm(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return { ok: false, error: "no_token" }

  const url = `https://api.telegram.org/bot${token}/sendMessage`
  let res
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(45_000),
    })
  } catch (e) {
    const name = e?.name || ""
    if (name === "AbortError" || name === "TimeoutError")
      return { ok: false, error: "timeout", description: "telegram_request_timeout" }
    return { ok: false, error: "network", description: String(e?.message || e) }
  }

  const data = await res.json().catch(() => null)
  if (!data?.ok) {
    const desc = String(data?.description || `http_${res.status}`)
    const low = desc.toLowerCase()
    if (low.includes("blocked") || low.includes("deactivated") || low.includes("bot was blocked"))
      return { ok: false, error: "blocked", description: desc }
    if (low.includes("chat not found")) return { ok: false, error: "chat_not_found", description: desc }
    return { ok: false, error: "send_failed", description: desc }
  }
  return { ok: true }
}
