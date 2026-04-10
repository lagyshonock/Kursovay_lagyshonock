import { Link } from "react-router-dom"
import { ExternalLink, Quote } from "lucide-react"

const mentions = [
  {
    outlet: "VC.ru",
    title: "Как EdTech-платформы конкурируют за внимание джунов в 2025 году",
    excerpt: "«IT Курсы» выделяется связкой сайт + Telegram-бот и прозрачной аналитикой по программам.",
    tag: "Мнение редакции",
  },
  {
    outlet: "Хабр",
    title: "От лендинга до LMS: один репозиторий для маркетинга и записи студентов",
    excerpt: "Разбор архитектуры: React, Express, Supabase (PostgreSQL) и бот для заявок.",
    tag: "Статья",
  },
  {
    outlet: "SkillCast (подкаст)",
    title: "Эп. 42: менторство и метрики популярности курсов",
    excerpt: "Обсуждаем, как по просмотрам и заявкам понимать, какие программы «заходят» аудитории.",
    tag: "Аудио",
  },
]

export default function MediaSpotlight() {
  return (
    <section id="media" className="py-20 border-t border-white/10 scroll-mt-24" aria-labelledby="media-heading">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <p className="text-cyan-400 text-sm font-medium tracking-wider uppercase mb-3">Медиа</p>
            <h2 id="media-heading" className="font-display text-3xl sm:text-4xl text-white">
              Платформа на радарах индустрии
            </h2>
            <p className="text-gray-400 mt-2 max-w-xl">Подборка публикаций, подкастов и материалов — демо-контент для портфолио проекта.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mentions.map((m) => (
            <article
              key={m.title}
              className="group rounded-2xl border border-white/10 bg-[#131a2b]/50 backdrop-blur-sm p-6 flex flex-col hover:border-cyan-500/20 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="text-xs font-medium text-purple-300/90 uppercase tracking-wide">{m.outlet}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10">{m.tag}</span>
              </div>
              <Quote className="w-8 h-8 text-white/10 mb-2" aria-hidden />
              <h3 className="font-display text-lg text-white leading-snug group-hover:text-cyan-100 transition-colors">
                {m.title}
              </h3>
              <p className="text-sm text-gray-400 mt-3 flex-1">{m.excerpt}</p>
              <Link
                to="/blog"
                className="mt-5 inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300"
              >
                К разделу «База знаний»
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
