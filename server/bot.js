import "dotenv/config"
import { Telegraf, session, Markup } from "telegraf"
import { z } from "zod"
import { getDb } from "./db.js"
import { getCourseIdBySlug, recordCourseView } from "./analytics.js"
import { saveCourseImageBuffer } from "./course-image-storage.js"
import { upsertStudentFromEnrollment } from "./student-account.js"
import { insertChatMessage, isEligibleForSupportChat } from "./student-chat.js"

const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) {
  // eslint-disable-next-line no-console
  console.error("[bot] TELEGRAM_BOT_TOKEN is missing. Create .env in project root or set env var.")
  process.exit(1)
}

const bot = new Telegraf(token)

const ENROLL_PAGE_SIZE = 6

function getSiteUrl() {
  const raw = process.env.SITE_URL || process.env.CLIENT_ORIGIN || "https://kursovay-lagyshonock-1.onrender.com/"
  return raw.replace(/\/$/, "")
}

function getTelegramSafeSiteUrl() {
  try {
    const site = getSiteUrl()
    const u = new URL(site)
    // Telegram rejects localhost/private dev URLs in inline URL buttons.
    if (u.protocol !== "https:") return null
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return null
    return u.origin
  } catch {
    return null
  }
}

function getAdminIds() {
  const raw = process.env.TELEGRAM_ADMIN_IDS || ""
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n))
}

function isAdmin(ctx) {
  const ids = getAdminIds()
  return ids.includes(ctx.from?.id)
}

