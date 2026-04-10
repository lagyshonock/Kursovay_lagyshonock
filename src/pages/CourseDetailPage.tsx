import PageLayout from "@/components/PageLayout"
import { buttonVariants } from "@/components/ui/button"
import { getTelegramEnrollUrl } from "@/lib/telegram"
import { cn, courseDisplayTitle } from "@/lib/utils"
import { ArrowLeft, Check, Clock, Users } from "lucide-react"
import { Link, useLocation, useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { useCourse } from "@/hooks/use-courses"
import { postCourseView } from "@/lib/courses-api"
import { fetchMe, getToken, type AuthUser } from "@/lib/auth"

const colorMap: Record<string, { badge: string; glow: string }> = {
  purple: { badge: "bg-purple-500/20 text-purple-300", glow: "shadow-[0_0_60px_rgba(127,86,217,0.18)]" },
  cyan: { badge: "bg-cyan-500/20 text-cyan-300", glow: "shadow-[0_0_60px_rgba(34,211,238,0.16)]" },
  yellow: { badge: "bg-yellow-500/20 text-yellow-300", glow: "shadow-[0_0_60px_rgba(254,200,75,0.18)]" },
  green: { badge: "bg-green-500/20 text-green-300", glow: "shadow-[0_0_60px_rgba(18,183,106,0.18)]" },
  red: { badge: "bg-red-500/20 text-red-300", glow: "shadow-[0_0_60px_rgba(240,68,56,0.18)]" },
}

export default function CourseDetailPage() {
  const { slug } = useParams()
  const location = useLocation()
  const { course, loading } = useCourse(slug)
  const [authState, setAuthState] = useState<"unknown" | "in" | "out">(() => (getToken() ? "unknown" : "out"))
  const [hasStudyAccess, setHasStudyAccess] = useState(false)

  useEffect(() => {
    if (!getToken()) {
      setAuthState("out")
      setHasStudyAccess(false)
      return
    }
    setAuthState("unknown")
    fetchMe()
      .then((d) => {
        setAuthState("in")
        const u = d.user as AuthUser
        const lib = u.library ?? []
        const ok = slug ? lib.some((x) => x.course.slug === slug) : false
        setHasStudyAccess(ok)
      })
      .catch(() => {
        setAuthState("out")
        setHasStudyAccess(false)
      })
  }, [slug, location.pathname])

  useEffect(() => {
    if (!slug) return
    const k = `course_view_${slug}`
    try {
      if (sessionStorage.getItem(k)) return
      sessionStorage.setItem(k, "1")
    } catch {
      /* ignore */
    }
    postCourseView(slug).catch(() => {})
  }, [slug])

  useEffect(() => {
    if (course) {
      document.title = `${courseDisplayTitle(course.title, course.slug)} · IT Курсы`
    }
    return () => {
      document.title = "IT Курсы — образовательная платформа"
    }
  }, [course])

  if (loading) {
    return (
      <PageLayout bare>
        <div className="max-w-3xl mx-auto text-gray-500 py-12">Загружаем курс…</div>
      </PageLayout>
    )
  }

  if (!course) {
    return (
      <PageLayout bare>
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display text-3xl text-white">Курс не найден</h1>
          <p className="text-gray-400 mt-3">Проверь ссылку или вернись к списку курсов.</p>
          <div className="mt-8 flex gap-3 flex-wrap">
            <Link to="/courses" className={cn(buttonVariants({ variant: "default" }), "bg-gradient-to-r from-purple-600 to-purple-500 text-white border-0")}>
              Все курсы
            </Link>
            <Link to="/" className={cn(buttonVariants({ variant: "outline" }), "border-white/15 text-white hover:bg-white/10")}>
              На главную
            </Link>
          </div>
        </div>
      </PageLayout>
    )
  }

  const theme = colorMap[course.color] || colorMap.purple
  const heading = courseDisplayTitle(course.title, course.slug)

  return (
    <PageLayout bare>
      <div className="max-w-5xl mx-auto py-4 sm:py-8">
          <div className="flex items-center justify-between gap-4 mb-8">
            <Link to="/courses" className={cn(buttonVariants({ variant: "ghost" }), "text-gray-300 hover:text-white hover:bg-white/5")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              К курсам
            </Link>
            <Link to="/" className={cn(buttonVariants({ variant: "outline" }), "border-white/15 text-white hover:bg-white/10")}>
              На главную
            </Link>
          </div>

          <div className={cn("rounded-3xl overflow-hidden border border-white/10 bg-[#131a2b]/70 backdrop-blur-sm", theme.glow)}>
            <div className="relative h-64 sm:h-72">
              <img src={course.image} alt={heading} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#131a2b] via-[#131a2b]/40 to-transparent" />
              <div className={cn("absolute top-6 left-6 px-3 py-1 rounded-full text-xs font-medium", theme.badge)}>
                {course.level}
              </div>
            </div>

            <div className="p-6 sm:p-10">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
                <div className="flex-1">
                  <h1 className="font-display text-3xl sm:text-4xl text-white leading-tight break-words">{heading}</h1>
                  <p className="text-gray-300 mt-3">{course.description}</p>
                  <p className="text-gray-400 mt-4">{course.details.about}</p>

                  <div className="flex flex-wrap items-center gap-5 text-sm text-gray-400 mt-6">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{course.students}</span>
                    </div>
                  </div>
                </div>

                <div className="lg:w-[340px]">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
                    {authState === "in" && hasStudyAccess ? (
                      <div>
                        <div className="text-sm text-emerald-200/90 mb-3">У тебя есть доступ к материалам</div>
                        <Link
                          to={`/courses/${encodeURIComponent(course.slug)}/study`}
                          className={cn(
                            buttonVariants({ variant: "default", size: "lg" }),
                            "w-full justify-center bg-gradient-to-r from-emerald-600 to-cyan-500 text-white border-0"
                          )}
                        >
                          Открыть уроки
                        </Link>
                      </div>
                    ) : null}
                    <div>
                      <div className="text-sm text-gray-300 mb-3">Запись на курс через Telegram-бота</div>
                      <a
                        href={getTelegramEnrollUrl({ course: course.slug, source: "course_detail" })}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(
                          buttonVariants({ variant: "default", size: "lg" }),
                          "w-full justify-center bg-gradient-to-r from-cyan-500 to-cyan-400 text-white border-0"
                        )}
                      >
                        Записаться
                      </a>
                      <div className="text-xs text-gray-500 mt-3">
                        Бот передаст выбранный курс. После заявки администратор может открыть материалы в твоём аккаунте.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <h2 className="font-display text-xl text-white mb-4">Чему ты научишься</h2>
                  <ul className="space-y-3">
                    {course.details.whatYouLearn.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-gray-300">
                        <Check className="w-5 h-5 text-green-400 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <h2 className="font-display text-xl text-white mb-4">Формат обучения</h2>
                  <ul className="space-y-3">
                    {course.details.format.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-gray-300">
                        <Check className="w-5 h-5 text-cyan-400 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {authState === "in" ? (
                <div className="mt-10 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-sm text-gray-300">Ты уже вошёл в аккаунт — заявку на курс всё равно оформляй через кнопку «Записаться» выше (бот привяжет курс).</p>
                  <Link
                    to="/profile"
                    className={cn(buttonVariants({ variant: "outline" }), "border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/10 shrink-0")}
                  >
                    Личный кабинет
                  </Link>
                </div>
              ) : authState === "out" ? (
                <div className="mt-10 flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/register"
                    className={cn(buttonVariants({ variant: "default" }), "bg-gradient-to-r from-purple-600 to-purple-500 text-white border-0")}
                  >
                    Создать аккаунт
                  </Link>
                  <Link to="/login" className={cn(buttonVariants({ variant: "outline" }), "border-white/15 text-white hover:bg-white/10")}>
                    Войти
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
      </div>
    </PageLayout>
  )
}

