# PR Gradient

Веб-инструмент для управления размещениями блогеров по 8 брендам холдинга НТС «Градиент».  
Production: **https://pr-gradient.onrender.com**

---

## Сценарии использования

Кратко: **Календарь** для обзора месяца, **Расписание** для активного планирования, две модалки для деталей.  
Toggle между Календарь ↔ Расписание — в шапке справа, состояние запоминается в браузере.

### 1. Войти

- Открыть https://pr-gradient.onrender.com → ввести общий пароль (хранится у тимлида).
- Cookie живёт 30 дней — повторно вводить не нужно.

### 2. Посмотреть месяц целиком (Календарь)

- Открывается по умолчанию.
- В каждой ячейке дня — **цветные точки**, по одной на размещение, цвет = бренд (легенда внизу).
- **❌** в правом верхнем углу ячейки → есть конфликт в этом дне.
- **Hover** на точку → tooltip с блогером, брендом, инструментом, категорией.
- **Клик** по точке → открыть карточку этого размещения.
- **Клик** по числу дня (или пустому месту в ячейке) → popover со списком всех размещений за день; «+ Добавить размещение» прямо отсюда.
- Если в дне больше 6 размещений — показывается `+N`, клик раскрывает popover.

### 3. Активно планировать на месяц («пасьянс») — Расписание

Переключить view → **Расписание**:

- Строки = блогеры (сортировка: больше размещений → сверху). Отображается 20 топ-блогеров, остальные через «Показать ещё».
- Столбцы = дни месяца.
- Каждая карточка в ячейке = одно размещение. Букву инструмента (`К`/`С`/`П`) показывает кружок, рядом — короткий код бренда (`VS`, `BB`, ...).
- **Drag-n-drop**: перетащить карточку на другую дату/другого блогера.
  - **Зелёная подсветка** ячейки = валидный drop, конфликта нет → drop = моментальный перенос + toast.
  - **Красная подсветка** + tooltip = конфликт. При drop — confirm-dialog с описанием конфликта; можно подтвердить «Всё равно поставить» или отменить.
- **Клик** по карточке без перетаскивания → открыть карточку размещения.
- **Клик** по имени блогера слева → открыть карточку блогера.

### 4. Запланировать новое размещение

Кнопка **+ Размещение** в шапке справа:

| Поле | Что вводим |
|---|---|
| Дата | Date picker, по умолчанию сегодня |
| Блогер | Combobox с поиском по имени. Если нет — внизу списка «+ Добавить нового» (см. §5) |
| Бренд | Select из активных брендов (см. §11) |
| Категория | Select из 10 категорий (Губы / Глаза / Лицо / Брови / Ногти / Волосы / Аксессуары / Коллекции / Эксклюзив / Уход) |
| Продукт | Свободный текст |
| Инструмент | Select: Крупный блогер / Свайп / Посев |
| Платформа | TikTok / VK / Telegram / Instagram / YouTube |
| Ссылка на пост | URL, опционально (заполняется после публикации) |
| Статус | Запланировано / Опубликовано / Отменено |

**Под формой live-проверка конфликта** обновляется при изменении даты/блогера/бренда/категории/инструмента:
- ✅ «Конфликтов не найдено» — нейтрально, можно сохранять.
- ❌ красный блок с разбором — «Требуется ≥N дн. между размещениями, фактически M».

«Сохранить» при конфликте → confirm-dialog «Размещение нарушает правила. Всё равно сохранить?»

### 5. Добавить нового блогера

- В модалке размещения → клик в поле «Блогер» → список → внизу **+ Добавить нового** (или `+ Добавить нового: «<то что в поиске>»`).
- Мини-форма: каноническое имя, платформа, ник без `@`.
- После «Добавить» блогер сразу выбран в текущей форме размещения.
- Полную карточку (контакт, уровень, заметки, другие платформы) — потом через карточку блогера в Расписании.

### 6. Карточка блогера

Из Расписания клик по имени слева → **BloggerModal**:

- **Поля**: Уровень (Крупный/Средний/Нано), 5 handle'ов (TikTok / VK / Telegram / Instagram / YouTube), Контакт (free-text), Заметки (textarea).
- **История размещений** (read-only, сортировка по дате, новые сверху): дата, цветная точка бренда, бренд, категория · инструмент, статус, ❌ если конфликт.
- **Клик** по строке истории → перейти в карточку этого размещения.
- «Сохранить» обновляет только поля блогера.

### 7. Что делать с конфликтом

Конфликт = у одного блогера есть размещения у разных брендов одного холдинга в пределах spacing-порога.

| Инструменты | Та же категория | Разные категории |
|---|---|---|
| Крупный + любой | ≥7 дней | ≥2 дня |
| Свайп + (свайп/посев) | ≥3 дня | ≥1 день |
| Посев + посев | ≥1 день | same-day-флаг |
| **Любые** в один день | всегда конфликт | всегда конфликт |

