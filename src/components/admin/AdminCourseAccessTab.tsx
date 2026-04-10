import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  adminCreateCourseAccess,
  adminDeleteCourseAccess,
  adminListCourseAccess,
  adminListCourses,
  adminSearchUsers,
  clearAdminToken,
  type AdminCourseAccessGrant,
  type AdminUserSearchRow,
} from "@/lib/admin"
import { cn } from "@/lib/utils"
import { KeyRound, Plus, RefreshCw, Trash2, UserSearch } from "lucide-react"

type CourseOpt = { id: number; slug: string; title: string }

export default function AdminCourseAccessTab() {
  const navigate = useNavigate()
  const [grants, setGrants] = useState<AdminCourseAccessGrant[]>([])
  const [courses, setCourses] = useState<CourseOpt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const [q, setQ] = useState("")
  const [searchHits, setSearchHits] = useState<AdminUserSearchRow[]>([])
  const [searching, setSearching] = useState(false)
  const [pickedUser, setPickedUser] = useState<AdminUserSearchRow | null>(null)
  const [courseId, setCourseId] = useState<number | null>(null)
  const [note, setNote] = useState("")
  const [formErr, setFormErr] = useState<string | null>(null)
  const [formOk, setFormOk] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [g, c] = await Promise.all([adminListCourseAccess(), adminListCourses()])
      setGrants(g.grants)
      setCourses(
        (c.courses as { id: number; slug: string; title: string }[]).map((row) => ({
          id: row.id,
          slug: row.slug,
          title: row.title,
        }))
      )
    } catch (e) {
      const msg = e instanceof Error ? e.message : ""
      if (msg === "unauthorized" || msg === "forbidden") {
        clearAdminToken()
        navigate("/admin/login")
        return
      }
      setError("Не удалось загрузить данные")
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    void load()
  }, [load])

  const runSearch = async () => {
    if (q.trim().length < 2) {
      setSearchHits([])
      return
    }
    setSearching(true)
    setFormErr(null)
    try {
      const d = await adminSearchUsers(q)
      setSearchHits(d.users)
    } catch {
      setSearchHits([])
    } finally {
      setSearching(false)
    }
  }

  const grant = async () => {
    setFormErr(null)
    setFormOk(null)
    if (!pickedUser || !courseId) {
      setFormErr("Выберите пользователя и курс")
      return
    }
    try {
      await adminCreateCourseAccess(pickedUser.id, courseId, note.trim() || undefined)
      setFormOk(`Доступ выдан: ${pickedUser.name}`)
      setNote("")
      setPickedUser(null)
      setCourseId(null)
      setSearchHits([])
      setQ("")
      await load()
    } catch (e) {
      const code = e instanceof Error ? e.message : ""
      if (code === "already_granted") setFormErr("У этого пользователя уже есть доступ к выбранному курсу")
      else if (code === "unauthorized" || code === "forbidden") {
        clearAdminToken()
        navigate("/admin/login")
      } else setFormErr("Не удалось выдать доступ")
    }
  }

  const revoke = async (id: number) => {
    if (!confirm("Снять доступ? Студент перестанет видеть материалы.")) return
    setBusyId(id)
    try {
      await adminDeleteCourseAccess(id)
      await load()
    } catch (e) {
      const msg = e instanceof Error ? e.message : ""
      if (msg === "unauthorized" || msg === "forbidden") {
        clearAdminToken()
        navigate("/admin/login")
      }
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-white/10 bg-[#131a2b]/80 backdrop-blur-sm p-6 shadow-lg">
        <h2 className="font-display text-lg text-white mb-1 flex items-center gap-2">
          <Plus className="w-5 h-5 text-cyan-400" />
          Выдать доступ
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Поиск по имени, e-mail, логину или нику Telegram. Пользователь увидит материалы в личном кабинете и на странице курса.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <div className="flex flex-1 gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Минимум 2 символа…"
              className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white"
            />
            <Button
              type="button"
              variant="outline"
              className="border-white/15 text-white shrink-0"
              disabled={searching || q.trim().length < 2}
              onClick={() => void runSearch()}
            >
              <UserSearch className="w-4 h-4 mr-2" />
              Найти
            </Button>
          </div>
        </div>

        {searchHits.length > 0 ? (
          <div className="rounded-xl border border-white/10 divide-y divide-white/10 max-h-40 overflow-y-auto mb-4">
            {searchHits.map((u) => (
              <button
                key={u.id}
                type="button"
                className={cn(
                  "w-full text-left px-3 py-2 text-sm hover:bg-white/5",
                  pickedUser?.id === u.id && "bg-cyan-500/10"
                )}
                onClick={() => setPickedUser(u)}
              >
                <span className="text-white">{u.name}</span>
                <span className="text-gray-500 ml-2 font-mono text-xs">
                  {u.account_login || u.email || (u.telegram_username ? `@${u.telegram_username}` : `#${u.id}`)}
                </span>
              </button>
            ))}
          </div>
        ) : null}

        {pickedUser ? (
          <p className="text-xs text-emerald-200/80 mb-2">
            Выбран: <strong>{pickedUser.name}</strong> · id {pickedUser.id}
          </p>
        ) : null}

        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <select
            className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white"
            value={courseId ?? ""}
            onChange={(e) => setCourseId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">— Курс —</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} ({c.slug})
              </option>
            ))}
          </select>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Заметка (необязательно)"
            className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white"
          />
        </div>

        {formErr ? <div className="text-sm text-red-300 mb-2">{formErr}</div> : null}
        {formOk ? <div className="text-sm text-emerald-300 mb-2">{formOk}</div> : null}

        <Button type="button" className="bg-cyan-600 hover:bg-cyan-500 text-white" onClick={() => void grant()}>
          <KeyRound className="w-4 h-4 mr-2" />
          Выдать доступ к материалам
        </Button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#131a2b]/80 backdrop-blur-sm p-6 shadow-lg">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="font-display text-lg text-white">Кто имеет доступ</h2>
          <button
            type="button"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-white/15 text-white")}
            onClick={() => void load()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Обновить
          </button>
        </div>

        {error ? <div className="text-sm text-red-300 mb-3">{error}</div> : null}
        {loading ? <p className="text-gray-500">Загрузка…</p> : null}

        {!loading && grants.length === 0 ? (
          <p className="text-gray-500 text-sm">Пока никому не выдавали доступ.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm text-left min-w-[720px]">
              <thead>
                <tr className="text-gray-500 border-b border-white/10 bg-white/[0.03]">
                  <th className="py-3 px-4">Когда</th>
                  <th className="py-3 px-4">Студент</th>
                  <th className="py-3 px-4">Курс</th>
                  <th className="py-3 px-4">Заметка</th>
                  <th className="py-3 px-4 w-24" />
                </tr>
              </thead>
              <tbody>
                {grants.map((g) => (
                  <tr key={g.id} className="border-b border-white/5 text-gray-300">
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap text-xs">{g.created_at}</td>
                    <td className="py-3 px-4">
                      <div className="text-white">{g.user_name}</div>
                      <div className="text-xs text-gray-600 font-mono">
                        {g.account_login || g.user_email || (g.telegram_username ? `@${g.telegram_username}` : `#${g.user_id}`)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>{g.course_title}</div>
                      <div className="text-xs text-gray-600 font-mono">{g.course_slug}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500 max-w-[180px] break-words">{g.note || "—"}</td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-red-300 hover:text-red-200")}
                        disabled={busyId === g.id}
                        onClick={() => void revoke(g.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
