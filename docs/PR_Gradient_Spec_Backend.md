---
title: "PR Gradient — Спецификация для бэкенд-разработчика"
subtitle: "Веб-инструмент для управления размещениями блогеров"
author: "Kirill Morozov"
date: "19 мая 2026"
lang: ru
---

# Спецификация для бэкенд-разработчика

## Контекст

API для внутреннего веб-инструмента PR-команды (4–6 пользователей). Управление размещениями блогеров по 8 брендам холдинга НТС «Градиент». Основная сложная логика — детекция конфликтов между размещениями (один блогер в нескольких брендах в пределах spacing-порога).

Связанные документы:

- `docs/PR_Gradient_Spec_Frontend.md` — Frontend
- `docs/PR_Gradient_Spec_Designer.md` — UI/UX

## Стек

| Слой | Технология | Зачем |
|---|---|---|
| Runtime | **Node.js 20+** | Standard |
| Framework | **Next.js 15 API routes** (default) ИЛИ **NestJS 10** (если отдельный сервис) | Next.js — монорепо с frontend, проще deploy на Vercel; NestJS — если хочется reuse архитектуры от Dream Platform |
| ORM | **Prisma 5** | Type-safe queries, миграции в коде, играет с TypeScript |
| DB | **PostgreSQL** (Supabase Free tier на prod, SQLite на dev) | Supabase free хватит на 1500 записей + 500 MB storage |
| Validation | **zod** | shared schema между client и server (через `lib/schemas.ts`) |
| Auth | **HTTP-only cookie** с shared password | Никакого user management. Один пароль на всех. |
| Hosting | **Vercel** (если Next.js) или **Railway/Render** (если NestJS) | Free tier для обоих |

### Default рекомендация

**Next.js API routes** в том же репо что и frontend. Один deploy на Vercel, одна env config. Если позже захочется отделить — миграция тривиальная (handlers переезжают в NestJS controllers без изменения логики).

## Модель данных (Prisma schema)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"        // или "sqlite" локально
  url      = env("DATABASE_URL")
}

enum Brand {
  VIVIENNE_SABO
  STELLARY
  INFLUENCE_BEAUTY
  BEAUTY_BOMB
  LOVE_GENERATION
  ARTDECO
  DEBORAH_MILANO
  PHYSICIANS_FORMULA
}

enum Category {
  EYES        // Глаза
  LIPS        // Губы
  FACE        // Лицо
  BROWS       // Брови
  COLLECTIONS // Коллекции
  EXCLUSIVE   // Эксклюзив
  CARE        // Уход
}

enum Tool {
  KRUPNY      // Крупный блогер
  SWIPE       // Свайп
  POSEV       // Посев
}

enum Platform {
  TIKTOK
  VK
  TELEGRAM
  INSTAGRAM
  YOUTUBE
}

enum PlacementStatus {
  PLANNED     // Запланировано
  PUBLISHED   // Опубликовано
  CANCELLED   // Отменено
}

enum BloggerLevel {
  TOP         // Крупный
  MID         // Средний
  NANO        // Нано
}

model Blogger {
  id              String       @id @default(uuid())
  canonicalName   String       @unique
  level           BloggerLevel @default(MID)

  handleTiktok    String?
  handleVk        String?
  handleTelegram  String?
  handleInstagram String?
  handleYoutube   String?

  contact         String?
  notes           String?

  placements      Placement[]

  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  @@index([canonicalName])
}

