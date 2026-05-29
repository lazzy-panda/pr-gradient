"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Plus, Pencil, Search } from "lucide-react";
import { toast } from "sonner";
import { useBloggers, useCreateBlogger } from "@/hooks/use-bloggers";
import { usePlacements } from "@/hooks/use-placements";
import { BLOGGER_LEVELS, LEVEL_LABELS } from "@/lib/domain";
import type { BloggerLevel } from "@/lib/domain";
import type { Blogger } from "@/lib/types";

interface Props {
  onClose: () => void;
  onOpenBlogger: (id: string) => void;
}

export function BloggersModal({ onClose, onOpenBlogger }: Props) {
  const [search, setSearch] = useState("");
  const { data: bloggers = [], isLoading } = useBloggers();
  const { data: allPlacements = [] } = usePlacements({});
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const placementCount = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of allPlacements) m[p.bloggerId] = (m[p.bloggerId] ?? 0) + 1;
    return m;
  }, [allPlacements]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bloggers;
    return bloggers.filter((b) =>
      b.canonicalName.toLowerCase().includes(q) ||
      b.handleTiktok?.toLowerCase().includes(q) ||
      b.handleVk?.toLowerCase().includes(q) ||
      b.handleTelegram?.toLowerCase().includes(q) ||
      b.handleInstagram?.toLowerCase().includes(q) ||
      b.handleYoutube?.toLowerCase().includes(q),
    );
  }, [bloggers, search]);

  return (
    <div className="m-overlay" onClick={onClose}>
      <div className="bgm-shell" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="m-head">
          <div className="m-title">Блогеры</div>
          <button className="iconbtn" onClick={onClose} aria-label="Закрыть"><X size={16} /></button>
        </div>
        <div className="bgm-body">
          <div className="bgm-toolbar">
            <div className="bgm-search">
              <Search size={14} color="var(--color-ink-3)" />
              <input
                className="bgm-search-input"
                placeholder="Поиск по имени или нику…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="btn btn-sm btn-ghost" onClick={() => setCreating(true)}>
              <Plus size={13} /> Добавить блогера
            </button>
          </div>

          {isLoading ? (
            <div className="skeleton" style={{ height: 240 }} />
          ) : (
            <>
              <div className="bgm-section-head">
                <span>Всего · {filtered.length}{search ? ` из ${bloggers.length}` : ""}</span>
              </div>
              <div className="bgm-list">
                {filtered.length === 0 ? (
                  <div className="bgm-empty">
                    {search ? "Не найдено блогеров по запросу." : "Список блогеров пуст."}
                  </div>
                ) : filtered.map((b) => (
                  <BloggerRow
                    key={b.id}
                    blogger={b}
                    placementCount={placementCount[b.id] ?? 0}
                    onEdit={() => { onClose(); onOpenBlogger(b.id); }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {creating && (
        <BloggerForm
          existingNames={bloggers.map((b) => b.canonicalName.toLowerCase())}
          onCancel={() => setCreating(false)}
          onSaved={() => setCreating(false)}
        />
      )}

      <style>{`
        .m-overlay {
          position: fixed; inset: 0; z-index: 500;
          background: rgba(11,11,12,0.40);
          display: flex; align-items: center; justify-content: center;
          padding: 32px;
          animation: m-fade 140ms ease-out;
        }
        .bgm-shell {
          width: 680px;
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
        .bgm-body { padding: 18px 24px 24px; overflow-y: auto; }
        .bgm-toolbar {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 12px;
        }
        .bgm-search {
          flex: 1;
          display: inline-flex; align-items: center; gap: 8px;
          padding: 8px 12px;
          background: var(--color-bg);
          border: 1px solid var(--color-line-1);
          border-radius: 8px;
        }
        .bgm-search:focus-within { border-color: var(--color-ink-3); background: var(--color-surface); }
        .bgm-search-input {
          flex: 1; background: transparent; border: none; outline: none;
          font-size: 13px; color: var(--color-ink-1);
          font-family: inherit;
        }
        .bgm-section-head {
          font-size: 12px; font-weight: 600; color: var(--color-ink-3);
          text-transform: uppercase; letter-spacing: 0.04em;
          margin-bottom: 8px;
        }
        .bgm-list {
          display: flex; flex-direction: column;
          border: 1px solid var(--color-line-2);
          border-radius: 8px;
          overflow: hidden;
        }
        .bgm-row {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 14px;
          background: transparent;
          border-bottom: 1px solid var(--color-line-2);
        }
        .bgm-row:last-child { border-bottom: none; }
        .bgm-row:hover { background: var(--color-bg); }
        .bgm-empty {
          padding: 16px;
          text-align: center;
          font-size: 13px;
          color: var(--color-ink-3);
        }
      `}</style>
    </div>
  );
}

function BloggerRow({ blogger, placementCount, onEdit }: { blogger: Blogger; placementCount: number; onEdit: () => void }) {
  const handles = [
    blogger.handleTiktok && `TT @${blogger.handleTiktok}`,
    blogger.handleVk && `VK @${blogger.handleVk}`,
    blogger.handleTelegram && `TG @${blogger.handleTelegram}`,
    blogger.handleInstagram && `IG @${blogger.handleInstagram}`,
    blogger.handleYoutube && `YT @${blogger.handleYoutube}`,
  ].filter(Boolean) as string[];
  return (
    <div className="bgm-row">
      <span style={{
        width: 28, height: 28, borderRadius: 999,
        background: "var(--color-bg)",
        fontSize: 12, fontWeight: 600,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        color: "var(--color-ink-2)", flexShrink: 0,
      }}>
        {blogger.canonicalName[0]?.toUpperCase() ?? "?"}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: 13 }}>{blogger.canonicalName}</div>
        <div style={{ fontSize: 11, color: "var(--color-ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {handles.length > 0 ? handles.join(" · ") : <span style={{ fontStyle: "italic", color: "var(--color-ink-4)" }}>ники не указаны</span>}
        </div>
      </div>
      <div style={{ fontSize: 11, color: "var(--color-ink-3)", textAlign: "right" }}>
        <div>{LEVEL_LABELS[blogger.level as BloggerLevel] ?? blogger.level}</div>
        <div style={{ color: "var(--color-ink-4)" }}>
          {placementCount} {pluralPlacements(placementCount)}
        </div>
      </div>
      <button className="iconbtn" onClick={onEdit} aria-label="Редактировать"><Pencil size={14} /></button>
    </div>
  );
}

function BloggerForm({ existingNames, onCancel, onSaved }: {
  existingNames: string[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const createMut = useCreateBlogger();

  const [canonicalName, setCanonicalName] = useState("");
  const [level, setLevel] = useState<BloggerLevel>("MID");
  const [handleTiktok, setHandleTiktok] = useState("");
  const [handleVk, setHandleVk] = useState("");
  const [handleTelegram, setHandleTelegram] = useState("");
  const [handleInstagram, setHandleInstagram] = useState("");
  const [handleYoutube, setHandleYoutube] = useState("");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");

  const nameClash = canonicalName.trim().length > 0 && existingNames.includes(canonicalName.trim().toLowerCase());
  const canSave = canonicalName.trim().length > 0 && !nameClash;

  const submit = async () => {
    try {
      await createMut.mutateAsync({
        canonicalName: canonicalName.trim(),
        level,
        handleTiktok: handleTiktok.trim() || null,
        handleVk: handleVk.trim() || null,
        handleTelegram: handleTelegram.trim() || null,
        handleInstagram: handleInstagram.trim() || null,
        handleYoutube: handleYoutube.trim() || null,
        contact: contact.trim() || null,
        notes: notes.trim() || null,
      });
      toast.success(`Блогер «${canonicalName.trim()}» добавлен`);
      onSaved();
    } catch (err: unknown) {
      const e = err as { body?: { error?: string } };
      toast.error("Ошибка: " + (e.body?.error ?? "не удалось сохранить"));
    }
  };

  return (
    <div className="bf-overlay" onClick={onCancel}>
      <div className="bf-shell" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="bf-title">Новый блогер</div>

        <Field label="Имя / ник">
          <input
            className="ctl"
            value={canonicalName}
            onChange={(e) => setCanonicalName(e.target.value)}
            placeholder="как в крео и таблицах"
            autoFocus
          />
          {nameClash && <div className="fld-err">Уже есть блогер с таким именем</div>}
          <div className="fld-hint">Каноническое имя, используется для матчинга по всем платформам.</div>
        </Field>

        <Field label="Уровень">
          <select className="ctl" value={level} onChange={(e) => setLevel(e.target.value as BloggerLevel)}>
            {BLOGGER_LEVELS.map((l) => <option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
          </select>
        </Field>

        <Field label="TikTok">
          <input className="ctl" value={handleTiktok} onChange={(e) => setHandleTiktok(e.target.value)} placeholder="без @" />
        </Field>
        <Field label="VK">
          <input className="ctl" value={handleVk} onChange={(e) => setHandleVk(e.target.value)} placeholder="без @" />
        </Field>
        <Field label="Telegram">
          <input className="ctl" value={handleTelegram} onChange={(e) => setHandleTelegram(e.target.value)} placeholder="без @" />
        </Field>
        <Field label="Instagram">
          <input className="ctl" value={handleInstagram} onChange={(e) => setHandleInstagram(e.target.value)} placeholder="без @" />
        </Field>
        <Field label="YouTube">
          <input className="ctl" value={handleYoutube} onChange={(e) => setHandleYoutube(e.target.value)} placeholder="без @" />
        </Field>

        <Field label="Контакт">
          <input className="ctl" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="t.me/… или e-mail" />
        </Field>

        <Field label="Заметки">
          <textarea className="ctl" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Любые заметки…" />
        </Field>

        <div className="bf-foot">
          <button className="btn btn-ghost" onClick={onCancel}>Отмена</button>
          <button className="btn btn-primary" onClick={submit} disabled={!canSave || createMut.isPending}>
            {createMut.isPending ? "..." : "Добавить"}
          </button>
        </div>
      </div>
      <style>{`
        .bf-overlay {
          position: fixed; inset: 0; z-index: 700;
          background: rgba(11,11,12,0.45);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
          animation: m-fade 140ms ease-out;
        }
        .bf-shell {
          width: 520px;
          background: var(--color-surface);
          border-radius: 12px;
          box-shadow: var(--sh-modal);
          padding: 22px 24px;
          animation: m-pop 160ms ease-out;
          display: flex; flex-direction: column; gap: 12px;
          max-height: calc(100vh - 48px);
          overflow-y: auto;
        }
        .bf-title { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
        .bf-foot {
          display: flex; justify-content: flex-end; gap: 8px;
          margin-top: 6px;
        }
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
        .fld-err { font-size: 12px; color: var(--color-conflict); margin-top: 4px; }
        .fld-hint { font-size: 11px; color: var(--color-ink-3); margin-top: 4px; }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", alignItems: "start", columnGap: 14 }}>
      <label style={{ fontSize: 13, color: "var(--color-ink-2)", fontWeight: 500, paddingTop: 6 }}>{label}</label>
      <div>{children}</div>
    </div>
  );
}

function pluralPlacements(n: number): string {
  const lt = n % 100;
  if (lt >= 11 && lt <= 14) return "размещ.";
  const l = n % 10;
  if (l === 1) return "размещ.";
  if (l >= 2 && l <= 4) return "размещ.";
  return "размещ.";
}
