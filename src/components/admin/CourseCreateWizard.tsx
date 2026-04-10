import { useCallback, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Layers,
  Sparkles,
  Upload,
} from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { adminCreateCourse, adminUploadCourseImage, clearAdminToken } from "@/lib/admin"

const STEPS = [
  { id: 0, title: "Основное", hint: "Идентификатор и название", icon: Sparkles },
  { id: 1, title: "Описание", hint: "Тексты для карточки и страницы", icon: BookOpen },
  { id: 2, title: "Обложка", hint: "Загрузите файл — он сохранится на сервере", icon: ImageIcon },
  { id: 3, title: "Параметры", hint: "Срок, аудитория, акцентный цвет", icon: Layers },
  { id: 4, title: "Программа", hint: "Списки через точку с запятой", icon: BookOpen },
] as const

const COLOR_PRESETS = [
  { value: "purple", label: "Фиолетовый", ring: "ring-purple-400", bg: "bg-purple-500" },
  { value: "cyan", label: "Бирюза", ring: "ring-cyan-400", bg: "bg-cyan-500" },
  { value: "yellow", label: "Жёлтый", ring: "ring-yellow-400", bg: "bg-yellow-500" },
  { value: "green", label: "Зелёный", ring: "ring-green-400", bg: "bg-green-500" },
  { value: "red", label: "Красный", ring: "ring-red-400", bg: "bg-red-500" },
] as const

function parseList(input: string) {
  return input
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
}

type Props = {
  onCreated: () => Promise<void>
}