model Placement {
  id          String          @id @default(uuid())
  date        DateTime        // YYYY-MM-DD only, time всегда 00:00:00 UTC
  brand       Brand
  category    Category
  product     String
  tool        Tool
  platform    Platform
  postUrl     String?
  status      PlacementStatus @default(PLANNED)

  blogger     Blogger         @relation(fields: [bloggerId], references: [id], onDelete: Restrict)
  bloggerId   String

  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  @@index([date])
  @@index([bloggerId, date])     // КРИТИЧЕСКИЙ для conflict detection
  @@index([brand, date])
  @@index([status])
}
```

**Решения по схеме:**

- **Brand / Category / Tool / Platform** как Prisma `enum` — компилируется в Postgres `CHECK CONSTRAINT`. Не отдельные таблицы. Если в будущем понадобится править значения — Prisma migration, один файл, 5 минут.
- **Один блогер = одна запись, до 5 handles** в этой же записи. Не отдельная таблица BloggerAccount. Если со временем заведутся дубли (`Полина` и `Polina P.`) — правятся вручную в БД (это работа разработчика, не PR-менеджера; MVP такого UI не имеет).
- **Удаление блогера запрещено**, если есть placements (`onDelete: Restrict`). Сначала soft-delete placements (изменить status на CANCELLED).
- **`@@index([bloggerId, date])`** — основной для conflict-check запроса.

## API endpoints (REST)

Базовый URL: `/api/`. Все защищены auth middleware (cookie check).

### Bloggers

| Метод | Путь | Назначение |
|---|---|---|
| `GET` | `/api/bloggers` | List + search via `?q=name` |
| `GET` | `/api/bloggers/:id` | Get с include `placements` |
| `POST` | `/api/bloggers` | Create |
| `PATCH` | `/api/bloggers/:id` | Update |

### Placements

| Метод | Путь | Назначение |
|---|---|---|
| `GET` | `/api/placements` | List с фильтрами: `?from=YYYY-MM-DD&to=YYYY-MM-DD&brand=...&bloggerId=...&conflictsOnly=true` |
| `GET` | `/api/placements/:id` | Get с include `blogger` + `conflicts` (computed) |
| `POST` | `/api/placements` | Create. Если `hasConflict === true` — return 409 с деталями. Body может содержать `force: true` для override. |
| `PATCH` | `/api/placements/:id` | Update (включая drag-n-drop reschedule). Та же логика конфликта. |
| `DELETE` | `/api/placements/:id` | Soft delete (status → CANCELLED) |
| `POST` | `/api/placements/check-conflict` | **Dry-run** для UI preview. Body: `{ date, bloggerId, brand, category, tool, excludeId? }`. Returns `{ hasConflict, conflicts }` без сохранения. |

### Auth

| Метод | Путь | Назначение |
|---|---|---|
| `POST` | `/api/auth/login` | Body: `{ password }`. Если match — set cookie `pr_gradient_auth` (HTTP-only, secure, SameSite=lax). |
| `POST` | `/api/auth/logout` | Clear cookie |

### Misc

| Метод | Путь | Назначение |
|---|---|---|
| `POST` | `/api/import/excel` | Bulk import из CSV (один раз для миграции из текущей Excel). Admin-only via env flag. |

## Conflict detection — алгоритм

Главная функция, переиспользуется и в `POST /api/placements`, и в `POST /api/placements/check-conflict`:

```ts
// lib/conflict-detect.ts

type ConflictResult = {
  hasConflict: boolean
  conflicts: Array<{
    placementId: string
    blogger: string
    brand: Brand
    date: Date
    tool: Tool
    daysActual: number
    daysRequired: number
    reason: string
  }>
}

const TOOL_SEVERITY: Record<Tool, number> = {
  KRUPNY: 3,
  SWIPE: 2,
  POSEV: 1,
}

function isSameCategory(a: Category, b: Category): boolean {
  return a === b  // simple version. Можно расширить proximity matrix позже.
}

function getSpacingThreshold(tool1: Tool, tool2: Tool, sameCategory: boolean): number {
  // Из правила в листе "Общая" текущего Excel:
  // - крупная поддержка (max tool = KRUPNY) — 2 дня разноплановые / 5-7 дней смежные
  // - меньше — пропорционально
  const maxSeverity = Math.max(TOOL_SEVERITY[tool1], TOOL_SEVERITY[tool2])
  if (maxSeverity === 3) return sameCategory ? 7 : 2       // KRUPNY
  if (maxSeverity === 2) return sameCategory ? 3 : 1       // SWIPE
  return sameCategory ? 1 : 0                              // POSEV (только same-day flag)
}

