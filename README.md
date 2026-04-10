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

## Docker (рекомендуется)

1. Скопируй `.env` из `.env.server.example` и заполни переменные (см. ниже).
2. Запуск:

```bash
docker compose up --build
```

Сайт и API: **http://localhost:3001** (и фронт, и `/api` на одном origin).

База SQLite в volume `course_data` по пути внутри контейнера `/app/server/data/data.sqlite` (см. `DB_PATH` в compose). Загруженные обложки курсов хранятся в volume **`course_uploads`** (`/app/server/uploads`).

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

## Админка

- Вход: `/admin/login`
- Панель: `/admin`
- Вкладки: **Аналитика** (просмотры, график), **Курсы** (добавление / удаление)
- **Обложка курса**: перетащи файл в зону или выбери с диска (JPG/PNG/GIF/WebP, до 5 МБ) — файл сохраняется на сервере, в БД пишется путь вида `/uploads/courses/<uuid>.jpg`. При необходимости можно открыть «Указать URL или путь вручную».

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

## Если на Windows падает Vite (`spawn EPERM`, `Отказано в доступа` для node.exe)

0. **В репозитории уже стоит обход:** в `package.json` → `overrides` подключён **`esbuild-wasm`** вместо нативного бинарника `esbuild` (он чаще всего и даёт `spawn … esbuild.exe EPERM` в путях с кириллицей). Выполни **`npm install`** заново, затем **`npm run build`**. Сборка может быть чуть медленнее, зато без запуска `.exe` из `node_modules`.
1. **Путь к проекту** — по возможности перенеси папку в каталог **только с латиницей**, например `C:\dev\site` (пути с кириллицей иногда ломают spawn у `esbuild` / Vite).
2. **Защита Windows** — «Безопасность Windows» → защита от вирусов → **Управление настройками** → **Исключения** → добавь папку проекта и `C:\Program Files\nodejs`.
3. **Контролируемый доступ к папкам** — если включён, разреши для `node.exe` / терминала (Cursor, PowerShell) изменение папки проекта.
4. Переустанови зависимости и пересобери нативный esbuild:
   ```bash
   rmdir /s /q node_modules
   del package-lock.json
   npm i
   npm rebuild esbuild
   ```
5. Ошибка **`$LASTEXITCODE` в npm.ps1** — это баг/особенность оболочки. Запускай команды через **cmd**: `cmd /c "npm run dev:all"` или используй **`npm.cmd`** вместо `npm` в PowerShell.

Конфиг Vite в проекте — **`vite.config.mjs`** (без дубликата `vite.config.ts`), скрипт **`npm run dev:all`** вызывает `nodemon` и `vite` напрямую, без вложенного `npm run`.
