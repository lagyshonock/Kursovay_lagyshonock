import { useEffect, useRef, useState } from 'react';
import {
  Code2,
  Users,
  Clock,
  Award,
  MessageCircle,
  Briefcase,
} from 'lucide-react';

const benefits = [
  {
    icon: Code2,
    title: 'Практические навыки',
    description: 'Работа над реальными проектами из индустрии. Не просто теория — применяй знания сразу.',
    color: 'purple',
  },
  {
    icon: Users,
    title: 'Поддержка менторов',
    description: 'Помощь опытных разработчиков на каждом этапе обучения. Ответы на вопросы в течение 24 часов.',
    color: 'cyan',
  },
  {
    icon: Clock,
    title: 'Гибкий график',
    description: 'Учись в своем темпе. Доступ к материалам 24/7 — занимайся когда удобно.',
    color: 'yellow',
  },
  {
    icon: Award,
    title: 'Сертификат',
    description: 'Подтверждение квалификации после успешного завершения курса. Признается работодателями.',
    color: 'green',
  },
  {
    icon: MessageCircle,
    title: 'Сообщество',
    description: 'Доступ к чату с выпускниками и студентами. Нетворкинг и обмен опытом.',
    color: 'purple',
  },
  {
    icon: Briefcase,
    title: 'Трудоустройство',
    description: 'Помощь с резюме, портфолио и подготовкой к собеседованиям. Карьерная поддержка.',
    color: 'red',
  },
];

const colorMap: Record<string, string> = {
  purple: 'text-purple-400 bg-purple-500/10 group-hover:bg-purple-500/20',
  cyan: 'text-cyan-400 bg-cyan-500/10 group-hover:bg-cyan-500/20',
  yellow: 'text-yellow-400 bg-yellow-500/10 group-hover:bg-yellow-500/20',
  green: 'text-green-400 bg-green-500/10 group-hover:bg-green-500/20',
  red: 'text-red-400 bg-red-500/10 group-hover:bg-red-500/20',
};

export default function Benefits() {
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
      id="benefits"
      ref={sectionRef}
      className="relative py-24 lg:py-32 overflow-hidden"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent" />

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-white mb-4">
            Почему выбирают <span className="text-gradient">нас</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Мы создаем условия для твоего успеха в IT
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                data-index={index}
                className={`group relative p-6 lg:p-8 rounded-2xl border border-white/10 bg-[#131a2b]/50 backdrop-blur-sm hover:border-white/20 transition-all duration-700 hover:-translate-y-1 ${
                  visibleItems.has(index)
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {/* Icon */}
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 ${colorMap[benefit.color]}`}
                >
                  <Icon className="w-7 h-7" />
                </div>

                {/* Content */}
                <h3 className="font-display text-xl text-white mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {benefit.description}
                </p>

                {/* Hover Glow */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/0 to-cyan-500/0 group-hover:from-purple-500/5 group-hover:to-cyan-500/5 transition-all duration-500 pointer-events-none" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