Размещения с **одного и того же бренда** (intra-brand) — не конфликт; внутри бренда сами решают.  
Отменённые (`Отменено`) — игнорируются в расчёте.

**В UI:**
- Календарь: красный ❌ на дне; точка с конфликтом — обведена красным.
- Расписание: карточка с красной обводкой.
- Фильтр **«Только конфликты»** (счётчик в шапке фильтров) — показать только проблемные.

**Решение:** либо перенести (drag в Расписании / edit в Календаре), либо подтвердить «Всё равно поставить» в confirm-dialog (для случаев, когда правило сознательно нарушаем).

### 8. Отметить размещение как опубликованное

- Открыть карточку размещения (клик на точку/карточку).
- Поле **Статус** → выбрать «Опубликовано».
- Заполнить **Ссылка на пост** (опционально, но полезно).
- Сохранить.

### 9. Отменить (удалить) размещение

- Открыть карточку → кнопка **🗑 Удалить** слева внизу.
- Confirm-dialog → подтвердить.
- Размещение получает статус «Отменено», исчезает из активного планирования. Данные остаются в БД (для аналитики / истории блогера).

### 10. Фильтры (общие для обеих view)

В строке под шапкой:

- **Бренд:** multi-select из всех активных брендов. Пусто = все.
- **Блогер:** search-select (один блогер). 
- **Только конфликты:** toggle, показывает только размещения с `hasConflict`. Рядом счётчик — сколько всего конфликтов в текущем месяце.
- **Сбросить** появляется, если что-то выбрано.

Фильтры применяются и к Календарю, и к Расписанию одинаково. **Не сохраняются** между сессиями.

### 11. Перемещение по месяцам

Шевроны **◀ Май 2026 ▶** в правой части filter bar.

### 12. Управление брендами

Кнопка **⚙️** в шапке (между View toggle и «+ Размещение»):

- **Список активных** брендов: цветной квадрат, название, код (`VIVIENNE_SABO`), короткий код (`VS`), счётчик размещений.
- **Список архивных** (если есть).
- **+ Добавить бренд** → форма:
  - **Код** — идентификатор UPPER_SNAKE_CASE (после создания не меняется!)
  - **Название** — отображается в селекторе, в Календаре, везде
  - **Короткий код** — 2–4 символа, показывается на карточках в Расписании
  - **Цвет** — HEX или клик по предустановленной палитре из 18 цветов
  - **Бренд НТС «Градиент»** (чекбокс) — учитывается ли в conflict-detect с другими брендами холдинга (по умолчанию да)
- **✏️ Редактировать** существующий: всё кроме `code`; можно архивировать.
- **Архивный** бренд:
  - НЕ показывается в селекторе нового размещения
  - Существующие размещения с ним остаются видимыми (тот же цвет, имя)
  - Можно вернуть в активные через ту же галочку

**Удаления нет** — только архивирование. Это сохраняет историческую целостность размещений.

---

## Стек (тех. часть)

- **Next.js 15** (App Router) + TypeScript + Turbopack
- **Prisma 5** + **SQLite** (dev) / **PostgreSQL** (prod через Neon)
- **Tailwind 4** + дизайн-токены из `docs/PR_Gradient_Spec_Designer.pdf`
- **TanStack Query** для server-state + optimistic updates
- **react-hook-form** + **zod** для валидации форм (схемы шарятся с сервером)
- **vitest** для unit-тестов `lib/conflict-detect.ts`
- Drag-n-drop в Расписании — кастомная реализация на pointer events (тактильность из дизайн-спеки: `rotate(2°)` + `scale(1.04)` + opacity)

## Запуск (dev)

```bash
npm install
cp .env.example .env
# для локальной разработки можно подложить SQLite в DATABASE_URL,
# но проще использовать тот же Neon что и прод (DB-провайдер один — postgresql)
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts                                          # 25 блогеров + 38 размещений
npx tsx prisma/seed-brands.ts                                   # 8 брендов холдинга
npx tsx scripts/import-excel.ts uploads/PR_Градиент_общая.xlsx  # +135 / +130 из xlsx (опц.)
npm run dev
```

Открыть http://localhost:3000 → ввести `SHARED_PASSWORD` из `.env`.

## Env vars (`.env`)

```
DATABASE_URL=postgresql://...                # Neon connection string
SHARED_PASSWORD=changeme                     # ЗАМЕНИТЬ перед deploy
AUTH_TOKEN=dev-auth-token-replace            # ЗАМЕНИТЬ (random uuid)
```

## Команды

| Команда | Что делает |
|---|---|
| `npm run dev` | dev-сервер на 3000 |
| `npm run build` | prod-сборка |
| `npm run lint` | ESLint |
| `npm run test` | vitest (conflict-detect unit-тесты, 14 кейсов) |
| `npm run db:push` | синхронизировать schema → DB |
| `npm run db:seed` | загрузить 25 блогеров + 38 placements |
| `npm run db:reset` | сброс БД + повторное применение схемы |
| `npm run import:excel -- путь` | импорт реального xlsx |