export async function detectConflicts(
  input: {
    date: Date
    bloggerId: string
    brand: Brand
    category: Category
    tool: Tool
    excludeId?: string  // при update — исключить саму строку из проверки
  },
  prisma: PrismaClient
): Promise<ConflictResult> {
  const fourteenDays = 14 * 24 * 60 * 60 * 1000
  const sameBloggerPlacements = await prisma.placement.findMany({
    where: {
      bloggerId: input.bloggerId,
      status: { not: 'CANCELLED' },
      id: input.excludeId ? { not: input.excludeId } : undefined,
      date: {
        gte: new Date(input.date.getTime() - fourteenDays),
        lte: new Date(input.date.getTime() + fourteenDays),
      },
    },
    include: { blogger: true },
  })

  const conflicts = sameBloggerPlacements
    .filter(p => p.brand !== input.brand)  // только cross-brand внутри холдинга
    .map(p => {
      const days = Math.abs(daysBetween(p.date, input.date))
      const sameCategory = isSameCategory(p.category, input.category)
      const required = getSpacingThreshold(p.tool, input.tool, sameCategory)
      return { p, days, required, sameCategory }
    })
    .filter(({ days, required }) => days < required)  // только реальные нарушения

  return {
    hasConflict: conflicts.length > 0,
    conflicts: conflicts.map(({ p, days, required, sameCategory }) => ({
      placementId: p.id,
      blogger: p.blogger.canonicalName,
      brand: p.brand,
      date: p.date,
      tool: p.tool,
      daysActual: days,
      daysRequired: required,
      reason: `Требуется ≥${required} дн между размещениями ${sameCategory ? 'в одной категории' : 'разных категорий'}, фактически ${days}`,
    })),
  }
}
```

**Граничные случаи:**

- Если `input.brand === existingPlacement.brand` (один и тот же бренд) → не конфликт. Внутри бренда они сами решают.
- Если `status === 'CANCELLED'` → исключаем из проверки.
- Один и тот же блогер в один и тот же день у разных брендов = всегда `error`.
- `excludeId` для update-case: при перетаскивании Placement не должен конфликтовать сам с собой.

## Validation schemas (zod, shared с frontend)

`lib/schemas.ts`:

```ts
import { z } from 'zod'

export const BRANDS = ['VIVIENNE_SABO','STELLARY',...] as const
export const CATEGORIES = ['EYES','LIPS',...] as const
export const TOOLS = ['KRUPNY','SWIPE','POSEV'] as const
export const PLATFORMS = ['TIKTOK','VK','TELEGRAM','INSTAGRAM','YOUTUBE'] as const

export const placementCreateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  brand: z.enum(BRANDS),
  category: z.enum(CATEGORIES),
  product: z.string().min(1).max(200),
  bloggerId: z.string().uuid(),
  tool: z.enum(TOOLS),
  platform: z.enum(PLATFORMS),
  postUrl: z.string().url().optional().nullable(),
  status: z.enum(['PLANNED','PUBLISHED','CANCELLED']).default('PLANNED'),
  force: z.boolean().optional(),  // override HIGH conflict
})

export const bloggerCreateSchema = z.object({
  canonicalName: z.string().min(1).max(120),
  level: z.enum(['TOP','MID','NANO']).default('MID'),
  handleTiktok: z.string().optional().nullable(),
  handleVk: z.string().optional().nullable(),
  handleTelegram: z.string().optional().nullable(),
  handleInstagram: z.string().optional().nullable(),
  handleYoutube: z.string().optional().nullable(),
  contact: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})
```

## Auth middleware

```ts
// middleware.ts (Next.js)
import { NextResponse } from 'next/server'

