import "./App.css"
import { lazy, Suspense, useEffect } from "react"
import { Navigate, Route, Routes, useLocation } from "react-router-dom"

const HomePage = lazy(() => import("@/pages/HomePage"))
const CoursesPage = lazy(() => import("@/pages/CoursesPage"))
const CourseDetailPage = lazy(() => import("@/pages/CourseDetailPage"))
const CourseStudyPage = lazy(() => import("@/pages/CourseStudyPage"))
const LoginPage = lazy(() => import("@/pages/LoginPage"))
const ProfilePage = lazy(() => import("@/pages/ProfilePage"))
const RegisterPage = lazy(() => import("@/pages/RegisterPage"))
const AdminLoginPage = lazy(() => import("@/pages/AdminLoginPage"))
const AdminDashboardPage = lazy(() => import("@/pages/AdminDashboardPage"))
const AboutPage = lazy(() => import("@/pages/AboutPage"))
const BlogPage = lazy(() => import("@/pages/BlogPage"))
const ContactPage = lazy(() => import("@/pages/ContactPage"))
const CareersPage = lazy(() => import("@/pages/CareersPage"))
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage"))
const TermsPage = lazy(() => import("@/pages/TermsPage"))

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#0a0f1a] flex flex-col items-center justify-center gap-4 text-gray-500">
      <div className="w-10 h-10 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" aria-hidden />
      <p className="text-sm tracking-wide">Загрузка платформы…</p>
    </div>
  )
}

function HashScroller() {
  const location = useLocation()

  useEffect(() => {
    if (!location.hash) return
    const el = document.querySelector(location.hash)
    if (el) el.scrollIntoView({ behavior: "smooth" })
  }, [location.hash, location.pathname])

  return null
}

function App() {
  return (
    <>
      <HashScroller />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:slug/study" element={<CourseStudyPage />} />
          <Route path="/courses/:slug" element={<CourseDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default App
