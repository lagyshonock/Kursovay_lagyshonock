import { Link } from "react-router-dom"
import { Clock, Users, ArrowRight } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn, courseDisplayTitle } from "@/lib/utils"
import type { Course } from "@/lib/courses-api"

const colorMap: Record<string, { border: string; badge: string }> = {
  purple: { border: "hover:border-purple-500/35", badge: "bg-purple-500/15 text-purple-200" },
  cyan: { border: "hover:border-cyan-500/35", badge: "bg-cyan-500/15 text-cyan-200" },
  yellow: { border: "hover:border-yellow-500/35", badge: "bg-yellow-500/15 text-yellow-200" },
  green: { border: "hover:border-green-500/35", badge: "bg-green-500/15 text-green-200" },
  red: { border: "hover:border-red-500/35", badge: "bg-red-500/15 text-red-200" },
}

type Props = {
  courses: Course[]
  loading?: boolean
}

export default function HomeCoursesSection({ courses, loading }: Props) {
  return (
    <section id="courses" className="relative py-16 lg:py-20 border-t border-white/5">
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="font-display text-2xl sm:text-3xl text-white mb-3">Другие курсы</h2>
          <p className="text-gray-500 text-sm">Короткий список — полный каталог по ссылке ниже</p>
        </div>

        {loading ? (
          <p className="text-center text-gray-600 py-10 text-sm">Загрузка…</p>
        ) : courses.length === 0 ? (
          <p className="text-center text-gray-600 py-10 text-sm">Курсы скоро появятся здесь.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {courses.map((course) => (
              <div
                key={course.id}
                className={cn(
                  "rounded-xl overflow-hidden border border-white/10 bg-[#131a2b]/50 transition-colors",
                  colorMap[course.color]?.border || colorMap.purple.border
                )}
              >
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={course.image}
                    alt={courseDisplayTitle(course.title, course.slug)}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#131a2b] to-transparent" />
                  <div
                    className={cn(
                      "absolute top-3 left-3 px-2.5 py-0.5 rounded-md text-xs font-medium",
                      colorMap[course.color]?.badge || colorMap.purple.badge
                    )}
                  >
                    {course.level}
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-display text-lg text-white mb-2 leading-snug break-words">{courseDisplayTitle(course.title, course.slug)}</h3>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">{course.description}</p>

                  <div className="flex items-center gap-4 text-xs text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{course.students}</span>
                    </div>
                  </div>

                  <Link
                    to={`/courses/${course.slug}`}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "sm" }),
                      "w-full justify-between text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <span>Подробнее</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <Link
            to="/courses"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "border-white/15 text-gray-200 hover:bg-white/5"
            )}
          >
            Все курсы
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    </section>
  )
}
