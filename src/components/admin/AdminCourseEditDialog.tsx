import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ImageIcon, Plus, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  adminUpdateCourse,
  adminUploadCourseImage,
  clearAdminToken,
  type CourseMaterial,
} from "@/lib/admin"

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

function safeJsonArray(raw: string | undefined, fallback: string[] = []) {
  try {
    const a = JSON.parse(raw || "[]")
    return Array.isArray(a) ? a.map((x) => String(x)) : fallback
  } catch {
    return fallback
  }
}

function parseMaterialsJson(raw: string | undefined): CourseMaterial[] {
  try {
    const a = JSON.parse(raw || "[]")
    if (!Array.isArray(a)) return []
    return a
      .filter((x) => x && typeof x === "object")
      .map((x) => ({ title: String(x.title || "").trim(), body: String(x.body || "") }))
      .filter((x) => x.title.length > 0)
  } catch {
    return []
  }
}

export type AdminCourseEditRow = {
  id: number
  slug: string
  title: string
  description: string
  image: string
  duration: string
  students: string
  level: string
  color: string
  about: string
  what_you_learn_json: string
  format_json: string
  materials_json?: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  course: AdminCourseEditRow | null
  onSaved: () => void
}

export default function AdminCourseEditDialog({ open, onOpenChange, course, onSaved }: Props) {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [coverDrag, setCoverDrag] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)
  const [showImageUrl, setShowImageUrl] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const [slug, setSlug] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [about, setAbout] = useState("")
  const [image, setImage] = useState("")
  const [duration, setDuration] = useState("")
  const [students, setStudents] = useState("")
  const [level, setLevel] = useState("")
  const [color, setColor] = useState("purple")
  const [whatYouLearnText, setWhatYouLearnText] = useState("")
  const [formatText, setFormatText] = useState("")
  const [lessons, setLessons] = useState<CourseMaterial[]>([])

  const resetFromCourse = useCallback(() => {
    if (!course) return
    setSlug(course.slug)
    setTitle(course.title)
    setDescription(course.description)
    setAbout(course.about)
    setImage(course.image)
    setDuration(course.duration)
    setStudents(course.students)
    setLevel(course.level)
    setColor(course.color || "purple")
    const wy = safeJsonArray(course.what_you_learn_json)
    const fmt = safeJsonArray(course.format_json)
    setWhatYouLearnText(wy.join("; "))
    setFormatText(fmt.join("; "))
    setLessons(parseMaterialsJson(course.materials_json))
    setErr(null)
    setShowImageUrl(false)
  }, [course])

  useEffect(() => {
    if (open && course) resetFromCourse()
  }, [open, course, resetFromCourse])

  const uploadCoverFile = useCallback(
    async (file: File) => {
      const okType = ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)
      if (!okType) {
        setErr("Обложка: JPG, PNG, GIF или WebP")
        return
      }
      setErr(null)
      setCoverUploading(true)
      try {
        const { url } = await adminUploadCourseImage(file)
        setImage(url)
      } catch (e) {
        const code = e instanceof Error ? e.message : ""
        if (code === "unauthorized" || code === "forbidden") {
          clearAdminToken()
          navigate("/admin/login")
          return
        }
        setErr("Не удалось загрузить файл")
      } finally {
        setCoverUploading(false)
      }
    },
    [navigate]
  )

  const save = async () => {
    if (!course) return
    const wy = parseList(whatYouLearnText)
    const fmt = parseList(formatText)
    if (!/^[a-z0-9-]{2,64}$/.test(slug.trim())) {
      setErr("Slug: 2–64 символов, латиница, цифры и дефис")
      return
    }
    if (title.trim().length < 2 || description.trim().length < 10 || about.trim().length < 10) {
      setErr("Заполните название и тексты (описание и «о курсе» не короче 10 символов)")
      return
    }
    if (!image.trim()) {
      setErr("Нужна обложка (загрузка или URL)")
      return
    }
    if (wy.length < 1 || fmt.length < 1) {
      setErr("Списки «чему научат» и «формат» — пункты через ;")
      return
    }
    const validLessons = lessons.filter((l) => l.title.trim().length > 0)
    setSaving(true)
    setErr(null)
    try {
      await adminUpdateCourse(course.id, {
        slug: slug.trim().toLowerCase(),
        title: title.trim(),
        description: description.trim(),
        about: about.trim(),
        image: image.trim(),
        duration: duration.trim(),
        students: students.trim(),
        level: level.trim(),
        color: color.trim(),
        whatYouLearn: wy,
        format: fmt,
        materials: validLessons,
      })
      onSaved()
      onOpenChange(false)
    } catch (e) {
      const code = e instanceof Error ? e.message : ""
      if (code === "slug_taken") setErr("Этот slug уже занят другим курсом")
      else if (code === "invalid_input") setErr("Проверьте поля (ограничения длины)")
      else if (code === "unauthorized" || code === "forbidden") {
        clearAdminToken()
        navigate("/admin/login")
      } else setErr("Не удалось сохранить")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "max-w-2xl max-h-[90vh] overflow-y-auto bg-[#131a2b] text-white border border-white/15",
          "[&_.text-muted-foreground]:text-gray-500"
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-white">Редактировать курс</DialogTitle>
          <DialogDescription>
            Витрина, тексты, обложка, программа и уроки. Смена slug обновит ссылки; заявки из бота с старым кодом курса получат новый slug автоматически.
          </DialogDescription>
        </DialogHeader>

        {err ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{err}</div>
        ) : null}

        <div className="space-y-5 text-sm">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Slug (URL)</label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Название</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-400">Краткое описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[80px] rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400">Подробно о курсе</label>
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              className="w-full min-h-[100px] rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-gray-400 flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5" /> Обложка
            </label>
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
                "flex items-center gap-4 rounded-xl border-2 border-dashed px-4 py-4 cursor-pointer transition-colors",
                coverDrag ? "border-cyan-400/70 bg-cyan-500/10" : "border-white/20 bg-white/[0.02]"
              )}
            >
              <div className="w-20 h-20 rounded-lg border border-white/10 overflow-hidden bg-black/40 shrink-0">
                {image ? <img src={image} alt="" className="w-full h-full object-cover" /> : null}
              </div>
              <div className="min-w-0 text-xs text-gray-400">
                <p className="text-white text-sm mb-1">{coverUploading ? "Загрузка…" : "Нажмите или перетащите файл"}</p>
                <p>JPG, PNG, GIF, WebP · до 5 МБ</p>
              </div>
              <Upload className="w-5 h-5 text-gray-600 shrink-0 ml-auto" />
            </div>
            <button type="button" className="text-xs text-gray-500 hover:text-gray-300" onClick={() => setShowImageUrl((v) => !v)}>
              {showImageUrl ? "▼ Скрыть URL" : "▸ URL обложки вручную"}
            </button>
            {showImageUrl ? (
              <input
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="/uploads/... или https://..."
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white font-mono text-xs"
              />
            ) : null}
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Длительность</label>
              <input value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Студенты (плашка)</label>
              <input value={students} onChange={(e) => setStudents(e.target.value)} className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Уровень</label>
              <input value={level} onChange={(e) => setLevel(e.target.value)} className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-gray-400">Цвет карточки</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs",
                    color === c.value ? cn("border-white/30 bg-white/10 ring-2", c.ring) : "border-white/10 bg-white/5"
                  )}
                >
                  <span className={cn("w-3 h-3 rounded-full", c.bg)} />
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-400">Чему научат (через ;)</label>
            <textarea value={whatYouLearnText} onChange={(e) => setWhatYouLearnText(e.target.value)} className="w-full min-h-[72px] rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400">Формат (через ;)</label>
            <textarea value={formatText} onChange={(e) => setFormatText(e.target.value)} className="w-full min-h-[72px] rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white" />
          </div>

          <div className="border-t border-white/10 pt-4 space-y-3">
            <p className="text-xs text-cyan-200/80 font-medium">Уроки (материалы для студентов с доступом)</p>
            {lessons.map((lesson, i) => (
              <div key={i} className="rounded-lg border border-white/10 p-2 space-y-2">
                <input
                  className="w-full rounded bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-white"
                  placeholder="Название урока"
                  value={lesson.title}
                  onChange={(e) => {
                    const next = [...lessons]
                    next[i] = { ...next[i], title: e.target.value }
                    setLessons(next)
                  }}
                />
                <textarea
                  className="w-full min-h-[80px] rounded bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-gray-200"
                  placeholder="Текст урока"
                  value={lesson.body}
                  onChange={(e) => {
                    const next = [...lessons]
                    next[i] = { ...next[i], body: e.target.value }
                    setLessons(next)
                  }}
                />
                <Button type="button" variant="ghost" size="sm" className="text-red-300 h-8" onClick={() => setLessons(lessons.filter((_, j) => j !== i))}>
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Удалить урок
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-white/15 text-white"
              onClick={() => setLessons([...lessons, { title: `Урок ${lessons.length + 1}`, body: "" }])}
            >
              <Plus className="w-4 h-4 mr-1" /> Добавить урок
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-end border-t border-white/10 pt-4 bg-transparent">
          <Button type="button" variant="ghost" className="text-gray-400" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button type="button" className="bg-cyan-600 hover:bg-cyan-500 text-white" disabled={saving || !course} onClick={() => void save()}>
            {saving ? "Сохранение…" : "Сохранить всё"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
