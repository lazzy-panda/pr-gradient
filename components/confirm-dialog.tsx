"use client";

import { useEffect } from "react";

interface Props {
  title: string;
  body: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, body, confirmLabel = "Подтвердить", cancelLabel = "Отмена", tone = "default", onConfirm, onCancel }: Props) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onCancel]);

  return (
    <div className="cd-overlay" onClick={onCancel}>
      <div className="cd-shell" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true">
        <div className="cd-title">{title}</div>
        <div className="cd-body">{body}</div>
        <div className="cd-foot">
          <button className="btn btn-ghost" onClick={onCancel}>{cancelLabel}</button>
          <button className={tone === "danger" ? "btn btn-danger-solid" : "btn btn-primary"} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
      <style>{`
        .cd-overlay {
          position: fixed; inset: 0; z-index: 700;
          background: rgba(11,11,12,0.45);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
          animation: m-fade 140ms ease-out;
        }
        .cd-shell {
          width: 440px;
          background: var(--color-surface);
          border-radius: 12px;
          box-shadow: var(--sh-modal);
          padding: 22px 24px;
          animation: m-pop 160ms ease-out;
        }
        .cd-title { font-size: 16px; font-weight: 600; margin-bottom: 10px; }
        .cd-body { font-size: 13px; color: var(--color-ink-2); margin-bottom: 16px; }
        .cd-foot { display: flex; justify-content: flex-end; gap: 8px; }
      `}</style>
    </div>
  );
}
