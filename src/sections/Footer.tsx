import { Code2, Youtube } from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"

/** Маршрут или якорь на главной — union, чтобы `Link to` не был `string | undefined`. */
type FooterColumnLink = { label: string; to: string } | { label: string; hash: string }

const footerLinks: {
  product: { label: string; to: string }[]
  company: FooterColumnLink[]
  support: FooterColumnLink[]
} = {
  product: [
    { label: "Все курсы", to: "/courses" },
    { label: "О платформе", to: "/about" },
    { label: "База знаний", to: "/blog" },
    { label: "Карьера", to: "/careers" },
  ],
  company: [
    { label: "Контакты", to: "/contact" },
    { label: "Показатели", hash: "#stats" },
  ],
  support: [
    { label: "FAQ", hash: "#faq" },
    { label: "Политика конфиденциальности", to: "/privacy" },
    { label: "Условия использования", to: "/terms" },
  ],
}

const socialLinks = [
  {
    label: "Telegram",
    href: "https://t.me/itcourses",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "#",
    icon: <Youtube className="w-5 h-5" />,
  },
  {
    label: "VK",
    href: "#",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.523-2.049-1.714-1.033-1.033-1.49-1.172-1.744-1.172-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4 8.673 4 8.231c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.678.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.049.17.491-.085.745-.576.745z" />
      </svg>
    ),
  },
]

export default function Footer() {
  const navigate = useNavigate()
  const location = useLocation()

  const goHash = (hash: string) => {
    if (location.pathname !== "/") {
      navigate(`/${hash}`)
      return
    }
    const element = document.querySelector(hash)
    if (element) element.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <footer className="relative border-t border-white/10">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
            {/* Логотип и соцсети */}
            <div className="lg:col-span-2">
              <Link
                to="/"
                className="flex items-center gap-2 mb-6"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                  <Code2 className="w-5 h-5 text-white" />
                </div>
                <span className="font-display text-xl text-white">IT Курсы</span>
              </Link>
              <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-sm">
                Образовательная платформа полного цикла: каталог программ, личный кабинет через Telegram, аналитика для команды и
                бот для заявок 24/7.
              </p>

              <div className="flex gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300"
                    aria-label={social.label}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Продукт */}
            <div>
              <h4 className="font-display text-white mb-4">Продукт</h4>
              <ul className="space-y-3">
                {footerLinks.product.map((link) =>
                  link.to ? (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ) : null
                )}
              </ul>
            </div>

            {/* Компания */}
            <div>
              <h4 className="font-display text-white mb-4">Компания</h4>
              <ul className="space-y-3">
                {footerLinks.company.map((link) =>
                  "to" in link ? (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ) : (
                    <li key={link.label}>
                      <button
                        type="button"
                        onClick={() => goHash(link.hash)}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        {link.label}
                      </button>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Поддержка */}
            <div>
              <h4 className="font-display text-white mb-4">Правовая информация</h4>
              <ul className="space-y-3">
                {footerLinks.support.map((link) =>
                  "to" in link ? (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ) : (
                    <li key={link.label}>
                      <button
                        type="button"
                        onClick={() => goHash(link.hash)}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        {link.label}
                      </button>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">© {new Date().getFullYear()} IT Курсы · Учебный / демо-проект</p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Связаться:</span>
              <Link to="/contact" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                Контакты
              </Link>
              <span className="text-gray-600">·</span>
              <a
                href="https://t.me/itcourses"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
              >
                Telegram
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}