import PageLayout from "@/components/PageLayout"

export default function PrivacyPage() {
  return (
    <PageLayout title="Политика конфиденциальности" description="Упрощённый шаблон для учебного проекта. Замените на юридически верифицированный текст перед продакшеном.">
      <div className="space-y-8 text-gray-300 text-sm leading-relaxed max-w-3xl">
        <section>
          <h2 className="font-display text-xl text-white mb-3">1. Общие положения</h2>
          <p className="leading-relaxed">
            Настоящая политика описывает, как образовательная платформа «IT Курсы» обрабатывает персональные данные пользователей
            сайта и Telegram-бота. Оператором выступает владелец развёрнутого экземпляра приложения (учебный проект / организация).
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl text-white mb-3">2. Какие данные мы собираем</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Идентификаторы и профиль Telegram при входе через Telegram Login и при работе с ботом.</li>
            <li>Контактный телефон и комментарии, которые вы указываете при записи на курс.</li>
            <li>Технические логи (IP, user-agent) на стороне сервера — по необходимости для безопасности.</li>
          </ul>
        </section>
        <section>
          <h2 className="font-display text-xl text-white mb-3">3. Цели обработки</h2>
          <p className="leading-relaxed">
            Обработка осуществляется для регистрации на программы, коммуникации с учениками, улучшения сервиса и выполнения
            требований закона. Без вашего согласия данные не передаются третьим лицам, кроме случаев, предусмотренных законодательством.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl text-white mb-3">4. Хранение</h2>
          <p className="leading-relaxed">
            Данные хранятся в базе PostgreSQL (Supabase); при самостоятельном хостинге политика доступа определяется вами. Срок хранения
            определяется политикой оператора.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl text-white mb-3">5. Контакты</h2>
          <p className="leading-relaxed">
            Вопросы по персональным данным — через форму на странице «Контакты» или по email оператора.
          </p>
        </section>
      </div>
    </PageLayout>
  )
}