function baseUserFields(from) {
  return {
    telegram_user_id: from.id,
    telegram_username: from.username || null,
    telegram_first_name: from.first_name || null,
    telegram_last_name: from.last_name || null,
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/** Эвристика: строка похожа на телефон (минимум 10 цифр). */
function looksLikePhone(s) {
  const digits = String(s).replace(/\D/g, "")
  return digits.length >= 10
}

function chunkText(text, maxLen = 3800) {
  const chunks = []
  for (let i = 0; i < text.length; i += maxLen) {
    chunks.push(text.slice(i, i + maxLen))
  }
  return chunks.length ? chunks : [""]
}

/** URL-кнопка; style — primary | success | danger (новые клиенты Telegram), без style — обычная */
function inlineUrl(text, url, style) {
  const b = { text: String(text).slice(0, 64), url }
  if (style) b.style = style
  return b
}

/** Callback-кнопка; style опционально */
function inlineCb(text, data, style) {
  const b = { text: String(text).slice(0, 64), callback_data: String(data).slice(0, 64) }
  if (style) b.style = style
  return b
}

/** Текст для кнопки (Telegram: до 64 символов) */
function btnText(prefix, title) {
  const p = String(prefix)
  const max = 64 - p.length
  let t = String(title || "").trim()
  if (t.length > max) t = `${t.slice(0, Math.max(0, max - 1))}…`
  return `${p}${t}`
}

async function notifyAdminsInboundChat(telegram, from, previewText) {
  const ids = getAdminIds()
  if (!ids.length) return
  const label =
    from.username != null ? `@${from.username}` : [from.first_name, from.last_name].filter(Boolean).join(" ").trim() || `id ${from.id}`
  const text = ["💬 Сообщение от студента (ответ в админке «Чат»)", "", label, "", String(previewText || "").trim().slice(0, 500)].join("\n")
  for (const id of ids) {
    try {
      await telegram.sendMessage(id, text)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[bot] notify admin chat inbound failed", id, err?.message || err)
    }
  }
}

async function notifyAdminsEnrollment(telegram, enrollment) {
  const ids = getAdminIds()
  if (!ids.length) return
  const e = enrollment
  const text = [
    "🔔 Новая заявка на курс",
    "",
    `Курс: ${e.course_slug || "—"}`,
    `Источник: ${e.source || "—"}`,
    `Telegram ID: ${e.telegram_user_id}`,
    e.telegram_username ? `@${e.telegram_username}` : `Имя: ${e.telegram_first_name || ""} ${e.telegram_last_name || ""}`.trim(),
    `Телефон: ${e.phone || "не указан"}`,
    e.note ? `Комментарий: ${e.note}` : "",
  ]
    .filter(Boolean)
    .join("\n")

  for (const id of ids) {
    try {
      await telegram.sendMessage(id, text)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[bot] notify admin failed", id, err?.message || err)
    }
  }
}

bot.telegram
  .getMe()
  .then((me) => {
    // eslint-disable-next-line no-console
    console.log(`[bot] authorized as @${me.username || me.id}`)
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("[bot] getMe failed", err)
  })

bot.use(
  session({
    defaultSession: () => ({
      enrollment: null,
      admin: null,
    }),
  })
)

function parseStartPayload(text) {
  let raw = String(text || "")
    .replace(/^\/start\s*/i, "")
    .trim()
  if (!raw) return { course_slug: null, source: null }
  try {
    raw = decodeURIComponent(raw)
  } catch {
    /* как пришло от Telegram */
  }

  if (raw.includes("__")) {
    const [coursePart, sourcePart] = raw.split("__")
    const course_slug = coursePart?.startsWith("c_") ? coursePart.slice(2) : null
    const source = sourcePart?.startsWith("s_") ? sourcePart.slice(2) : null
    return { course_slug: course_slug || null, source }
  }
  if (raw.startsWith("c_")) return { course_slug: raw.slice(2), source: null }
  if (raw.startsWith("s_")) return { course_slug: null, source: raw.slice(2) }
  return { course_slug: null, source: null }
}

/** Данные курса для приветствия при переходе с сайта */
async function getCourseForEnrollIntro(slug) {
  if (!slug || slug === "unknown") return null
  const db = await getDb()
  return db.get(
    "SELECT slug, title, description, level, duration, about FROM courses WHERE slug = ?",
    slug
  )
}

function courseEnrollKeyboard(slug) {
  const site = getTelegramSafeSiteUrl()
  const pathSlug = encodeURIComponent(slug)
  if (!site) return Markup.inlineKeyboard([[inlineCb("ℹ️ Ссылки недоступны в локальном режиме", "noop")]])
  return Markup.inlineKeyboard([
    [inlineUrl("📄 Страница этого курса", `${site}/courses/${pathSlug}`, "primary")],
    [inlineUrl("📚 Все программы", `${site}/courses`, "success")],
    [inlineUrl("🌐 Сайт школы", site)],
  ])
}

async function fetchCoursesList() {
  const db = await getDb()
  return db.all("SELECT id, slug, title, level FROM courses ORDER BY LOWER(title) ASC")
}

function enrollKeyboard(courses, page) {
  const site = getTelegramSafeSiteUrl()
  const total = courses.length
  const lastPage = Math.max(0, Math.ceil(total / ENROLL_PAGE_SIZE) - 1)
  const safePage = Math.min(Math.max(0, page), lastPage)
  const start = safePage * ENROLL_PAGE_SIZE
  const slice = courses.slice(start, start + ENROLL_PAGE_SIZE)

  const rows = []
  for (let i = 0; i < slice.length; i += 2) {
    const row = []
    const a = slice[i]
    row.push(inlineCb(btnText("▸ ", a.title), `e:${a.id}`, "success"))
    if (slice[i + 1]) {
      const b = slice[i + 1]
      row.push(inlineCb(btnText("▸ ", b.title), `e:${b.id}`, "success"))
    }
    rows.push(row)
  }

  const navRow = []
  if (safePage > 0) navRow.push(inlineCb("◀️ Назад", `ep:${safePage - 1}`, "primary"))
  navRow.push(inlineCb("💬 Без курса", "e:0"))
  if (safePage < lastPage) navRow.push(inlineCb("Вперёд ▶️", `ep:${safePage + 1}`, "primary"))
  rows.push(navRow)
  if (site) rows.push([inlineUrl("📚 Открыть каталог в браузере", `${site}/courses`, "primary")])
  else rows.push([inlineCb("ℹ️ Каталог: включите публичный SITE_URL (https)", "noop")])

  return Markup.inlineKeyboard(rows)
}

function siteLinksKeyboard() {
  const site = getTelegramSafeSiteUrl()
  if (!site) return Markup.inlineKeyboard([[inlineCb("ℹ️ Ссылки появятся с публичным SITE_URL (https)", "noop")]])
  return Markup.inlineKeyboard([
    [inlineUrl("📚 Каталог курсов", `${site}/courses`, "primary")],
    [inlineUrl("🌐 Сайт школы", site, "success")],
  ])
}

bot.action("noop", async (ctx) => {
  await ctx.answerCbQuery("Нужен публичный https SITE_URL")
})

async function sendCoursePicker(ctx, page = 0, introPrefix = "") {
  const courses = await fetchCoursesList()
  const site = getSiteUrl()
  if (!courses.length) {
    ctx.session.enrollment = {
      stage: "collect_contact",
      ...baseUserFields(ctx.from),
      course_slug: null,
      source: null,
      phone: null,
      note: null,
      awaitingNote: false,
    }
    await ctx.reply(
      [
        "<b>Курсов в каталоге пока нет</b>",
        "<blockquote>Оставь заявку сообщением — мы свяжемся.</blockquote>",
        "",
        "<b>1.</b> Телефон или вопрос текстом",
        "<b>2.</b> <code>/skip</code> — пропустить; два раза — без телефона и текста",
        "",
        "<code>/cancel</code> выход · <code>/help</code> справка",
      ].join("\n"),
      { parse_mode: "HTML", ...siteLinksKeyboard() }
    )
    return
  }

  const lastPage = Math.max(0, Math.ceil(courses.length / ENROLL_PAGE_SIZE) - 1)
  const safePage = Math.min(Math.max(0, page), lastPage)

  const core = [
    "<b>① Выбор курса</b>",
    "<blockquote>Нажми <b>зелёную</b> кнопку с названием программы.</blockquote>",
    "",
    "Синие <b>◀️ Назад</b> и <b>Вперёд ▶️</b> — листать список.",
    "<b>💬 Без курса</b> — оставить контакты без программы.",
    "",
    `<i>Страница ${safePage + 1} из ${lastPage + 1}</i>`,
  ].join("\n")

  const text = (introPrefix ? `${escapeHtml(introPrefix)}\n\n` : "") + core

  await ctx.reply(text, { parse_mode: "HTML", ...enrollKeyboard(courses, safePage) })
}

/** Старт: с ссылкой с сайта — сразу контакт; без — выбор курса из БД. */
bot.start(async (ctx) => {
  const { course_slug, source } = parseStartPayload(ctx.message.text || "")
  const user = ctx.from

  if (course_slug) {
    const row = await getCourseForEnrollIntro(course_slug)
    if (!row) {
      await ctx.reply(`Курс «${course_slug}» в каталоге не найден. Выбери программу из списка:`)
      ctx.session.enrollment = {
        stage: "choose_course",
        page: 0,
        ...baseUserFields(user),
      }
      await sendCoursePicker(ctx, 0)
      return
    }

    const id = await getCourseIdBySlug(row.slug)
    if (id) await recordCourseView(id)
    ctx.session.enrollment = {
      stage: "collect_contact",
      ...baseUserFields(user),
      course_slug: row.slug,
      source,
      phone: null,
      note: null,
      awaitingNote: false,
    }

    const desc = (row.description || "").trim() || "—"
    let aboutBlock = ""
    if (row.about && String(row.about).trim()) {
      let a = String(row.about).trim().replace(/\s+/g, " ")
      if (a.length > 400) a = `${a.slice(0, 397)}…`
      aboutBlock = `\n\n${a}`
    }

    const aboutHtml = aboutBlock ? `\n\n${escapeHtml(aboutBlock.trim())}` : ""
    const introHtml = [
      `📌 <b>${escapeHtml(row.title)}</b>`,
      "",
      escapeHtml(desc),
      "",
      `📎 ${escapeHtml(row.level)} · ${escapeHtml(row.duration)}`,
      aboutHtml,
      source ? `\n\n🔖 ${escapeHtml(source)}` : "",
    ]
      .filter(Boolean)
      .join("")

    for (const part of chunkText(introHtml, 3800)) {
      await ctx.reply(part, { parse_mode: "HTML" })
    }

    await ctx.reply(
      [
        "<b>② Контакты</b>",
        "<blockquote>Достаточно одного сообщения или двух шагов с <code>/skip</code>.</blockquote>",
        "",
        "• Только телефон → потом комментарий или <code>/skip</code>",
        "• Сразу текст вопроса (без телефона)",
        "• Дважды <code>/skip</code> — пустая заявка",
        "",
        "При первой записи пришлю логин и пароль отдельным сообщением.",
        "<code>/cancel</code> · <code>/help</code>",
      ].join("\n"),
      { parse_mode: "HTML", ...courseEnrollKeyboard(row.slug) }
    )
    return
  }

  ctx.session.enrollment = {
    stage: "choose_course",
    page: 0,
    ...baseUserFields(user),
  }
  await sendCoursePicker(ctx, 0, "Привет! Оставь заявку на курс — так:")
})

/** Тот же сценарий выбора курса по команде. */
bot.command("enroll", async (ctx) => {
  ctx.session.enrollment = {
    stage: "choose_course",
    page: 0,
    ...baseUserFields(ctx.from),
  }
  await sendCoursePicker(ctx, 0)
})

bot.command("support", async (ctx) => {
  await ctx.reply(
    [
      "<b>Связь с школой</b>",
      "<blockquote>Напишите обычным сообщением — ответ увидите здесь. Администратор отвечает с сайта.</blockquote>",
      "",
      "Подойдёт, если вы уже оставляли заявку или писали нам из школы.",
      "<code>/help</code> — остальные команды",
    ].join("\n"),
    { parse_mode: "HTML" }
  )
})

bot.command("help", async (ctx) => {
  const lines = [
    "<b>Кратко</b>",
    "<blockquote>Зелёные кнопки — курсы. Синие — листать. Ссылки внизу — сайт.</blockquote>",
    "",
    "<b>1</b> <code>/start</code> или кнопки выше",
    "<b>2</b> Телефон или текст · <code>/skip</code> ×2 — без данных",
    "",
    "<code>/support</code> написать администратору (если уже есть заявка/аккаунт)",
    "<code>/enroll</code> список снова · <code>/cancel</code> сброс · <code>/help</code>",
  ]
  if (isAdmin(ctx)) {
    lines.push(
      "",
      "🔐 Админ:",
      "/admin — меню",
      "/admin_courses — список курсов",
      "/admin_add_course — добавить курс (в боте — по шагам)",
      "/admin_del_course — удалить курс по slug",
      "",
      "Обложку в сценарии добавления пришли как фото — файл сохранится на сервере."
    )
  }
  await ctx.reply(lines.join("\n"), { parse_mode: "HTML" })
})

bot.command("cancel", async (ctx) => {
  if (ctx.session.admin?.mode) {
    ctx.session.admin = null
    return ctx.reply("Сценарий администратора отменён.")
  }
  if (ctx.session.enrollment) {
    ctx.session.enrollment = null
    return ctx.reply("Сценарий сброшен. Нажми /start или /enroll, чтобы записаться снова.")
  }
  await ctx.reply("Нет активного сценария. /start — запись, /help — справка.")
})

bot.command("skip", async (ctx) => {
  const e = ctx.session.enrollment
  if (!e || e.stage !== "collect_contact") {
    return ctx.reply("Команда /skip работает во время записи на курс. Нажми /start.")
  }
  if (e.awaitingNote) {
    e.note = null
    await saveEnrollment(ctx)
    return
  }
  e.phone = null
  await ctx.reply("Телефон пропущен. Можно написать комментарий или снова /skip.")
  e.awaitingNote = true
})

/** Листание списка курсов */
bot.action(/^ep:(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery()
  const en = ctx.session.enrollment
  if (!en || en.stage !== "choose_course") return

  const page = Number(ctx.match[1])
  en.page = page
  const courses = await fetchCoursesList()
  if (!courses.length) return

  const lastPage = Math.max(0, Math.ceil(courses.length / ENROLL_PAGE_SIZE) - 1)
  const safePage = Math.min(Math.max(0, page), lastPage)

  const text = [
    "<b>① Выбор курса</b>",
    "<blockquote>Зелёные кнопки — программы.</blockquote>",
    "",
    "Синие — листать · <b>💬 Без курса</b> — консультация",
    "",
    `<i>Страница ${safePage + 1} из ${lastPage + 1}</i>`,
  ].join("\n")

  try {
    await ctx.editMessageText(text, { parse_mode: "HTML", ...enrollKeyboard(courses, safePage) })
  } catch {
    /* message not modified */
  }
})

/** Выбор курса по id (0 = без курса) */
bot.action(/^e:(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery()
  const en = ctx.session.enrollment
  if (!en || en.stage !== "choose_course") return

  const rawId = Number(ctx.match[1])
  let titleLine = "Только вопрос (без курса)"

  if (rawId !== 0) {
    const db = await getDb()
    const row = await db.get("SELECT slug, title FROM courses WHERE id = ?", rawId)
    if (!row) {
      return ctx.reply("Такого курса уже нет. Нажми /enroll и выбери снова.")
    }
    ctx.session.enrollment = {
      stage: "collect_contact",
      ...baseUserFields(ctx.from),
      course_slug: row.slug,
      source: null,
      phone: null,
      note: null,
      awaitingNote: false,
    }
    titleLine = `Курс: ${row.title}`
  } else {
    ctx.session.enrollment = {
      stage: "collect_contact",
      ...baseUserFields(ctx.from),
      course_slug: null,
      source: null,
      phone: null,
      note: null,
      awaitingNote: false,
    }
  }

  try {
    await ctx.editMessageText(`Выбрано: ${titleLine}`)
  } catch {
    /* ignore */
  }

  await ctx.reply(
    [
      "<b>② Контакты</b>",
      "<blockquote>Номер или вопрос одним сообщением.</blockquote>",
      "",
      "<code>/skip</code> — пропустить телефон, ещё раз — без комментария",
      "",
      "При первой заявке — логин и пароль отдельным сообщением. <code>/help</code>",
    ].join("\n"),
    { parse_mode: "HTML", ...siteLinksKeyboard() }
  )
})

async function sendAdminMenu(ctx) {
  const kb = Markup.inlineKeyboard([
    [inlineCb("📋 Список курсов", "adm:courses", "primary")],
    [inlineCb("➕ Добавить", "adm:add", "success"), inlineCb("🗑 Удалить", "adm:del", "danger")],
    [inlineCb("✕ Закрыть", "adm:dismiss")],
  ])
  await ctx.reply(
    [
      "<b>Админ</b>",
      "<blockquote>Кнопки или команды:</blockquote>",
      "<code>/admin_courses</code> · <code>/admin_add_course</code> · <code>/admin_del_course</code>",
    ].join("\n"),
    { parse_mode: "HTML", ...kb }
  )
}

bot.command("admin", async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply("Нет доступа.")
  await sendAdminMenu(ctx)
})

bot.action("adm:dismiss", async (ctx) => {
  await ctx.answerCbQuery()
  if (!isAdmin(ctx)) return
  try {
    await ctx.deleteMessage()
  } catch {
    await ctx.reply("Ок.")
  }
})

async function replyCourseList(ctx) {
  const db = await getDb()
  const rows = await db.all("SELECT id, slug, title, level, duration, view_count FROM courses ORDER BY id ASC")
  if (!rows.length) return ctx.reply("Курсов нет.")
  const lines = rows.map((r) => `• ${r.slug} — ${r.title} (${r.level}, ${r.duration}) · 👁 ${r.view_count ?? 0}`)
  const full = ["Курсы:", "", ...lines].join("\n")
  for (const ch of chunkText(full)) {
    await ctx.reply(ch)
  }
}

bot.action("adm:courses", async (ctx) => {
  await ctx.answerCbQuery()
  if (!isAdmin(ctx)) return ctx.reply("Нет доступа.")
  await replyCourseList(ctx)
})

bot.action("adm:add", async (ctx) => {
  await ctx.answerCbQuery()
  if (!isAdmin(ctx)) return ctx.reply("Нет доступа.")
  ctx.session.admin = { mode: "add_course", step: "slug", data: {} }
  await ctx.reply("➕ Новый курс\n\nШаг 1/9: пришли slug (латиница, цифры, дефис), например: `ui-ux`\n\n/cancel — отмена")
})

bot.action("adm:del", async (ctx) => {
  await ctx.answerCbQuery()
  if (!isAdmin(ctx)) return ctx.reply("Нет доступа.")
  ctx.session.admin = { mode: "del_course" }
  await ctx.reply("Удаление: пришли slug курса.\n\n/cancel — отмена")
})

bot.command("admin_courses", async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply("Нет доступа.")
  await replyCourseList(ctx)
})