export default function CourseCreateWizard({ onCreated }: Props) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [coverDrag, setCoverDrag] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)
  const [showImageUrlAdvanced, setShowImageUrlAdvanced] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    slug: "",
    title: "",
    description: "",
    about: "",
    image: "",
    duration: "4 месяца",
    students: "0+",
    level: "С нуля",
    color: "purple",
    whatYouLearn: "",
    format: "",
  })

  const uploadCoverFile = useCallback(
    async (file: File) => {
      const okType = ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)
      if (!okType) {
        setLocalError("Формат: JPG, PNG, GIF или WebP")
        return
      }
      setLocalError(null)
      setCoverUploading(true)
      try {
        const { url } = await adminUploadCourseImage(file)
        setForm((p) => ({ ...p, image: url }))
      } catch (e) {
        const code = e instanceof Error ? e.message : ""
        if (code === "file_too_large") setLocalError("Файл больше 5 МБ")
        else if (code === "invalid_file") setLocalError("Не удалось прочитать файл")
        else if (code === "unauthorized" || code === "forbidden") {
          clearAdminToken()
          navigate("/admin/login")
          return
        } else setLocalError("Ошибка загрузки")
      } finally {
        setCoverUploading(false)
      }
    },
    [navigate]
  )

  const stepValid = useMemo(() => {
    switch (step) {
      case 0:
        return /^[a-z0-9-]{2,64}$/.test(form.slug.trim()) && form.title.trim().length >= 2
      case 1:
        return form.description.trim().length >= 10 && form.about.trim().length >= 10
      case 2:
        return form.image.trim().length >= 1
      case 3:
        return (
          form.duration.trim().length >= 2 &&
          form.students.trim().length >= 1 &&
          form.level.trim().length >= 1 &&
          form.color.trim().length >= 1
        )
      case 4: {
        const w = parseList(form.whatYouLearn)
        const f = parseList(form.format)
        return w.length >= 1 && f.length >= 1
      }
      default:
        return false
    }
  }, [step, form])

  const canSubmit = useMemo(() => {
    return (
      /^[a-z0-9-]{2,64}$/.test(form.slug.trim()) &&
      form.title.trim().length >= 2 &&
      form.description.trim().length >= 10 &&
      form.about.trim().length >= 10 &&
      form.image.trim().length >= 1 &&
      form.duration.trim().length >= 2 &&
      parseList(form.whatYouLearn).length >= 1 &&
      parseList(form.format).length >= 1
    )
  }, [form])

  const goNext = () => {
    setLocalError(null)
    if (!stepValid) {
      setLocalError("Заполните поля этого шага корректно")
      return
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const goPrev = () => {
    setLocalError(null)
    setStep((s) => Math.max(s - 1, 0))
  }

  const handleCreate = async () => {
    if (!canSubmit) {
      setLocalError("Проверьте все шаги")
      return
    }
    setLocalError(null)
    setSubmitting(true)
    try {
      await adminCreateCourse({
        ...form,
        slug: form.slug.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        about: form.about.trim(),
        whatYouLearn: parseList(form.whatYouLearn),
        format: parseList(form.format),
      })
      setForm({
        slug: "",
        title: "",
        description: "",
        about: "",
        image: "",
        duration: "4 месяца",
        students: "0+",
        level: "С нуля",
        color: "purple",
        whatYouLearn: "",
        format: "",
      })
      setStep(0)
      await onCreated()
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown_error"
      if (msg === "slug_taken") setLocalError("Этот slug уже занят")
      else if (msg === "unauthorized" || msg === "forbidden") {
        clearAdminToken()
        navigate("/admin/login")
        return
      } else setLocalError("Не удалось создать курс")
    } finally {
      setSubmitting(false)
    }
  }

  const CurrentIcon = STEPS[step]?.icon ?? Sparkles

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#131a2b]/90 to-[#0d121f]/90 backdrop-blur-sm overflow-hidden">
      <div className="border-b border-white/10 bg-white/[0.03] px-5 py-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center border border-white/10">
            <CurrentIcon className="w-5 h-5 text-cyan-300" />
          </div>
          <div>
            <h2 className="font-display text-xl text-white">Новый курс</h2>
            <p className="text-xs text-gray-500">Пошаговое создание с предпросмотром обложки</p>
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                if (i <= step) {
                  setLocalError(null)
                  setStep(i)
                }
              }}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                i === step
                  ? "bg-cyan-500/25 text-cyan-200 ring-1 ring-cyan-400/40"
                  : i < step
                    ? "bg-white/10 text-gray-300 hover:bg-white/15"
                    : "bg-white/5 text-gray-600 cursor-not-allowed"
              )}
            >
              {i + 1}. {s.title}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {localError ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 mb-5">
            {localError}
          </div>
        ) : null}

        <p className="text-sm text-gray-400 mb-4">
          <span className="text-white font-medium">{STEPS[step].title}</span> — {STEPS[step].hint}
        </p>

        {step === 0 ? (
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Slug (URL)</label>
              <input
                value={form.slug}
                onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value.toLowerCase() }))}
                placeholder="например frontend-pro"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 font-mono"
              />
              <p className="text-[11px] text-gray-600">Только латиница, цифры и дефис — попадёт в адрес /courses/…</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Название</label>
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Как отображается в каталоге"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Краткое описание</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="1–2 предложения для карточки курса"
                className="w-full min-h-[100px] rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Подробно о курсе</label>
              <textarea
                value={form.about}
                onChange={(e) => setForm((p) => ({ ...p, about: e.target.value }))}
                placeholder="Для страницы курса: кому подойдёт, формат, результат"
                className="w-full min-h-[140px] rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void uploadCoverFile(f)
                e.target.value = ""
              }}
            />
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  fileInputRef.current?.click()
                }
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setCoverDrag(true)
              }}
              onDragLeave={() => setCoverDrag(false)}
              onDrop={(e) => {
                e.preventDefault()
                setCoverDrag(false)
                const f = e.dataTransfer.files?.[0]
                if (f) void uploadCoverFile(f)
              }}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative flex flex-col sm:flex-row items-center gap-6 rounded-2xl border-2 border-dashed px-6 py-10 cursor-pointer transition-all outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40",
                coverDrag ? "border-cyan-400/70 bg-cyan-500/10 scale-[1.01]" : "border-white/20 bg-white/[0.02] hover:border-cyan-400/40 hover:bg-white/[0.04]"
              )}
            >
              <div className="shrink-0 w-36 h-36 rounded-2xl border border-white/10 bg-black/40 overflow-hidden flex items-center justify-center shadow-inner">
                {form.image ? (
                  <img src={form.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-14 h-14 text-gray-600" aria-hidden />
                )}
              </div>
              <div className="text-center sm:text-left min-w-0 flex-1">
                <p className="text-lg text-white font-display">
                  {coverUploading ? "Загружаем…" : "Перетащите изображение или нажмите"}
                </p>
                <p className="text-sm text-gray-500 mt-2">JPG, PNG, GIF, WebP · до 5 МБ · файл сохраняется в /uploads/courses/</p>
                {form.image ? (
                  <p className="text-[11px] text-emerald-400/90 mt-3 font-mono truncate" title={form.image}>
                    ✓ {form.image}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <button
                type="button"
                className="text-xs text-gray-500 hover:text-gray-300"
                onClick={() => setShowImageUrlAdvanced((v) => !v)}
              >
                {showImageUrlAdvanced ? "▼ Скрыть ввод по URL" : "▸ Указать URL вручную (редко нужно)"}
              </button>
              {showImageUrlAdvanced ? (
                <div className="mt-3 space-y-2">
                  <label className="text-xs text-gray-500">Внешний URL или уже загруженный путь</label>
                  <input
                    value={form.image}
                    onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))}
                    placeholder="https://…"
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-cyan-400/50"
                  />
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(
                [
                  ["duration", "Длительность", "6 месяцев"],
                  ["students", "Студентов (плашка)", "1200+"],
                  ["level", "Уровень", "С нуля"],
                ] as const
              ).map(([key, label, ph]) => (
                <div key={key} className="space-y-2">
                  <label className="text-xs text-gray-400">{label}</label>
                  <input
                    value={(form as Record<string, string>)[key]}
                    onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                    placeholder={ph}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                  />
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <label className="text-xs text-gray-400">Акцентный цвет карточки</label>
              <div className="flex flex-wrap gap-3">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, color: c.value }))}
                    className={cn(
                      "group flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all",
                      form.color === c.value
                        ? cn("border-white/30 bg-white/10 ring-2", c.ring)
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    )}
                  >
                    <span className={cn("w-4 h-4 rounded-full", c.bg)} />
                    <span className="text-gray-200">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Чему научат (через ;)</label>
              <textarea
                value={form.whatYouLearn}
                onChange={(e) => setForm((p) => ({ ...p, whatYouLearn: e.target.value }))}
                placeholder="Вёрстка; React; TypeScript; …"
                className="w-full min-h-[120px] rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Формат (через ;)</label>
              <textarea
                value={form.format}
                onChange={(e) => setForm((p) => ({ ...p, format: e.target.value }))}
                placeholder="Онлайн; Дедлайны; Поддержка в чате; …"
                className="w-full min-h-[120px] rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>
          </div>
        ) : null}

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 mt-8 pt-6 border-t border-white/10">
          <button
            type="button"
            disabled={step === 0}
            onClick={goPrev}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "border-white/15 text-white hover:bg-white/10 disabled:opacity-40"
            )}
          >
            <ChevronLeft className="w-4 h-4 mr-1 inline" />
            Назад
          </button>
          <div className="flex gap-3 justify-end">
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={goNext} className={cn(buttonVariants({ variant: "default" }), "bg-gradient-to-r from-cyan-500 to-purple-500 text-white border-0")}>
                Далее
                <ChevronRight className="w-4 h-4 ml-1 inline" />
              </button>
            ) : (
              <button
                type="button"
                disabled={!canSubmit || submitting}
                onClick={() => void handleCreate()}
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white border-0 disabled:opacity-50"
                )}
              >
                {submitting ? "Создаём…" : "Создать курс"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
