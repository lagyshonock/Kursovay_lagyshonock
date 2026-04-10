import { Cpu, Database, Globe, Layers, Shield, Zap } from "lucide-react"

const partners = [
  { name: "CloudStack", hint: "Инфраструктура" },
  { name: "DevHub", hint: "CI/CD" },
  { name: "DataForge", hint: "Аналитика" },
  { name: "SecureLab", hint: "Безопасность" },
  { name: "LearnOS", hint: "LMS" },
]

const stack = [
  { icon: Globe, label: "Web & API" },
  { icon: Database, label: "Data & SQL" },
  { icon: Cpu, label: "ML основы" },
  { icon: Shield, label: "DevSecOps" },
  { icon: Layers, label: "Системный дизайн" },
  { icon: Zap, label: "Автоматизация" },
]

export default function EcosystemSection() {
  return (
    <section className="py-20 border-t border-white/10" aria-labelledby="eco-heading">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-purple-400 text-sm font-medium tracking-wider uppercase mb-3">Экосистема</p>
          <h2 id="eco-heading" className="font-display text-3xl sm:text-4xl text-white">
            Интеграции и технологический контур
          </h2>
          <p className="text-gray-400 mt-3">
            Мы строим обучение вокруг реальных инструментов индустрии: от хостинга и пайплайнов до аналитики и защиты
            данных.
          </p>
        </div>

        <div className="mb-14">
          <p className="text-center text-xs text-gray-500 uppercase tracking-widest mb-6">Технологические партнёры</p>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {partners.map((p) => (
              <div
                key={p.name}
                className="px-5 py-3 rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent hover:border-purple-500/30 transition-colors min-w-[140px] text-center"
              >
                <div className="font-display text-white text-sm">{p.name}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">{p.hint}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {stack.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/5 bg-[#131a2b]/40 text-center"
            >
              <Icon className="w-5 h-5 text-cyan-400/90" aria-hidden />
              <span className="text-xs text-gray-300 leading-tight">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