bot.command("admin_del_course", async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply("Нет доступа.")
  ctx.session.admin = { mode: "del_course" }
  return ctx.reply("Пришли slug курса для удаления.\n\n/cancel — отмена")
})

bot.command("admin_add_course", async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply("Нет доступа.")
  ctx.session.admin = { mode: "add_course", step: "slug", data: {} }
  return ctx.reply("➕ Новый курс\n\nШаг 1/9: пришли slug, например: `frontend`\n\n/cancel — отмена")
})

async function handleAdminAddCourseImageFromFile(ctx, buffer, extHint) {
  const state = ctx.session.admin
  if (!state || state.mode !== "add_course" || state.step !== "image" || !isAdmin(ctx)) return
  if (buffer.length > 5 * 1024 * 1024) {
    await ctx.reply("Файл больше 5 МБ. Пришли другое фото.")
    return
  }
  const url = saveCourseImageBuffer(buffer, extHint)
  state.data.image = url
  state.step = "duration"
  await ctx.reply(`Обложка сохранена.\n\nШаг 5/9: длительность (например: 6 месяцев)`)
}

bot.on("photo", async (ctx) => {
  const adminImg =
    ctx.session.admin?.mode === "add_course" && ctx.session.admin?.step === "image" && isAdmin(ctx)

  if (adminImg) {
    const photos = ctx.message.photo
    if (!photos?.length) return
    const best = photos[photos.length - 1]
    try {
      const link = await ctx.telegram.getFileLink(best.file_id)
      const res = await fetch(link.href)
      if (!res.ok) throw new Error("download failed")
      const buf = Buffer.from(await res.arrayBuffer())
      const pathname = new URL(link.href).pathname.toLowerCase()
      const ext = pathname.endsWith(".png") ? ".png" : pathname.endsWith(".webp") ? ".webp" : ".jpg"
      await handleAdminAddCourseImageFromFile(ctx, buf, ext)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[bot] photo download failed", e)
      await ctx.reply("Не удалось сохранить фото. Попробуй ещё раз.")
    }
    return
  }

  const en = ctx.session.enrollment
  if (en?.stage === "choose_course") {
    return ctx.reply("Сначала выбери курс кнопкой под предыдущим сообщением.")
  }
  if (en?.stage === "collect_contact" && en.awaitingNote) {
    return ctx.reply("Пришли комментарий текстом.")
  }
  if (en?.stage === "collect_contact") {
    return ctx.reply("Пришли текстом телефон, комментарий или используй /skip.")
  }
})

