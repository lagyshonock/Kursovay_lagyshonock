import PageLayout from "@/components/PageLayout"
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react"
import { fetchPublicStats, type PublicStats } from "@/lib/public-stats"
import { useEffect, useState } from "react"

export default function ContactPage() {
  const [stats, setStats] = useState<PublicStats | null>(null)
  useEffect(() => {
    void fetchPublicStats().then(setStats)
  }, [])

  return (
    <PageLayout title="Контакты" description="Центральные точки входа: поддержка учеников, партнёрства и пресса.">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#131a2b]/50 p-6 flex gap-4">
            <MessageCircle className="w-6 h-6 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-display text-lg text-white">Telegram</h2>
              <p className="text-sm text-gray-400 mt-1">Быстрые вопросы и запись через бота — с сайта или по прямой ссылке.</p>
              <p className="text-sm text-cyan-400 mt-3">@itcourses — демо-аккаунт в футере</p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#131a2b]/50 p-6 flex gap-4">
            <Mail className="w-6 h-6 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-display text-lg text-white">Электронная почта</h2>
              <p className="text-sm text-gray-400 mt-1">Для деловой переписки и корпоративных запросов.</p>
              <p className="text-sm text-white mt-3 font-mono">hello@it-courses.demo</p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#131a2b]/50 p-6 flex gap-4">
            <Phone className="w-6 h-6 text-green-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-display text-lg text-white">Телефон горячей линии</h2>
              <p className="text-sm text-gray-400 mt-1">Учебный проект — подставьте реальный номер при деплое.</p>
              <p className="text-sm text-white mt-3 font-mono">+7 (800) 000-00-00</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#131a2b] to-[#0d1424] p-8">
          <div className="flex items-start gap-3 mb-6">
            <MapPin className="w-6 h-6 text-cyan-400 shrink-0" />
            <div>
              <h2 className="font-display text-lg text-white">Штаб-квартира (витрина)</h2>
              <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                Москва, деловой кластер «Сириус» — условный адрес для презентаций. Фактически проект может хоститься где угодно.
              </p>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Часы работы поддержки</p>
            <p className="text-white font-medium">{stats?.supportHours ?? "9:00–21:00 МСК"}</p>
            <p className="text-sm text-gray-400 mt-4">
              Среднее время первого ответа в рабочие дни — до 2 часов. Сложные кейсы эскалируются в команду менторов.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
