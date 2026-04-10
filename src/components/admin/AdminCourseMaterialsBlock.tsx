import { useEffect, useState } from "react"
import { Plus, Trash2, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { adminPatchCourseMaterials, type CourseMaterial } from "@/lib/admin"

function parseMaterials(raw: string | undefined): CourseMaterial[] {
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

type Props = {
  courseId: number
  materialsJson?: string
  onSaved?: () => void
}

export default function AdminCourseMaterialsBlock({ courseId, materialsJson, onSaved }: Props) {
  const [open, setOpen] = useState(false)
  const [lessons, setLessons] = useState<CourseMaterial[]>(() => parseMaterials(materialsJson))
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    setLessons(parseMaterials(materialsJson))
  }, [materialsJson, courseId])

  const save = async () => {
    const valid = lessons.filter((l) => l.title.trim().length > 0)
    setSaving(true)
    setMsg(null)
    try {
      await adminPatchCourseMaterials(courseId, valid)
      setMsg("Сохранено")
      onSaved?.()
    } catch {
      setMsg("Ошибка сохранения")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mt-2 border border-white/10 rounded-xl bg-black/20">
      <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-cyan-200/90 hover:bg-white/5 rounded-xl gap-2">
        <span>Материалы (уроки для студентов)</span>
        <ChevronDown className={cn("w-4 h-4 shrink-0 transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3 pt-0 space-y-3">
        <p className="text-xs text-gray-500">
          Содержимое видно только пользователям с выданным доступом (вкладка «Доступ» или кнопка у заявки).
        </p>
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
              className="w-full min-h-[120px] rounded bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-gray-200"
              placeholder="Текст урока"
              value={lesson.body}
              onChange={(e) => {
                const next = [...lessons]
                next[i] = { ...next[i], body: e.target.value }
                setLessons(next)
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-300 hover:text-red-200"
              onClick={() => setLessons(lessons.filter((_, j) => j !== i))}
            >
              <Trash2 className="w-4 h-4 mr-1" /> Удалить
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
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" className="bg-cyan-600 hover:bg-cyan-500 text-white" disabled={saving} onClick={() => void save()}>
            {saving ? "Сохранение…" : "Сохранить материалы"}
          </Button>
          {msg ? <span className="text-xs text-gray-400">{msg}</span> : null}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
