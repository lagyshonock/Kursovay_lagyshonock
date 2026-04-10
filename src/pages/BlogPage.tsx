import { Link } from "react-router-dom"
import PageLayout from "@/components/PageLayout"
import { Calendar, Clock } from "lucide-react"

const posts = [
  {
    slug: "edtech-metrics",
    title: "Какие метрики важны EdTech-платформе в первый год",
    excerpt: "Просмотры программ, конверсия в заявку, удержание по неделям — разбираем минимальный набор KPI.",
    date: "2025-02-18",
    readMin: 6,
    tag: "Аналитика",
  },
  {
    slug: "telegram-onboarding",
    title: "Onboarding через Telegram: что работает у джунов",
    excerpt: "Бот как первый контакт: сценарии /start, напоминания и ручной эскалации в поддержку.",
    date: "2025-02-03",
    readMin: 8,
    tag: "Продукт",
  },
  {
    slug: "sqlite-at-scale",
    title: "SQLite для учебного проекта: когда этого достаточно",
    excerpt: "Один файл БД, миграции и бэкапы — почему для портфолио и MVP это разумный выбор.",
    date: "2025-01-22",
    readMin: 5,
    tag: "Инженерия",
  },
  {
    slug: "design-systems-dark",
    title: "Тёмные интерфейсы в образовании: контраст и усталость глаз",
    excerpt: "Практические заметки по Tailwind, типографике и акцентным градиентам на лендинге курсов.",
    date: "2024-12-10",
    readMin: 7,
    tag: "Дизайн",
  },
]

export default function BlogPage() {
  return (
    <PageLayout
      title="База знаний"
      description="Статьи, заметки команды и разборы процессов — учебный контент для демонстрации раздела «медиа»."
    >
      <div className="grid grid-cols-1 gap-6">
        {posts.map((p) => (
          <article
            key={p.slug}
            className="rounded-2xl border border-white/10 bg-[#131a2b]/50 p-6 sm:p-8 hover:border-purple-500/25 transition-colors"
          >
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
              <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/20">{p.tag}</span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {p.date}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {p.readMin} мин
              </span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl text-white">{p.title}</h2>
            <p className="text-gray-400 mt-3 leading-relaxed">{p.excerpt}</p>
            <div className="mt-5">
              <span className="text-sm text-cyan-400/90">Полная версия — в разработке</span>
            </div>
          </article>
        ))}
      </div>

      <p className="text-center text-sm text-gray-500 mt-12">
        <Link to="/" className="text-cyan-400 hover:text-cyan-300">
          ← На главную
        </Link>
      </p>
    </PageLayout>
  )
}
