import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button, buttonVariants } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  adminListChatMessages,
  adminListChatThreads,
  adminSendChatMessage,
  clearAdminToken,
  type AdminChatMessage,
  type AdminChatThread,
} from "@/lib/admin"
import { MessageCircle, RefreshCw, Send } from "lucide-react"

function formatWhen(iso: string) {
  const d = new Date(iso.includes("T") ? iso : `${iso.replace(" ", "T")}Z`)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d)
}

function threadLabel(t: AdminChatThread) {
  if (t.user_telegram_username) return `@${t.user_telegram_username}`
  const n = (t.user_name || "").trim()
  if (n) return n
  if (t.linked_login) return t.linked_login
  return `Telegram ${t.telegram_user_id}`
}

export default function AdminChatTab() {
  const navigate = useNavigate()
  const [threads, setThreads] = useState<AdminChatThread[]>([])
  const [selectedTid, setSelectedTid] = useState<number | null>(null)
  const [messages, setMessages] = useState<AdminChatMessage[]>([])
  const [draft, setDraft] = useState("")
  const [loadingThreads, setLoadingThreads] = useState(true)
  const [loadingMsg, setLoadingMsg] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sendErr, setSendErr] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const maxIdRef = useRef(0)

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadThreads = useCallback(async () => {
    setError(null)
    try {
      const d = await adminListChatThreads()
      setThreads(d.threads)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown_error"
      if (msg === "unauthorized" || msg === "forbidden") {
        clearAdminToken()
        navigate("/admin/login")
        return
      }
      setError("Не удалось загрузить диалоги")
    } finally {
      setLoadingThreads(false)
    }
  }, [navigate])

  const loadMessagesFull = useCallback(
    async (tid: number) => {
      setLoadingMsg(true)
      setSendErr(null)
      try {
        const d = await adminListChatMessages(tid, 0)
        setMessages(d.messages)
        const max = d.messages.reduce((m, x) => Math.max(m, x.id), 0)
        maxIdRef.current = max
        setTimeout(scrollToBottom, 80)
      } catch (e) {
        const msg = e instanceof Error ? e.message : "unknown_error"
        if (msg === "unauthorized" || msg === "forbidden") {
          clearAdminToken()
          navigate("/admin/login")
          return
        }
        setSendErr("Не удалось загрузить сообщения")
      } finally {
        setLoadingMsg(false)
      }
    },
    [navigate]
  )

  const pollNew = useCallback(async () => {
    if (selectedTid == null) return
    const after = maxIdRef.current
    try {
      const d = await adminListChatMessages(selectedTid, after)
      if (d.messages.length > 0) {
        setMessages((prev) => [...prev, ...d.messages])
        maxIdRef.current = Math.max(maxIdRef.current, ...d.messages.map((m) => m.id))
        setTimeout(scrollToBottom, 50)
      }
    } catch {
      /* тихий сбой опроса */
    }
  }, [selectedTid])

  useEffect(() => {
    void loadThreads()
  }, [loadThreads])

  useEffect(() => {
    if (selectedTid != null) {
      maxIdRef.current = 0
      void loadMessagesFull(selectedTid)
    } else {
      setMessages([])
    }
  }, [selectedTid, loadMessagesFull])

  useEffect(() => {
    if (selectedTid == null) return
    const t = window.setInterval(() => void pollNew(), 2800)
    return () => clearInterval(t)
  }, [selectedTid, pollNew])

  useEffect(() => {
    const t = window.setInterval(() => void loadThreads(), 12_000)
    return () => clearInterval(t)
  }, [loadThreads])

  const send = async () => {
    if (selectedTid == null || draft.trim().length < 1) return
    setSending(true)
    setSendErr(null)
    try {
      await adminSendChatMessage(selectedTid, draft.trim())
      setDraft("")
      await pollNew()
      await loadThreads()
    } catch (e) {
      const code = e instanceof Error ? e.message : ""
      if (code === "unauthorized" || code === "forbidden") {
        clearAdminToken()
        navigate("/admin/login")
        return
      }
      if (code === "telegram_blocked") setSendErr("Пользователь заблокировал бота.")
      else if (code === "telegram_not_configured") setSendErr("Не задан TELEGRAM_BOT_TOKEN.")
      else if (code === "telegram_chat_not_found") setSendErr("Чат в Telegram недоступен.")
      else if (code === "telegram_timeout") setSendErr("Таймаут Telegram.")
      else setSendErr("Не удалось отправить.")
    } finally {
      setSending(false)
    }
  }

  const selectedThread = threads.find((t) => t.telegram_user_id === selectedTid) ?? null

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-[#131a2b]/70 backdrop-blur-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="font-display text-xl text-white flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-cyan-400" />
              Чат со студентами
            </h2>
            <p className="text-sm text-gray-500 mt-1 max-w-xl">
              Студент получает и отвечает в Telegram. История хранится на сервере; новые сообщения подтягиваются
              автоматически.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="border-white/15 text-white hover:bg-white/10 shrink-0"
            disabled={loadingThreads}
            onClick={() => void loadThreads()}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", loadingThreads && "animate-spin")} />
            Обновить список
          </Button>
        </div>

        {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 mb-4">{error}</div> : null}

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 min-h-[420px]">
          <div className="rounded-xl border border-white/10 bg-black/20 overflow-hidden flex flex-col max-h-[520px] lg:max-h-[min(70vh,560px)]">
            <div className="px-3 py-2 border-b border-white/10 text-xs text-gray-500 uppercase tracking-wide">Диалоги</div>
            <ScrollArea className="flex-1 min-h-[200px]">
              <div className="p-2 space-y-1">
                {loadingThreads && threads.length === 0 ? (
                  <p className="text-gray-500 text-sm p-3">Загрузка…</p>
                ) : threads.length === 0 ? (
                  <p className="text-gray-500 text-sm p-3 leading-relaxed">
                    Пока нет переписок. Отправьте первое сообщение из вкладки «Заявки» — диалог появится здесь; студент сможет
                    ответить в боте.
                  </p>
                ) : (
                  threads.map((t) => {
                    const active = t.telegram_user_id === selectedTid
                    return (
                      <button
                        key={t.telegram_user_id}
                        type="button"
                        onClick={() => setSelectedTid(t.telegram_user_id)}
                        className={cn(
                          "w-full text-left rounded-lg px-3 py-2.5 transition-colors",
                          active ? "bg-cyan-500/15 ring-1 ring-cyan-500/30" : "hover:bg-white/[0.06]"
                        )}
                      >
                        <div className="text-white text-sm font-medium truncate">{threadLabel(t)}</div>
                        <div className="text-[10px] text-gray-600 font-mono mt-0.5">{t.telegram_user_id}</div>
                        <div className="text-xs text-gray-500 line-clamp-2 mt-1">
                          {t.last_direction === "out" ? "Вы: " : ""}
                          {t.last_body}
                        </div>
                        <div className="text-[10px] text-gray-600 mt-1">{formatWhen(t.last_at)}</div>
                      </button>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 flex flex-col min-h-[360px] max-h-[min(70vh,560px)]">
            {selectedTid == null ? (
              <div className="flex-1 flex items-center justify-center text-gray-500 text-sm p-6 text-center">
                Выберите диалог слева или начните с вкладки «Заявки».
              </div>
            ) : (
              <>
                <div className="px-4 py-3 border-b border-white/10 shrink-0">
                  <div className="text-white font-medium">{selectedThread ? threadLabel(selectedThread) : "—"}</div>
                  <div className="text-xs text-gray-500 font-mono">Telegram {selectedTid}</div>
                </div>
                <ScrollArea className="flex-1 min-h-0">
                  <div className="p-4 space-y-3">
                    {loadingMsg ? <p className="text-gray-500 text-sm">Загрузка…</p> : null}
                    {!loadingMsg && messages.length === 0 ? (
                      <p className="text-gray-500 text-sm">Нет сообщений.</p>
                    ) : null}
                    {messages.map((m) => {
                      const out = m.direction === "out"
                      return (
                        <div key={m.id} className={cn("flex", out ? "justify-end" : "justify-start")}>
                          <div
                            className={cn(
                              "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words",
                              out ? "bg-cyan-600/25 text-cyan-50 border border-cyan-500/20" : "bg-white/[0.08] text-gray-200 border border-white/10"
                            )}
                          >
                            <div className="text-[10px] opacity-70 mb-1">{out ? "Вы (сайт → бот)" : "Студент (Telegram)"}</div>
                            {m.body}
                            <div className="text-[10px] text-gray-500 mt-1.5">{formatWhen(m.created_at)}</div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={bottomRef} />
                  </div>
                </ScrollArea>
                <div className="p-3 border-t border-white/10 shrink-0 space-y-2">
                  {sendErr ? <p className="text-xs text-red-300">{sendErr}</p> : null}
                  <div className="flex gap-2 items-end">
                    <Textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Ответ уйдёт в Telegram…"
                      className="min-h-[72px] max-h-32 bg-white/5 border-white/15 text-white placeholder:text-gray-600 resize-y"
                      maxLength={3900}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault()
                          void send()
                        }
                      }}
                    />
                    <button
                      type="button"
                      className={cn(
                        buttonVariants({ variant: "default", size: "icon" }),
                        "h-11 w-11 shrink-0 bg-cyan-600 hover:bg-cyan-500 text-white"
                      )}
                      disabled={sending || draft.trim().length < 1}
                      onClick={() => void send()}
                      title="Отправить (Ctrl+Enter)"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-600">{draft.length} / 3900 · Ctrl+Enter</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
