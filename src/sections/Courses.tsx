import { useEffect, useRef, useState } from 'react';
import { Clock, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const courses = [
  {
    id: 1,
    title: 'Frontend-разработка',
    description: 'Создавай современные веб-приложения с React, TypeScript и Tailwind CSS',
    image: '/course-frontend.jpg',
    duration: '6 месяцев',
    students: '1200+',
    level: 'С нуля',
    color: 'purple',
  },
  {
    id: 2,
    title: 'Backend-разработка',
    description: 'Строй масштабируемые серверные решения на Node.js и Python',
    image: '/course-backend.jpg',
    duration: '5 месяцев',
    students: '800+',
    level: 'С нуля',
    color: 'cyan',
  },
  {
    id: 3,
    title: 'Python-разработка',
    description: 'Универсальный язык для веб-разработки, автоматизации и анализа данных',
    image: '/course-python.jpg',
    duration: '4 месяца',
    students: '2000+',
    level: 'С нуля',
    color: 'yellow',
  },
  {
    id: 4,
    title: 'Data Science',
    description: 'Анализируй данные, строй модели машинного обучения и предсказывай тренды',
    image: '/course-datascience.jpg',
    duration: '6 месяцев',
    students: '600+',
    level: 'Средний',
    color: 'green',
  },
  {
    id: 5,
    title: 'DevOps',
    description: 'Автоматизируй разработку и деплой с Docker, Kubernetes и CI/CD',
    image: '/course-devops.jpg',
    duration: '5 месяцев',
    students: '400+',
    level: 'Продвинутый',
    color: 'red',
  },
];

const colorMap: Record<string, { border: string; glow: string; badge: string }> = {
  purple: {
    border: 'hover:border-purple-500/50',
    glow: 'group-hover:shadow-glow',
    badge: 'bg-purple-500/20 text-purple-300',
  },
  cyan: {
    border: 'hover:border-cyan-500/50',
    glow: 'group-hover:shadow-glow-cyan',
    badge: 'bg-cyan-500/20 text-cyan-300',
  },
  yellow: {
    border: 'hover:border-yellow-500/50',
    glow: 'group-hover:shadow-[0_0_40px_rgba(254,200,75,0.3)]',
    badge: 'bg-yellow-500/20 text-yellow-300',
  },
  green: {
    border: 'hover:border-green-500/50',
    glow: 'group-hover:shadow-[0_0_40px_rgba(18,183,106,0.3)]',
    badge: 'bg-green-500/20 text-green-300',
  },
  red: {
    border: 'hover:border-red-500/50',
    glow: 'group-hover:shadow-[0_0_40px_rgba(240,68,56,0.3)]',
    badge: 'bg-red-500/20 text-red-300',
  },
};

export default function Courses() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = parseInt(entry.target.getAttribute('data-index') || '0');
          if (entry.isIntersecting) {
            setVisibleCards((prev) => new Set([...prev, index]));
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -50px 0px' }
    );

    const cards = sectionRef.current?.querySelectorAll('[data-index]');
    cards?.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="courses"
      ref={sectionRef}
      className="relative py-24 lg:py-32 overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(127, 86, 217, 0.15) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-white mb-4">
            Выбери свое <span className="text-gradient">направление</span>
          </h2>
          <p className="text-gray-400 text-lg">
            От начального уровня до продвинутого — у нас есть курс для каждого этапа твоего развития
          </p>
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
          {courses.map((course, index) => (
            <div
              key={course.id}
              data-index={index}
              className={`group relative rounded-2xl overflow-hidden border border-white/10 bg-[#131a2b]/80 backdrop-blur-sm transition-all duration-700 ${
                colorMap[course.color].border
              } ${colorMap[course.color].glow} hover:-translate-y-2 ${
                visibleCards.has(index)
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#131a2b] to-transparent" />
                
                {/* Level Badge */}
                <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium ${colorMap[course.color].badge}`}>
                  {course.level}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="font-display text-xl text-white mb-2 group-hover:text-gradient transition-colors">
                  {course.title}
                </h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {course.description}
                </p>

                {/* Meta */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{course.students}</span>
                  </div>
                </div>

                {/* CTA */}
                <Button
                  variant="ghost"
                  className="w-full justify-between text-gray-300 hover:text-white hover:bg-white/5 group/btn"
                >
                  <span>Подробнее</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Button
            size="lg"
            variant="outline"
            className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10 hover:text-purple-200"
          >
            Все курсы
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}
