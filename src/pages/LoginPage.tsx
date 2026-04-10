import { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Link } from "react-router-dom"
import { TelegramLoginButton, type TelegramWidgetUser } from "@/components/TelegramLoginButton"
import { loginWithPassword, loginWithTelegram, setToken } from "@/lib/auth"

const BOT_USER = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || "cursovay_lagyshonock_bot"

export default function LoginPage() {
  const navigate = useNavigate()
  const [login, setLogin] = useState("")
  const [password, setPassword] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [formBusy, setFormBusy] = useState(false)

  const onTelegramAuth = useCallback(
    async (user: TelegramWidgetUser) => {
      const { token, user: u } = await loginWithTelegram(user as unknown as Record<string, unknown>)
      setToken(token)
      navigate("/", { replace: true })
      void u
    },
    [navigate]
  )

  const onEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFormBusy(true)
    try {
      const { token } = await loginWithPassword(login, password)
      setToken(token)
      navigate("/", { replace: true })
    } catch (err) {
      const code = err instanceof Error ? err.message : ""
      if (code === "invalid_credentials") setFormError("Неверный логин или пароль")
      else setFormError("Не удалось войти")
    } finally {
      setFormBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#131a2b]/80 backdrop-blur-sm p-6 sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="font-display text-3xl text-white">Вход</h1>
          <p className="text-gray-400 mt-2">
            Через Telegram или по логину и паролю: логин — твой Telegram @ник или служебный вид user_… из бота; при
            регистрации на сайте можно ввести e-mail.
          </p>
        </div>

        <div className="flex justify-center mb-6">
          <TelegramLoginButton botUsername={BOT_USER} onAuth={onTelegramAuth} />
        </div>

        <p className="text-xs text-gray-500 text-center mb-6">
          Нажимая «Log in», ты разрешаешь сайту получить имя и username из Telegram (официальный виджет Telegram).
        </p>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center" aria-hidden>
            <span className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wide">
            <span className="bg-[#131a2b] px-3 text-gray-500">или логин</span>
          </div>
        </div>

        <form onSubmit={(e) => void onEmailLogin(e)} className="space-y-3 mb-6">
          {formError ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{formError}</div>
          ) : null}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400">Логин (ник из Telegram / user_… или e-mail)</label>
            <input
              type="text"
              name="username"
              autoComplete="username"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="ivan_dev или ivan@mail.com"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-cyan-400/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400">Пароль</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
            />
          </div>
          <button
            type="submit"
            disabled={formBusy}
            className={cn(
              buttonVariants({ variant: "default" }),
              "w-full bg-gradient-to-r from-cyan-600 to-cyan-500 text-white border-0 disabled:opacity-50"
            )}
          >
            {formBusy ? "Входим…" : "Войти"}
          </button>
        </form>

        <div className="flex items-center justify-between text-sm text-gray-400">
          <Link to="/" className={cn(buttonVariants({ variant: "ghost" }), "text-gray-400 hover:text-white")}>
            На главную
          </Link>
          <Link to="/register" className="text-cyan-300 hover:text-cyan-200 transition-colors">
            Регистрация
          </Link>
        </div>
      </div>
    </div>
  )
}
