# IT Курсы — сайт + API + Telegram

Лендинг на **React + Vite + Tailwind**, бэкенд **Express + SQLite**, **Telegram-бот** (запись на курсы + админ-команды), **вход/регистрация через Telegram Login Widget**.

## Возможности

- **Главная**: популярный курс, каталог, блок **«Платформа в цифрах»** (данные из `GET /api/stats`), экосистема/партнёры, отзывы, **медиа**, FAQ.
- **Разделы сайта**: `/about`, `/blog` (база знаний), `/contact`, `/careers`, `/privacy`, `/terms` — единый хедер/футер, ощущение «крупного» продукта.
- **Вход и регистрация** — через **официальный виджет Telegram** (без пароля на сайте).
- **Админ-панель** (`/admin`): аналитика просмотров (график за 7 дней, таблица популярности), добавление/удаление курсов.
- **Telegram-бот**: запись на курсы, **уведомления админам** о новых заявках, `/help` и `/cancel`, **inline-меню** в `/admin`, **обложка курса фото или файлом** при добавлении через бота (сохранение в `server/uploads/courses`).
- **Docker**: один контейнер — API, раздача фронта, бот.

## Быстрый старт (локально, одна команда)

Требуется Node.js 20+.

```bash
npm i
npm run dev:all
```

Откроется:

- фронт: `http://localhost:5173` (прокси `/api` и `/uploads` → `3001`)
- API: `http://localhost:3001`

Отдельно (если нужно):

- только фронт: `npm run dev`
- только API: `npm run server`
- только бот: `npm run bot`
- **всё в production-режиме локально**: `npm run build` затем `npm start` (API + статика + бот)


## Переменные окружения (`.env`)

| Переменная | Описание |
|------------|----------|
| `PORT` | Порт API (по умолчанию `3001`) |
| `CLIENT_ORIGIN` | Origin фронта для CORS (dev: `http://localhost:5173`, Docker: `http://localhost:3001`) |
| `SITE_URL` | Публичный URL сайта для **кнопок в боте** (dev: `http://localhost:5173`, Docker: `http://localhost:3001`) |
| `JWT_SECRET` | Секрет JWT |
| `DB_PATH` | Путь к SQLite (например `server/data.sqlite`) |
| `TELEGRAM_BOT_TOKEN` | Токен бота от @BotFather |
| `ADMIN_PASSWORD` | Пароль входа в веб-админку |
| `TELEGRAM_ADMIN_IDS` | ID админов в Telegram через запятую (команды бота) |

Фронт (опционально):

| Переменная | Описание |
|------------|----------|
| `VITE_TELEGRAM_BOT_USERNAME` | Username бота **без** `@` (для виджета входа) |

## Telegram-бот (кратко)

- `/start` — запись; кнопки на каталог, сайт и «О платформе» (ссылки из `SITE_URL`).
- `/help`, `/cancel` — справка и сброс сценария (запись или пошаговое добавление курса).
- **Админам** (`TELEGRAM_ADMIN_IDS`): `/admin` с кнопками, список курсов с просмотрами, добавление курса (на шаге обложки — **фото**, **документ-картинка** или текст URL).
- После новой заявки на курс админам уходит сообщение в Telegram.

## Telegram Login (вход на сайте)

1. В @BotFather включи **Domain** для бота (команда `/setdomain`) — укажи домен продакшена. Для **localhost** виджет обычно работает без домена.
2. На страницах `/login` и `/register` используется виджет `oauth.telegram.org`; после нажатия «Log in» данные проверяются на сервере (`POST /api/auth/telegram`).

## API (кратко)

- `GET /api/stats` — публичная статистика для лендинга (курсы, пользователи, заявки, просмотры)
- `GET /api/courses` — курсы, сортировка по популярности
- `GET /api/courses/featured` — топ-курс + остальные
- `POST /api/courses/:slug/view` — зафиксировать просмотр (для аналитики)
- `POST /api/auth/telegram` — вход/регистрация через Telegram
- `GET /api/me` — текущий пользователь (Bearer JWT)
- `GET /api/admin/analytics` — аналитика (Bearer admin JWT)
- `POST /api/admin/upload/course-image` — загрузка обложки, `multipart/form-data`, поле `image` (Bearer admin JWT); ответ `{ "url": "/uploads/courses/..." }`

## Структура

- `src/` — React SPA
- `server/` — Express, SQLite, бот (`server/bot.js`), точка входа `server/entry.js` (API + бот)

## Производительность

- Ленивая загрузка страниц (`React.lazy` + `Suspense`)
- На главной убран тяжёлый canvas Hero; фон популярного курса — статичное изображение + градиент
- `loading="lazy"` для карточек курсов

