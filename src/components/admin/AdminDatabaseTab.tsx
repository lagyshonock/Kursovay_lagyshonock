import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Database, RefreshCw } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { adminGetDbOverview, adminGetDbTable, clearAdminToken, type AdminDbOverview, type AdminDbTable } from "@/lib/admin"

const PAGE_SIZE = 50

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return "—"
  if (typeof v === "object") return JSON.stringify(v)
  return String(v)
}

export default function AdminDatabaseTab() {
  const navigate = useNavigate()
  const [overview, setOverview] = useState<AdminDbOverview | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [tablePayload, setTablePayload] = useState<AdminDbTable | null>(null)
  const [loading, setLoading] = useState(true)
  const [tableLoading, setTableLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)

  const loadOverview = useCallback(async () => {
    setLocalError(null)
    setLoading(true)
    try {
      const data = await adminGetDbOverview()
      setOverview(data)
      setSelected((prev) => prev ?? (data.tables[0]?.name ?? null))
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown_error"
      if (msg === "unauthorized" || msg === "forbidden") {
        clearAdminToken()
        navigate("/admin/login")
        return
      }
      setLocalError("Не удалось загрузить сведения о базе")
    } finally {
      setLoading(false)
    }
  }, [navigate])

  const loadTable = useCallback(
    async (name: string, off: number) => {
      setTableLoading(true)
      setLocalError(null)
      try {
        const data = await adminGetDbTable(name, { limit: PAGE_SIZE, offset: off })
        setTablePayload(data)
        setOffset(off)
      } catch (e) {
        const msg = e instanceof Error ? e.message : "unknown_error"
        if (msg === "unauthorized" || msg === "forbidden") {
          clearAdminToken()
          navigate("/admin/login")
          return
        }
        setLocalError("Не удалось загрузить таблицу")
        setTablePayload(null)
      } finally {
        setTableLoading(false)
      }
    },
    [navigate]
  )

  useEffect(() => {
    void loadOverview()
  }, [loadOverview])

  useEffect(() => {
    if (!selected) return
    void loadTable(selected, 0)
  }, [selected, loadTable])

  const columns = useMemo(() => {
    const rows = tablePayload?.rows ?? []
    if (!rows.length) return [] as string[]
    const keys = new Set<string>()
    for (const row of rows) {
      Object.keys(row).forEach((k) => keys.add(k))
    }
    return Array.from(keys).sort()
  }, [tablePayload])

  const totalPages = tablePayload ? Math.ceil(tablePayload.total / PAGE_SIZE) : 0
  const currentPage = tablePayload ? Math.floor(offset / PAGE_SIZE) + 1 : 0

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-[#131a2b]/70 backdrop-blur-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <Database className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="font-display text-xl text-white">База данных SQLite</h2>
              <p className="text-sm text-gray-500 mt-1">
                Файл создаётся при первом запуске API. Просмотр только для чтения; пароли в таблице users скрыты.
              </p>
            </div>
          </div>
          <button
            type="button"
            className={cn(buttonVariants({ variant: "outline" }), "border-white/15 text-white hover:bg-white/10 shrink-0")}
            onClick={() => void loadOverview()}
          >
            <RefreshCw className="w-4 h-4 mr-2 inline" />
            Обновить
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500 mt-4">Загрузка…</p>
        ) : overview ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
            <p className="text-xs text-gray-500 mb-1">Путь к файлу</p>
            <code className="text-sm text-emerald-200/90 break-all">{overview.file}</code>
          </div>
        ) : null}

        {localError ? (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{localError}</div>
        ) : null}
      </div>

      {overview && overview.tables.length > 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#131a2b]/70 backdrop-blur-sm p-6">
          <h3 className="font-display text-lg text-white mb-3">Таблицы</h3>
          <div className="flex flex-wrap gap-2 mb-6">
            {overview.tables.map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => {
                  setSelected(t.name)
                  setOffset(0)
                }}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm transition-colors",
                  selected === t.name
                    ? "bg-cyan-500/25 text-cyan-100 ring-1 ring-cyan-400/40"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200"
                )}
              >
                {t.name}
                <span className="text-gray-500 ml-1.5">({t.count})</span>
              </button>
            ))}
          </div>

          {selected ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <p className="text-sm text-gray-400">
                  Таблица <span className="text-white font-mono">{selected}</span>
                  {tablePayload ? (
                    <>
                      {" "}
                      — строк: <span className="text-gray-200">{tablePayload.total}</span>
                    </>
                  ) : null}
                </p>
                {tablePayload && totalPages > 1 ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={offset <= 0 || tableLoading}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "border-white/15 text-white disabled:opacity-40"
                      )}
                      onClick={() => void loadTable(selected, Math.max(0, offset - PAGE_SIZE))}
                    >
                      Назад
                    </button>
                    <span className="text-xs text-gray-500">
                      {currentPage} / {totalPages || 1}
                    </span>
                    <button
                      type="button"
                      disabled={tableLoading || !tablePayload || offset + PAGE_SIZE >= tablePayload.total}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "border-white/15 text-white disabled:opacity-40"
                      )}
                      onClick={() => void loadTable(selected, offset + PAGE_SIZE)}
                    >
                      Вперёд
                    </button>
                  </div>
                ) : null}
              </div>

              {tableLoading ? (
                <p className="text-gray-500">Загрузка таблицы…</p>
              ) : tablePayload && columns.length === 0 ? (
                <p className="text-gray-500 text-sm">В таблице пока нет строк.</p>
              ) : tablePayload && columns.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-gray-500">
                        {columns.map((col) => (
                          <th key={col} className="py-2 px-3 font-medium whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tablePayload.rows.map((row, ri) => (
                        <tr key={ri} className="border-b border-white/5 text-gray-300 hover:bg-white/[0.02]">
                          {columns.map((col) => (
                            <td
                              key={col}
                              className="py-2 px-3 max-w-[min(280px,40vw)] align-top font-mono text-[11px] sm:text-xs"
                              title={formatCell(row[col])}
                            >
                              <span className="line-clamp-3 break-all">{formatCell(row[col])}</span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
