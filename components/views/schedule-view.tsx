"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { Placement, Blogger, ConflictResult, ConflictReason } from "@/lib/types";
import {
  BRAND_COLORS, BRAND_SHORT, BRAND_LABELS,
  CATEGORY_LABELS, TOOL_LABELS, TOOL_SHORT,
} from "@/lib/domain";
import type { Brand, Tool, Category } from "@/lib/domain";
import { useUpdatePlacement, useCheckConflict } from "@/hooks/use-placements";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { detectConflicts } from "@/lib/conflict-detect";
import { fmtRu } from "@/lib/date";

interface Props {
  year: number;
  month: number;
  placements: Placement[];
  bloggers: Blogger[];
  conflictMap: Record<string, ConflictResult>;
  onOpenPlacement: (p: Placement) => void;
  onOpenBlogger: (id: string) => void;
}

interface DragState {
  placement: Placement;
  startX: number;
  startY: number;
  cursorX: number;
  cursorY: number;
  hover: { ymd: string; bloggerId: string } | null;
  hoverConflict: ConflictResult | null;
}

interface PendingDrop {
  placement: Placement;
  targetYmd: string;
  targetBloggerId: string;
  conflict: ConflictResult;
}

const VISIBLE_BLOGGERS_DEFAULT = 20;

