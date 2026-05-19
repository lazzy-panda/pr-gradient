---
title: "PR Gradient — Спецификация для фронтенд-разработчика"
subtitle: "Веб-инструмент для управления размещениями блогеров"
author: "Kirill Morozov"
date: "19 мая 2026"
lang: ru
---

# Спецификация для фронтенд-разработчика

## Контекст

Внутренний веб-инструмент для PR-команды (4–6 пользователей). Управление размещениями блогеров по 8 брендам холдинга НТС «Градиент». Один главный экран с двумя view'ами (Календарь / Расписание) + две модалки (новое размещение + карточка блогера).

Связанные документы:

- `docs/PR_Gradient_Spec_Designer.md` — UI/UX спецификация
- `docs/PR_Gradient_Spec_Backend.md` — API контракты, модель данных

## Стек

| Слой | Технология | Зачем |
|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript** | Фуллстек в одном репо, API routes для backend, Vercel deploy за 1 клик |
| Styling | **Tailwind CSS 4** | Стандарт, быстро, отлично сочетается со shadcn/ui |
| UI library | **shadcn/ui** + **Radix primitives** | Готовые компоненты (Dialog, Combobox, Select, ToggleGroup, Calendar), копируются в проект, не lock-in |
| Calendar (View A) | **react-day-picker** (для month grid) или **shadcn `<Calendar>`** | Достаточно для overview view |
| Timeline + drag (View B) | **FullCalendar v6 + resource-timeline plugin** | MIT free версия покрывает; премиум-resource $480/год — не нужен для MVP |
| Forms | **react-hook-form + zod** | Валидация на клиенте до отправки |
| Data fetching | **TanStack Query v5** | Cache + revalidation, optimistic updates для drag-n-drop |
| Icons | **lucide-react** | Совпадает с shadcn |
| State | Локальный (`useState`, `useReducer`) + TanStack Query для server state | Никаких Redux/Zustand для MVP |

### Если хочется отделить frontend от backend

Заменить **Next.js API routes** на отдельный **NestJS** сервис (см. backend-спеку). Frontend остаётся Next.js с pages только — API base URL через `NEXT_PUBLIC_API_URL` env var.

## Структура проекта

```
pr-gradient/
├── app/
│   ├── layout.tsx                  # Root layout, auth wrapper
│   ├── login/page.tsx              # Простая форма пароля
│   ├── page.tsx                    # ЕДИНСТВЕННЫЙ главный экран
│   └── api/                        # Next.js API routes (см. backend spec)
├── components/
│   ├── ui/                         # shadcn компоненты (Dialog, Select, ...)
│   ├── header.tsx                  # Title + ViewToggle + AddButton
│   ├── view-toggle.tsx             # 📅/🗂 segmented control
│   ├── views/
│   │   ├── calendar-view.tsx       # View A
│   │   └── timeline-view.tsx       # View B (FullCalendar wrapper)
│   ├── filters-bar.tsx             # фильтры (общие для обеих view)
│   ├── modals/
│   │   ├── placement-modal.tsx     # модалка A
│   │   ├── blogger-modal.tsx      # модалка B
│   │   └── day-placements-popover.tsx  # список размещений дня (для клика по пустой ячейке Calendar)
│   └── conflict-badge.tsx          # ✅ / ❌ значок
├── lib/
│   ├── api.ts                      # fetcher (TanStack Query)
│   ├── conflict-detect.ts          # клиентская копия логики (для preview в форме)
│   ├── brand-colors.ts             # карта Brand → HEX
│   └── types.ts                    # shared types (Placement, Blogger, ...)
├── hooks/
│   ├── use-placements.ts           # TanStack Query hook
│   ├── use-bloggers.ts
│   └── use-view-mode.ts            # localStorage persist для toggle
└── prisma/                         # см. backend spec
```

## Маршруты

- `GET /login` — форма пароля (один input, отправляет POST на `/api/auth`). При success → redirect на `/` + cookie.
- `GET /` — главный экран. Защищён middleware на cookie.
- `POST /api/auth/logout` — очистить cookie.

**Всё остальное — API endpoints** (см. backend spec).

## Главный экран (`app/page.tsx`) — структура компонентов

```tsx
<main>
  <Header>
    <Title>PR Gradient</Title>
    <ViewToggle value={viewMode} onChange={setViewMode} />  {/* localStorage */}
    <Button onClick={() => setPlacementModalOpen(true)}>+ Размещение</Button>
  </Header>

  <FiltersBar filters={filters} onChange={setFilters} />

  {viewMode === 'calendar' ? (
    <CalendarView
      placements={filtered}
      onPlacementClick={(p) => openPlacementModal(p)}
      onDayClick={(date) => openDayPopover(date)}
    />
  ) : (
    <TimelineView
      placements={filtered}
      bloggers={bloggers}
      onPlacementClick={(p) => openPlacementModal(p)}
      onDrop={handleDragDrop}   /* optimistic update + PATCH /api/placements/:id */
    />
  )}

  <PlacementModal ... />
  <BloggerModal ... />
  <DayPlacementsPopover ... />
</main>
```

