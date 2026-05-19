"use client";

import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { Placement, Blogger, ConflictResult } from "@/lib/types";
import { BRAND_COLORS, BRAND_LABELS, TOOL_LABELS, CATEGORY_LABELS } from "@/lib/domain";
import type { Brand, Tool, Category } from "@/lib/domain";
import { DayPlacementsPopover } from "@/components/modals/day-placements-popover";

interface Props {
  year: number;
  month: number;
  placements: Placement[];
  bloggers: Blogger[];
  conflictMap: Record<string, ConflictResult>;
  onOpenPlacement: (p: Placement) => void;
  onCreateOnDay: (ymd: string) => void;
}

const WEEKDAY_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function CalendarView({ year, month, placements, bloggers, conflictMap, onOpenPlacement, onCreateOnDay }: Props) {
  // Build grid: pad with leading blanks so Monday is first.
  const grid = useMemo(() => {
    const first = new Date(Date.UTC(year, month - 1, 1));
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDow = (first.getUTCDay() + 6) % 7; // Mon=0 … Sun=6
    const cells: ({ ymd: string; day: number } | null)[] = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, ymd: `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}` });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  const byDay = useMemo(() => {
    const m: Record<string, Placement[]> = {};
    for (const p of placements) {
      const ymd = p.date.slice(0, 10);
      (m[ymd] ??= []).push(p);
    }
    return m;
  }, [placements]);

  const bloggerNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const b of bloggers) map[b.id] = b.canonicalName;
    return map;
  }, [bloggers]);

  const [popover, setPopover] = useState<string | null>(null); // ymd

  return (
    <div className="cal-wrap">
      <div className="cal-head">
        {WEEKDAY_RU.map((w) => (
          <div key={w} className="cal-wd">{w}</div>
        ))}
      </div>
      <div className="cal-grid">
        {grid.map((cell, i) => {
          if (!cell) return <div key={i} className="cal-cell cal-empty" />;
          const dayPlacements = byDay[cell.ymd] ?? [];
          const hasConflict = dayPlacements.some((p) => conflictMap[p.id]?.hasConflict);
          const isWeekend = i % 7 >= 5;
          return (
            <div
              key={cell.ymd}
              className={`cal-cell ${isWeekend ? "is-weekend" : ""} ${hasConflict ? "has-conflict" : ""}`}
              onClick={(e) => {
                if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains("cal-num")) {
                  if (dayPlacements.length > 0) setPopover(cell.ymd);
                  else onCreateOnDay(cell.ymd);
                }
              }}
            >
              <span className="cal-num">{cell.day}</span>
              {hasConflict && (
                <span className="cal-flag" aria-label="Конфликт">
                  <AlertTriangle size={9} color="#fff" strokeWidth={2.6} />
                </span>
              )}
              <div className="cal-dots">
                {dayPlacements.slice(0, 6).map((p) => (
                  <button
                    key={p.id}
                    className={`cal-dot ${conflictMap[p.id]?.hasConflict ? "is-conflict" : ""}`}
                    style={{ background: BRAND_COLORS[p.brand as Brand] }}
                    title={`${bloggerNameById[p.bloggerId] ?? "—"} · ${BRAND_LABELS[p.brand as Brand] ?? p.brand} · ${TOOL_LABELS[p.tool as Tool] ?? p.tool} · ${CATEGORY_LABELS[p.category as Category] ?? p.category}`}
                    onClick={(e) => { e.stopPropagation(); onOpenPlacement(p); }}
                  />
                ))}
                {dayPlacements.length > 6 && (
                  <button
                    className="cal-more"
                    onClick={(e) => { e.stopPropagation(); setPopover(cell.ymd); }}
                  >
                    +{dayPlacements.length - 6}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {popover && (
        <DayPlacementsPopover
          ymd={popover}
          placements={byDay[popover] ?? []}
          conflictMap={conflictMap}
          bloggerNameById={bloggerNameById}
          onClose={() => setPopover(null)}
          onOpenPlacement={(p) => { setPopover(null); onOpenPlacement(p); }}
          onAddNew={() => { setPopover(null); onCreateOnDay(popover); }}
        />
      )}
      <style>{`
        .cal-wrap {
          background: var(--color-surface);
          border: 1px solid var(--color-line-1);
          border-radius: 12px;
          overflow: hidden;
        }
        .cal-head {
          display: grid; grid-template-columns: repeat(7, 1fr);
          background: var(--color-bg);
          border-bottom: 1px solid var(--color-line-1);
        }
        .cal-wd {
          padding: 10px 12px;
          font-size: 11px; font-weight: 600; color: var(--color-ink-3);
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .cal-grid {
          display: grid; grid-template-columns: repeat(7, 1fr);
        }
        .cal-cell {
          min-height: 96px;
          padding: 8px 10px;
          border-right: 1px solid var(--color-line-2);
          border-bottom: 1px solid var(--color-line-2);
          position: relative;
          cursor: pointer;
          transition: background 80ms ease;
        }
        .cal-cell:hover { background: rgba(0,0,0,0.015); }
        .cal-cell.is-weekend { background: rgba(0,0,0,0.012); }
        .cal-cell.is-weekend:hover { background: rgba(0,0,0,0.025); }
        .cal-cell.cal-empty { background: var(--color-bg); cursor: default; }
        .cal-cell:nth-child(7n) { border-right: none; }

        .cal-num {
          font-size: 13px; font-weight: 600; color: var(--color-ink-2);
          display: inline-block; margin-bottom: 8px;
        }
        .cal-flag {
          position: absolute; top: 6px; right: 6px;
          width: 14px; height: 14px; border-radius: 999px;
          background: var(--color-conflict);
          display: inline-flex; align-items: center; justify-content: center;
        }
        .cal-dots {
          display: flex; flex-wrap: wrap; gap: 3px; align-items: center;
        }
        .cal-dot {
          width: 9px; height: 9px; border-radius: 999px;
          border: none; padding: 0; cursor: pointer;
          transition: transform 100ms ease;
        }
        .cal-dot:hover { transform: scale(1.4); }
        .cal-dot.is-conflict { box-shadow: 0 0 0 1.5px var(--color-conflict); }
        .cal-more {
          font-size: 10px; font-weight: 600;
          color: var(--color-ink-3);
          background: transparent; border: none; padding: 0 4px;
          cursor: pointer;
        }
        .cal-more:hover { color: var(--color-ink-1); }
      `}</style>
    </div>
  );
}
