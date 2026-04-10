import PageLayout from "@/components/PageLayout"
import { getTelegramEnrollUrl } from "@/lib/telegram"
import { cn, courseDisplayTitle } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { ArrowRight, Clock, Users } from "lucide-react"
import { Link } from "react-router-dom"
import { useCourses } from "@/hooks/use-courses"

const colorMap: Record<string, { border: string; badge: string }> = {
  purple: { border: "hover:border-purple-500/50", badge: "bg-purple-500/20 text-purple-300" },
  cyan: { border: "hover:border-cyan-500/50", badge: "bg-cyan-500/20 text-cyan-300" },
  yellow: { border: "hover:border-yellow-500/50", badge: "bg-yellow-500/20 text-yellow-300" },
  green: { border: "hover:border-green-500/50", badge: "bg-green-500/20 text-green-300" },
  red: { border: "hover:border-red-500/50", badge: "bg-red-500/20 text-red-300" },
}

export default function CoursesPage() {
  const { courses, loading, error } = useCourses()
  return (
    <PageLayout
      title="Каталог программ"
      description="Все направления в одном месте: длительность, уровень, запись через Telegram и детальная программа."
    >
      <div className="flex justify-end mb-8">
        <Link to="/" className={cn(buttonVariants({ variant: "outline" }), "border-white/15 text-white hover:bg-white/10")}>
          На главную
        </Link>
      </div>

          {error ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200 mb-6">
              Не удалось загрузить курсы.
            </div>
          ) : null}

          {loading ? (
            <div className="text-center text-gray-500 py-16">Загружаем курсы…</div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(courses || []).map((course) => (
              <div
                key={course.slug}
                className={cn(
                  "rounded-2xl overflow-hidden border border-white/10 bg-[#131a2b]/80 backdrop-blur-sm transition-all duration-300",
                  colorMap[course.color]?.border
                )}
              >
                <div className="flex flex-col sm:flex-row gap-6 p-6">
                  <div className="sm:w-48 sm:shrink-0">
                    <div className="relative h-40 sm:h-32 rounded-xl overflow-hidden">
                      <img src={course.image} alt={courseDisplayTitle(course.title, course.slug)} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#131a2b] to-transparent" />
                      <div className={cn("absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium", colorMap[course.color]?.badge)}>
                        {course.level}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1">
                    <h2 className="font-display text-xl text-white leading-snug break-words">
                      {courseDisplayTitle(course.title, course.slug)}
                    </h2>
                    <p className="text-gray-400 text-sm mt-2">{course.description}</p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-4">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{course.students}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 mt-6">
                      <Link
                        to={`/courses/${course.slug}`}
                        className={cn(buttonVariants({ variant: "default" }), "bg-gradient-to-r from-purple-600 to-purple-500 text-white border-0")}
                      >
                        Подробнее
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                      <a
                        href={getTelegramEnrollUrl({ course: course.slug, source: "courses_page" })}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(buttonVariants({ variant: "outline" }), "border-white/15 text-white hover:bg-white/10")}
                      >
                        Записаться в Telegram
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
    </PageLayout>
  )
}

