import { Link } from "react-router-dom"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn, courseDisplayTitle } from "@/lib/utils"
import { ArrowRight, Clock, Users } from "lucide-react"
import type { Course } from "@/lib/courses-api"
import { getTelegramEnrollUrl } from "@/lib/telegram"

const colorGlow: Record<string, string> = {
  purple: "from-purple-500/30",
  cyan: "from-cyan-500/30",
  yellow: "from-yellow-500/25",
  green: "from-green-500/25",
  red: "from-red-500/25",
}

type Props = {
  featured: Course | null
  loading: boolean
}

export default function FeaturedHero({ featured, loading }: Props) {
  if (loading) {
    return (
      <section className="relative min-h-[70vh] flex items-center justify-center pt-20">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] via-[#0d1524] to-[#0a0f1a]" />
        <p className="relative z-10 text-gray-500">Загрузка…</p>
      </section>
    )
  }

  if (!featured) {
    return (
      <section className="relative min-h-[50vh] flex items-center justify-center pt-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] to-[#0a0f1a]" />
        <p className="relative z-10 text-gray-400 text-center max-w-md">
          Пока нет курсов в каталоге. Добавьте их в админ-панели.
        </p>
      </section>
    )
  }

  const glow = colorGlow[featured.color] || "from-purple-500/30"

  return (
    <section className="relative min-h-[72vh] flex items-center overflow-hidden pt-20">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-35"
        style={{ backgroundImage: `url(${featured.image})` }}
      />
      <div className={`absolute inset-0 bg-gradient-to-br ${glow} via-[#0a0f1a]/92 to-[#0a0f1a]`} />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a] via-transparent to-[#0a0f1a]/85" />

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 xl:px-12 max-w-3xl mx-auto">
        <p className="text-sm text-gray-500 mb-5">Популярная программа · {featured.view_count ?? 0} просмотров</p>

        <h1 className="font-display text-4xl sm:text-5xl md:text-[3.25rem] leading-tight mb-5 break-words">
          <span className="text-gradient drop-shadow-[0_2px_24px_rgba(0,0,0,0.45)]">
            {courseDisplayTitle(featured.title, featured.slug)}
          </span>
        </h1>

        <p className="text-base sm:text-lg text-gray-300 max-w-xl mb-8 leading-relaxed">{featured.description}</p>

        <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500 mb-9">
          <span className="inline-flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {featured.duration}
          </span>
          <span className="inline-flex items-center gap-2">
            <Users className="w-4 h-4" />
            {featured.students}
          </span>
          <span className="px-3 py-1 rounded-full bg-white/10 text-gray-300 text-xs">{featured.level}</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            size="lg"
            className="bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-white border-0 shadow-glow-cyan text-base px-8 py-6"
            onClick={() => window.open(getTelegramEnrollUrl({ course: featured.slug, source: "featured_hero" }), "_blank")}
          >
            Записаться в Telegram
          </Button>
          <Link
            to={`/courses/${featured.slug}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "border-white/20 text-white hover:bg-white/10 inline-flex items-center justify-center gap-2 min-h-11 px-6"
            )}
          >
            Подробнее
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
