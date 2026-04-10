import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  adminGrantEnrollmentAccess,
  adminListEnrollments,
  adminMessageEnrollment,
  clearAdminToken,
  type AdminEnrollmentRow,
} from "@/lib/admin"
import { KeyRound, MessageCircle, RefreshCw, Send } from "lucide-react"

function formatWhen(iso: string) {
  const d = new Date(iso.includes("T") ? iso : `${iso.replace(" ", "T")}Z`)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d)
}

function studentLabel(e: AdminEnrollmentRow) {
  const name = [e.telegram_first_name, e.telegram_last_name].filter(Boolean).join(" ").trim()
  if (e.telegram_username) return `@${e.telegram_username}`
  if (name) return name
  return `id ${e.telegram_user_id}`
}

export default function AdminEnrollmentsTab() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<AdminEnrollmentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [pick, setPick] = useState<AdminEnrollmentRow | null>(null)
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [sendErr, setSendErr] = useState<string | null>(null)
  const [sentOk, setSentOk] = useState<string | null>(null)
  const [grantBusy, setGrantBusy] = useState<number | null>(null)
  const [grantMsg, setGrantMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const d = await adminListEnrollments(120)
      setRows(d.enrollments)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown_error"
      if (msg === "unauthorized" || msg === "forbidden") {
        clearAdminToken()
        navigate("/admin/login")
        return
      }
      setError("Не удалось загрузить заявки")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [navigate])

  useEffect(() => {
    void load()
  }, [load])

  const openCompose = (e: AdminEnrollmentRow) => {
    setPick(e)
    setDraft("")
    setSendErr(null)
    setDialogOpen(true)
  }

  const grantAccess = async (e: AdminEnrollmentRow) => {
    if (!e.linked_user_id || !e.course_slug) return
    setGrantBusy(e.id)
    setGrantMsg(null)
    try {
      await adminGrantEnrollmentAccess(e.id)
      setGrantMsg(`Доступ к «${e.course_title || e.course_slug}» выдан (${studentLabel(e)})`)
      await load()
    } catch (err) {
      const code = err instanceof Error ? err.message : ""
      if (code === "no_linked_user")
        setGrantMsg("Нет аккаунта на сайте с таким Telegram — пусть войдёт через бота, затем повторите.")
      else if (code === "already_granted") setGrantMsg("Доступ уже был выдан ранее.")
      else if (code === "course_not_found") setGrantMsg("Курс не найден по slug.")
      else if (code === "unauthorized" || code === "forbidden") {
        clearAdminToken()
        navigate("/admin/login")
      } else setGrantMsg("Не удалось выдать доступ.")
    } finally {
      setGrantBusy(null)
    }
  }

  const send = async () => {
    if (!pick || draft.trim().length < 1) return
    setSending(true)
    setSendErr(null)
    try {
      await adminMessageEnrollment(pick.id, draft.trim())
      setSentOk(`Сообщение отправлено: ${studentLabel(pick)}`)
      setDialogOpen(false)
      setPick(null)
      setDraft("")
    } catch (e) {
      const code = e instanceof Error ? e.message : ""
      if (code === "unauthorized" || code === "forbidden") {
        clearAdminToken()
        navigate("/admin/login")
        return
      }
      if (code === "telegram_blocked") setSendErr("Пользователь заблокировал бота — написать нельзя.")
      else if (code === "telegram_not_configured") setSendErr("На сервере не задан TELEGRAM_BOT_TOKEN.")
      else if (code === "telegram_chat_not_found") setSendErr("Чат не найден (неверный ID или пользователь не писал боту).")
      else if (code === "telegram_timeout") setSendErr("Telegram не ответил вовремя. Попробуйте ещё раз.")
      else if (code === "no_telegram_id") setSendErr("У заявки нет Telegram ID — написать нельзя.")
      else setSendErr("Не удалось отправить. Если в терминале был перезапуск API — повторите; не сохраняйте файлы в server/ во время отправки.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      {sentOk ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 flex justify-between gap-3 items-center">
          <span>{sentOk}</span>
          <button type="button" className="text-emerald-200/80 hover:text-white text-xs underline" onClick={() => setSentOk(null)}>
            Скрыть
          </button>
        </div>
      ) : null}

      {grantMsg ? (
        <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100 flex justify-between gap-3 items-center">
          <span>{grantMsg}</span>
          <button type="button" className="text-cyan-200/80 hover:text-white text-xs underline" onClick={() => setGrantMsg(null)}>
            Скрыть
          </button>
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-[#131a2b]/70 backdrop-blur-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-xl text-white">Заявки на курсы</h2>
            <p className="text-sm text-gray-500 mt-1">
              Сообщение уйдёт в Telegram от бота; ответ студент может написать в боте — он появится во вкладке «Чат». Нужны тот же{" "}
              <span className="font-mono text-gray-400">TELEGRAM_BOT_TOKEN</span> и чтобы пользователь уже общался с ботом.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="border-white/15 text-white hover:bg-white/10 shrink-0"
            disabled={refreshing}
            onClick={() => {
              setRefreshing(true)
              void load()
            }}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
            Обновить
          </Button>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 mb-4">{error}</div>
        ) : null}

        {loading ? (
          <p className="text-gray-500 py-12 text-center">Загрузка…</p>
        ) : rows.length === 0 ? (
          <p className="text-gray-500 py-12 text-center text-sm">Заявок пока нет.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm text-left min-w-[720px]">
              <thead>
                <tr className="text-gray-500 border-b border-white/10 bg-white/[0.03]">
                  <th className="py-3 px-4 font-medium">Когда</th>
                  <th className="py-3 px-4 font-medium">Студент</th>
                  <th className="py-3 px-4 font-medium">Курс</th>
                  <th className="py-3 px-4 font-medium">Контакт</th>
                  <th className="py-3 px-4 font-medium w-[200px]" />
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id} className="border-b border-white/5 text-gray-300 hover:bg-white/[0.02]">
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{formatWhen(e.created_at)}</td>
                    <td className="py-3 px-4">
                      <div className="text-white">{studentLabel(e)}</div>
                      <div className="text-xs text-gray-600 font-mono mt-0.5">{e.telegram_user_id}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-gray-200">{e.course_title || "—"}</div>
                      {e.course_slug ? <div className="text-xs text-gray-600 font-mono">{e.course_slug}</div> : null}
                    </td>
                    <td className="py-3 px-4 max-w-[220px]">
                      {e.phone ? <div className="text-xs">{e.phone}</div> : null}
                      {e.note ? <div className="text-xs text-gray-500 line-clamp-2 mt-1">{e.note}</div> : null}
                      {!e.phone && !e.note ? <span className="text-gray-600">—</span> : null}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "border-cyan-500/40 text-cyan-200 hover:bg-cyan-500/10 w-full gap-1.5"
                          )}
                          onClick={() => openCompose(e)}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Написать
                        </button>
                        {e.linked_user_id && e.course_slug ? (
                          <button
                            type="button"
                            className={cn(
                              buttonVariants({ variant: "outline", size: "sm" }),
                              "border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/10 w-full gap-1.5"
                            )}
                            disabled={grantBusy === e.id}
                            title={`Аккаунт #${e.linked_user_id}${e.linked_login ? ` (${e.linked_login})` : ""}`}
                            onClick={() => void grantAccess(e)}
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            {grantBusy === e.id ? "…" : "Доступ к материалам"}
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-600 leading-tight">
                            {!e.course_slug
                              ? "Нет курса в заявке"
                              : "Нет аккаунта на сайте с этим Telegram"}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className={cn(
            "sm:max-w-lg bg-[#131a2b] text-white border border-white/15 shadow-xl",
            "[&_.text-muted-foreground]:text-gray-500"
          )}
          showCloseButton
        >
          <DialogHeader>
            <DialogTitle className="text-white">Сообщение в Telegram</DialogTitle>
            <DialogDescription>
              {pick ? (
                <>
                  Получатель: <span className="text-gray-300">{studentLabel(pick)}</span>
                  {pick.course_title ? (
                    <>
                      {" "}
                      · заявка: <span className="text-gray-400">{pick.course_title}</span>
                    </>
                  ) : null}
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={draft}
            onChange={(ev) => setDraft(ev.target.value)}
            placeholder="Здравствуйте! По вашей заявке…"
            className="min-h-[140px] bg-white/5 border-white/15 text-white placeholder:text-gray-600"
            maxLength={3900}
          />
          {sendErr ? <p className="text-sm text-red-300">{sendErr}</p> : null}
          <p className="text-xs text-gray-600">{draft.length} / 3900</p>
          <DialogFooter className="border-white/10 bg-transparent sm:justify-end gap-2">
            <Button type="button" variant="ghost" className="text-gray-400" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              type="button"
              className="bg-cyan-600 hover:bg-cyan-500 text-white"
              disabled={sending || draft.trim().length < 1}
              onClick={() => void send()}
            >
              <Send className="w-4 h-4 mr-2" />
              {sending ? "Отправка…" : "Отправить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
