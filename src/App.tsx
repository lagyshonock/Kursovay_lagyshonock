import './App.css';
import Header from './sections/Header';
import Hero from './sections/Hero';
import Courses from './sections/Courses';
import Benefits from './sections/Benefits';
import Testimonials from './sections/Testimonials';
import FAQ from './sections/FAQ';
import CTA from './sections/CTA';
import Footer from './sections/Footer';

function App() {
  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white overflow-x-hidden">
      <Header />
      <main>
        <Hero />
        <Courses />
        <Benefits />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

export default App;
