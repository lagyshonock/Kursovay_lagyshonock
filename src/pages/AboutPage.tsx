import { Link } from "react-router-dom"
import PageLayout from "@/components/PageLayout"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Bot, GraduationCap, LineChart, Shield, Users } from "lucide-react"

const pillars = [
  {
    icon: GraduationCap,
    title: "Практика вместо лекций",
    text: "Каждая программа завязана на проекты и задачи, которые можно показать работодателю.",
  },
  {
    icon: Bot,
    title: "Telegram как часть продукта",
    text: "Запись через бота, уведомления администраторам и единая база заявок — без разрозненных форм.",
  },
  {
    icon: LineChart,
    title: "Прозрачная аналитика",
    text: "Просмотры курсов и заявки агрегируются в админ-панели: видно, какие направления интересуют аудиторию.",
  },
  {
    icon: Shield,
    title: "Данные под контролем",
    text: "PostgreSQL в Supabase + собственный API: данные в облаке, бэкенд под вашим контролем.",
  },
  {
    icon: Users,
    title: "Менторская модель",
    text: "Наставники ведут группы, дают разборы и помогают с трудоустройством на финальном этапе.",
  },
]

export default function AboutPage() {
  return (
    <PageLayout
      title="О платформе"
      description="Образовательный хаб для IT-направлений: каталог программ, личный кабинет через Telegram и админка для команды."
    >
      <div className="space-y-16">
        <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/10 via-transparent to-cyan-500/10 p-8 sm:p-10">
          <p className="text-gray-300 leading-relaxed text-lg">
            <strong className="text-white">IT Курсы</strong> — это демонстрационный «крупный» продукт: лендинг, каталог с динамическими
            карточками, детальные страницы программ, регистрация через Telegram Login, бот для лидов и веб-админка с графиками.
            Архитектура рассчитана на то, чтобы проект смотрелся цельно в портфолио и курсовой работе.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link to="/courses" className={cn(buttonVariants({ variant: "default" }), "bg-gradient-to-r from-cyan-500 to-cyan-400 text-white border-0")}>
              Смотреть каталог
            </Link>
            <Link to="/contact" className={cn(buttonVariants({ variant: "outline" }), "border-white/15 text-white hover:bg-white/10")}>
              Связаться
            </Link>
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl text-white mb-8">Как устроена платформа</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pillars.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-[#131a2b]/50 p-6 flex gap-4">
                <div className="shrink-0 w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-cyan-400">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg text-white">{title}</h3>
                  <p className="text-sm text-gray-400 mt-2 leading-relaxed">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 p-8 bg-[#131a2b]/30">
          <h2 className="font-display text-2xl text-white mb-4">Дорожная карта (витрина)</h2>
          <ul className="space-y-3 text-gray-400 text-sm">
            <li>• Мобильное приложение для учеников (в планах)</li>
            <li>• Сертификаты с проверкой по QR</li>
            <li>• Корпоративные кабинеты для B2B</li>
            <li>• Расширенная LMS с трекингом домашних заданий</li>
          </ul>
        </section>
      </div>
    </PageLayout>
  )
}
