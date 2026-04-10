/** Демо-материалы: для отображения нужен перенос строк (`body` рендерится с whitespace-pre-wrap). */

export const defaultCourses = [
  {
    slug: "frontend",
    title: "Frontend-разработка",
    description: "Создавай современные веб-приложения с React, TypeScript и Tailwind CSS",
    image: "/course-frontend.jpg",
    duration: "6 месяцев",
    students: "1200+",
    level: "С нуля",
    color: "purple",
    about:
      "От базового HTML/CSS до продвинутого React: научишься проектировать интерфейсы, работать с API и собирать приложение в прод. В материалах — короткая теория, рабочие примеры и задачи с ориентирами «что проверить самому».",
    what_you_learn: [
      "HTML, CSS, адаптивная верстка",
      "JavaScript и TypeScript",
      "React: компоненты, хуки, состояние",
      "Работа с API, формы, валидация",
      "Сборка и деплой (Vite), Tailwind CSS",
    ],
    format: ["Живые занятия + записи", "Домашние задания", "Проект в портфолио", "Поддержка ментора"],
    materials: [
      {
        title: "Урок 1. Семантическая разметка и доступность",
        body: `Цель: страница «читается» браузером и скринридерами, а не только выглядит картинкой.

Теория (коротко)
• Используй теги по смыслу: <main>, <article>, <section>, <nav>, <h1>…<h6>, а не сплошные <div>.
• У интерактива всегда есть текст или aria-label у кнопок-иконок.
• Один <h1> на страницу; заголовки не прыгают с h2 на h4.

Пример разметки карточки курса
<article class="course-card">
  <h2>Frontend-разработка</h2>
  <p>С нуля до React и деплоя.</p>
  <a href="/courses/frontend">Подробнее</a>
</article>

Задача
1) Сверстай блок из трёх карточек в ряд (или колонкой на узком экране): заголовок, описание, ссылка.
2) Проверь в Lighthouse (Chrome DevTools → Lighthouse) раздел Accessibility и исправь явные замечания.
3) Ответ для себя: какой тег лучше обернуть список уроков — <ol> или <ul> и почему?`,
      },
      {
        title: "Урок 2. CSS: поток, отступы и адаптив",
        body: `Теория
• margin схлопывается между соседями — учитывай это в сетках.
• box-sizing: border-box — обычно ставят глобально, чтобы width включал padding.
• Mobile-first: сначала стили для узкой ширины, потом min-width медиазапросы.

Пример
*,
*::before,
*::after { box-sizing: border-box; }

.grid {
  display: grid;
  gap: 1rem;
}
@media (min-width: 640px) {
  .grid { grid-template-columns: repeat(3, 1fr); }
}

Задача
1) Сделай сетку «1 колонка на телефоне, 2 на планшете, 3 на десктопе» без готовых UI-библиотек.
2) Добавь изображению обложки object-fit: cover и фиксированное соотношение сторон (aspect-ratio).
3) Найди в проекте один «лишний» вложенный div и убери его, сохранив внешний вид.`,
      },
      {
        title: "Урок 3. JavaScript: данные, функции, модули",
        body: `Пример: чистая функция суммы и использование
function sum(a, b) {
  return a + b;
}
const prices = [1200, 800, 450];
const total = prices.reduce((acc, n) => acc + n, 0);

Пример: разбор JSON с защитой
function parseIds(raw) {
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.map(String) : [];
 } catch {
    return [];
  }
}

Задача
1) Напиши функцию average(nums), возвращающую среднее для непустого массива чисел; для [] — null.
2) Напиши функцию pick(obj, keys), которая из объекта делает новый только с перечисленными ключами.
3) Вынеси обе функции в отдельный файл utils.js и импортируй их в «точке входа».`,
      },
      {
        title: "Урок 4. React: состояние и список",
        body: `Теория
• key в списке — стабильный id, не индекс массива, если порядок меняется.
• Не мутируй state: копируй массив/объект перед обновлением.

Пример компонента со списком задач (упрощённо)
import { useState } from "react";

export function TodoList() {
  const [items, setItems] = useState([
    { id: 1, text: "Разметить карточку" },
    { id: 2, text: "Подключить стили" },
  ]);
  function remove(id) {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }
  return (
    <ul>
      {items.map((t) => (
        <li key={t.id}>
          {t.text}
          <button type="button" onClick={() => remove(t.id)}>Удалить</button>
        </li>
      ))}
    </ul>
  );
}

Задача
1) Добавь поле ввода и кнопку «Добавить»: новый id через crypto.randomUUID() или счётчик ref.
2) Сделай кнопку «очистить выполненные» (добавь поле done и фильтрацию).
3) Объясни вслух: зачем onClick={() => remove(t.id)}, а не onClick={remove(t.id)}?`,
      },
    ],
  },
  {
    slug: "backend",
    title: "Backend-разработка",
    description: "Строй масштабируемые серверные решения на Node.js и Python",
    image: "/course-backend.jpg",
    duration: "5 месяцев",
    students: "800+",
    level: "С нуля",
    color: "cyan",
    about:
      "Погрузишься в серверную разработку: REST API, базы данных, авторизация, тестирование и практики продакшн-развертывания. В уроках — типичные паттерны и задачи «как у взрослых».",
    what_you_learn: ["Основы HTTP и REST", "Node.js / Python основы", "Базы данных и запросы", "Авторизация и безопасность", "Логирование, тестирование, деплой"],
    format: ["Живые занятия + записи", "Практика на реальных задачах", "Проект API", "Ревью кода"],
    materials: [
      {
        title: "Урок 1. HTTP, REST и контракт API",
        body: `Теория
• GET идемпотентен и без тела; POST создаёт ресурс; PUT/PATCH обновляют; DELETE удаляет (в общем виде).
• Коды: 200 OK, 201 Created, 400 Bad Request, 401/403, 404, 409 Conflict, 500.
• Версионируй API (/api/v1/…) или хотя бы зафиксируй контракт в схеме (OpenAPI).

Пример «контракт» эндпоинта
GET /api/courses/:slug
200 → { slug, title, duration }
404 → { error: "not_found" }

Задача
1) Опиши три эндпоинта для «заявок на курс»: создание, список для админа, смена статуса. Укажи метод, URL, коды ответов.
2) Придумай пример тела POST с валидацией: какие поля обязательны, что вернёшь при 400?
3) Где в твоём проекте лучше отдавать 409 вместо 400? Приведи ситуацию.`,
      },
      {
        title: "Урок 2. Node.js + Express: маршрут и middleware",
        body: `Пример минимального сервера
import express from "express";
const app = express();
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "internal_error" });
});

app.listen(3000);

Задача
1) Добавь POST /api/echo: принимает JSON { message: string } и возвращает { message } в верхнем регистре.
2) Напиши middleware requestId: присваивай req.id = crypto.randomUUID() и логируй его на каждый запрос.
3) Чем отличается синхронный throw от next(err) внутри async-обработчика — проверь в документации Express 4 vs 5.`,
      },
      {
        title: "Урок 3. SQL и транзакции",
        body: `Пример (SQLite): выдача доступа без гонки
BEGIN TRANSACTION;
INSERT INTO course_access (user_id, course_id) VALUES (?, ?);
COMMIT;

Если уникальный индекс (user_id, course_id) — повторная вставка даст ошибку; оберни в try/catch и отдай 409.

Задача
1) Напиши запрос: все курсы, на которые у пользователя есть доступ (JOIN).
2) Напиши запрос: количество заявок по курсам за последние 7 дней (GROUP BY).
3) Опиши словами, зачем в платежке «BEGIN…COMMIT», если два запроса должны пройти вместе или откатиться.`,
      },
      {
        title: "Урок 4. Авторизация: сессия vs JWT",
        body: `Коротко
• Сессия в cookie + серверное хранилище: проще отозвать доступ, нужен sticky session или общий store.
• JWT: stateless, но отзыв токена сложнее (blacklist, короткий TTL + refresh).

Пример заголовка
Authorization: Bearer <token>

Задача
1) Составь таблицу плюсов/минусов сессии и JWT для админки учебного портала.
2) Где хранить refresh-токен на клиенте и почему localStorage часто не рекомендуют?
3) Придумай сценарий атаки «украли access-токен» и два шага защиты на уровне API.`,
      },
    ],
  },
  {
    slug: "python",
    title: "Python-разработка",
    description: "Универсальный язык для веб-разработки, автоматизации и анализа данных",
    image: "/course-python.jpg",
    duration: "4 месяца",
    students: "2000+",
    level: "С нуля",
    color: "yellow",
    about:
      "Python для старта в программировании: синтаксис, практика, работа с файлами, простые сервисы и автоматизация рутины. Каждый урок закрепляется примерами и мини-заданиями.",
    what_you_learn: ["Синтаксис Python и базовые структуры данных", "Функции, модули, ООП", "Работа с файлами и сетью", "Автоматизация и парсинг", "Мини‑проект для портфолио"],
    format: ["Много практики", "Шаблоны решений", "Проекты", "Поддержка в чате"],
    materials: [
      {
        title: "Урок 1. Типы, коллекции, строки",
        body: `Пример
text = "  hello, PYTHON  "
clean = text.strip().lower()
parts = clean.split(",")
first = parts[0].strip()

numbers = [3, 1, 4, 1, 5]
unique_sorted = sorted(set(numbers))

Задача
1) Напиши функцию normalize_email(s): trim, lower, пустая строка → None.
2) Из списка слов оставь только длины ≥ 4 и отсортируй по длине, затем по алфавиту.
3) Объясни разницу между is и == на примере двух списков с одинаковым содержимым.`,
      },
      {
        title: "Урок 2. Файлы, контекстный менеджер, кодировки",
        body: `Пример безопасного чтения
from pathlib import Path

def read_lines_utf8(path: Path) -> list[str]:
    return path.read_text(encoding="utf-8").splitlines()

Запись JSON
import json
payload = {"ok": True, "items": [1, 2, 3]}
Path("out.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

Задача
1) Напиши скрипт: папка logs/, объединить все *.log в один summary.txt с заголовком-именем файла.
2) Обработай отсутствие папки и PermissionError понятным сообщением пользователю.
3) Почему с open(...) лучше не забывать encoding="utf-8" в Windows?`,
      },
      {
        title: "Урок 3. Функции, *args, декоратор-заготовка",
        body: `Пример замыкания для счётчика вызовов
def call_counter(fn):
    n = 0
    def wrapper(*args, **kwargs):
        nonlocal n
        n += 1
        print(f"{fn.__name__} вызов #{n}")
        return fn(*args, **kwargs)
    return wrapper

@call_counter
def add(a, b):
    return a + b

Задача
1) Напиши функцию clamp(x, low, high), возвращающую x в пределах [low, high].
2) Напиши retry(fn, times, delay_sec) для повторов при исключении (time.sleep).
3) Почему в wrapper полезно functools.wraps(fn)? Добавь его в примере.`,
      },
      {
        title: "Урок 4. HTTP-клиент и простой парсер",
        body: `Пример (stdlib)
from urllib.request import urlopen

def fetch_status(url: str) -> int:
    with urlopen(url, timeout=10) as resp:
        return resp.status

Задача
1) Скачай страницу и посчитай, сколько раз встречается подстрока (без HTML-парсера, на свой страх и риск).
2) Ограничь размер ответа (например, первые 500 КБ), чтобы не скачать гигабайт.
3) Какой заголовок User-Agent стоит поставить и зачем robots.txt проверять перед массовым парсингом?`,
      },
    ],
  },
  {
    slug: "data-science",
    title: "Data Science",
    description: "Анализируй данные, строй модели машинного обучения и предсказывай тренды",
    image: "/course-datascience.jpg",
    duration: "6 месяцев",
    students: "600+",
    level: "Средний",
    color: "green",
    about:
      "Сфокусируешься на данных: подготовка, визуализация, базовые модели ML и понимание того, как доводить решения до результата. Задачи близки к реальным шагам EDA и обучения.",
    what_you_learn: ["Pandas, NumPy, базовая статистика", "Визуализация и EDA", "Модели ML и метрики качества", "Пайплайны и подготовка данных", "Мини‑проект с датасетом"],
    format: ["Занятия + практика", "Разбор датасетов", "Проект", "Обратная связь по решениям"],
    materials: [
      {
        title: "Урок 1. Pandas: загрузка, типы, пропуски",
        body: `Пример
import pandas as pd

df = pd.read_csv("sales.csv", parse_dates=["date"])
print(df.dtypes)
print(df.isna().sum())

Задача
1) Загрузи CSV, выведи shape, список колонок, долю пропусков по каждой колонке.
2) Удали строки, где пропуск в ключевой колонке id; в цене заполни медианой по группе категории.
3) Чем опасно fillna(0) для всех колонок подряд?`,
      },
      {
        title: "Урок 2. Описательная статистика и выбросы",
        body: `Пример
s = df["amount"]
q1 = s.quantile(0.25)
q3 = s.quantile(0.75)
iqr = q3 - q1
mask = (s >= q1 - 1.5 * iqr) & (s <= q3 + 1.5 * iqr)
filtered = df.loc[mask]

Задача
1) Построй describe() и гистограмму amount до/после отсечения выбросов IQR.
2) Сравни среднее и медиану: когда они сильно расходятся?
3) Приведи пример, когда «выброс» — это не ошибка, а важное событие.`,
      },
      {
        title: "Урок 3. Train/test split и метрики классификации",
        body: `Пример
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
# model.fit(...)
print(classification_report(y_test, y_pred, digits=3))

Задача
1) Объясни, зачем stratify при несбалансированных классах.
2) Приведи кейс, где accuracy вводит в заблуждение; какие метрики важнее?
3) Смоделируй утечку целевой (например, колонка «дата отмены» для прогноза оттока) — как её поймать?`,
      },
      {
        title: "Урок 4. Базовая линия и улучшения",
        body: `Практический рецепт
1) Считаем долю самого частого класса как baseline accuracy.
2) Логистическая регрессия на One-Hot + масштабирование чисел.
3) Сравниваем по F1 на валидации, не подгоняясь под test.

Задача
1) Реализуй baseline «всегда класс majority» и выведи confusion matrix для двух классов.
2) Добавь одну новую осмысленную фичу и зафиксируй, изменилась ли метрика.
3) Опиши план: что бы ты сделал, если train ROC-AUC высокий, а на production метрики падают?`,
      },
    ],
  },
  {
    slug: "devops",
    title: "DevOps",
    description: "Автоматизируй разработку и деплой с Docker, Kubernetes и CI/CD",
    image: "/course-devops.jpg",
    duration: "5 месяцев",
    students: "400+",
    level: "Продвинутый",
    color: "red",
    about:
      "Разберешься в инфраструктуре: контейнеры, CI/CD, мониторинг и базовые практики надежности для выката в прод. Уроки с командами и сценариями отладки.",
    what_you_learn: ["Docker и контейнеризация", "CI/CD пайплайны", "Основы Kubernetes", "Мониторинг и логирование", "Практика деплоя проекта"],
    format: ["Практика в терминале", "Лабы", "Проект деплоя", "Шаблоны CI/CD"],
    materials: [
      {
        title: "Урок 1. Dockerfile: слои, кэш, безопасность",
        body: `Пример многостадийной сборки (идея)
# build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# run
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

Задача
1) Объясни, почему COPY package*.json перед COPY . улучшает кэш Docker.
2) Почему в прод-образе не кладут devDependencies?
3) Поставь non-root user в финальном образе — набросай инструкции.`,
      },
      {
        title: "Урок 2. Compose: сервисы, сеть, тома",
        body: `Пример фрагмента
services:
  api:
    build: ./server
    environment:
      DB_PATH: /data/app.db
    volumes:
      - sqlite_data:/data
    ports:
      - "8787:8787"

volumes:
  sqlite_data:

Задача
1) Добавь healthcheck для api (curl/wget к /api/health).
2) Раздели сети: frontend и backend в одной user-defined сети, БД без публикации портов наружу.
3) Что произойдёт с данными в volume при docker compose down -v?`,
      },
      {
        title: "Урок 3. CI: проверки на каждый PR",
        body: `Минимальный pipeline (концепт)
• установка зависимостей
• линт + типы + тесты
• сборка образа (опционально)
• публикация только из main

Задача
1) Составь список шагов для монорепо: frontend (npm) + backend (npm) в одном workflow.
2) Как кэшировать npm в GitHub Actions (actions/cache)?
3) Где в пайплайне уместен секрет для registry — и как не утечь в логи?`,
      },
      {
        title: "Урок 4. Наблюдаемость: логи, метрики, алерты",
        body: `Практика
• Логи в JSON с полями: ts, level, requestId, msg.
• Метрики RED для HTTP: rate, errors, duration.
• Алерт на p95 latency и на долю 5xx.

Задача
1) Придумай три SLI для учебного портала (вход, просмотр курса, выдача материалов).
2) Как отличить проблему «медленный диск» от «утечка соединений к БД» по симптомам?
3) Нарисуй (текстом) дашборд из 4 панелей для релиза новой версии API.`,
      },
    ],
  },
]
