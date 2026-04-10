import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { BookOpen, Calendar, Clock, ExternalLink, GraduationCap, KeyRound, Shield, User } from "lucide-react"
import PageLayout from "@/components/PageLayout"
import { buttonVariants } from "@/components/ui/button"
import { cn, courseDisplayTitle } from "@/lib/utils"
import {
  changePassword,
  clearToken,
  fetchMe,
  getToken,
  updateAccountLogin,
  type AuthUser,
  type MeEnrollment,
  type MeLibraryItem,
} from "@/lib/auth"
import { getTelegramEnrollUrl } from "@/lib/telegram"

const colorMap: Record<string, { border: string; badge: string }> = {
  purple: { border: "border-purple-500/30", badge: "bg-purple-500/20 text-purple-300" },
  cyan: { border: "border-cyan-500/30", badge: "bg-cyan-500/20 text-cyan-300" },
  yellow: { border: "border-yellow-500/30", badge: "bg-yellow-500/20 text-yellow-300" },
  green: { border: "border-green-500/30", badge: "bg-green-500/20 text-green-300" },
  red: { border: "border-red-500/30", badge: "bg-red-500/20 text-red-300" },
}

function formatDateRu(iso: string) {
  const d = new Date(iso.includes("T") ? iso : `${iso.replace(" ", "T")}Z`)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(d)
}

