import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import CourseCreateWizard from "@/components/admin/CourseCreateWizard"
import AdminCourseAccessTab from "@/components/admin/AdminCourseAccessTab"
import AdminCourseEditDialog from "@/components/admin/AdminCourseEditDialog"
import AdminDatabaseTab from "@/components/admin/AdminDatabaseTab"
import AdminEnrollmentsTab from "@/components/admin/AdminEnrollmentsTab"
import AdminChatTab from "@/components/admin/AdminChatTab"
import { adminDeleteCourse, adminGetAnalytics, adminListCourses, clearAdminToken, type AdminAnalytics } from "@/lib/admin"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import {
  BookOpen,
  Database,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  MessagesSquare,
  PanelLeft,
  Pencil,
} from "lucide-react"

type AdminCourseRow = {
  id: number
  slug: string
  title: string
  description: string
  image: string
  duration: string
  students: string
  level: string
  color: string
  about: string
  what_you_learn_json: string
  format_json: string
  materials_json?: string
  view_count?: number
}

type TabId = "analytics" | "enrollments" | "chat" | "access" | "courses" | "database"

const NAV: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "analytics", label: "Аналитика", icon: LayoutDashboard },
  { id: "enrollments", label: "Заявки", icon: MessageCircle },
  { id: "chat", label: "Чат", icon: MessagesSquare },
  { id: "access", label: "Доступ", icon: KeyRound },
  { id: "courses", label: "Курсы", icon: BookOpen },
  { id: "database", label: "База (Supabase)", icon: Database },
]

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabId>("analytics")
  const [courses, setCourses] = useState<AdminCourseRow[] | null>(null)
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [editingCourse, setEditingCourse] = useState<AdminCourseRow | null>(null)

  const loadCourses = async () => {
    const data = await adminListCourses()
    setCourses(data.courses as AdminCourseRow[])
  }

  const loadAnalytics = async () => {
    const data = await adminGetAnalytics()
    setAnalytics(data)
  }

  const loadAll = async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([loadCourses(), loadAnalytics()])
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown_error"
      if (msg === "unauthorized" || msg === "forbidden") {
        clearAdminToken()
        navigate("/admin/login")
        return
      }
      setError("Не удалось загрузить данные")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const chartData = useMemo(() => {
    if (!analytics?.viewsByDay?.length) return []
    return analytics.viewsByDay.map((d) => ({ name: d.day.slice(5), views: d.cnt }))
  }, [analytics])

  const NavButton = ({ item, mobile = false }: { item: (typeof NAV)[0]; mobile?: boolean }) => {
    const Icon = item.icon
    const active = tab === item.id
    return (
      <button
        type="button"
        onClick={() => setTab(item.id)}
        className={cn(
          "flex items-center gap-2 rounded-xl text-sm font-medium transition-colors text-left whitespace-nowrap",
          mobile ? "px-4 py-2.5 shrink-0" : "w-full px-3 py-2.5",
          active ? "bg-white/12 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" : "text-gray-500 hover:text-gray-200 hover:bg-white/[0.05]"
        )}
      >
        <Icon className={cn("w-4 h-4 shrink-0", active ? "text-cyan-400" : "text-gray-600")} />
        {item.label}
      </button>
    )
  }

  return (
    <div className="min-h-screen bg-[#070b12] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r border-white/10 bg-[#0a0f1a] py-6 px-3">
          <div className="px-3 pb-6 mb-2 border-b border-white/10">
            <div className="flex items-center gap-2 text-white font-display text-lg">
              <PanelLeft className="w-5 h-5 text-purple-400" />
              Админ
            </div>
            <p className="text-xs text-gray-600 mt-1 leading-snug">Курсы, чат, материалы, доступ</p>
          </div>
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <NavButton key={item.id} item={item} />
            ))}
          </nav>
          <div className="mt-auto pt-6 px-3 space-y-2 border-t border-white/10">
            <Link
              to="/"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "w-full border-white/15 text-gray-300 hover:bg-white/10"
              )}
            >
              На сайт
            </Link>
            <button
              type="button"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-full text-gray-500 hover:text-white justify-start gap-2")}
              onClick={() => {
                clearAdminToken()
                navigate("/admin/login")
              }}
            >
              <LogOut className="w-4 h-4" />
              Выйти
            </button>
          </div>
        </aside>

        <div className="flex-1 min-w-0 flex flex-col">
          <header className="lg:hidden border-b border-white/10 bg-[#0a0f1a]/95 backdrop-blur-sm sticky top-0 z-10 px-4 py-3">
            <div className="flex overflow-x-auto gap-2 pb-1 -mb-1 scrollbar-thin">
              {NAV.map((item) => (
                <NavButton key={item.id} item={item} mobile />
              ))}
            </div>
          </header>

          <div className="flex-1 px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-6xl w-full mx-auto">
            <div className="hidden lg:flex items-end justify-between gap-4 mb-10">
              <div>
                <h1 className="font-display text-3xl sm:text-4xl text-white tracking-tight">
                  {NAV.find((x) => x.id === tab)?.label}
                </h1>
                <p className="text-gray-500 mt-2 text-sm max-w-xl">
                  {tab === "analytics" && "Просмотры страниц курсов и сводка по программам."}
                  {tab === "enrollments" && "Лиды из Telegram-бота: ответьте им тем же ботом."}
                  {tab === "chat" && "Переписка с теми, кто пишет в боте; ответы уходят в Telegram."}
                  {tab === "access" && "Кто видит материалы курсов: выдача и отзыв доступа."}
                  {tab === "courses" && "Витрина, уроки внутри курса, загрузка обложек."}
                  {tab === "database" && "Только чтение PostgreSQL в Supabase (отладка)."}
                </p>
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200 mb-6">
                {error}
              </div>
            ) : null}

            {tab === "enrollments" ? <AdminEnrollmentsTab /> : null}

            {tab === "chat" ? <AdminChatTab /> : null}

            {tab === "access" ? <AdminCourseAccessTab /> : null}

            {tab === "database" ? <AdminDatabaseTab /> : null}

            {tab === "analytics" ? (
              <div className="space-y-6">
                <div className="rounded-2xl border border-white/10 bg-[#131a2b]/80 backdrop-blur-sm p-6 shadow-lg shadow-black/20">
                  <h2 className="font-display text-lg text-white mb-4">Просмотры за 7 дней</h2>
                  {loading ? (
                    <p className="text-gray-500">Загрузка…</p>
                  ) : chartData.length === 0 ? (
                    <p className="text-gray-500 text-sm">Пока нет событий просмотров.</p>
                  ) : (
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                          <YAxis stroke="#64748b" fontSize={12} />
                          <Tooltip
                            contentStyle={{
                              background: "#131a2b",
                              border: "1px solid rgba(255,255,255,0.12)",
                              borderRadius: "8px",
                            }}
                            labelStyle={{ color: "#e2e8f0" }}
                          />
                          <Bar dataKey="views" fill="#22d3ee" radius={[4, 4, 0, 0]} name="Просмотры" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#131a2b]/80 backdrop-blur-sm p-6 shadow-lg shadow-black/20">
                  <h2 className="font-display text-lg text-white mb-4">Популярность курсов</h2>
                  {loading ? (
                    <p className="text-gray-500">Загрузка…</p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-white/10">
                      <table className="w-full text-sm text-left">
                        <thead>
                          <tr className="text-gray-500 border-b border-white/10 bg-white/[0.03]">
                            <th className="py-3 px-4">Курс</th>
                            <th className="py-3 px-4">Slug</th>
                            <th className="py-3 px-4">Просмотров</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(analytics?.totals || []).map((t) => (
                            <tr key={t.id} className="border-b border-white/5 text-gray-300 hover:bg-white/[0.02]">
                              <td className="py-3 px-4">{t.title}</td>
                              <td className="py-3 px-4 font-mono text-xs text-gray-500">{t.slug}</td>
                              <td className="py-3 px-4 tabular-nums">{t.view_count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {tab === "courses" ? (
              <>
              <AdminCourseEditDialog
                open={editingCourse !== null}
                onOpenChange={(o) => {
                  if (!o) setEditingCourse(null)
                }}
                course={editingCourse}
                onSaved={() => {
                  setEditingCourse(null)
                  void loadAll()
                }}
              />
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <CourseCreateWizard
                  onCreated={async () => {
                    setError(null)
                    await loadAll()
                  }}
                />

                <div className="rounded-2xl border border-white/10 bg-[#131a2b]/80 backdrop-blur-sm p-6 shadow-lg shadow-black/20">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="font-display text-lg text-white">Каталог</h2>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 tabular-nums">{courses ? courses.length : 0}</span>
                      <button
                        type="button"
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "border-white/15 text-white hover:bg-white/10"
                        )}
                        onClick={loadAll}
                      >
                        Обновить
                      </button>
                    </div>
                  </div>

                  {loading ? <div className="text-gray-500 py-10 text-center text-sm">Загружаем…</div> : null}

                  <div className="divide-y divide-white/10 mt-4">
                    {(courses || []).map((c) => (
                      <div key={c.id} className="py-4 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-3 min-w-0 flex-1">
                            {c.image ? (
                              <img
                                src={c.image}
                                alt=""
                                className="w-14 h-14 rounded-lg object-cover border border-white/10 shrink-0 bg-black/20"
                              />
                            ) : null}
                            <div className="min-w-0">
                              <div className="text-white font-medium truncate">{c.title}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                <span className="text-gray-400 font-mono">{c.slug}</span> · просмотров: {c.view_count ?? 0}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-white/15 text-white hover:bg-white/10 gap-1.5")}
                            onClick={() => setEditingCourse(c)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Редактировать
                          </button>
                          <button
                            type="button"
                            disabled={busyId === c.id}
                            className={cn(buttonVariants({ variant: "destructive", size: "sm" }))}
                            onClick={async () => {
                              if (!confirm(`Удалить курс «${c.title}»?`)) return
                              setBusyId(c.id)
                              try {
                                await adminDeleteCourse(c.id)
                                await loadAll()
                              } catch (e) {
                                const msg = e instanceof Error ? e.message : "unknown_error"
                                if (msg === "unauthorized" || msg === "forbidden") {
                                  clearAdminToken()
                                  navigate("/admin/login")
                                  return
                                }
                                setError("Не удалось удалить курс")
                              } finally {
                                setBusyId(null)
                              }
                            }}
                          >
                            {busyId === c.id ? "…" : "Удалить"}
                          </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