bot.on("document", async (ctx) => {
  const doc = ctx.message.document
  if (!doc?.mime_type?.startsWith("image/")) return
  if (!(ctx.session.admin?.mode === "add_course" && ctx.session.admin?.step === "image" && isAdmin(ctx))) return

  try {
    const link = await ctx.telegram.getFileLink(doc.file_id)
    const res = await fetch(link.href)
    if (!res.ok) throw new Error("download failed")
    const buf = Buffer.from(await res.arrayBuffer())
    const ext =
      doc.mime_type === "image/png"
        ? ".png"
        : doc.mime_type === "image/webp"
          ? ".webp"
          : doc.mime_type === "image/gif"
            ? ".gif"
            : ".jpg"
    await handleAdminAddCourseImageFromFile(ctx, buf, ext)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[bot] document image failed", e)
    await ctx.reply("Не удалось сохранить файл. Отправь как фото (сжатое).")
  }
})

bot.on("text", async (ctx) => {
  if (ctx.session.admin?.mode === "del_course" && isAdmin(ctx)) {
    const slug = ctx.message.text.trim()
    const slugOk = /^[a-z0-9-]{2,64}$/.test(slug)
    if (!slugOk) return ctx.reply("Slug некорректный. Пример: frontend")
    const db = await getDb()
    const res = await db.run("DELETE FROM courses WHERE slug = ?", slug)
    ctx.session.admin = null
    if (res.changes === 0) return ctx.reply("Не найдено. Проверь slug: /admin_courses")
    return ctx.reply(`Удалено: ${slug}`)
  }

  if (ctx.session.admin?.mode === "add_course" && isAdmin(ctx)) {
    const state = ctx.session.admin
    const text = ctx.message.text.trim()

    if (state.step === "slug") {
      if (!/^[a-z0-9-]{2,64}$/.test(text)) return ctx.reply("Slug: только латиница, цифры, дефис. Пример: data-science")
      state.data.slug = text
      state.step = "title"
      return ctx.reply("Шаг 2/9: название курса")
    }
    if (state.step === "title") {
      state.data.title = text
      state.step = "description"
      return ctx.reply("Шаг 3/9: короткое описание (1–2 предложения)")
    }
    if (state.step === "description") {
      state.data.description = text
      state.step = "image"
      return ctx.reply(
        [
          "Шаг 4/9: обложка",
          "",
          "Пришли изображение фото или файлом (JPG/PNG/WebP).",
          "Файл сохранится на сервере — ссылку с сайта вводить не нужно.",
        ].join("\n")
      )
    }
    if (state.step === "image") {
      return ctx.reply("Пришли картинку фото/файлом, не текстом.")
    }
    if (state.step === "duration") {
      state.data.duration = text
      state.step = "students"
      return ctx.reply("Шаг 6/9: студентов (плашка), например: 1200+")
    }
    if (state.step === "students") {
      state.data.students = text
      state.step = "level"
      return ctx.reply("Шаг 7/9: уровень (С нуля / Средний / …)")
    }
    if (state.step === "level") {
      state.data.level = text
      state.step = "color"
      return ctx.reply("Шаг 8/9: цвет карточки: purple / cyan / yellow / green / red")
    }
    if (state.step === "color") {
      state.data.color = text
      state.step = "about"
      return ctx.reply("Шаг 9a: подробное описание курса (about)")
    }
    if (state.step === "about") {
      state.data.about = text
      state.step = "what"
      return ctx.reply("Шаг 9b: чему научат — пункты через `;`")
    }
    if (state.step === "what") {
      state.data.whatYouLearn = text
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean)
      if (!state.data.whatYouLearn.length) return ctx.reply("Список пуст. Раздели пункты через `;`")
      state.step = "format"
      return ctx.reply("Последний шаг: формат обучения — пункты через `;`")
    }
    if (state.step === "format") {
      state.data.format = text
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean)
      if (!state.data.format.length) return ctx.reply("Список пуст. Раздели через `;`")

      const data = state.data
      const db = await getDb()
      try {
        await db.run(
          `INSERT INTO courses
            (slug, title, description, image, duration, students, level, color, about, what_you_learn_json, format_json, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
           RETURNING id`,
          data.slug,
          data.title,
          data.description,
          data.image,
          data.duration,
          data.students,
          data.level,
          data.color,
          data.about,
          JSON.stringify(data.whatYouLearn),
          JSON.stringify(data.format)
        )
      } catch (e) {
        ctx.session.admin = null
        if (e?.code === "23505") return ctx.reply("Slug занят. Начни снова: /admin_add_course")
        const msg = String(e?.message || "")
        if (msg.includes("UNIQUE") || msg.includes("unique")) return ctx.reply("Slug занят. Начни снова: /admin_add_course")
        // eslint-disable-next-line no-console
        console.error("[bot] add course failed", e)
        return ctx.reply("Ошибка при сохранении курса.")
      }

      ctx.session.admin = null
      const site = getSiteUrl()
      return ctx.reply([`✅ Курс «${data.title}» добавлен`, "", `Страница: ${site}/courses/${data.slug}`].join("\n"))
    }
  }

  const en = ctx.session.enrollment
  if (en?.stage === "choose_course") {
    return ctx.reply("Выбери курс кнопкой в сообщении выше или нажми /enroll.")
  }

  if (!en || en.stage !== "collect_contact") {
    const rawText = String(ctx.message.text || "").trim()
    if (rawText && !rawText.startsWith("/") && !isAdmin(ctx)) {
      const db = await getDb()
      const eligible = await isEligibleForSupportChat(db, ctx.from.id)
      if (eligible) {
        const body = rawText.slice(0, 3900)
        await insertChatMessage(db, {
          telegram_user_id: ctx.from.id,
          enrollment_id: null,
          direction: "in",
          body,
        })
        await notifyAdminsInboundChat(ctx.telegram, ctx.from, body)
        await ctx.reply("Сообщение отправлено. Ответ придёт здесь, когда администратор ответит.", {
          disable_web_page_preview: true,
        })
        return
      }
    }
    return ctx.reply(
      ["Нажми /start или /enroll, чтобы записаться.", "Уже учитесь у нас? — /support или просто напишите текстом после заявки.", "", "/help — справка"].join(
        "\n"
      )
    )
  }

  const text = ctx.message.text.trim()

  if (en.awaitingNote) {
    en.note = text.slice(0, 500)
    en.awaitingNote = false
    await saveEnrollment(ctx)
    return
  }

  if (looksLikePhone(text)) {
    en.phone = text.slice(0, 40)
    en.awaitingNote = true
    await ctx.reply("Комментарий — одним сообщением или /skip.")
    return
  }

  en.phone = null
  en.note = text.slice(0, 500)
  await saveEnrollment(ctx)
})

