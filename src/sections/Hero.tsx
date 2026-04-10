import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send, ChevronDown } from 'lucide-react';
import { getTelegramEnrollUrl } from '@/lib/telegram';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
}

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    const particleCount = Math.min(50, Math.floor(window.innerWidth / 30));
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.2,
    }));

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    let frameCount = 0;
    const animate = () => {
      frameCount++;
      // Render every 2nd frame for performance (30fps)
      if (frameCount % 2 === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const particles = particlesRef.current;

        // Update and draw particles
        particles.forEach((particle, i) => {
          // Update position
          particle.x += particle.vx;
          particle.y += particle.vy;

          // Mouse interaction (only for every 5th particle for performance)
          if (i % 5 === 0) {
            const dx = mouseRef.current.x - particle.x;
            const dy = mouseRef.current.y - particle.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
              particle.vx -= dx * 0.0001;
              particle.vy -= dy * 0.0001;
            }
          }

          // Bounce off edges
          if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
          if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

          // Draw particle
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(127, 86, 217, ${particle.opacity})`;
          ctx.fill();
        });

        // Draw connections (limited for performance)
        ctx.strokeStyle = 'rgba(127, 86, 217, 0.1)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < particles.length; i += 2) {
          for (let j = i + 1; j < particles.length; j += 2) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const scrollToCourses = () => {
    const element = document.querySelector('#courses');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/hero-bg.jpg)' }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a]/60 via-[#0a0f1a]/40 to-[#0a0f1a]" />

      {/* Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-10"
      />

      {/* Radial Glow */}
      <div className="absolute inset-0 bg-gradient-radial opacity-50 z-0" />

      {/* Content */}
      <div className="relative z-20 w-full px-4 sm:px-6 lg:px-8 xl:px-12 pt-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 transition-all duration-1000 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: '0.2s' }}
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-gray-300">Набор открыт — начни учиться сегодня</span>
          </div>

          {/* Heading */}
          <h1
            className={`font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white leading-tight mb-6 transition-all duration-1000 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '0.4s' }}
          >
            Освой востребованную{' '}
            <span className="text-gradient">профессию в IT</span>
          </h1>

          {/* Subheading */}
          <p
            className={`text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-10 transition-all duration-1000 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '0.6s' }}
          >
            Практические курсы от экспертов индустрии. Начни свой путь в технологиях с нуля и получи работу мечты.
          </p>

          {/* CTA Buttons */}
          <div
            className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 transition-all duration-1000 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '0.8s' }}
          >
            <Button
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-white border-0 shadow-glow-cyan hover:shadow-lg transition-all duration-300 text-base px-8 py-6 group"
              onClick={() => window.open(getTelegramEnrollUrl({ source: 'hero' }), '_blank')}
            >
              <Send className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
              Записаться через Telegram
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300 text-base px-8 py-6"
              onClick={scrollToCourses}
            >
              Смотреть курсы
            </Button>
          </div>

          {/* Stats */}
          <div
            className={`grid grid-cols-3 gap-8 max-w-lg mx-auto transition-all duration-1000 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '1s' }}
          >
            {[
              { value: '5000+', label: 'Выпускников' },
              { value: '50+', label: 'Курсов' },
              { value: '95%', label: 'Трудоустройство' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="font-display text-2xl sm:text-3xl text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-20 transition-all duration-1000 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ transitionDelay: '1.2s' }}
      >
        <button
          onClick={scrollToCourses}
          className="flex flex-col items-center text-gray-400 hover:text-white transition-colors"
        >
          <span className="text-xs mb-2">Листай вниз</span>
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </button>
      </div>
    </section>
  );
}