export function ScheduleView({ year, month, placements, bloggers, onOpenPlacement, onOpenBlogger }: Props) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = useMemo(() => {
    const arr: { day: number; ymd: string; dow: number; isWeekend: boolean }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const ymd = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dow = (new Date(ymd + "T00:00:00").getUTCDay() + 6) % 7;
      arr.push({ day: d, ymd, dow, isWeekend: dow >= 5 });
    }
    return arr;
  }, [year, month, daysInMonth]);

  // Sort bloggers: most placements first, then alphabetically.
  const sortedBloggers = useMemo(() => {
    const counts: Record<string, number> = {};
    placements.forEach(p => { counts[p.bloggerId] = (counts[p.bloggerId] ?? 0) + 1; });
    return [...bloggers]
      .filter(b => counts[b.id] > 0 || bloggers.length <= 30) // hide bloggers without placements unless small list
      .sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0) || a.canonicalName.localeCompare(b.canonicalName, "ru"));
  }, [bloggers, placements]);

  const [showAll, setShowAll] = useState(false);
  const visibleBloggers = showAll ? sortedBloggers : sortedBloggers.slice(0, VISIBLE_BLOGGERS_DEFAULT);
  const hiddenCount = sortedBloggers.length - visibleBloggers.length;

  // Cell index: bloggerId → ymd → [placements]
  const cellIndex = useMemo(() => {
    const idx: Record<string, Record<string, Placement[]>> = {};
    for (const p of placements) {
      const ymd = p.date.slice(0, 10);
      (idx[p.bloggerId] ??= {});
      (idx[p.bloggerId][ymd] ??= []).push(p);
    }
    return idx;
  }, [placements]);

  // Drag state
  const [drag, setDrag] = useState<DragState | null>(null);
  const cellRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const setCellRef = (key: string, el: HTMLDivElement | null) => {
    if (el) cellRefs.current.set(key, el);
    else cellRefs.current.delete(key);
  };

  const [pendingDrop, setPendingDrop] = useState<PendingDrop | null>(null);
  const updateMut = useUpdatePlacement();
  const checkMut = useCheckConflict();

  const cellKey = (bloggerId: string, ymd: string) => `${bloggerId}|${ymd}`;

  const onCardMouseDown = (e: React.MouseEvent, placement: Placement) => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    const startDrag = (cx: number, cy: number) => {
      setDrag({
        placement,
        startX: e.clientX,
        startY: e.clientY,
        cursorX: cx,
        cursorY: cy,
        hover: null,
        hoverConflict: null,
      });
    };
    // small move threshold (5px) to differentiate click from drag
    const onMove = (ev: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = ev.clientX - dragStartRef.current.x;
      const dy = ev.clientY - dragStartRef.current.y;
      if (drag) return;
      if (Math.hypot(dx, dy) > 5) {
        startDrag(ev.clientX, ev.clientY);
        document.removeEventListener("mousemove", onMove);
      }
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      if (dragStartRef.current && !drag) {
        // click only — open modal
        onOpenPlacement(placement);
      }
      dragStartRef.current = null;
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  // Live drag tracking
  useEffect(() => {
    if (!drag) return;
    const move = (e: MouseEvent) => {
      // find cell under cursor
      let hover: { ymd: string; bloggerId: string } | null = null;
      for (const [key, el] of cellRefs.current) {
        const rect = el.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
          const [bloggerId, ymd] = key.split("|");
          hover = { bloggerId, ymd };
          break;
        }
      }
      let hoverConflict: ConflictResult | null = null;
      if (hover) {
        // Client-side preview against current placements (server still gates on submit).
        const others = (cellIndex[hover.bloggerId] ?? {});
        const list: { id: string; date: string; bloggerId: string; brand: string; category: string; tool: string; status: string }[] = [];
        for (const [, arr] of Object.entries(others)) {
          for (const p of arr) {
            list.push({
              id: p.id, date: p.date.slice(0, 10), bloggerId: p.bloggerId,
              brand: p.brand, category: p.category, tool: p.tool, status: p.status,
            });
          }
        }
        hoverConflict = detectConflicts({
          date: hover.ymd,
          bloggerId: hover.bloggerId,
          brand: drag.placement.brand as Brand,
          category: drag.placement.category as Category,
          tool: drag.placement.tool as Tool,
          excludeId: drag.placement.id,
        }, list);
      }
      setDrag((d) => d ? { ...d, cursorX: e.clientX, cursorY: e.clientY, hover, hoverConflict } : d);
    };
    const up = async () => {
      const final = drag;
      setDrag(null);
      if (!final || !final.hover) return;
      const currentYmd = final.placement.date.slice(0, 10);
      if (final.hover.ymd === currentYmd && final.hover.bloggerId === final.placement.bloggerId) return;

      if (final.hoverConflict?.hasConflict) {
        setPendingDrop({
          placement: final.placement,
          targetYmd: final.hover.ymd,
          targetBloggerId: final.hover.bloggerId,
          conflict: final.hoverConflict,
        });
      } else {
        await performMove(final.placement.id, final.hover.ymd, final.hover.bloggerId, false);
      }
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
  }, [drag, cellIndex]);

  const performMove = useCallback(async (id: string, ymd: string, bloggerId: string, force: boolean) => {
    try {
      await updateMut.mutateAsync({ id, patch: { date: ymd, bloggerId, force } });
      toast.success("Размещение перенесено");
    } catch (err: unknown) {
      const e = err as { status?: number; body?: { error?: string; conflicts?: ConflictReason[] } };
      if (e.status === 409 && !force) {
        // shouldn't happen — we pre-checked, but handle it
        toast.error("Конфликт обнаружен сервером — попробуйте ещё раз");
      } else {
        toast.error("Не удалось перенести: " + (e.body?.error ?? "ошибка"));
      }
    }
  }, [updateMut]);

  const bloggerById = useMemo(() => {
    const m: Record<string, Blogger> = {};
    for (const b of bloggers) m[b.id] = b;
    return m;
  }, [bloggers]);

  return (
    <div className="sch-wrap">
      <div className="sch-scroll">
        <div className="sch-table" style={{ gridTemplateColumns: `160px repeat(${days.length}, 36px)` }}>
          {/* Header */}
          <div className="sch-corner" />
          {days.map((d) => (
            <div key={d.ymd} className={`sch-dayhead ${d.isWeekend ? "is-weekend" : ""}`}>
              <div className="sch-daynum">{d.day}</div>
            </div>
          ))}
          {/* Rows */}
          {visibleBloggers.map((b) => (
            <div key={b.id} className="sch-row" style={{ display: "contents" }}>
              <button className="sch-rowlabel" onClick={() => onOpenBlogger(b.id)}>
                <span className="sch-avatar">{b.canonicalName[0]}</span>
                <span className="sch-name truncate">{b.canonicalName}</span>
                <span className="sch-rowcount">
                  {Object.values(cellIndex[b.id] ?? {}).reduce((s, arr) => s + arr.length, 0)}
                </span>
              </button>
              {days.map((d) => {
                const key = cellKey(b.id, d.ymd);
                const items = cellIndex[b.id]?.[d.ymd] ?? [];
                const isDragHover = drag?.hover?.ymd === d.ymd && drag.hover.bloggerId === b.id;
                const isInvalid = isDragHover && drag?.hoverConflict?.hasConflict;
                const isValid = isDragHover && !drag?.hoverConflict?.hasConflict;
                return (
                  <div
                    key={key}
                    ref={(el) => setCellRef(key, el)}
                    className={`sch-cell ${d.isWeekend ? "is-weekend" : ""} ${isValid ? "is-valid-drop" : ""} ${isInvalid ? "is-invalid-drop" : ""}`}
                  >
                    {items.map((p) => (
                      <Card
                        key={p.id}
                        placement={p}
                        isDragging={drag?.placement.id === p.id}
                        onMouseDown={(e) => onCardMouseDown(e, p)}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {hiddenCount > 0 && (
        <button className="sch-more" onClick={() => setShowAll(true)}>
          Показать ещё {hiddenCount} {plural(hiddenCount)}
        </button>
      )}
      {showAll && sortedBloggers.length > VISIBLE_BLOGGERS_DEFAULT && (
        <button className="sch-more" onClick={() => setShowAll(false)}>Свернуть</button>
      )}

      {/* Floating drag card */}
      {drag && (
        <div
          className="sch-floater"
          style={{
            left: drag.cursorX,
            top: drag.cursorY,
            background: BRAND_COLORS[drag.placement.brand as Brand],
            transform: `translate(-14px, -10px) rotate(2deg) scale(1.04)`,
          }}
        >
          <span className="sch-tool-circle">{TOOL_SHORT[drag.placement.tool as Tool] ?? "·"}</span>
          <span>{BRAND_SHORT[drag.placement.brand as Brand] ?? ""}</span>
          {drag.hoverConflict?.hasConflict && drag.hoverConflict.conflicts[0] && (
            <div className="sch-floater-tip">
              <strong>Конфликт</strong>
              <br />
              {drag.hoverConflict.conflicts[0].reason}
            </div>
          )}
        </div>
      )}

      {pendingDrop && (
        <ConfirmDialog
          title="Конфликт обнаружен"
          body={
            <>
              Перенос на <strong>{fmtRu(pendingDrop.targetYmd)}</strong> нарушает правило интервалов:
              <ul style={{ margin: "8px 0 0", paddingLeft: 16 }}>
                {pendingDrop.conflict.conflicts.map((c, i) => (
                  <li key={i} style={{ fontSize: 12, color: "var(--color-ink-2)" }}>{c.reason}</li>
                ))}
              </ul>
            </>
          }
          confirmLabel="Всё равно поставить"
          tone="danger"
          onConfirm={async () => {
            await performMove(pendingDrop.placement.id, pendingDrop.targetYmd, pendingDrop.targetBloggerId, true);
            setPendingDrop(null);
          }}
          onCancel={() => setPendingDrop(null)}
        />
      )}

      <style>{`
        .sch-wrap {
          background: var(--color-surface);
          border: 1px solid var(--color-line-1);
          border-radius: 12px;
          overflow: hidden;
        }
        .sch-scroll { overflow-x: auto; }
        .sch-table {
          display: grid;
          gap: 0;
        }
        .sch-corner {
          background: var(--color-bg);
          border-bottom: 1px solid var(--color-line-1);
          border-right: 1px solid var(--color-line-1);
          position: sticky; left: 0; z-index: 4;
          height: 36px;
        }
        .sch-dayhead {
          background: var(--color-bg);
          border-bottom: 1px solid var(--color-line-1);
          border-right: 1px solid var(--color-line-2);
          height: 36px;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 600; color: var(--color-ink-3);
        }
        .sch-dayhead.is-weekend { color: var(--color-ink-2); background: #F0F0EC; }
        .sch-rowlabel {
          background: var(--color-surface);
          border-bottom: 1px solid var(--color-line-2);
          border-right: 1px solid var(--color-line-1);
          display: flex; align-items: center; gap: 8px;
          padding: 6px 10px;
          position: sticky; left: 0; z-index: 3;
          cursor: pointer;
          text-align: left;
          height: 44px;
        }
        .sch-rowlabel:hover { background: var(--color-bg); }
        .sch-avatar {
          width: 24px; height: 24px; border-radius: 999px;
          background: var(--color-bg);
          font-size: 11px; font-weight: 600;
          display: inline-flex; align-items: center; justify-content: center;
          color: var(--color-ink-2);
          flex-shrink: 0;
        }
        .sch-name {
          flex: 1; min-width: 0;
          font-size: 12px; font-weight: 500;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .sch-rowcount {
          font-size: 10px; font-weight: 600;
          color: var(--color-ink-3);
          background: var(--color-bg);
          padding: 2px 6px; border-radius: 999px;
        }
        .sch-cell {
          border-bottom: 1px solid var(--color-line-2);
          border-right: 1px solid var(--color-line-2);
          height: 44px;
          padding: 4px 3px;
          position: relative;
          display: flex; gap: 2px; align-items: center; flex-wrap: wrap;
          overflow: hidden;
        }
        .sch-cell.is-weekend { background: rgba(0,0,0,0.012); }
        .sch-cell.is-valid-drop {
          background: rgba(34, 197, 94, 0.15);
          outline: 1.5px dashed #16A34A;
          outline-offset: -1.5px;
        }
        .sch-cell.is-invalid-drop {
          background: rgba(239, 68, 68, 0.18);
          outline: 1.5px dashed #DC2626;
          outline-offset: -1.5px;
        }
        .sch-more {
          margin: 12px 0 0;
          width: 100%;
          padding: 10px;
          background: transparent;
          border: 1px dashed var(--color-line-1);
          border-radius: 8px;
          font-size: 12px; color: var(--color-ink-3);
          cursor: pointer;
        }
        .sch-more:hover { color: var(--color-ink-1); border-color: #C8C8C2; }
        .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .sch-floater {
          position: fixed; z-index: 1000;
          pointer-events: none;
          color: white; font-size: 11px; font-weight: 600;
          padding: 4px 8px;
          border-radius: 6px;
          box-shadow: 0 12px 24px rgba(0,0,0,0.18);
          opacity: 0.95;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .sch-tool-circle {
          width: 14px; height: 14px; border-radius: 999px;
          background: rgba(255,255,255,0.35);
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: 700;
        }
        .sch-floater-tip {
          position: absolute; top: calc(100% + 6px); left: 0;
          background: var(--color-conflict); color: white;
          padding: 6px 10px; border-radius: 6px;
          font-size: 11px; font-weight: 500;
          white-space: nowrap;
          box-shadow: var(--sh-3);
        }
      `}</style>
    </div>
  );
}

function Card({ placement, isDragging, onMouseDown }: {
  placement: Placement;
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  const brand = placement.brand as Brand;
  const tool = placement.tool as Tool;
  const category = placement.category as Category;
  return (
    <div
      className={`sch-card ${isDragging ? "is-dragging" : ""}`}
      style={{ background: BRAND_COLORS[brand] }}
      onMouseDown={onMouseDown}
      title={`${BRAND_LABELS[brand] ?? placement.brand} · ${CATEGORY_LABELS[category] ?? placement.category} · ${TOOL_LABELS[tool] ?? placement.tool}`}
    >
      <span className="sch-card-tool">{TOOL_SHORT[tool] ?? "·"}</span>
      <span className="sch-card-brand">{BRAND_SHORT[brand] ?? "?"}</span>
      <style>{`
        .sch-card {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 4px 6px;
          font-size: 10px; font-weight: 600;
          color: white;
          border-radius: 6px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.08);
          cursor: grab;
          transition: transform 100ms ease, box-shadow 100ms ease;
          user-select: none;
          flex: 0 0 auto;
        }
        .sch-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.12);
        }
        .sch-card:active { cursor: grabbing; }
        .sch-card.is-dragging { opacity: 0.25; }
        .sch-card-tool {
          width: 14px; height: 14px; border-radius: 999px;
          background: rgba(255,255,255,0.35);
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: 700;
        }
      `}</style>
    </div>
  );
}

function plural(n: number): string {
  const lt = n % 100;
  if (lt >= 11 && lt <= 14) return "блогеров";
  const l = n % 10;
  if (l === 1) return "блогера";
  if (l >= 2 && l <= 4) return "блогера";
  return "блогеров";
}