/** Только если выдали новый пароль (новый пользователь или первое назначение пароля). Повторные заявки — без напоминаний про аккаунт. */
async function sendNewCredentialsMessage(ctx, site, creds) {
  if (!(creds.issuedNewPassword && creds.passwordPlain)) return
  const loginEsc = escapeHtml(creds.login)
  const siteEsc = escapeHtml(site)
  const pwEsc = escapeHtml(creds.passwordPlain)
  await ctx.reply(
    [
      "<b>Доступ к сайту</b>",
      "",
      "Логин:",
      `<code>${loginEsc}</code>`,
      "",
      "Пароль (скрыт — нажми, чтобы показать):",
      `<tg-spoiler>${pwEsc}</tg-spoiler>`,
      "",
      `<a href="${siteEsc}/login">Вход</a> · <a href="${siteEsc}/profile">Профиль</a>`,
    ].join("\n"),
    { parse_mode: "HTML", disable_web_page_preview: true }
  )
}

async function saveEnrollment(ctx) {
  const e = ctx.session.enrollment
  const db = await getDb()

  await db.run(
    `INSERT INTO course_enrollments
      (telegram_user_id, telegram_username, telegram_first_name, telegram_last_name, course_slug, source, phone, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    e.telegram_user_id,
    e.telegram_username,
    e.telegram_first_name,
    e.telegram_last_name,
    e.course_slug,
    e.source,
    e.phone,
    e.note
  )

  await notifyAdminsEnrollment(ctx.telegram, e)

  const creds = await upsertStudentFromEnrollment(db, e)

  ctx.session.enrollment = null

  const site = getSiteUrl()
  await ctx.reply(
    [
      "Заявка принята.",
      "",
      "Мы свяжемся с тобой в ближайшее время.",
      `Каталог: ${site}/courses`,
      "",
      "Ещё раз — /start или /enroll",
    ].join("\n")
  )

  await sendNewCredentialsMessage(ctx, site, creds)
}

bot.catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[bot] error", err)
})

bot
  .launch()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log("[bot] started")
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("[bot] failed to start", err)
    process.exit(1)
  })

process.once("SIGINT", () => bot.stop("SIGINT"))
process.once("SIGTERM", () => bot.stop("SIGTERM"))
