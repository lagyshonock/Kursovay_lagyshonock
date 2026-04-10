import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

const faqs = [
  {
    question: "Как записаться?",
    answer: "Нажмите «Записаться в Telegram» на сайте или откройте бота: он предложит выбрать курс кнопкой и коротко снять контакты. Регистрация на сайте нужна для личного кабинета.",
  },
  {
    question: "Нужен ли опыт в IT?",
    answer:
      "У каждого курса указан уровень. Есть программы с нуля и с опорой на менторов — начальный опыт не обязателен, важны мотивация и время на занятия.",
  },
  {
    question: "Сколько длится обучение?",
    answer: "Срок зависит от программы — он указан на карточке курса. Формат гибкий: материалы доступны онлайн, ритм можно согласовать с куратором.",
  },
  {
    question: "Есть ли поддержка и сертификат?",
    answer: "Да: обратная связь от менторов и сообщество студентов. После завершения программы выдаётся сертификат; детали — на странице выбранного курса.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="relative py-16 lg:py-20 border-t border-white/5 scroll-mt-24">
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="text-center max-w-lg mx-auto mb-10">
          <h2 className="font-display text-2xl sm:text-3xl text-white mb-2">Вопросы</h2>
          <p className="text-gray-500 text-sm">Коротко о записи и обучении</p>
        </div>

        <div className="max-w-2xl mx-auto space-y-3">
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

        <div className="text-center mt-10">
          <p className="text-gray-600 text-sm mb-3">Не нашли ответ?</p>
          <Link to="/contact" className="text-cyan-400/90 hover:text-cyan-300 text-sm">
            Связаться с нами
          </Link>
        </div>
      </div>
    </section>
  );
}
