import { useEffect, useState } from "react"
import { fetchPublicStats, type PublicStats } from "@/lib/public-stats"
import { BookOpen, Eye, TrendingUp, Users } from "lucide-react"

function StatCard({
  icon: Icon,
  value,
  label,
  suffix = "",
}: {
  icon: typeof Users
  value: string | number
  label: string
  suffix?: string
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#131a2b]/40 p-5 text-center">
      <div className="inline-flex p-2.5 rounded-lg bg-white/[0.06] text-gray-400 mb-3">
        <Icon className="w-5 h-5" aria-hidden />
      </div>
      <div className="font-display text-2xl sm:text-3xl text-white tabular-nums">
        {value}
        {suffix ? <span className="text-xl text-cyan-400/90">{suffix}</span> : null}
      </div>
      <p className="text-sm text-gray-400 mt-2">{label}</p>
    </div>
  )
}

export default function StatsSection() {
  const [stats, setStats] = useState<PublicStats | null>(null)

  useEffect(() => {
    void fetchPublicStats().then(setStats)
  }, [])

  if (!stats) {
    return (
      <section className="py-14 border-t border-white/10" aria-label="Статистика платформы">
        <div className="max-w-5xl mx-auto px-4 text-center text-gray-600 text-sm">Загрузка…</div>
      </section>
    )
  }

  return (
    <section id="stats" className="py-14 border-t border-white/10 scroll-mt-24" aria-labelledby="stats-heading">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 id="stats-heading" className="font-display text-2xl sm:text-3xl text-white">
            Сейчас в платформе
          </h2>
          <p className="text-gray-500 text-sm mt-2">Цифры обновляются автоматически.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard icon={BookOpen} value={stats.courses} label="Курсов" />
          <StatCard icon={Users} value={stats.studentsOnPlatform} label="Пользователей" />
          <StatCard icon={TrendingUp} value={stats.enrollments} label="Заявок" />
          <StatCard icon={Eye} value={stats.totalViews} label="Просмотров" />
        </div>

        <p className="text-center text-xs text-gray-600 mt-8">
          Поддержка: {stats.supportHours}
        </p>
      </div>
    </section>
  )
}
