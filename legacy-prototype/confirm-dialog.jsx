/* global React, window */
// Confirm dialog (small, used for conflict-on-save and delete)
function ConfirmDialog({ title, body, confirmLabel = 'Подтвердить', cancelLabel = 'Отмена', tone = 'danger', onConfirm, onCancel }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);
  return (
    <div className="cd-overlay" onClick={onCancel}>
      <div className="cd-shell" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true">
        <div className="cd-icon" style={{ background: tone === 'danger' ? 'var(--conflict-bg)' : 'var(--bg)' }}>
          <IconAlert size={20} color={tone === 'danger' ? '#DC2626' : '#374151'} strokeWidth={2.2} />
        </div>
        <div className="cd-title">{title}</div>
        <div className="cd-body">{body}</div>
        <div className="cd-foot">
          <button className="btn btn-ghost" onClick={onCancel}>{cancelLabel}</button>
          <button className={`btn ${tone === 'danger' ? 'btn-danger-solid' : 'btn-primary'}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
      <style>{`
        .cd-overlay {
          position: fixed; inset: 0; z-index: 600;
          background: rgba(11,11,12,0.45);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
          animation: mFade 120ms ease-out;
        }
        .cd-shell {
          width: 440px; max-width: 100%;
          background: var(--surface); border-radius: 14px;
          box-shadow: var(--sh-modal);
          padding: 24px;
          animation: mPop 140ms ease-out;
        }
        .cd-icon {
          width: 42px; height: 42px; border-radius: 10px;
          display: inline-flex; align-items: center; justify-content: center;
          margin-bottom: 14px;
        }
        .cd-title { font-size: 17px; font-weight: 600; margin-bottom: 6px; letter-spacing: -0.005em; }
        .cd-body { color: var(--ink-2); font-size: 14px; line-height: 1.5; margin-bottom: 18px; }
        .cd-foot { display: flex; justify-content: flex-end; gap: 8px; }
      `}</style>
    </div>
  );
}
window.ConfirmDialog = ConfirmDialog;
