"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ChevronRight, Layers, Plus, Trash2, X } from "lucide-react";
import type { Placement, Blogger, ConflictResult } from "@/lib/types";
import { TOOL_SHORT } from "@/lib/domain";
import type { Tool } from "@/lib/domain";
import { useBrands, brandColor, brandLabel } from "@/hooks/use-brands";
import { fmtRuShort } from "@/lib/date";
import {
  OVERVIEW_CATEGORIES,
  OVERVIEW_MONTHS,
  OVERVIEW_MONTH_INDEX,
  OVERVIEW_STATUSES,
  OVERVIEW_SUPPORT_RULES,
  OVERVIEW_TRACKS_DEFAULT,
  OVERVIEW_YEAR,
  spanMonths,
  type OverviewItem,
  type OverviewStatus,
  type OverviewTrack,
} from "@/lib/overview-data";

interface Props {
  placements: Placement[];
  bloggers: Blogger[];
  conflictMap: Record<string, ConflictResult>;
  onOpenPlacement: (p: Placement) => void;
  onJumpToSchedule: (opts: { year: number; month: number }) => void;
  onAddPlacementWith: (opts: { brand: string; date: string; product?: string }) => void;
}

type PopoverState =
  | {
      mode: "edit";
      trackId: string;
      itemIdx: number;
      anchor: { x: number; y: number };
      draft: { product: string; status: OverviewStatus; span: number; startMonth: string };
    }
  | {
      mode: "add";
      trackId: string;
      monthKey: string;
      anchor: { x: number; y: number };
      draft: { product: string; status: OverviewStatus; span: number; startMonth: string };
    };

interface TipState {
  x: number;
  y: number;
  item: OverviewItem;
  trackBrandCode: string;
  span: number;
  startMonth: string;
}

const COL_LABEL_W = 84;
const COL_BRAND_W = 156;
const COL_MONTH_W = 132;