export function middleware(req) {
  if (req.nextUrl.pathname.startsWith('/api/auth')) return NextResponse.next()
  const cookie = req.cookies.get('pr_gradient_auth')
  if (!cookie || cookie.value !== process.env.AUTH_TOKEN) {
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }
  return NextResponse.next()
}
```

`POST /api/auth/login`:

```ts
const { password } = await req.json()
if (password !== process.env.SHARED_PASSWORD) {
  return Response.json({ error: 'wrong password' }, { status: 401 })
}
const res = NextResponse.json({ ok: true })
res.cookies.set('pr_gradient_auth', process.env.AUTH_TOKEN, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 30, // 30 days
})
return res
```

**Env vars:**

```
DATABASE_URL=postgresql://...
SHARED_PASSWORD=<тот, что говорим PR-команде>
AUTH_TOKEN=<random secret, e.g. uuid>
```

## Excel import (one-off)

`scripts/import-excel.ts` — отдельный скрипт, запускается через `tsx scripts/import-excel.ts <path>`:

1. Парсит `PR_Градиент_общая.xlsx` через `xlsx` library
2. Нормализует:
   - Месяцы → канонические значения
   - Handles → strip `@`, lowercase
   - Даты → ISO, для диапазонов «12 - 24 мая» берёт start
   - Категории → enum mapping
   - Tools → enum mapping
3. Дедупликация bloggers по `{handle, platform}` пересечениям → каноническое имя
4. Inserts через `prisma.placement.createMany`
5. Лог результата: сколько rows, сколько unique bloggers, сколько skipped

Этот скрипт **запускается один раз** при старте проекта. Не expose'ится как API в production.

## Acceptance criteria

1. ✅ `prisma migrate dev` создаёт схему, FK/индексы стоят
2. ✅ `GET /api/placements?from=...&to=...` возвращает list с правильными фильтрами
3. ✅ `POST /api/placements` валидирует через zod, возвращает 422 на bad input
4. ✅ `POST /api/placements/check-conflict` возвращает корректный `hasConflict` для типовых кейсов:
   - Same blogger, same brand → `false`
   - Same blogger, different brand, +1 day, Крупный + Крупный, same category → `true` (нужно 7)
   - Same blogger, different brand, +3 days, Свайп + Свайп, different category → `false`
   - Same blogger, different brand, +1 day, Крупный + Свайп, different category → `true` (нужно 2)
5. ✅ `POST /api/placements` возвращает 409 при conflict без `force: true`, и 200 с `force: true`
6. ✅ Auth middleware блокирует доступ без cookie
7. ✅ Импорт-скрипт прогоняет текущий xlsx, создаёт ≥1300 placements и ≥200 unique bloggers
8. ✅ База на Supabase Free tier поднята, env vars в Vercel настроены, deployment работает

## Deliverables

1. Prisma schema файл (`prisma/schema.prisma`)
2. API handlers в `app/api/*/route.ts` (если Next.js) или `src/*.controller.ts` (если NestJS)
3. `lib/conflict-detect.ts` — переиспользуемая функция
4. `lib/schemas.ts` — zod schemas
5. `scripts/import-excel.ts` — миграция данных
6. README: `prisma migrate dev`, `npm run dev`, env vars
7. Базовые тесты для conflict-detect (4 кейса из acceptance criteria) — vitest или jest
8. Seed-данные для local dev (минимум 5 bloggers + 10 placements чтобы UI можно было пощупать без import-скрипта)

## Out of scope

- ❌ User management (login/signup/roles/permissions)
- ❌ Audit log
- ❌ Webhooks/уведомления (Telegram/email при конфликте)
- ❌ Real-time updates (WebSocket)
- ❌ Аналитика и отчёты
- ❌ ОРД-маркировка / интеграция с Dream Platform / MediaScout
- ❌ TikTok/VK scraping контента
- ❌ Multi-tenant
- ❌ Rate limiting (нет публичного доступа, не нужно)
- ❌ Background jobs / queues

Принцип: «всё, что не описано в этой спеке — out of scope в MVP».
