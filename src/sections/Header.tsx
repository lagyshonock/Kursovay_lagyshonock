import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  BookOpen,
  Building2,
  Code2,
  HelpCircle,
  Menu,
  MessageCircle,
  Newspaper,
  User,
  X,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { clearToken, fetchMe, getToken, type AuthUser } from "@/lib/auth"
import { cn } from "@/lib/utils"

type NavItem =
  | { kind: "route"; label: string; to: string; hint: string; icon: LucideIcon }
  | { kind: "hash"; label: string; hash: string; hint: string; icon: LucideIcon }

const mainNav: NavItem[] = [
  { kind: "route", label: "Курсы", hint: "Программы и направления", to: "/courses", icon: BookOpen },
  { kind: "route", label: "О платформе", hint: "Как устроено обучение", to: "/about", icon: Building2 },
  { kind: "route", label: "База знаний", hint: "Статьи и гайды", to: "/blog", icon: Newspaper },
  { kind: "hash", label: "Вопросы", hint: "Частые вопросы", hash: "#faq", icon: HelpCircle },
]

function navItemActive(item: NavItem, pathname: string): boolean {
  if (item.kind === "hash") return pathname === "/"
  if (item.to === "/") return pathname === "/"
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (!getToken()) {
      setUser(null)
      return
    }
    fetchMe()
      .then((d) =>
        setUser({
          id: d.user.id,
          name: d.user.name,
          email: d.user.email,
          account_login: d.user.account_login,
          telegram_id: d.user.telegram_id,
          telegram_username: d.user.telegram_username,
          has_password: d.user.has_password,
        })
      )
      .catch(() => setUser(null))
  }, [location.pathname])

  const goNav = (item: NavItem) => {
    setIsMobileMenuOpen(false)
    if (item.kind === "route") {
      navigate(item.to)
      return
    }
    const href = item.hash
    if (location.pathname !== "/") {
      navigate(`/${href}`)
      return
    }
    const element = document.querySelector(href)
    if (element) element.scrollIntoView({ behavior: "smooth" })
  }

  const displayName = user?.telegram_username
    ? `@${user.telegram_username}`
    : user?.account_login
      ? user.account_login
      : user?.name || "Аккаунт"

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled ? "bg-[#0a0f1a]/90 backdrop-blur-xl border-b border-white/5" : "bg-transparent"
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link
            to="/"
            className="flex items-center gap-3 group shrink-0"
            onClick={() => {
              setIsMobileMenuOpen(false)
              window.scrollTo({ top: 0, behavior: "smooth" })
            }}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-violet-600 to-cyan-500 flex items-center justify-center shadow-[0_0_24px_-4px_rgba(139,92,246,0.55)] group-hover:shadow-[0_0_28px_-2px_rgba(34,211,238,0.35)] transition-shadow duration-300 ring-1 ring-white/20">
                <Code2 className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0a0f1a] shadow-[0_0_8px_rgba(52,211,153,0.7)]" aria-hidden />
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <span className="font-display text-lg text-white tracking-tight block">IT Курсы</span>
              <span className="text-[11px] text-gray-500 font-medium tracking-wide">онлайн‑школа · практика и менторы</span>
            </div>
          </Link>

          <nav
            className="hidden lg:flex items-stretch rounded-2xl border border-white/[0.12] bg-gradient-to-b from-white/[0.07] to-white/[0.02] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_32px_-12px_rgba(0,0,0,0.65)] px-1.5 py-1.5 gap-0.5 max-w-[min(62vw,640px)] xl:max-w-none overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Основное меню"
          >
            {mainNav.map((item) => {
              const Icon = item.icon
              const active = navItemActive(item, location.pathname)
              return (
                <button
                  key={item.kind === "route" ? item.to : item.hash}
                  type="button"
                  onClick={() => goNav(item)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 xl:px-3.5 py-2 rounded-xl text-left transition-all duration-200 shrink-0 min-w-0",
                    "hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40",
                    active
                      ? "bg-white/[0.11] shadow-[inset_0_0_0_1px_rgba(34,211,238,0.22)] text-white"
                      : "text-gray-300 hover:text-white"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors",
                      active
                        ? "border-cyan-500/35 bg-cyan-500/15 text-cyan-300"
                        : "border-white/10 bg-white/[0.04] text-gray-400 group-hover:text-gray-200"
                    )}
                  >
                    <Icon className="w-[18px] h-[18px]" aria-hidden />
                  </span>
                  <span className="flex flex-col min-w-0">
                    <span className="text-[13px] font-semibold text-white leading-tight truncate">{item.label}</span>
                    <span className="text-[10px] text-gray-500 leading-snug truncate max-w-[9.5rem] xl:max-w-[11rem]">
                      {item.hint}
                    </span>
                  </span>
                </button>
              )
            })}
            <span className="w-px self-stretch my-2 bg-gradient-to-b from-transparent via-white/15 to-transparent shrink-0 mx-0.5" aria-hidden />
            <button
              type="button"
              onClick={() => {
                navigate("/contact")
              }}
              className={cn(
                "flex items-center gap-2.5 px-3 xl:px-3.5 py-2 rounded-xl text-left transition-all duration-200 shrink-0",
                "hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40",
                location.pathname === "/contact"
                  ? "bg-white/[0.11] shadow-[inset_0_0_0_1px_rgba(34,211,238,0.22)] text-white"
                  : "text-gray-300 hover:text-white"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors",
                  location.pathname === "/contact"
                    ? "border-cyan-500/35 bg-cyan-500/15 text-cyan-300"
                    : "border-white/10 bg-white/[0.04] text-gray-400"
                )}
              >
                <MessageCircle className="w-[18px] h-[18px]" aria-hidden />
              </span>
              <span className="flex flex-col min-w-0">
                <span className="text-[13px] font-semibold leading-tight truncate">Контакты</span>
                <span className="text-[10px] text-gray-500 leading-snug truncate max-w-[9.5rem] xl:max-w-[11rem]">
                  Связаться со школой
                </span>
              </span>
            </button>
          </nav>

          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {user ? (
              <div className="flex items-center gap-2 pl-1">
                <button
                  type="button"
                  onClick={() => navigate("/profile")}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.12] text-sm text-gray-200 max-w-[220px] hover:bg-white/[0.09] hover:border-white/20 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 shrink-0">
                    <User className="w-4 h-4 text-cyan-300" />
                  </span>
                  <span className="flex flex-col items-start min-w-0 text-left">
                    <span className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">Кабинет</span>
                    <span className="truncate text-[13px] text-white font-medium w-full">{displayName}</span>
                  </span>
                </button>
                <Button
                  variant="ghost"
                  className="text-gray-400 hover:text-white hover:bg-white/5 text-sm px-3"
                  onClick={() => {
                    clearToken()
                    setUser(null)
                    navigate("/")
                  }}
                >
                  Выйти
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1 rounded-2xl border border-white/[0.10] bg-white/[0.03] p-1 pl-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <Button
                  variant="ghost"
                  className="text-gray-300 hover:text-white hover:bg-white/5 text-sm h-9 px-4"
                  onClick={() => navigate("/login")}
                >
                  Войти
                </Button>
                <Button
                  className="h-9 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white border-0 shadow-[0_4px_20px_-4px_rgba(139,92,246,0.5)] text-sm font-medium"
                  onClick={() => navigate("/register")}
                >
                  Регистрация
                </Button>
              </div>
            )}
          </div>

          <button
            type="button"
            className="lg:hidden p-2 text-gray-300 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-expanded={isMobileMenuOpen}
            aria-label="Меню"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <div
        className={`lg:hidden absolute top-full left-0 right-0 bg-[#0a0f1a]/95 backdrop-blur-xl border-b border-white/5 transition-all duration-300 ${
          isMobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <nav className="flex flex-col p-4 space-y-1 max-h-[70vh] overflow-y-auto">
          {mainNav.map((item) => (
            <button
              key={item.kind === "route" ? item.to : item.hash}
              type="button"
              onClick={() => goNav(item)}
              className="text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors duration-300"
            >
              {item.label}
            </button>
          ))}
          <Link
            to="/contact"
            className="text-left px-4 py-3 text-cyan-400/90 hover:text-cyan-300 hover:bg-white/5 rounded-lg text-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Контакты
          </Link>
          <div className="flex flex-col gap-2 pt-4 border-t border-white/10">
            {user ? (
              <>
                <button
                  type="button"
                  className="text-left px-4 py-3 text-gray-200 hover:bg-white/5 rounded-lg w-full flex items-center gap-2"
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    navigate("/profile")
                  }}
                >
                  <User className="w-4 h-4 text-cyan-400" />
                  <span className="truncate">{displayName}</span>
                </button>
                <Button
                  variant="ghost"
                  className="w-full justify-center"
                  onClick={() => {
                    clearToken()
                    setUser(null)
                    setIsMobileMenuOpen(false)
                  }}
                >
                  Выйти
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" className="w-full justify-center" onClick={() => navigate("/login")}>
                  Войти
                </Button>
                <Button
                  className="w-full justify-center bg-gradient-to-r from-purple-600 to-purple-500 text-white border-0"
                  onClick={() => navigate("/register")}
                >
                  Регистрация
                </Button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