## Архитектура

```
app/
  api/
    auth/login, auth/logout              # cookie auth
    brands, brands/[code]                # CRUD брендов
    bloggers, bloggers/[id]
    placements, placements/[id]
    placements/check-conflict            # dry-run для live preview
  login/page.tsx                         # форма пароля
  page.tsx                               # главный экран (Calendar / Schedule + filter bar)
components/
  views/{calendar,schedule}-view.tsx
  modals/{placement,blogger,brands,day-placements-popover}.tsx
  {filter-bar,brand-legend,confirm-dialog,query-provider}.tsx
hooks/
  use-{placements,bloggers,brands,view-mode}.ts
lib/
  conflict-detect.ts          # pure spec-matrix algorithm (Tool × SameCategory)
  placement-conflict.ts       # server wrapper (DB load + detect)
  client-conflict-map.ts      # precompute hasConflict для batch render
  schemas.ts                  # zod (shared client+server)
  domain.ts                   # enum strings + RU labels (бренды теперь в БД)
  db.ts, api.ts, date.ts, types.ts, utils.ts
prisma/
  schema.prisma               # Brand + Blogger + Placement
  seed.ts                     # 25 блогеров + 38 размещений (порт прототипа)
  seed-brands.ts              # 8 брендов холдинга, idempotent
scripts/
  import-excel.ts             # реальный xlsx (5 листов брендов)
tests/
  conflict-detect.test.ts     # 14 кейсов (spec acceptance + edge)
middleware.ts                 # cookie auth + redirect to /login
```

## Деплой

Production: **https://pr-gradient.onrender.com** — Render (Frankfurt) + Neon Postgres (Frankfurt). Auto-deploy с push в `main`.

### Почему Render + Neon

Оба сервиса доступны из РФ без ВПН: хостятся на AWS, IP-диапазоны не в реестре РКН; поддомены `*.onrender.com` не таргетятся DPI (в отличие от `*.vercel.app` / `*.netlify.app`, которые режут МТС/Билайн). Neon — server-to-server, пользовательский браузер к нему не обращается.

### Первый deploy с нуля

1. **Neon** — `https://console.neon.tech/signup` → создать проект (Frankfurt, Postgres 16) → скопировать `DATABASE_URL`.
2. **Применить schema локально** (с временным `DATABASE_URL`):
   ```bash
   DATABASE_URL="<Neon URL>" npx prisma db push
   DATABASE_URL="<Neon URL>" npx tsx prisma/seed-brands.ts
   DATABASE_URL="<Neon URL>" npx tsx prisma/seed.ts
   DATABASE_URL="<Neon URL>" npx tsx scripts/import-excel.ts uploads/PR_Градиент_общая.xlsx
   ```
3. **GitHub** — публичный репо (или приватный + установить Render GitHub App).
4. **Render** — `https://dashboard.render.com` → New → Web Service → connect GitHub repo:
   - Region: **Frankfurt**
   - Build Command: `npm install --include=dev && npm run build`
   - Start Command: `npm start`
   - Plan: **Free**
   - Health Check Path: `/login`
   - Env vars: `DATABASE_URL`, `SHARED_PASSWORD`, `AUTH_TOKEN`, `NODE_ENV=production`

   Генерация секретов:
   ```bash
   node -e "console.log('SHARED_PASSWORD=' + require('crypto').randomBytes(8).toString('base64url'))"
   node -e "console.log('AUTH_TOKEN=' + require('crypto').randomUUID())"
   ```
5. **Keep-alive** — `.github/workflows/keep-alive.yml` уже в репо: GitHub Actions cron pingает `/login` каждые 10 мин, чтобы Render free service не уходил в sleep после 15 мин простоя.

### Бесплатный custom-домен `*.is-a.dev`

Fork `https://github.com/is-a-dev/register`, добавить `domains/pr-gradient.json`:
```json
{
  "owner": { "username": "<GitHub login>", "email": "<email>" },
  "records": { "CNAME": "pr-gradient.onrender.com" }
}
```
PR в `is-a-dev/register` → мержат за 1–24 ч. После мерджа на Render dashboard добавить custom domain `pr-gradient.is-a.dev`.

### Render configuration as code

`render.yaml` в корне репо описывает сервис целиком. ENV всё равно ставятся вручную (плейсхолдеры `sync: false`) — секреты не в git.

## Out of scope MVP

См. `docs/PR_Gradient_Spec_*.md` → «Out of scope». Кратко: user roles, audit log, webhooks, real-time, аналитика, ОРД, scraping, multi-tenant, dark mode, i18n, PWA, e2e-тесты.

## Прототип

В `legacy-prototype/` лежит client-only прототип на React+Babel-Standalone (без сборки). Открыть `legacy-prototype/index.html` в браузере для сравнения UX. Прототип не используется в production — только референс дизайна.
