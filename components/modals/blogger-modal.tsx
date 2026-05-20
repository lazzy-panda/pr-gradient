"use client";

import { useEffect, useState } from "react";
import { X, AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";
import { useBlogger, useUpdateBlogger } from "@/hooks/use-bloggers";
import type { Placement } from "@/lib/types";
import {
  BLOGGER_LEVELS, LEVEL_LABELS,
  CATEGORY_LABELS, TOOL_LABELS, STATUS_LABELS, FALLBACK_BRAND_COLOR,
} from "@/lib/domain";
import type { Category, Tool, PlacementStatus, BloggerLevel } from "@/lib/domain";
import { useBrands } from "@/hooks/use-brands";
import { buildConflictMap } from "@/lib/client-conflict-map";
import { fmtRu } from "@/lib/date";

interface Props {
  bloggerId: string;
  onClose: () => void;
  onOpenPlacement: (p: Placement) => void;
}

export function BloggerModal({ bloggerId, onClose, onOpenPlacement }: Props) {
  const { data: blogger, isLoading } = useBlogger(bloggerId);
  const { byCode: brandsByCode } = useBrands({ includeArchived: true });
  const updateMut = useUpdateBlogger();

  const [form, setForm] = useState<{
    level: BloggerLevel;
    handleTiktok: string;
    handleVk: string;
    handleTelegram: string;
    handleInstagram: string;
    handleYoutube: string;
    contact: string;
    notes: string;
  } | null>(null);

  useEffect(() => {
    if (!blogger) return;
    setForm({
      level: (blogger.level as BloggerLevel) ?? "MID",
      handleTiktok: blogger.handleTiktok ?? "",
      handleVk: blogger.handleVk ?? "",
      handleTelegram: blogger.handleTelegram ?? "",
      handleInstagram: blogger.handleInstagram ?? "",
      handleYoutube: blogger.handleYoutube ?? "",
      contact: blogger.contact ?? "",
      notes: blogger.notes ?? "",
    });
  }, [blogger]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const save = async () => {
    if (!form || !blogger) return;
    try {
      await updateMut.mutateAsync({ id: blogger.id, patch: {
        level: form.level,
        handleTiktok: form.handleTiktok || null,
        handleVk: form.handleVk || null,
        handleTelegram: form.handleTelegram || null,
        handleInstagram: form.handleInstagram || null,
        handleYoutube: form.handleYoutube || null,
        contact: form.contact || null,
        notes: form.notes || null,
      } });
      toast.success("Карточка блогера сохранена");
      onClose();
    } catch (err: unknown) {
      const e = err as { body?: { error?: string } };
      toast.error("Ошибка: " + (e.body?.error ?? ""));
    }
  };

  const conflictMap = blogger ? buildConflictMap(blogger.placements ?? []) : {};

  return (
    <div className="m-overlay" onClick={onClose}>
      <div className="m-shell" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="m-head">
          <div className="m-title">{blogger?.canonicalName ?? "Блогер"}</div>
          <button className="iconbtn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="bm-body">
          {isLoading || !form || !blogger ? (
            <div className="skeleton" style={{ height: 200 }} />
          ) : (
            <>
              <div className="bm-grid">
                <Row label="Уровень">
                  <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as BloggerLevel })} className="ctl">
                    {BLOGGER_LEVELS.map(l => <option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
                  </select>
                </Row>
                <Row label="TikTok"><input className="ctl" value={form.handleTiktok} onChange={(e) => setForm({ ...form, handleTiktok: e.target.value })} placeholder="без @" /></Row>
                <Row label="VK"><input className="ctl" value={form.handleVk} onChange={(e) => setForm({ ...form, handleVk: e.target.value })} placeholder="без @" /></Row>
                <Row label="Telegram"><input className="ctl" value={form.handleTelegram} onChange={(e) => setForm({ ...form, handleTelegram: e.target.value })} placeholder="без @" /></Row>
                <Row label="Instagram"><input className="ctl" value={form.handleInstagram} onChange={(e) => setForm({ ...form, handleInstagram: e.target.value })} placeholder="без @" /></Row>
                <Row label="YouTube"><input className="ctl" value={form.handleYoutube} onChange={(e) => setForm({ ...form, handleYoutube: e.target.value })} placeholder="без @" /></Row>
                <Row label="Контакт"><input className="ctl" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="t.me/… или e-mail" /></Row>
                <Row label="Заметки">
                  <textarea
                    className="ctl"
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Любые заметки..."
                  />
                </Row>
              </div>

              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                  История размещений — {blogger.placements.length}
                </div>
                <div className="bm-list">
                  {blogger.placements.length === 0 ? (
                    <div style={{ padding: 12, fontSize: 12, color: "var(--color-ink-3)" }}>Размещений пока нет.</div>
                  ) : blogger.placements.map((p) => {
                    const hasConflict = conflictMap[p.id]?.hasConflict;
                    return (
                      <button key={p.id} className={`bm-list-item ${hasConflict ? "is-conflict" : ""}`} onClick={() => onOpenPlacement(p)}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-ink-3)", minWidth: 64 }}>
                          {fmtRu(p.date.slice(0, 10))}
                        </span>
                        <span className="dot-mini" style={{ background: brandsByCode[p.brand]?.color ?? FALLBACK_BRAND_COLOR }} />
                        <span style={{ fontSize: 12, fontWeight: 500, minWidth: 120 }}>{brandsByCode[p.brand]?.name ?? p.brand}</span>
                        <span style={{ fontSize: 12, color: "var(--color-ink-3)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {CATEGORY_LABELS[p.category as Category] ?? p.category} · {TOOL_LABELS[p.tool as Tool] ?? p.tool}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--color-ink-3)" }}>{STATUS_LABELS[p.status as PlacementStatus] ?? p.status}</span>
                        {hasConflict ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "var(--color-conflict)", fontSize: 11, fontWeight: 600 }}>
                            <AlertTriangle size={11} /> конфликт
                          </span>
                        ) : (
                          <Check size={11} color="var(--color-ok)" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="m-foot">
          <button className="btn btn-ghost" onClick={onClose}>Закрыть</button>
          <button className="btn btn-primary" onClick={save} disabled={!form || updateMut.isPending}>
            {updateMut.isPending ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>
      <style>{`
        .m-overlay {
          position: fixed; inset: 0; z-index: 500;
          background: rgba(11,11,12,0.40);
          display: flex; align-items: center; justify-content: center;
          padding: 32px;
          animation: m-fade 140ms ease-out;
        }
        .m-shell {
          width: 600px;
          background: var(--color-surface);
          border-radius: 14px;
          box-shadow: var(--sh-modal);
          max-height: calc(100vh - 64px);
          display: flex; flex-direction: column;
          animation: m-pop 160ms ease-out;
          overflow: hidden;
        }
        .m-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 24px;
          border-bottom: 1px solid var(--color-line-2);
        }
        .m-title { font-size: 18px; font-weight: 600; }
        .bm-body { padding: 18px 24px; overflow-y: auto; }
        .bm-grid { display: flex; flex-direction: column; gap: 12px; }
        .bm-list {
          display: flex; flex-direction: column;
          border: 1px solid var(--color-line-2);
          border-radius: 8px;
          overflow: hidden;
        }
        .bm-list-item {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 12px;
          background: transparent;
          border: none;
          border-bottom: 1px solid var(--color-line-2);
          text-align: left;
          cursor: pointer;
        }
        .bm-list-item:last-child { border-bottom: none; }
        .bm-list-item:hover { background: var(--color-bg); }
        .bm-list-item.is-conflict { background: rgba(220, 38, 38, 0.04); }
        .ctl {
          width: 100%;
          padding: 8px 10px;
          background: var(--color-surface);
          border: 1px solid var(--color-line-1);
          border-radius: 8px;
          font-size: 13px;
          outline: none;
          font-family: inherit;
        }
        .ctl:focus { border-color: var(--color-ink-3); }
        .m-foot {
          padding: 14px 24px;
          border-top: 1px solid var(--color-line-2);
          display: flex; justify-content: flex-end; gap: 8px;
        }
      `}</style>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", alignItems: "center", columnGap: 14 }}>
      <label style={{ fontSize: 12, color: "var(--color-ink-2)", fontWeight: 500 }}>{label}</label>
      <div>{children}</div>
    </div>
  );
}
