import { Link } from "react-router-dom"
import PageLayout from "@/components/PageLayout"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Briefcase, MapPin, Sparkles } from "lucide-react"

const openings = [
  {
    title: "Senior Frontend (React)",
    location: "Удалённо · МСК",
    type: "Полная занятость",
    stack: "React 19, Vite, Tailwind, дизайн-системы",
  },
  {
    title: "Ментор по Backend (Node.js)",
    location: "Гибрид",
    type: "Частичная занятость",
    stack: "Express, SQL, API-дизайн, код-ревью",
  },
  {
    title: "Product Analyst",
    location: "Удалённо",
    type: "Полная занятость",
    stack: "Воронки, Amplitude/Metabase, A/B",
  },
  {
    title: "Контент-редактор EdTech",
    location: "Москва",
    type: "Проект",
    stack: "Лонгриды, программы курсов, Tone of Voice",
  },
]

export default function CareersPage() {
  return (
    <PageLayout
      title="Карьера"
      description="Мы масштабируем команду: инженерия, продукт, методология. Ниже — демо-вакансии для полноты раздела."
    >
      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6 mb-10 flex gap-4">
        <Sparkles className="w-8 h-8 text-cyan-400 shrink-0" />
        <div>
          <p className="text-white font-medium">Хочешь в команду без открытой вакансии?</p>
          <p className="text-sm text-gray-400 mt-1">
            Пришли портфолио и коротко опиши, чем хочешь заниматься — мы храним заявки в CRM (в учебной версии — в базе заявок
            через бота).
          </p>
          <Link
            to="/contact"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4 border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/10")}
          >
            Написать нам
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {openings.map((job) => (
          <div
            key={job.title}
            className="rounded-2xl border border-white/10 bg-[#131a2b]/50 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-purple-400 shrink-0">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-display text-lg text-white">{job.title}</h2>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {job.location}
                  </span>
                  <span>{job.type}</span>
                </div>
                <p className="text-sm text-gray-400 mt-2">{job.stack}</p>
              </div>
            </div>
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "shrink-0 bg-white/10 text-white border-0 hover:bg-white/15"
              )}
            >
              Откликнуться
            </button>
          </div>
        ))}
      </div>
    </PageLayout>
  )
}
