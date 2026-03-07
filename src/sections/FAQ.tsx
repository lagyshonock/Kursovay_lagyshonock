import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'Как проходит обучение?',
    answer:
      'Обучение проходит полностью онлайн. Вы получаете доступ к видео-лекциям, практическим заданиям и проектам. Материалы доступны 24/7, чтобы вы могли учиться в удобном темпе. Каждую неделю проходят живые вебинары с менторами, где можно задать вопросы и разобрать сложные темы.',
  },
  {
    question: 'Нужен ли опыт программирования?',
    answer:
      'Наши курсы подходят для всех уровней — от полных новичков до опытных разработчиков. Для начинающих у нас есть подготовительные модули, где объясняются базовые концепции. Для продвинутых — углубленные темы и сложные проекты.',
  },
  {
    question: 'Сколько длится курс?',
    answer:
      'Продолжительность зависит от направления: базовые курсы — 3-4 месяца, профессиональные программы — 5-6 месяцев. Вы можете учиться в своем темпе, но мы рекомендуем уделять обучению минимум 10-15 часов в неделю для лучших результатов.',
  },
  {
    question: 'Выдаете ли вы сертификаты?',
    answer:
      'Да, после успешного завершения курса вы получаете сертификат, подтверждающий вашу квалификацию. Наши сертификаты признаются работодателями и ценятся в IT-индустрии. Также помогаем с подготовкой портфолио проектов.',
  },
  {
    question: 'Есть ли рассрочка?',
    answer:
      'Да, доступна рассрочка на 3, 6 или 12 месяцев без переплаты через наших партнеров. Также предлагаем скидки при полной оплате курса и специальные условия для студентов.',
  },
  {
    question: 'Какая поддержка предоставляется?',
    answer:
      'Вы получаете персонального ментора, который отвечает на вопросы в течение 24 часов. Доступ к закрытому чату с другими студентами и выпускниками. Регулярные код-ревью ваших проектов и помощь с подготовкой к собеседованиям.',
  },
  {
    question: 'Помогаете ли с трудоустройством?',
    answer:
      'Да, мы оказываем полную поддержку в поиске работы: помогаем составить резюме и портфолио, готовим к техническим собеседованиям, делимся вакансиями от партнерских компаний. 95% наших выпускников находят работу в течение 3 месяцев после окончания курса.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent" />

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-white mb-4">
            Часто задаваемые <span className="text-gradient">вопросы</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Все, что нужно знать перед началом обучения
          </p>
        </div>

        {/* FAQ List */}
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`rounded-xl border transition-all duration-300 ${
                openIndex === index
                  ? 'border-purple-500/30 bg-[#131a2b]/80'
                  : 'border-white/10 bg-[#131a2b]/50 hover:border-white/20'
              }`}
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex items-center justify-between p-5 lg:p-6 text-left"
              >
                <span className="font-medium text-white pr-4">{faq.question}</span>
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    openIndex === index
                      ? 'bg-purple-500/20 text-purple-400 rotate-180'
                      : 'bg-white/5 text-gray-400'
                  }`}
                >
                  <ChevronDown className="w-5 h-5" />
                </div>
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="px-5 lg:px-6 pb-5 lg:pb-6">
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-400 mb-4">Остались вопросы?</p>
          <a
            href="https://t.me/itcourses"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Напишите нам в Telegram
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
