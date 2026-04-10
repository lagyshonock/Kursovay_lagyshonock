import { useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getTelegramEnrollUrl } from "@/lib/telegram"
import { TelegramLoginButton, type TelegramWidgetUser } from "@/components/TelegramLoginButton"
import { loginWithTelegram, setToken } from "@/lib/auth"

const BOT_USER = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || "cursovay_lagyshonock_bot"

export default function RegisterPage() {
  const navigate = useNavigate()

  const onTelegramAuth = useCallback(
    async (user: TelegramWidgetUser) => {
      const { token } = await loginWithTelegram(user as unknown as Record<string, unknown>)
      setToken(token)
      navigate("/courses", { replace: true })
    },
    [navigate]
  )

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#131a2b]/80 backdrop-blur-sm p-6 sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="font-display text-3xl text-white">Регистрация</h1>
          <p className="text-gray-400 mt-2">Создай аккаунт через Telegram — один клик, без почты и пароля.</p>
        </div>

        <div className="flex justify-center mb-6">
          <TelegramLoginButton botUsername={BOT_USER} onAuth={onTelegramAuth} />
        </div>

        <p className="text-xs text-gray-500 text-center mb-6">
          Первый вход через Telegram автоматически создаёт аккаунт в системе.
        </p>

        <div className="mt-6 text-sm text-gray-400 flex items-center justify-between">
          <Link to="/login" className="text-cyan-300 hover:text-cyan-200 transition-colors">
            Уже есть аккаунт? Войти
          </Link>
          <Link to="/" className="hover:text-white transition-colors">
            На главную
          </Link>
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-gray-300">Записаться на курс без аккаунта</div>
          <a
            href={getTelegramEnrollUrl({ source: "register_page" })}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline" }), "mt-3 w-full justify-center border-white/15 text-white hover:bg-white/10")}
          >
            Открыть Telegram-бота
          </a>
        </div>
      </div>
    </div>
  )
}