**Никакой таблицы снизу.** Доступ к деталям размещения — только через клик в основной view'хе.

## View A — Календарь

Использует `react-day-picker` или shadcn `<Calendar>` в month-mode. **Кастомный day renderer** (`Components={{ Day: CustomDay }}`):

```tsx
function CustomDay({ date }: { date: Date }) {
  const dayPlacements = placements.filter(p => isSameDay(p.date, date))
  const hasConflict = dayPlacements.some(p => p.conflictStatus === 'high')
  return (
    <div className="relative h-12 w-12 p-1">
      <span className="text-sm">{date.getDate()}</span>
      <div className="absolute bottom-1 left-1 flex flex-wrap gap-0.5">
        {dayPlacements.slice(0, 4).map(p => (
          <div
            key={p.id}
            className="h-2 w-2 rounded-full"
            style={{ background: BRAND_COLORS[p.brand] }}
            title={`${p.blogger.name} — ${p.brand} — ${p.tool}`}
          />
        ))}
        {dayPlacements.length > 4 && <span className="text-[10px]">+{dayPlacements.length - 4}</span>}
      </div>
      {hasConflict && <span className="absolute top-0 right-0 text-red-600">❌</span>}
    </div>
  )
}
```

Клик на день — `onSelect` хук фильтрует таблицу по `date === selectedDate`.

## View B — Расписание (FullCalendar resource-timeline)

```tsx
import FullCalendar from '@fullcalendar/react'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import interactionPlugin from '@fullcalendar/interaction'

<FullCalendar
  plugins={[resourceTimelinePlugin, interactionPlugin]}
  initialView="resourceTimelineMonth"
  resources={bloggers.map(b => ({ id: b.id, title: b.canonicalName }))}
  events={placements.map(p => ({
    id: p.id,
    resourceId: p.bloggerId,
    start: p.date,
    end: p.date,
    title: `${p.brand} · ${p.tool}`,
    backgroundColor: BRAND_COLORS[p.brand],
    extendedProps: { placement: p }
  }))}
  editable={true}
  eventDrop={async (info) => {
    const newDate = info.event.start
    const newBloggerId = info.newResource?.id ?? info.event.getResources()[0].id
    // optimistic UI update via TanStack Query
    await updatePlacement.mutateAsync({
      id: info.event.id,
      date: newDate,
      bloggerId: newBloggerId
    })
    // re-run conflict detection on receive; if HIGH conflict → confirm dialog
  }}
  eventAllow={(dropInfo, draggedEvent) => {
    // optional: pre-check via conflict-detect.ts, отменить drop если HIGH conflict без подтверждения
    return true
  }}
  height="auto"
/>
```

**Note по resource view:** `resourceTimelineMonth` доступен в **free FullCalendar v6** через `@fullcalendar/resource-timeline` (теперь MIT). Проверить лицензию при `npm install`.

Optimistic update во время drag:
1. UI обновляется немедленно (TanStack Query `setQueryData`)
2. Параллельно POST на API
3. Если backend возвращает HIGH conflict без подтверждения — откатить через `setQueryData` + показать confirm dialog
4. Если confirmed → повторить с `force: true` флагом

## Модалка «Новое размещение»

Использует **shadcn `<Dialog>`** + **react-hook-form** + **zod**:

```tsx
const schema = z.object({
  date: z.date(),
  brand: z.enum(BRANDS),
  category: z.enum(CATEGORIES),
  product: z.string().min(1),
  bloggerId: z.string().uuid(),
  tool: z.enum(TOOLS),
  platform: z.enum(PLATFORMS),
  postUrl: z.string().url().optional().or(z.literal('')),
  status: z.enum(['planned','published','cancelled']).default('planned'),
})
```

Поле «Блогер» — `<Combobox>` (shadcn) с asynchronous search:

```tsx
<Combobox
  value={bloggerId}
  onSearch={async (query) => searchBloggers(query)}  // GET /api/bloggers?q=...
  onCreateNew={(name) => /* inline form для нового блогера */}
/>
```

### Live conflict preview

Подписка на изменения формы через `useWatch`:

```tsx
const { date, bloggerId, brand, category, tool } = useWatch({ control })
const conflictPreview = useQuery({
  queryKey: ['conflict-check', { date, bloggerId, brand, category, tool }],
  queryFn: () => api.checkConflict({ date, bloggerId, brand, category, tool }),
  enabled: !!(date && bloggerId && brand && category && tool),
  staleTime: 0,
})

{conflictPreview.data && (
  <ConflictBanner result={conflictPreview.data} />
)}
```

