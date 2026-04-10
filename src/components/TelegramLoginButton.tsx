import { useEffect, useRef } from "react"

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramWidgetUser) => void
  }
}

export type TelegramWidgetUser = {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

type Props = {
  botUsername: string
  onAuth: (user: TelegramWidgetUser) => void
}

export function TelegramLoginButton({ botUsername, onAuth }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.onTelegramAuth = (user) => onAuth(user)
    const el = containerRef.current
    if (!el) return

    const script = document.createElement("script")
    script.src = "https://telegram.org/js/telegram-widget.js?22"
    script.async = true
    script.setAttribute("data-telegram-login", botUsername)
    script.setAttribute("data-size", "large")
    script.setAttribute("data-radius", "12")
    script.setAttribute("data-onauth", "onTelegramAuth(user)")
    script.setAttribute("data-request-access", "write")
    el.innerHTML = ""
    el.appendChild(script)

    return () => {
      delete window.onTelegramAuth
      el.innerHTML = ""
    }
  }, [botUsername, onAuth])

  return <div ref={containerRef} className="flex justify-center [&_iframe]:rounded-xl" />
}
