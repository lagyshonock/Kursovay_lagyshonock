import { useEffect, useRef, useState } from 'react';
import { Quote, Star } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Анна М.',
    role: 'Python-разработчик',
    company: 'Яндекс',
    content:
      'Курс изменил мою жизнь. За 6 месяцев я освоила Python и нашла работу мечты в крупной IT-компании. Менторы всегда были на связи, а материал подан очень доступно.',
    rating: 5,
    course: 'Python-разработка',
  },
  {
    id: 2,
    name: 'Дмитрий К.',
    role: 'Frontend-разработчик',
    company: 'Сбер',
    content:
      'Преподаватели — настоящие профессионалы. Объясняют сложные вещи простым языком, всегда готовы помочь. Особенно понравилась практическая часть с реальными проектами.',
    rating: 5,
    course: 'Frontend-разработка',
  },
  {
    id: 3,
    name: 'Елена С.',
    role: 'Frontend-разработчик',
    company: 'Стартап',
    content:
      'Гибкий формат позволил учиться параллельно с работой. Теперь я frontend-разработчик в стартапе. Спасибо за отличную программу и поддержку!',
    rating: 5,
    course: 'Frontend-разработка',
  },
  {
    id: 4,
    name: 'Сергей П.',
    role: 'DevOps-инженер',
    company: 'VK',
    content:
      'Лучшие инвестиции в себя. Материал актуальный, проекты — из реальной практики. После курса прошел собеседование в VK и успешно вышел на новую работу.',
    rating: 5,
    course: 'DevOps',
  },
  {
    id: 5,
    name: 'Мария В.',
    role: 'Data Scientist',
    company: 'Тинькофф',
    content:
      'Отличный курс по Data Science! Математика объясняется понятно, много практики с реальными датасетами. Теперь работаю в Тинькофф над ML-моделями.',
    rating: 5,
    course: 'Data Science',
  },
  {
    id: 6,
    name: 'Алексей Н.',
    role: 'Backend-разработчик',
    company: 'Авито',
    content:
      'Курс дал мне все необходимые навыки для перехода в IT. Поддержка менторов была бесценной. Рекомендую всем, кто хочет сменить профессию.',
    rating: 5,
    course: 'Backend-разработка',
  },
];

export default function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = parseInt(entry.target.getAttribute('data-index') || '0');
          if (entry.isIntersecting) {
            setVisibleItems((prev) => new Set([...prev, index]));
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -50px 0px' }
    );

    const items = sectionRef.current?.querySelectorAll('[data-index]');
    items?.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="testimonials"
      ref={sectionRef}
      className="relative py-24 lg:py-32 overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(29, 181, 190, 0.2) 1px, transparent 0)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-white mb-4">
            Истории наших <span className="text-gradient">выпускников</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Узнай, как наши курсы изменили их карьеру
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              data-index={index}
              className={`group relative p-6 lg:p-8 rounded-2xl border border-white/10 bg-[#131a2b]/80 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-700 hover:-translate-y-1 ${
                visibleItems.has(index)
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Quote className="w-5 h-5 text-purple-400" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              {/* Content */}
              <p className="text-gray-300 text-sm leading-relaxed mb-6">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                {/* Avatar Placeholder */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-display text-lg">
                  {testimonial.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-400 truncate">
                    {testimonial.role} @ {testimonial.company}
                  </div>
                </div>
              </div>

              {/* Course Badge */}
              <div className="mt-4">
                <span className="inline-block px-3 py-1 rounded-full text-xs bg-cyan-500/10 text-cyan-300">
                  {testimonial.course}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
