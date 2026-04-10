import { Button } from "../components/ui/button"
import { getTelegramEnrollUrl } from "@/lib/telegram"

export default function CTA() {
  return (
    <section className="relative py-16 lg:py-20 border-t border-white/5">
      <div className="max-w-xl mx-auto text-center px-4 sm:px-6">
        <h2 className="font-display text-2xl sm:text-3xl text-white mb-3">Записаться</h2>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          Откроется Telegram-бот: выберите курс кнопкой и оставьте контакт — это пара сообщений.
        </p>
        <Button
          size="lg"
          className="bg-cyan-600 hover:bg-cyan-500 text-white border-0 text-base px-8"
          onClick={() => window.open(getTelegramEnrollUrl({ source: "cta" }), "_blank")}
        >
          Открыть бота
        </Button>
      </div>
    </section>
  )
}
