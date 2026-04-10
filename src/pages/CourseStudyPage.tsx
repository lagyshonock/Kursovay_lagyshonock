import PageLayout from "@/components/PageLayout"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { clearToken, fetchCourseStudy, getToken } from "@/lib/auth"
import { ArrowLeft, BookOpen } from "lucide-react"
import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

export default function CourseStudyPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [materials, setMaterials] = useState<{ title: string; body: string }[]>([])

  useEffect(() => {
    if (!slug) return
    if (!getToken()) {
      navigate("/login", { replace: true })
      return
    }
    setLoading(true)
    setErr(null)
    fetchCourseStudy(slug)
      .then((d) => {
        setTitle(d.course.title)
        setMaterials(d.materials)
      })
      .catch((e) => {
        const c = e instanceof Error ? e.message : ""
        if (c === "no_access") setErr("no_access")
        else if (c === "not_found") setErr("not_found")
        else if (c === "unauthorized") {
          clearToken()
          navigate("/login", { replace: true })
        } else setErr("error")
      })
      .finally(() => setLoading(false))
  }, [slug, navigate])

  if (loading) {
    return (
      <PageLayout bare>
        <div className="max-w-3xl mx-auto text-gray-500 py-12">Загрузка материалов…</div>
      </PageLayout>
    )
  }

  if (err === "no_access") {
    return (
      <PageLayout bare>
        <div className="max-w-xl mx-auto py-12 space-y-4">
          <h1 className="font-display text-2xl text-white">Доступ не выдан</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Материалы этого курса доступны после оформления заявки и подтверждения администратором. Если вы уже оплатили или договорились о доступе — напишите нам или дождитесь выдачи в личном кабинете.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to={slug ? `/courses/${encodeURIComponent(slug)}` : "/courses"}
              className={cn(buttonVariants({ variant: "outline" }), "border-white/15 text-white")}
            >
              Страница курса
            </Link>
            <Link to="/profile" className={cn(buttonVariants({ variant: "default" }), "bg-cyan-600 text-white")}>
              Личный кабинет
            </Link>
          </div>
        </div>
      </PageLayout>
    )
  }

  if (err === "not_found") {
    return (
      <PageLayout bare>
        <div className="max-w-xl mx-auto py-12 text-gray-400">Курс не найден.</div>
      </PageLayout>
    )
  }

  if (err) {
    return (
      <PageLayout bare>
        <div className="max-w-xl mx-auto py-12 text-gray-400">Не удалось загрузить материалы. Попробуйте позже.</div>
      </PageLayout>
    )
  }

  return (
    <PageLayout bare>
      <div className="max-w-3xl mx-auto py-6 sm:py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link
            to={slug ? `/courses/${encodeURIComponent(slug)}` : "/courses"}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-gray-300 hover:text-white -ml-2")}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            К описанию курса
          </Link>
        </div>

        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3 mb-8 flex items-center gap-2 text-sm text-emerald-100/90">
          <BookOpen className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>
            Вы открыли материалы курса <strong className="text-white">{title}</strong>
          </span>
        </div>

        {materials.length === 0 ? (
          <p className="text-gray-500 text-sm">
            Уроки ещё не добавлены. Загляните позже или свяжитесь с куратором.
          </p>
        ) : (
          <div className="space-y-10">
            {materials.map((m, i) => (
              <article key={i} className="rounded-2xl border border-white/10 bg-[#131a2b]/80 p-6 sm:p-8">
                <h2 className="font-display text-xl text-white mb-4 flex items-center gap-2">
                  <span className="text-cyan-400/90 tabular-nums text-base">{i + 1}.</span>
                  {m.title}
                </h2>
                <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{m.body}</div>
              </article>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
