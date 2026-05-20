"use client";

import { Plus, X } from "lucide-react";
import { useEffect } from "react";
import type { Placement, ConflictResult } from "@/lib/types";
import { CATEGORY_LABELS, TOOL_LABELS, FALLBACK_BRAND_COLOR } from "@/lib/domain";
import type { Category, Tool } from "@/lib/domain";
import { useBrands } from "@/hooks/use-brands";
import { fmtRu } from "@/lib/date";

interface Props {
  ymd: string;
  placements: Placement[];
  conflictMap: Record<string, ConflictResult>;
  bloggerNameById: Record<string, string>;
  onClose: () => void;
  onOpenPlacement: (p: Placement) => void;
  onAddNew: () => void;
}

export function DayPlacementsPopover({ ymd, placements, conflictMap, bloggerNameById, onClose, onOpenPlacement, onAddNew }: Props) {
  const { byCode: brandsByCode } = useBrands({ includeArchived: true });
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div className="dp-overlay" onClick={onClose}>
      <div className="dp-shell" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="dp-head">
          <div className="dp-title">{fmtRu(ymd)} — {placements.length} {plural(placements.length)}</div>
          <button className="iconbtn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="dp-body">
          {placements.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "var(--color-ink-3)" }}>В этот день размещений нет.</div>
          ) : (
            placements.map((p) => (
              <button key={p.id} className={`dp-item ${conflictMap[p.id]?.hasConflict ? "is-conflict" : ""}`} onClick={() => onOpenPlacement(p)}>
                <span className="dot-mini" style={{ background: brandsByCode[p.brand]?.color ?? FALLBACK_BRAND_COLOR, marginTop: 6 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{bloggerNameById[p.bloggerId] ?? "—"}</div>
                  <div style={{ fontSize: 12, color: "var(--color-ink-3)" }}>
                    {brandsByCode[p.brand]?.name ?? p.brand} · {CATEGORY_LABELS[p.category as Category] ?? p.category} · {TOOL_LABELS[p.tool as Tool] ?? p.tool}
                  </div>
                </div>
                {conflictMap[p.id]?.hasConflict && (
                  <span className="dp-badge">конфликт</span>
                )}
              </button>
            ))
          )}
        </div>
        <div className="dp-foot">
          <button className="btn btn-ghost" onClick={onAddNew}>
            <Plus size={14} /> Добавить размещение
          </button>
        </div>
      </div>
      <style>{`
        .dp-overlay {
          position: fixed; inset: 0; z-index: 400;
          background: rgba(11,11,12,0.40);
          display: flex; align-items: center; justify-content: center;
          padding: 32px;
          animation: m-fade 140ms ease-out;
        }
        .dp-shell {
          width: 440px;
          background: var(--color-surface);
          border-radius: 12px;
          box-shadow: var(--sh-modal);
          max-height: calc(100vh - 64px);
          display: flex; flex-direction: column;
          animation: m-pop 160ms ease-out;
          overflow: hidden;
        }
        .dp-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 18px;
          border-bottom: 1px solid var(--color-line-2);
        }
        .dp-title { font-size: 15px; font-weight: 600; }
        .dp-body { overflow-y: auto; padding: 4px; }
        .dp-item {
          width: 100%;
          display: flex; align-items: flex-start; gap: 10px;
          padding: 10px 12px; border-radius: 8px;
          background: transparent; border: 1px solid transparent;
          font-size: 13px; color: var(--color-ink-1);
          text-align: left; cursor: pointer;
        }
        .dp-item:hover { background: var(--color-bg); }
        .dp-item.is-conflict { border-color: rgba(220,38,38,0.25); }
        .dp-badge {
          background: var(--conflict-bg); color: var(--color-conflict);
          font-size: 11px; font-weight: 600;
          padding: 2px 8px; border-radius: 999px;
          align-self: center;
        }
        .dp-foot {
          border-top: 1px solid var(--color-line-2);
          padding: 12px 18px;
          display: flex; justify-content: flex-end;
        }
      `}</style>
    </div>
  );
}

function plural(n: number): string {
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 14) return "размещений";
  const last = n % 10;
  if (last === 1) return "размещение";
  if (last >= 2 && last <= 4) return "размещения";
  return "размещений";
}