function LibraryCard({ row }: { row: MeLibraryItem }) {
  const c = row.course
  const title = courseDisplayTitle(c.title, c.slug)
  const theme = c.color ? colorMap[c.color] || colorMap.purple : colorMap.purple
  const studyHref = `/courses/${encodeURIComponent(c.slug)}/study`

  return (
    <div
      className={cn(
        "rounded-2xl border bg-[#131a2b]/90 backdrop-blur-sm overflow-hidden flex flex-col h-full transition hover:border-white/20",
        theme.border
      )}
    >
      <Link to={studyHref} className="block relative aspect-[16/10] bg-white/5 shrink-0">
        {c.image ? (
          <img src={c.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-500/10 to-cyan-500/10">
            <KeyRound className="w-14 h-14 text-emerald-400/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a] via-transparent to-transparent opacity-90" />
        <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/25 text-emerald-200 border border-emerald-400/30">
          Доступ к урокам
        </div>
      </Link>
      <div className="p-4 sm:p-5 flex flex-col flex-1 gap-3">
        <h3 className="font-display text-lg text-white leading-snug break-words">
          <Link to={studyHref} className="hover:text-cyan-200 transition-colors">
            {title}
          </Link>
        </h3>
        <p className="text-xs text-gray-500 mt-auto">
          Выдано: {formatDateRu(row.granted_at)}
          {row.note ? ` · ${row.note}` : ""}
        </p>
        <Link
          to={studyHref}
          className={cn(
            buttonVariants({ variant: "default", size: "sm" }),
            "w-full bg-gradient-to-r from-emerald-600 to-cyan-600 text-white border-0 justify-center gap-2"
          )}
        >
          Перейти к материалам
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}

function EnrollmentCard({ row }: { row: MeEnrollment }) {
  const slug = row.course?.slug ?? row.course_slug
  const title = row.course ? courseDisplayTitle(row.course.title, row.course.slug) : courseDisplayTitle(null, row.course_slug)
  const theme = row.course?.color ? colorMap[row.course.color] || colorMap.purple : colorMap.purple
  const detailHref = `/courses/${encodeURIComponent(slug)}`

  return (
    <div
      className={cn(
        "rounded-2xl border bg-[#131a2b]/90 backdrop-blur-sm overflow-hidden flex flex-col h-full transition hover:border-white/20",
        theme.border
      )}
    >
      <Link to={detailHref} className="block relative aspect-[16/10] bg-white/5 shrink-0">
        {row.course?.image ? (
          <img src={row.course.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/5 to-white/[0.02]">
            <GraduationCap className="w-14 h-14 text-white/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a] via-transparent to-transparent opacity-90" />
      </Link>
      <div className="p-4 sm:p-5 flex flex-col flex-1 gap-3">
        <div>
          <h3 className="font-display text-lg text-white leading-snug break-words">
            <Link to={detailHref} className="hover:text-cyan-200 transition-colors">
              {title}
            </Link>
          </h3>
          {row.course ? (
            <p className="text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
              <span className={cn("rounded-md px-2 py-0.5", theme.badge)}>{row.course.level}</span>
              <span className="text-gray-400 inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {row.course.duration}
              </span>
            </p>
          ) : (
            <p className="text-xs text-amber-200/80 mt-1">Курс обновлён в каталоге — данные подгружаются по коду «{row.course_slug}»</p>
          )}
        </div>
        <div className="text-xs text-gray-500 space-y-1 mt-auto">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            Заявка: {formatDateRu(row.created_at)}
          </div>
          {row.source ? (
            <div>
              Метка: <span className="text-gray-400">{row.source}</span>
            </div>
          ) : null}
          {row.phone ? (
            <div className="text-gray-400">Телефон в заявке: {row.phone}</div>
          ) : null}
          {row.note ? (
            <div className="text-gray-400 line-clamp-2">Комментарий: {row.note}</div>
          ) : null}
        </div>
        <Link
          to={detailHref}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "w-full border-white/15 text-white hover:bg-white/10 gap-2 justify-center"
          )}
        >
          Страница курса
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<
    (AuthUser & { created_at?: string; enrollments?: MeEnrollment[]; library?: MeLibraryItem[] }) | null
  >(null)
  const [loading, setLoading] = useState(true)
  const [currentPw, setCurrentPw] = useState("")
  const [newPw, setNewPw] = useState("")
  const [newPw2, setNewPw2] = useState("")
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loginEdit, setLoginEdit] = useState("")
  const [loginMsg, setLoginMsg] = useState<string | null>(null)
  const [loginErr, setLoginErr] = useState<string | null>(null)
  const [loginBusy, setLoginBusy] = useState(false)

  const enrollments = user?.enrollments ?? []
  const library = user?.library ?? []
  const enrollUrl = useMemo(() => getTelegramEnrollUrl({ source: "profile" }), [])

  useEffect(() => {
    if (!getToken()) {
      navigate("/login", { replace: true })
      return
    }
    fetchMe()
      .then((d) => {
        setUser(d.user)
        setLoginEdit(d.user.account_login || "")
      })
      .catch(() => {
        clearToken()
        navigate("/login", { replace: true })
      })
      .finally(() => setLoading(false))
  }, [navigate])

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginMsg(null)
    setLoginErr(null)
    setLoginBusy(true)
    try {
      const { user: u } = await updateAccountLogin(loginEdit.trim())
      setUser(u)
      setLoginEdit(u.account_login || "")
      setLoginMsg("Логин обновлён")
    } catch (e) {
      const code = e instanceof Error ? e.message : ""
      if (code === "login_taken") setLoginErr("Этот логин уже занят")
      else if (code === "invalid_login_format") setLoginErr("3–32 символа: латиница, цифры и _")
      else setLoginErr("Не удалось сохранить логин")
    } finally {
      setLoginBusy(false)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    setErr(null)
    if (newPw.length < 8) {
      setErr("Новый пароль — не короче 8 символов")
      return
    }
    if (newPw !== newPw2) {
      setErr("Новый пароль и повтор не совпадают")
      return
    }
    try {
      await changePassword(currentPw, newPw)
      setMsg("Пароль обновлён")
      setCurrentPw("")
      setNewPw("")
      setNewPw2("")
      const d = await fetchMe()
      setUser(d.user)
    } catch (e) {
      const code = e instanceof Error ? e.message : ""
      if (code === "invalid_credentials") setErr("Текущий пароль указан неверно")
      else if (code === "no_password_set")
        setErr("Пароль ещё не задан — он придёт в Telegram после записи на курс через бота")
      else setErr("Не удалось сменить пароль")
    }
  }

  if (loading) {
    return (
      <PageLayout title="Профиль" bare>
        <div className="min-h-[40vh] flex items-center justify-center text-gray-500 text-sm">Загрузка…</div>
      </PageLayout>
    )
  }

  if (!user) return null

  const initial = (user.name || user.account_login || "?").slice(0, 1).toUpperCase()
  const memberSince = user.created_at ? formatDateOnlyRu(user.created_at) : null

  return (
    <PageLayout title="Профиль" description="Твои заявки на курсы, данные аккаунта и настройки безопасности">
      <div className="space-y-10 lg:space-y-14">
        <section className="rounded-2xl border border-white/10 bg-[#131a2b]/80 backdrop-blur-sm p-6 sm:p-8 flex flex-col sm:flex-row gap-6 sm:gap-8 sm:items-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-purple-600/30 border border-white/10 flex items-center justify-center text-3xl font-display text-white shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <h2 className="font-display text-2xl text-white flex flex-wrap items-center gap-2">
              {user.name}
              {user.telegram_username ? (
                <span className="text-sm font-normal text-cyan-200/90">@{user.telegram_username}</span>
              ) : null}
            </h2>
            <div className="flex flex-wrap gap-3 text-sm text-gray-400">
              {user.account_login ? (
                <span className="inline-flex items-center gap-1.5 font-mono text-xs text-gray-300">
                  <User className="w-4 h-4 text-gray-500" />
                  {user.account_login}
                </span>
              ) : null}
              {user.email ? (
                <span className="inline-flex items-center gap-1.5 break-all">
                  <Shield className="w-4 h-4 text-gray-500 shrink-0" />
                  {user.email}
                </span>
              ) : null}
              {memberSince ? (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-500" />С регистрации: {memberSince}
                </span>
              ) : null}
            </div>
            {!user.telegram_id ? (
              <p className="text-sm text-amber-200/85 pt-1 max-w-2xl">
                Аккаунт без привязки к Telegram — список записей на курсы доступен после входа через Telegram или если к аккаунту добавлен
                Telegram при записи через бота. Каталог:{" "}
                <Link to="/courses" className="text-cyan-300 underline-offset-2 hover:underline">
                  все курсы
                </Link>
                .
              </p>
            ) : null}
          </div>
          <div className="sm:text-right shrink-0">
            <div className="inline-flex flex-col gap-2">
              <span className="text-3xl font-display text-white">{enrollments.length}</span>
              <span className="text-xs text-gray-500 uppercase tracking-wider">заявок на курсы</span>
            </div>
          </div>
        </section>

        <section>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl text-white flex items-center gap-2">
                <BookOpen className="w-7 h-7 text-cyan-400/90" />
                Мои курсы
              </h2>
              <p className="text-gray-400 mt-2 max-w-xl text-sm sm:text-base">
                Здесь отображаются заявки, оформленные через Telegram-бота с этим же аккаунтом. Новую запись можно оставить в боте.
              </p>
            </div>
            <a
              href={enrollUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants({ variant: "default" }),
                "shrink-0 bg-gradient-to-r from-cyan-600 to-purple-600 text-white border-0 gap-2"
              )}
            >
              Записаться в боте
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {enrollments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-14 text-center">
              <p className="text-gray-300 mb-2">Пока нет заявок на курсы</p>
              <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                Выбери направление в каталоге и нажми «Записаться» — откроется бот. После заявки курсы появятся здесь.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link to="/courses" className={cn(buttonVariants({ variant: "outline" }), "border-white/15 text-white hover:bg-white/10")}>
                  Каталог курсов
                </Link>
                <a
                  href={enrollUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(buttonVariants({ variant: "default" }), "bg-gradient-to-r from-purple-600 to-purple-500 text-white border-0")}
                >
                  Открыть бота
                </a>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {enrollments.map((row) => (
                <EnrollmentCard key={row.id} row={row} />
              ))}
            </div>
          )}
        </section>

        {library.length > 0 ? (
          <section>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl text-white flex items-center gap-2">
                  <KeyRound className="w-7 h-7 text-emerald-400/90" />
                  Доступ к материалам
                </h2>
                <p className="text-gray-400 mt-2 max-w-xl text-sm sm:text-base">
                  Уроки и тексты курсов, которые администратор открыл для твоего аккаунта.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {library.map((row) => (
                <LibraryCard key={row.grant_id} row={row} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
          <div className="rounded-2xl border border-white/10 bg-[#131a2b]/60 backdrop-blur-sm p-6 sm:p-8">
            <h2 className="font-display text-xl text-white mb-1">Логин для входа</h2>
            <p className="text-xs text-gray-500 mb-4">
              3–32 символа: латинские буквы, цифры, подчёркивание. Должен отличаться от чужих логинов и от чужих e-mail.
            </p>
            <form onSubmit={(e) => void submitLogin(e)} className="space-y-3">
              {loginMsg ? (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">{loginMsg}</div>
              ) : null}
              {loginErr ? <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{loginErr}</div> : null}
              <input
                type="text"
                autoComplete="username"
                value={loginEdit}
                onChange={(e) => setLoginEdit(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="my_nickname"
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white font-mono outline-none focus:border-cyan-400/50"
              />
              <button
                type="submit"
                disabled={loginBusy || loginEdit.length < 3}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "border-cyan-500/40 text-cyan-200 hover:bg-cyan-500/10 disabled:opacity-50"
                )}
              >
                {loginBusy ? "Сохраняем…" : "Сохранить логин"}
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#131a2b]/60 backdrop-blur-sm p-6 sm:p-8">
            <h2 className="font-display text-xl text-white mb-1">Смена пароля</h2>
            {!user.has_password ? (
              <p className="text-gray-400 text-sm leading-relaxed mt-3">
                Пароль для входа по логину приходит в Telegram после записи на курс через бота (или задаётся при регистрации по e-mail).
              </p>
            ) : (
              <form onSubmit={(e) => void submit(e)} className="space-y-4 mt-4">
                {msg ? (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">{msg}</div>
                ) : null}
                {err ? <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{err}</div> : null}
                <div className="space-y-2">
                  <label className="text-xs text-gray-400">Текущий пароль</label>
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-400">Новый пароль (от 8 символов)</label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-400">Повтор нового пароля</label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={newPw2}
                    onChange={(e) => setNewPw2(e.target.value)}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
                  />
                </div>
                <button
                  type="submit"
                  className={cn(buttonVariants({ variant: "default" }), "w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white border-0")}
                >
                  Сохранить пароль
                </button>
              </form>
            )}
          </div>
        </section>

        <div className="flex flex-wrap gap-3 pb-8">
          <Link to="/" className={cn(buttonVariants({ variant: "outline" }), "border-white/15 text-white hover:bg-white/10")}>
            На главную
          </Link>
        </div>
      </div>
    </PageLayout>
  )
}

function formatDateOnlyRu(iso: string) {
  const d = new Date(iso.includes("T") ? iso : `${iso.replace(" ", "T")}Z`)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "long" }).format(d)
}