Backend endpoint `POST /api/placements/check-conflict` возвращает `{ hasConflict: boolean, conflicts: [...] }`. Два визуальных состояния: ✅ (`hasConflict === false`) или ❌ с деталями (`hasConflict === true`). Промежуточного «предупреждения» нет.

## Модалка «Карточка блогера»

Same shadcn `<Dialog>`. Загружает блогера + его placements:

```tsx
const blogger = useQuery({ queryKey: ['blogger', id], queryFn: () => api.getBlogger(id) })
// blogger.data.placements автоматически приходит include'м с backend
```

**Merge (объединение дубликатов) в MVP нет** — если со временем заведутся дубли, правка вручную в БД. Эта кнопка/sub-modal не строится.

## Filter bar

```tsx
type Filters = {
  brands: Brand[]      // empty = все
  bloggerIds: string[] // empty = все
  conflictsOnly: boolean
}
```

Применяется к **всем трём** компонентам (Calendar / Timeline / Table) через один общий state.

## Brand colors

`lib/brand-colors.ts`:

```ts
export const BRAND_COLORS = {
  'Vivienne Sabó': '#B91C5C',
  'Stellary': '#1D4ED8',
  'Influence Beauty': '#059669',
  'Beauty Bomb': '#EC4899',
  'Love Generation': '#EA580C',
  'ARTDECO': '#374151',
  'Deborah Milano': '#7C3AED',
  'Physicians Formula': '#0891B2',
} as const
```

## Авторизация (MVP)

`middleware.ts`:

```ts
export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/api/auth')) return NextResponse.next()
  const cookie = req.cookies.get('pr_gradient_auth')
  if (!cookie || cookie.value !== process.env.AUTH_TOKEN) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  return NextResponse.next()
}
```

`/login` — один input + POST на `/api/auth` с паролем. Backend сравнивает с `process.env.SHARED_PASSWORD` и устанавливает cookie. **Никакого user management.** Один shared password на всю PR-команду.

## Mobile

Tailwind breakpoints, по умолчанию responsive. Specifically:

- На `<768px` — ViewToggle скрыт, всегда показывается Calendar (drag-n-drop на тач выключен)
- Таблица превращается в карточки через `block md:table-row` Tailwind utilities
- Модалки — `sm:max-w-md` (full-screen на mobile, центрированы на desktop)

## Performance

- Placements кэшируются в TanStack Query (`staleTime: 30s`)
- При >500 placements в таблице — virtualize через `@tanstack/react-virtual`
- FullCalendar resource view умеет hide-rows-without-events — включить, чтобы не рендерить 220 строк блогеров за раз

## Acceptance criteria

1. ✅ `/` загружается, токен в cookie проверен
2. ✅ Видны 8 брендов на легенде, цвета совпадают с дизайн-системой
3. ✅ Toggle переключает Calendar ↔ Timeline без перезагрузки страницы, состояние сохраняется после перезахода
4. ✅ Calendar показывает точки правильного цвета по дням; клик по точке открывает модалку A; клик по дню открывает popover со списком размещений дня
5. ✅ Timeline позволяет drag-n-drop карточки на другие дни/блогеров; карточки имеют тактильные состояния (rest/hover/dragging/dropped) согласно designer-спеке
6. ✅ Drag в день, где у того же блогера уже размещение в пределах spacing-порога — красная подсветка drop-zone, confirm dialog при drop
7. ✅ Кнопка «+ Размещение» открывает модалку, поля валидируются, live conflict preview работает (бинарно: ✅ или ❌)
8. ✅ Клик на блогера в карточке Timeline (или в popover дня) открывает модалку B с историей; кнопки merge нет
9. ✅ Фильтры (Бренд / Блогер / только конфликты) применяются ко всем view'ам синхронно
10. ✅ Адаптивно работает на iPad (≥768px); на мобильных view B скрыт

## Deliverables

1. Public GitHub/GitLab репозиторий (или приватный с invite Кириллу)
2. README на 1 страницу: install, env vars, dev / build / deploy
3. `vercel.json` или эквивалент — deploy в одну команду
4. Deployed preview URL (Vercel preview deployment для проверки)
5. Один screencast 5 минут — пробег по фичам

## Out of scope

- ❌ SSR/SSG оптимизации (просто CSR в client component)
- ❌ i18n (одна локаль — Russian)
- ❌ Темная тема
- ❌ Animations выше базовых hover/focus
- ❌ Offline mode / PWA
- ❌ Real-time updates через WebSocket (TanStack Query polling 30s достаточно)
- ❌ Тесты выше smoke (1 e2e + базовая валидация форм)