export function OverviewView({
  placements,
  bloggers,
  conflictMap,
  onOpenPlacement,
  onJumpToSchedule,
  onAddPlacementWith,
}: Props) {
  const { byCode: brandsByCode } = useBrands({ includeArchived: true });

  const [tracks, setTracks] = useState<OverviewTrack[]>(() =>
    OVERVIEW_TRACKS_DEFAULT.map((t) => ({ ...t, items: t.items.map((i) => ({ ...i, months: [...i.months] })) })),
  );
  const [statusFilter, setStatusFilter] = useState<OverviewStatus | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [tip, setTip] = useState<TipState | null>(null);

  const byCategory = useMemo(() => {
    const out: Record<string, OverviewTrack[]> = {};
    OVERVIEW_CATEGORIES.forEach((c) => { out[c.id] = []; });
    tracks.forEach((t) => {
      if (out[t.category]) out[t.category].push(t);
    });
    return out;
  }, [tracks]);

  const visibleCategories = activeCategory
    ? OVERVIEW_CATEGORIES.filter((c) => c.id === activeCategory)
    : OVERVIEW_CATEGORIES;

  const totalLaunches = useMemo(
    () => tracks.reduce((s, t) => s + t.items.length, 0),
    [tracks],
  );

  const statusCounts = useMemo(() => {
    const counts: Record<OverviewStatus, number> = { plan: 0, priority: 0, seeding: 0 };
    tracks.forEach((t) => t.items.forEach((i) => { counts[i.status] += 1; }));
    return counts;
  }, [tracks]);

  // ── Mutations ─────────────────────────────────────────────────────────
  const saveItem = (trackId: string, itemIdx: number, patch: Partial<OverviewItem>) => {
    setTracks((prev) => prev.map((t) => {
      if (t.id !== trackId) return t;
      const items = [...t.items];
      items[itemIdx] = { ...items[itemIdx], ...patch };
      return { ...t, items };
    }));
  };
  const deleteItem = (trackId: string, itemIdx: number) => {
    setTracks((prev) => prev.map((t) => {
      if (t.id !== trackId) return t;
      return { ...t, items: t.items.filter((_, i) => i !== itemIdx) };
    }));
  };
  const addItem = (trackId: string, monthKey: string, draft: { product: string; status: OverviewStatus; span: number }) => {
    setTracks((prev) => prev.map((t) => {
      if (t.id !== trackId) return t;
      return { ...t, items: [...t.items, { product: draft.product, status: draft.status, months: spanMonths(monthKey, draft.span) }] };
    }));
  };

  // ── Popover open/close ───────────────────────────────────────────────
  const closePopover = () => setPopover(null);

  const openEditPopover = (e: React.MouseEvent, track: OverviewTrack, itemIdx: number) => {
    e.stopPropagation();
    const item = track.items[itemIdx];
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopover({
      mode: "edit",
      trackId: track.id,
      itemIdx,
      anchor: { x: rect.left, y: rect.bottom + 6 },
      draft: { product: item.product, status: item.status, span: item.months.length, startMonth: item.months[0] },
    });
  };
  const openAddPopover = (e: React.MouseEvent, track: OverviewTrack, monthKey: string) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopover({
      mode: "add",
      trackId: track.id,
      monthKey,
      anchor: { x: rect.left, y: rect.bottom + 6 },
      draft: { product: "", status: "plan", span: 1, startMonth: monthKey },
    });
  };

  useEffect(() => {
    if (!popover) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closePopover(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [popover]);

  return (
    <div className="ov-wrap" onClick={closePopover}>
      <div className="ov-toolbar">
        <div className="ov-toolbar-left">
          <span className="ov-stat-num">{totalLaunches}</span>
          <span className="ov-stat-lbl">запусков · {OVERVIEW_YEAR}</span>
        </div>

        <div className="ov-legend">
          {(Object.entries(OVERVIEW_STATUSES) as [OverviewStatus, typeof OVERVIEW_STATUSES.plan][]).map(([key, s]) => (
            <button
              key={key}
              className={`ov-legend-chip ${statusFilter === key ? "is-active" : ""} ${statusFilter && statusFilter !== key ? "is-dim" : ""}`}
              onClick={(e) => { e.stopPropagation(); setStatusFilter((prev) => prev === key ? null : key); }}
              style={{ "--swatch": s.bg, "--swatch-border": s.border, "--swatch-ink": s.ink } as React.CSSProperties}
              title={s.hint}
            >
              <span className="ov-legend-swatch" />
              <span>{s.label}</span>
              <span className="ov-legend-count">{statusCounts[key]}</span>
            </button>
          ))}
        </div>

        <div className="ov-cat-pills">
          <button
            className={`ov-cat-pill ${!activeCategory ? "is-active" : ""}`}
            onClick={(e) => { e.stopPropagation(); setActiveCategory(null); }}
          >
            Все категории
          </button>
          {OVERVIEW_CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={`ov-cat-pill ${activeCategory === c.id ? "is-active" : ""}`}
              onClick={(e) => { e.stopPropagation(); setActiveCategory((prev) => prev === c.id ? null : c.id); }}
            >
              {c.label}
              <span className="ov-cat-pill-count">{byCategory[c.id]?.reduce((s, t) => s + t.items.length, 0) || 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="ov-scroll">
        <div
          className="ov-grid"
          style={{
            minWidth: COL_LABEL_W + COL_BRAND_W + COL_MONTH_W * OVERVIEW_MONTHS.length,
            gridTemplateColumns: `${COL_LABEL_W}px ${COL_BRAND_W}px repeat(${OVERVIEW_MONTHS.length}, ${COL_MONTH_W}px)`,
          }}
        >
          {/* Header row */}
          <div className="ov-th ov-th-corner">Категория</div>
          <div className="ov-th ov-th-brand">Бренд / линия</div>
          {OVERVIEW_MONTHS.map((m) => (
            <div key={m.key} className="ov-th ov-th-month">
              <span className="ov-th-month-label">{m.label}</span>
              <span className="ov-th-month-num">{OVERVIEW_YEAR}</span>
            </div>
          ))}

          {visibleCategories.map((cat) => {
            const catTracks = byCategory[cat.id] ?? [];
            const trackCount = Math.max(1, catTracks.length);
            return (
              <CategoryRows
                key={cat.id}
                category={cat}
                tracks={catTracks}
                trackCount={trackCount}
                brandColorOf={(code) => brandColor(brandsByCode, code)}
                brandLabelOf={(code) => brandLabel(brandsByCode, code)}
                statusFilter={statusFilter}
                popover={popover}
                onOpenEdit={openEditPopover}
                onOpenAdd={openAddPopover}
                setTip={setTip}
              />
            );
          })}
        </div>
      </div>

      {tip && !popover && (() => {
        const brand = brandsByCode[tip.trackBrandCode];
        const status = OVERVIEW_STATUSES[tip.item.status];
        const monthLabels = tip.item.months
          .map((k) => OVERVIEW_MONTHS.find((m) => m.key === k)?.label ?? k)
          .join(" → ");
        return (
          <div className="ov-tip" style={{ left: tip.x + 14, top: tip.y + 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span className="dot-mini" style={{ background: brand?.color ?? "#9A9AA3" }} />
              <span style={{ fontWeight: 600 }}>{brand?.name ?? tip.trackBrandCode}</span>
            </div>
            <div className="ov-tip-prod">{tip.item.product}</div>
            <div className="ov-tip-meta">{monthLabels}</div>
            <div className="ov-tip-status">
              <span className="ov-tip-status-dot" style={{ background: status.dot }} />
              {status.label}{status.hint ? ` · ${status.hint}` : ""}
            </div>
            <div className="ov-tip-cta">→ кликни для размещений и редактирования</div>
          </div>
        );
      })()}

      {popover && (
        <PopoverShell anchor={popover.anchor} onClose={closePopover}>
          {popover.mode === "edit" ? (
            <EditPopover
              popover={popover}
              setPopover={setPopover}
              track={tracks.find((t) => t.id === popover.trackId)!}
              placements={placements}
              bloggers={bloggers}
              conflictMap={conflictMap}
              brandsByCode={brandsByCode}
              onSave={(patch) => { saveItem(popover.trackId, popover.itemIdx, patch); closePopover(); }}
              onDelete={() => { deleteItem(popover.trackId, popover.itemIdx); closePopover(); }}
              onOpenPlacement={(p) => { closePopover(); onOpenPlacement(p); }}
              onJumpToSchedule={(opts) => { closePopover(); onJumpToSchedule(opts); }}
              onAddPlacement={(opts) => { closePopover(); onAddPlacementWith(opts); }}
            />
          ) : (
            <AddPopover
              popover={popover}
              setPopover={setPopover}
              track={tracks.find((t) => t.id === popover.trackId)!}
              brandsByCode={brandsByCode}
              onSave={(draft) => { addItem(popover.trackId, popover.monthKey, draft); closePopover(); }}
            />
          )}
        </PopoverShell>
      )}

      <div className="ov-rules">
        <div className="ov-rules-head">Правила поддержки</div>
        <div className="ov-rules-grid">
          {OVERVIEW_SUPPORT_RULES.map((r) => {
            const s = OVERVIEW_STATUSES[r.status];
            return (
              <div key={r.id} className="ov-rules-row">
                <span className="ov-rules-swatch" style={{ background: s.bg, borderColor: s.border }} />
                <div>
                  <div className="ov-rules-label">{r.label}</div>
                  <div className="ov-rules-detail">{r.detail}</div>
                </div>
              </div>
            );
          })}
          <div className="ov-rules-row">
            <span className="ov-rules-swatch" style={{ background: "#fff", border: "1px dashed var(--color-line-1)" }} />
            <div>
              <div className="ov-rules-label">Редактирование</div>
              <div className="ov-rules-detail">Клик по плашке — открыть карточку запуска. Клик по пустой ячейке — добавить запуск.</div>
            </div>
          </div>
        </div>
      </div>

      <OverviewStyles />
    </div>
  );
}

// ============================================================================
// Category rows
// ============================================================================
interface CategoryRowsProps {
  category: typeof OVERVIEW_CATEGORIES[number];
  tracks: OverviewTrack[];
  trackCount: number;
  brandColorOf: (code: string) => string;
  brandLabelOf: (code: string) => string;
  statusFilter: OverviewStatus | null;
  popover: PopoverState | null;
  onOpenEdit: (e: React.MouseEvent, track: OverviewTrack, itemIdx: number) => void;
  onOpenAdd: (e: React.MouseEvent, track: OverviewTrack, monthKey: string) => void;
  setTip: (tip: TipState | null) => void;
}

function CategoryRows({
  category, tracks, trackCount, brandColorOf, brandLabelOf,
  statusFilter, popover, onOpenEdit, onOpenAdd, setTip,
}: CategoryRowsProps) {
  return (
    <>
      <div className="ov-cat-cell" style={{ gridRow: `span ${trackCount}` }}>
        <div className="ov-cat-label">{category.label}</div>
        <div className="ov-cat-sub">{category.sub}</div>
        <div className="ov-cat-tracks">{tracks.reduce((s, t) => s + t.items.length, 0)} запусков</div>
      </div>

      {tracks.length === 0 ? (
        <>
          <div className="ov-brand-cell ov-brand-empty">—</div>
          {OVERVIEW_MONTHS.map((m) => (
            <div key={m.key} className="ov-mcell ov-mcell-empty" />
          ))}
        </>
      ) : tracks.map((track) => {
        const displayName = track.label ?? brandLabelOf(track.brandCode);
        return (
          <TrackRow
            key={track.id}
            track={track}
            displayName={displayName}
            brandColor={brandColorOf(track.brandCode)}
            statusFilter={statusFilter}
            popover={popover}
            onOpenEdit={onOpenEdit}
            onOpenAdd={onOpenAdd}
            setTip={setTip}
          />
        );
      })}
    </>
  );
}

interface TrackRowProps {
  track: OverviewTrack;
  displayName: string;
  brandColor: string;
  statusFilter: OverviewStatus | null;
  popover: PopoverState | null;
  onOpenEdit: (e: React.MouseEvent, track: OverviewTrack, itemIdx: number) => void;
  onOpenAdd: (e: React.MouseEvent, track: OverviewTrack, monthKey: string) => void;
  setTip: (tip: TipState | null) => void;
}

function TrackRow({ track, displayName, brandColor, statusFilter, popover, onOpenEdit, onOpenAdd, setTip }: TrackRowProps) {
  return (
    <>
      <div className="ov-brand-cell">
        <span className="ov-brand-bar" style={{ background: brandColor }} />
        <span className="ov-brand-name" title={displayName}>{displayName}</span>
      </div>
      {OVERVIEW_MONTHS.map((m, mIdx) => {
        const startingItemIdx = track.items.findIndex((it) => it.months[0] === m.key);
        const startingItem = startingItemIdx >= 0 ? track.items[startingItemIdx] : null;
        const continuing = track.items.find((it) => it.months.includes(m.key) && it.months[0] !== m.key);

        return (
          <div
            key={m.key}
            className={[
              "ov-mcell",
              mIdx % 2 === 1 ? "is-stripe" : "",
              !startingItem && !continuing ? "is-empty-cell" : "",
            ].filter(Boolean).join(" ")}
            onClick={(e) => {
              if (!startingItem && !continuing) {
                onOpenAdd(e, track, m.key);
              }
            }}
          >
            {startingItem && (() => {
              const span = startingItem.months.length;
              const status = OVERVIEW_STATUSES[startingItem.status] ?? OVERVIEW_STATUSES.plan;
              const dim = statusFilter && statusFilter !== startingItem.status;
              const isOpen = popover?.mode === "edit" && popover.trackId === track.id && popover.itemIdx === startingItemIdx;
              return (
                <div
                  className={`ov-bar ${dim ? "is-dim" : ""} ${isOpen ? "is-open" : ""}`}
                  style={{
                    width: `calc(${span * 100}% + ${(span - 1)}px)`,
                    background: status.bg,
                    color: status.ink,
                    borderColor: status.border,
                    boxShadow: `inset 4px 0 0 ${brandColor}`,
                  }}
                  onClick={(e) => onOpenEdit(e, track, startingItemIdx)}
                  onMouseEnter={(e) => setTip({ x: e.clientX, y: e.clientY, item: startingItem, trackBrandCode: track.brandCode, span, startMonth: m.key })}
                  onMouseMove={(e) => setTip({ x: e.clientX, y: e.clientY, item: startingItem, trackBrandCode: track.brandCode, span, startMonth: m.key })}
                  onMouseLeave={() => setTip(null)}
                  title={startingItem.product}
                >
                  <span className="ov-bar-text">{startingItem.product}</span>
                  {span > 1 && <span className="ov-bar-span-pill">{span} мес.</span>}
                </div>
              );
            })()}
            {!startingItem && continuing && (
              <div className="ov-bar-continuation" />
            )}
            {!startingItem && !continuing && (
              <span className="ov-add-hint">+</span>
            )}
          </div>
        );
      })}
    </>
  );
}

// ============================================================================
// Popover shell — positions itself near anchor, clamps to viewport
// ============================================================================
function PopoverShell({ anchor, children }: { anchor: { x: number; y: number }; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: anchor.x, top: anchor.y });

  useEffect(() => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    let left = anchor.x;
    let top = anchor.y;
    if (left + r.width > window.innerWidth - 16) left = window.innerWidth - r.width - 16;
    if (top + r.height > window.innerHeight - 16) top = anchor.y - r.height - 12;
    if (left < 16) left = 16;
    if (top < 16) top = 16;
    setPos({ left, top });
  }, [anchor.x, anchor.y]);

  return (
    <div
      ref={ref}
      className="ov-pop"
      style={{ left: pos.left, top: pos.top }}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
    >
      {children}
    </div>
  );
}

// ============================================================================
// Edit popover
// ============================================================================
interface EditPopoverProps {
  popover: Extract<PopoverState, { mode: "edit" }>;
  setPopover: React.Dispatch<React.SetStateAction<PopoverState | null>>;
  track: OverviewTrack;
  placements: Placement[];
  bloggers: Blogger[];
  conflictMap: Record<string, ConflictResult>;
  brandsByCode: Record<string, import("@/lib/types").BrandRow>;
  onSave: (patch: Partial<OverviewItem>) => void;
  onDelete: () => void;
  onOpenPlacement: (p: Placement) => void;
  onJumpToSchedule: (opts: { year: number; month: number }) => void;
  onAddPlacement: (opts: { brand: string; date: string; product?: string }) => void;
}

function EditPopover({
  popover, setPopover, track, placements, bloggers, conflictMap, brandsByCode,
  onSave, onDelete, onOpenPlacement, onJumpToSchedule, onAddPlacement,
}: EditPopoverProps) {
  const brand = brandsByCode[track.brandCode];
  const item = track.items[popover.itemIdx];

  const setDraft = (patch: Partial<typeof popover.draft>) =>
    setPopover((prev) => (prev && prev.mode === "edit" ? { ...prev, draft: { ...prev.draft, ...patch } } : prev));

  const matching = useMemo(() => {
    if (!item) return [];
    const monthYears = new Set(item.months.map((k) => {
      const mIdx = OVERVIEW_MONTH_INDEX[k];
      return `${OVERVIEW_YEAR}-${String(mIdx).padStart(2, "0")}`;
    }));
    return placements
      .filter((p) => p.brand === track.brandCode && monthYears.has(p.date.slice(0, 7)))
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [placements, item, track.brandCode]);

  if (!item) return null;

  const startMonthLabel = OVERVIEW_MONTHS.find((m) => m.key === item.months[0])?.label;
  const endMonthLabel = OVERVIEW_MONTHS.find((m) => m.key === item.months[item.months.length - 1])?.label;
  const startIdx = OVERVIEW_MONTHS.findIndex((m) => m.key === popover.draft.startMonth);
  const maxSpan = OVERVIEW_MONTHS.length - startIdx;
  const headStatus = OVERVIEW_STATUSES[popover.draft.status];

  const firstMonthIdx = OVERVIEW_MONTH_INDEX[item.months[0]];
  const dateForActions = `${OVERVIEW_YEAR}-${String(firstMonthIdx).padStart(2, "0")}-15`;

  return (
    <>
      <div className="ovp-head" style={{ background: headStatus.bg, color: headStatus.ink }}>
        <div className="ovp-head-meta">
          <span className="dot-mini" style={{ background: brand?.color ?? "#9A9AA3" }} />
          <span style={{ fontWeight: 600 }}>{track.label ?? brand?.name ?? track.brandCode}</span>
          <span className="ovp-head-month">{startMonthLabel}{item.months.length > 1 ? ` → ${endMonthLabel}` : ""}</span>
        </div>
        <button className="iconbtn" onClick={() => setPopover(null)} aria-label="Закрыть"><X size={14} /></button>
      </div>

      <div className="ovp-body">
        <label className="ovp-lbl">Продукт</label>
        <input
          className="ovp-in"
          value={popover.draft.product}
          onChange={(e) => setDraft({ product: e.target.value })}
          placeholder="Название запуска"
          autoFocus
        />

        <label className="ovp-lbl">Цвет ячейки</label>
        <div className="ovp-swatches">
          {(Object.entries(OVERVIEW_STATUSES) as [OverviewStatus, typeof OVERVIEW_STATUSES.plan][]).map(([key, s]) => (
            <button
              key={key}
              className={`ovp-swatch ${popover.draft.status === key ? "is-active" : ""}`}
              onClick={() => setDraft({ status: key })}
              style={{ background: s.bg, borderColor: s.border, color: s.ink }}
              title={s.hint}
            >
              <span>{s.label}</span>
              <span className="ovp-swatch-hint">{s.hint}</span>
            </button>
          ))}
        </div>

        <label className="ovp-lbl">Длительность</label>
        <div className="ovp-span-row">
          <input
            type="range"
            min={1}
            max={Math.min(12, maxSpan)}
            step={1}
            value={Math.min(popover.draft.span, maxSpan)}
            onChange={(e) => setDraft({ span: parseInt(e.target.value, 10) })}
            className="ovp-range"
          />
          <span className="ovp-span-num">{Math.min(popover.draft.span, maxSpan)} мес.</span>
        </div>

        <div className="ovp-divider">Реальные размещения · {matching.length}</div>

        {matching.length === 0 ? (
          <div className="ovp-empty">
            Пока нет размещений по {brand?.name ?? track.brandCode} в {item.months.length === 1 ? startMonthLabel : `${startMonthLabel}–${endMonthLabel}`}.
          </div>
        ) : (
          <div className="ovp-placements">
            {matching.slice(0, 8).map((p) => {
              const b = bloggers.find((x) => x.id === p.bloggerId);
              const hasConflict = conflictMap[p.id]?.hasConflict;
              return (
                <button key={p.id} className="ovp-place-row" onClick={() => onOpenPlacement(p)}>
                  <span className="ovp-place-date">{fmtRuShort(p.date.slice(0, 10))}</span>
                  <span className="ovp-place-name" title={b?.canonicalName ?? "—"}>{b?.canonicalName ?? "—"}</span>
                  <span className="ovp-place-tool">{TOOL_SHORT[p.tool as Tool] ?? "·"}</span>
                  {hasConflict && (
                    <span className="ovp-place-conflict" title="Конфликт"><AlertTriangle size={11} /></span>
                  )}
                  <ChevronRight size={12} color="#9A9AA3" />
                </button>
              );
            })}
            {matching.length > 8 && (
              <div className="ovp-place-more">+{matching.length - 8} ещё — открой в Расписании</div>
            )}
          </div>
        )}

        <div className="ovp-quick-actions">
          <button
            className="ovp-quick"
            onClick={() => onAddPlacement({ brand: track.brandCode, date: dateForActions, product: item.product })}
          >
            <Plus size={12} /> Добавить размещение
          </button>
          <button
            className="ovp-quick"
            onClick={() => onJumpToSchedule({ year: OVERVIEW_YEAR, month: firstMonthIdx })}
          >
            <Layers size={12} /> Открыть в Расписании
          </button>
        </div>
      </div>

      <div className="ovp-foot">
        <button className="btn btn-ghost btn-danger btn-sm" onClick={onDelete}>
          <Trash2 size={12} /> Удалить запуск
        </button>
        <span style={{ flex: 1 }} />
        <button className="btn btn-ghost btn-sm" onClick={() => setPopover(null)}>Отмена</button>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => onSave({
            product: popover.draft.product,
            status: popover.draft.status,
            months: spanMonths(item.months[0], popover.draft.span),
          })}
          disabled={!popover.draft.product.trim()}
        >
          Сохранить
        </button>
      </div>
    </>
  );
}

// ============================================================================
// Add popover
// ============================================================================
interface AddPopoverProps {
  popover: Extract<PopoverState, { mode: "add" }>;
  setPopover: React.Dispatch<React.SetStateAction<PopoverState | null>>;
  track: OverviewTrack;
  brandsByCode: Record<string, import("@/lib/types").BrandRow>;
  onSave: (draft: { product: string; status: OverviewStatus; span: number }) => void;
}

function AddPopover({ popover, setPopover, track, brandsByCode, onSave }: AddPopoverProps) {
  const brand = brandsByCode[track.brandCode];
  const setDraft = (patch: Partial<typeof popover.draft>) =>
    setPopover((prev) => (prev && prev.mode === "add" ? { ...prev, draft: { ...prev.draft, ...patch } } : prev));
  const monthLabel = OVERVIEW_MONTHS.find((m) => m.key === popover.monthKey)?.label ?? popover.monthKey;
  const startIdx = OVERVIEW_MONTHS.findIndex((m) => m.key === popover.monthKey);
  const maxSpan = OVERVIEW_MONTHS.length - startIdx;
  const headStatus = OVERVIEW_STATUSES[popover.draft.status];

  return (
    <>
      <div className="ovp-head" style={{ background: headStatus.bg, color: headStatus.ink }}>
        <div className="ovp-head-meta">
          <span className="dot-mini" style={{ background: brand?.color ?? "#9A9AA3" }} />
          <span style={{ fontWeight: 600 }}>{track.label ?? brand?.name ?? track.brandCode}</span>
          <span className="ovp-head-month">с {monthLabel}</span>
        </div>
        <button className="iconbtn" onClick={() => setPopover(null)} aria-label="Закрыть"><X size={14} /></button>
      </div>

      <div className="ovp-body">
        <label className="ovp-lbl">Продукт</label>
        <input
          className="ovp-in"
          value={popover.draft.product}
          onChange={(e) => setDraft({ product: e.target.value })}
          placeholder="Например: Туши Lash Totem"
          autoFocus
        />

        <label className="ovp-lbl">Цвет ячейки</label>
        <div className="ovp-swatches">
          {(Object.entries(OVERVIEW_STATUSES) as [OverviewStatus, typeof OVERVIEW_STATUSES.plan][]).map(([key, s]) => (
            <button
              key={key}
              className={`ovp-swatch ${popover.draft.status === key ? "is-active" : ""}`}
              onClick={() => setDraft({ status: key })}
              style={{ background: s.bg, borderColor: s.border, color: s.ink }}
              title={s.hint}
            >
              <span>{s.label}</span>
              <span className="ovp-swatch-hint">{s.hint}</span>
            </button>
          ))}
        </div>

        <label className="ovp-lbl">Длительность</label>
        <div className="ovp-span-row">
          <input
            type="range"
            min={1}
            max={Math.min(12, maxSpan)}
            step={1}
            value={popover.draft.span}
            onChange={(e) => setDraft({ span: parseInt(e.target.value, 10) })}
            className="ovp-range"
          />
          <span className="ovp-span-num">{popover.draft.span} мес.</span>
        </div>
      </div>

      <div className="ovp-foot">
        <span style={{ flex: 1 }} />
        <button className="btn btn-ghost btn-sm" onClick={() => setPopover(null)}>Отмена</button>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => onSave(popover.draft)}
          disabled={!popover.draft.product.trim()}
        >
          Добавить
        </button>
      </div>
    </>
  );
}

// ============================================================================
// Styles
// ============================================================================
function OverviewStyles() {
  return (
    <style>{`
      .ov-wrap { position: relative; }

      .ov-toolbar {
        display: flex; align-items: center; gap: 16px;
        padding: 6px 0 16px;
        flex-wrap: wrap;
      }
      .ov-toolbar-left {
        display: inline-flex; align-items: baseline; gap: 8px;
        padding-right: 16px; border-right: 1px solid var(--color-line-1);
        min-height: 28px;
      }
      .ov-stat-num {
        font-size: 22px; font-weight: 700; color: var(--color-ink-1);
        letter-spacing: -0.02em;
        font-variant-numeric: tabular-nums;
      }
      .ov-stat-lbl { font-size: 12px; color: var(--color-ink-3); }

      .ov-legend {
        display: inline-flex; gap: 6px; align-items: center;
        flex-wrap: wrap;
      }
      .ov-legend-chip {
        display: inline-flex; align-items: center; gap: 8px;
        padding: 6px 12px 6px 10px;
        background: var(--color-surface);
        border: 1px solid var(--color-line-1);
        border-radius: 999px;
        font-size: 12.5px; color: var(--color-ink-1);
        cursor: pointer;
        transition: border-color 120ms ease, background 120ms ease, opacity 120ms ease;
      }
      .ov-legend-chip:hover { border-color: #C8C8C2; }
      .ov-legend-chip.is-active { background: #F1F1EE; border-color: #C5C5BE; font-weight: 600; }
      .ov-legend-chip.is-dim { opacity: 0.45; }
      .ov-legend-swatch {
        width: 14px; height: 14px; border-radius: 4px;
        background: var(--swatch);
        border: 1px solid var(--swatch-border);
        flex-shrink: 0;
      }
      .ov-legend-count {
        font-family: var(--font-mono);
        font-size: 11px; color: var(--color-ink-3); font-weight: 500;
      }

      .ov-cat-pills {
        margin-left: auto;
        display: inline-flex; gap: 4px;
        flex-wrap: wrap;
        background: var(--color-bg);
        padding: 3px;
        border: 1px solid var(--color-line-1);
        border-radius: 10px;
      }
      .ov-cat-pill {
        padding: 6px 10px;
        background: transparent;
        border: none;
        border-radius: 7px;
        font-size: 12.5px; color: var(--color-ink-3); font-weight: 500;
        cursor: pointer;
        display: inline-flex; align-items: center; gap: 6px;
        transition: background 120ms ease, color 120ms ease;
      }
      .ov-cat-pill:hover { color: var(--color-ink-1); }
      .ov-cat-pill.is-active {
        background: var(--color-surface); color: var(--color-ink-1);
        font-weight: 600;
        box-shadow: 0 1px 2px rgba(0,0,0,0.06), 0 0 0 1px var(--color-line-1);
      }
      .ov-cat-pill-count {
        font-family: var(--font-mono);
        font-size: 10.5px; color: var(--color-ink-3);
        background: rgba(0,0,0,0.04); padding: 1px 5px; border-radius: 999px;
      }

      .ov-scroll {
        border: 1px solid var(--color-line-1);
        border-radius: 12px;
        background: var(--color-surface);
        overflow-x: auto;
      }
      .ov-grid { display: grid; width: 100%; }
      .ov-th {
        padding: 12px 14px;
        font-size: 11.5px; font-weight: 600; color: var(--color-ink-3);
        text-transform: uppercase; letter-spacing: 0.04em;
        background: #FAFAF7;
        border-bottom: 1px solid var(--color-line-1);
        position: sticky; top: 0; z-index: 6;
      }
      .ov-th-corner {
        position: sticky; left: 0; z-index: 8;
        border-right: 1px solid var(--color-line-1);
      }
      .ov-th-brand {
        position: sticky; left: 84px; z-index: 7;
        border-right: 1px solid var(--color-line-1);
      }
      .ov-th-month {
        display: flex; flex-direction: column; gap: 2px;
        border-right: 1px solid var(--color-line-2);
        text-transform: none;
      }
      .ov-th-month-label {
        font-size: 13px; font-weight: 700; color: var(--color-ink-1);
        text-transform: capitalize; letter-spacing: -0.005em;
      }
      .ov-th-month-num {
        font-family: var(--font-mono);
        font-size: 10px; color: var(--color-ink-4); font-weight: 500;
        text-transform: uppercase; letter-spacing: 0.06em;
      }

      .ov-cat-cell {
        position: sticky; left: 0; z-index: 4;
        background: #FCFCF9;
        padding: 16px 12px;
        border-right: 1px solid var(--color-line-1);
        border-bottom: 1px solid var(--color-line-1);
        display: flex; flex-direction: column; gap: 4px;
        justify-content: center;
      }
      .ov-cat-label {
        font-size: 14px; font-weight: 700; color: var(--color-ink-1);
        letter-spacing: -0.005em;
      }
      .ov-cat-sub {
        font-size: 10px; font-weight: 600; color: var(--color-ink-4);
        text-transform: uppercase; letter-spacing: 0.04em;
      }
      .ov-cat-tracks {
        font-size: 11px; color: var(--color-ink-3);
        margin-top: 6px;
      }
      .ov-brand-cell {
        position: sticky; left: 84px; z-index: 3;
        background: var(--color-surface);
        padding: 12px 14px;
        display: flex; align-items: center; gap: 10px;
        font-size: 13px; font-weight: 500; color: var(--color-ink-1);
        border-right: 1px solid var(--color-line-1);
        border-bottom: 1px solid var(--color-line-2);
      }
      .ov-brand-cell.ov-brand-empty {
        color: var(--color-ink-4); font-style: italic;
        background: #FCFCF9;
      }
      .ov-brand-bar {
        width: 4px; height: 22px; border-radius: 2px;
        flex-shrink: 0;
      }
      .ov-brand-name {
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }

      .ov-mcell {
        border-right: 1px solid var(--color-line-2);
        border-bottom: 1px solid var(--color-line-2);
        padding: 7px;
        min-height: 52px;
        display: flex; align-items: center;
        position: relative;
      }
      .ov-mcell.is-stripe { background: rgba(0,0,0,0.012); }
      .ov-mcell.is-empty-cell { cursor: cell; }
      .ov-mcell.is-empty-cell:hover { background: rgba(11,11,12,0.025); }
      .ov-mcell.is-empty-cell:hover .ov-add-hint { opacity: 1; }
      .ov-add-hint {
        width: 100%; text-align: center;
        font-size: 18px; color: var(--color-ink-4); font-weight: 300;
        opacity: 0;
        transition: opacity 120ms ease;
      }
      .ov-mcell-empty { background: #FAFAF7; }

      .ov-bar {
        position: relative;
        z-index: 2;
        padding: 8px 12px 8px 14px;
        border: 1px solid var(--color-line-1);
        border-radius: 6px;
        font-size: 12.5px; font-weight: 500;
        line-height: 1.3;
        cursor: pointer;
        display: flex; align-items: center; gap: 8px;
        min-height: 38px;
        box-sizing: border-box;
        overflow: hidden;
        transition: transform 120ms ease, opacity 160ms ease, box-shadow 120ms ease;
      }
      .ov-bar:hover { transform: translateY(-1px); z-index: 3; }
      .ov-bar.is-open {
        z-index: 4;
        box-shadow: inset 4px 0 0 currentColor, 0 0 0 2px var(--color-ink-1), 0 4px 12px rgba(0,0,0,0.12);
      }
      .ov-bar.is-dim { opacity: 0.32; }
      .ov-bar-text {
        flex: 1;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .ov-bar-span-pill {
        font-family: var(--font-mono);
        font-size: 10px; font-weight: 600;
        padding: 2px 6px;
        border-radius: 999px;
        background: rgba(255,255,255,0.55);
        color: inherit;
        flex-shrink: 0;
      }
      .ov-bar-continuation { width: 100%; height: 38px; }

      .ov-tip {
        position: fixed; z-index: 100;
        background: #161618; color: #fff; border-radius: 8px;
        padding: 10px 12px;
        font-size: 12px; line-height: 1.45;
        box-shadow: var(--sh-3);
        pointer-events: none;
        max-width: 280px;
      }
      .ov-tip-prod { color: #fff; font-weight: 600; margin-bottom: 4px; font-size: 13px; }
      .ov-tip-meta { color: rgba(255,255,255,0.7); font-size: 11.5px; }
      .ov-tip-status {
        display: inline-flex; align-items: center; gap: 6px;
        margin-top: 6px;
        color: rgba(255,255,255,0.85); font-size: 11.5px;
      }
      .ov-tip-status-dot { width: 8px; height: 8px; border-radius: 999px; display: inline-block; }
      .ov-tip-cta {
        margin-top: 6px; padding-top: 6px;
        border-top: 1px solid rgba(255,255,255,0.15);
        color: rgba(255,255,255,0.55); font-size: 11px;
      }

      .ov-rules {
        margin-top: 16px;
        padding: 16px;
        background: var(--color-surface);
        border: 1px solid var(--color-line-1);
        border-radius: 12px;
      }
      .ov-rules-head {
        font-size: 12px; font-weight: 600; color: var(--color-ink-3);
        text-transform: uppercase; letter-spacing: 0.04em;
        margin-bottom: 12px;
      }
      .ov-rules-grid {
        display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 14px;
      }
      .ov-rules-row { display: flex; align-items: flex-start; gap: 12px; }
      .ov-rules-swatch {
        width: 18px; height: 18px; border-radius: 5px;
        border: 1px solid; flex-shrink: 0;
        margin-top: 2px;
      }
      .ov-rules-label { font-size: 13px; font-weight: 600; color: var(--color-ink-1); margin-bottom: 2px; }
      .ov-rules-detail { font-size: 12.5px; color: var(--color-ink-3); line-height: 1.45; }

      .ov-pop {
        position: fixed; z-index: 80;
        width: 380px;
        background: var(--color-surface);
        border: 1px solid var(--color-line-1);
        border-radius: 12px;
        box-shadow: var(--sh-modal);
        max-height: calc(100vh - 32px);
        display: flex; flex-direction: column;
        overflow: hidden;
        animation: ovPopIn 140ms ease-out;
      }
      @keyframes ovPopIn {
        from { transform: translateY(-4px); opacity: 0; }
        to { transform: none; opacity: 1; }
      }

      .ovp-head {
        padding: 12px 14px;
        display: flex; align-items: center; justify-content: space-between;
        border-bottom: 1px solid var(--color-line-2);
      }
      .ovp-head-meta { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; }
      .ovp-head-month {
        font-family: var(--font-mono);
        font-size: 11px;
        padding: 2px 6px;
        background: rgba(0,0,0,0.08);
        border-radius: 4px;
        margin-left: 4px;
      }

      .ovp-body {
        padding: 14px;
        display: flex; flex-direction: column; gap: 8px;
        overflow-y: auto;
      }
      .ovp-lbl {
        font-size: 11px; font-weight: 600;
        color: var(--color-ink-3);
        text-transform: uppercase; letter-spacing: 0.04em;
        margin-top: 4px;
      }
      .ovp-in {
        padding: 9px 12px;
        border: 1px solid var(--color-line-1);
        border-radius: 8px;
        background: var(--color-surface);
        font-size: 14px; color: var(--color-ink-1);
        font-family: inherit;
      }
      .ovp-in:focus {
        outline: none; border-color: var(--color-ink-1);
        box-shadow: 0 0 0 3px rgba(11,11,12,0.06);
      }
      .ovp-swatches {
        display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;
      }
      .ovp-swatch {
        padding: 8px 6px;
        border: 1px solid;
        border-radius: 8px;
        font-size: 12px; font-weight: 600;
        cursor: pointer;
        display: flex; flex-direction: column; align-items: center; gap: 2px;
        line-height: 1.2;
        position: relative;
        transition: transform 100ms ease, box-shadow 100ms ease;
      }
      .ovp-swatch:hover { transform: translateY(-1px); }
      .ovp-swatch.is-active { box-shadow: 0 0 0 2px var(--color-ink-1); }
      .ovp-swatch-hint { font-size: 10px; font-weight: 400; opacity: 0.7; }

      .ovp-span-row { display: flex; align-items: center; gap: 12px; }
      .ovp-range {
        flex: 1; -webkit-appearance: none; appearance: none;
        height: 4px; background: var(--color-line-1); border-radius: 999px;
        outline: none;
      }
      .ovp-range::-webkit-slider-thumb {
        -webkit-appearance: none; appearance: none;
        width: 16px; height: 16px; border-radius: 999px;
        background: var(--color-ink-1); cursor: pointer;
      }
      .ovp-range::-moz-range-thumb {
        width: 16px; height: 16px; border-radius: 999px;
        background: var(--color-ink-1); cursor: pointer; border: none;
      }
      .ovp-span-num {
        font-family: var(--font-mono);
        font-size: 12px; color: var(--color-ink-2); font-weight: 600;
        min-width: 56px; text-align: right;
      }

      .ovp-divider {
        margin-top: 8px;
        padding-top: 12px;
        border-top: 1px solid var(--color-line-2);
        font-size: 11px; font-weight: 600;
        color: var(--color-ink-3);
        text-transform: uppercase; letter-spacing: 0.04em;
      }
      .ovp-empty {
        padding: 14px;
        background: var(--color-bg);
        border-radius: 8px;
        color: var(--color-ink-3); font-size: 12.5px;
        text-align: center;
      }
      .ovp-placements { display: flex; flex-direction: column; gap: 2px; }
      .ovp-place-row {
        display: grid;
        grid-template-columns: 50px 1fr auto auto 14px;
        align-items: center; gap: 8px;
        padding: 7px 8px;
        background: var(--color-surface);
        border: 1px solid var(--color-line-2);
        border-radius: 6px;
        font-size: 12.5px; color: var(--color-ink-1);
        text-align: left;
        cursor: pointer;
      }
      .ovp-place-row:hover { background: #FBFBF8; border-color: var(--color-line-1); }
      .ovp-place-date {
        font-family: var(--font-mono);
        font-size: 11px; font-weight: 600; color: var(--color-ink-2);
      }
      .ovp-place-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .ovp-place-tool {
        font-family: var(--font-mono); font-size: 10px; font-weight: 700;
        color: var(--color-ink-3); padding: 1px 5px;
        background: var(--color-line-2); border-radius: 4px;
      }
      .ovp-place-conflict {
        display: inline-flex; align-items: center;
        color: var(--color-conflict);
      }
      .ovp-place-more {
        padding: 6px 8px; font-size: 11.5px; color: var(--color-ink-3);
        text-align: center;
      }

      .ovp-quick-actions {
        display: flex; gap: 6px; margin-top: 4px;
        flex-wrap: wrap;
      }
      .ovp-quick {
        display: inline-flex; align-items: center; gap: 5px;
        padding: 6px 10px;
        background: var(--color-bg);
        border: 1px solid var(--color-line-1);
        border-radius: 6px;
        font-size: 11.5px; font-weight: 500;
        color: var(--color-ink-2);
        cursor: pointer;
      }
      .ovp-quick:hover { color: var(--color-ink-1); background: #EEEEEA; }

      .ovp-foot {
        padding: 12px 14px;
        display: flex; align-items: center; gap: 6px;
        border-top: 1px solid var(--color-line-2);
        background: #FBFBF8;
      }
    `}</style>
  );
}
