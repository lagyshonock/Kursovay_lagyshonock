import { useEffect, useState } from "react"
import Header from "@/sections/Header"
import FeaturedHero from "@/sections/FeaturedHero"
import HomeCoursesSection from "@/sections/HomeCoursesSection"
import StatsSection from "@/sections/StatsSection"
import FAQ from "@/sections/FAQ"
import CTA from "@/sections/CTA"
import Footer from "@/sections/Footer"
import { fetchFeatured } from "@/lib/courses-api"
import type { Course } from "@/lib/courses-api"

export default function HomePage() {
  const [featured, setFeatured] = useState<Course | null>(null)
  const [others, setOthers] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeatured()
      .then((d) => {
        setFeatured(d.featured)
        setOthers(d.others)
      })
      .catch(() => {
        setFeatured(null)
        setOthers([])
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white overflow-x-hidden">
      <Header />
      <main>
        <FeaturedHero featured={featured} loading={loading} />
        <HomeCoursesSection courses={others} loading={loading} />
        <StatsSection />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
