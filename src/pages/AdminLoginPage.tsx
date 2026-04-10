import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { adminLogin, setAdminToken } from "@/lib/admin"

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => password.trim().length >= 1, [password])

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#131a2b]/80 backdrop-blur-sm p-6 sm:p-8">
        <h1 className="font-display text-3xl text-white">Админ вход</h1>
        <p className="text-gray-400 mt-2">Введи пароль администратора из `.env` (переменная `ADMIN_PASSWORD`).</p>

        <form
          className="space-y-4 mt-6"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!canSubmit) return
            setError(null)
            setIsSubmitting(true)
            try {
              const { token } = await adminLogin(password)
              setAdminToken(token)
              navigate("/admin")
            } catch (e) {
              const msg = e instanceof Error ? e.message : "unknown_error"
              setError(msg === "invalid_credentials" ? "Неверный пароль" : "Не удалось войти")
            } finally {
              setIsSubmitting(false)
            }
          }}
        >
          <div className="space-y-2">
            <label className="text-sm text-gray-300">Пароль</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
            />
          </div>

          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "w-full justify-center bg-gradient-to-r from-cyan-500 to-cyan-400 text-white border-0 disabled:opacity-60"
            )}
          >
            {isSubmitting ? "Входим..." : "Войти"}
          </button>
        </form>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  )
}

