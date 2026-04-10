import { useEffect } from "react"
import Header from "@/sections/Header"
import Footer from "@/sections/Footer"

type PageLayoutProps = {
  children: React.ReactNode
  /** Заголовок страницы и <title> */
  title?: string
  description?: string
  /** Без верхнего блока title — для кастомных страниц (карточка курса) */
  bare?: boolean
}

export default function PageLayout({ children, title, description, bare }: PageLayoutProps) {
  useEffect(() => {
    document.title = title ? `${title} · IT Курсы` : "IT Курсы — образовательная платформа"
  }, [title])

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white flex flex-col">
      <Header />
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 xl:px-12 pt-24 pb-8">
        {!bare && title ? (
          <div className="max-w-6xl mx-auto mb-10">
            <h1 className="font-display text-3xl sm:text-4xl text-white">{title}</h1>
            {description ? <p className="text-gray-400 mt-2 max-w-2xl">{description}</p> : null}
          </div>
        ) : null}
        <div className={bare ? "w-full" : "max-w-6xl mx-auto"}>{children}</div>
      </main>
      <Footer />
    </div>
  )
}
