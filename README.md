# PR Gradient

Веб-инструмент для управления размещениями блогеров по 8 брендам холдинга НТС «Градиент».

## Стек

- **Next.js 15** (App Router) + TypeScript + Turbopack
- **Prisma 5** + **SQLite** (dev). Для prod подложите PostgreSQL/Supabase — изменив `provider` в `prisma/schema.prisma`.
- **Tailwind 4** + дизайн-токены из `docs/PR_Gradient_Spec_Designer.pdf`
- **TanStack Query** для server-state и optimistic updates
- **react-hook-form** + **zod** для валидации форм (схемы шарятся с сервером)
- **vitest** для unit-тестов `lib/conflict-detect.ts`
- Drag-n-drop в Расписании — кастомная реализация на pointer events (тактильность из дизайн-спеки: rotate(2°)+scale(1.04)+opacity)

## Запуск (dev)

```bash
npm install
cp .env.example .env                                            # дефолтные параметры работают
npx prisma generate
npx prisma db push                                              # создаст prisma/dev.db
npx tsx prisma/seed.ts                                          # 25 блогеров + 38 размещений на май 2026
npx tsx scripts/import-excel.ts uploads/PR_Градиент_общая.xlsx  # +135 / +130 из реального xlsx (опц.)
npm run dev
```

Открыть http://localhost:3000 → ввести пароль `changeme`.

## Env vars (`.env`)

```
DATABASE_URL=file:./dev.db                              # SQLite
SHARED_PASSWORD=changeme                                # ЗАМЕНИТЕ перед deploy
AUTH_TOKEN=dev-auth-token-replace-in-production         # ЗАМЕНИТЕ (random uuid)
```

## Команды

| Команда | Что делает |
|---|---|
| `npm run dev` | dev-сервер на 3000 |
| `npm run build` | prod-сборка |
| `npm run lint` | ESLint |
| `npm run test` | vitest (conflict-detect unit-тесты) |
| `npm run db:push` | синхронизировать schema → SQLite |
| `npm run db:seed` | загрузить 25 блогеров + 38 placement из data.jsx |
| `npm run db:reset` | сброс БД и повторное применение схемы |
| `npm run import:excel -- путь` | импорт реального xlsx |

## Архитектура

```
app/
  api/                              # REST API (см. docs/PR_Gradient_Spec_Backend.md)
    auth/login, auth/logout
    bloggers, bloggers/[id]
    placements, placements/[id]
    placements/check-conflict       # dry-run preview
  login/page.tsx                    # форма пароля
  page.tsx                          # главный экран (Calendar / Schedule)
components/
  views/{calendar,schedule}-view.tsx
  modals/{placement,blogger,day-placements-popover}.tsx
  {filter-bar,brand-legend,confirm-dialog,query-provider}.tsx
hooks/
  use-{placements,bloggers,view-mode}.ts
lib/
  conflict-detect.ts          # pure spec-matrix algorithm
  placement-conflict.ts       # server wrapper (DB load + detect)
  client-conflict-map.ts      # precompute hasConflict for batch render
  schemas.ts                  # zod (shared client+server)
  domain.ts                   # enum strings + Russian labels + brand colors
  db.ts, api.ts, date.ts, types.ts, utils.ts
prisma/
  schema.prisma               # Blogger + Placement
  seed.ts                     # порт из legacy-prototype/data.jsx
scripts/
  import-excel.ts             # реальный xlsx (5 листов брендов)
tests/
  conflict-detect.test.ts     # 14 кейсов (spec acceptance + edge)
middleware.ts                 # cookie auth + redirect to /login
```

## Conflict detection (spec-версия)

Cross-brand (один блогер у разных брендов холдинга):

| Tools | Same category | Different category |
|---|---|---|
| Крупный + любой | ≥7 дней | ≥2 дня |
| Свайп + (свайп/посев) | ≥3 дня | ≥1 день |
| Посев + посев | ≥1 день | same-day flag |

Same-day cross-brand — **всегда** конфликт (intra-brand игнорируется как решение бренда). Cancelled placements — игнорируются.

## Конвейер

1. `dev.db` — единственный источник истины для местной разработки.
2. Импорт реальных данных — `npm run import:excel` (idempotent: дедуп блогеров по `(platform, handle)`).
3. Conflict detection — pure-function в `lib/conflict-detect.ts`, переиспользуется и на сервере (validate + 409 on POST), и на клиенте (live preview в форме, drag feedback).
4. Auth — single shared password в `.env`, cookie HTTP-only / SameSite=lax / 30 дней.

## Out of scope MVP

См. `docs/PR_Gradient_Spec_*.md` → «Out of scope». Кратко: user roles, audit log, webhooks, real-time, аналитика, ОРД, scraping, multi-tenant, dark mode, i18n, PWA, e2e-тесты.

## Прототип

В `legacy-prototype/` лежит client-only прототип на React+Babel-Standalone (без сборки). Открыть `legacy-prototype/index.html` в браузере для сравнения UX. Прототип не используется в production — только референс дизайна.
