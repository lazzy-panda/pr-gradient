/* global React, window */
// ============================================================================
// Modal B — Карточка блогера (с историей)
// ============================================================================
const { useState: useStateB, useMemo: useMemoB } = React;

function BloggerModal({ blogger, placements, onClose, onSave, onOpenPlacement, conflictMap }) {
  const [form, setForm] = useStateB({ ...blogger });
  const set = (k, v) => setForm(s => ({ ...s, [k]: v }));

  const history = useMemoB(() => {
    return placements
      .filter(p => p.bloggerId === blogger.id)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [placements, blogger.id]);

  const year = (history[0]?.date || '2026').slice(0, 4);
  const countThisYear = history.filter(p => p.date.startsWith(year)).length;

  return (
    <ModalShell title={blogger.name} onClose={onClose} width={620}>
      <div className="bm-body">
        <div className="bm-grid">
          <Field label="Уровень" required>
            <Select value={form.level} onChange={(v) => set('level', v)} options={LEVELS} placeholder="— уровень —" />
          </Field>

          <div className="bm-handles">
            <div className="bm-section-label">Хэндлы по платформам</div>
            <div className="bm-handle-row">
              <span className="bm-platform-glyph" style={{ background: '#0F0F10' }}>
                <IconTikTok size={13} color="#fff" />
              </span>
              <TextInput value={form.tiktok} onChange={(v) => set('tiktok', v)} placeholder="tiktok handle" />
            </div>
            <div className="bm-handle-row">
              <span className="bm-platform-glyph" style={{ background: 'linear-gradient(135deg,#FFB13D 0%,#E1306C 50%,#833AB4 100%)' }}>
                <IconInsta size={13} color="#fff" />
              </span>
              <TextInput value={form.instagram} onChange={(v) => set('instagram', v)} placeholder="instagram handle" />
            </div>
            <div className="bm-handle-row">
              <span className="bm-platform-glyph" style={{ background: '#FF0000' }}>
                <IconYouTube size={13} color="#fff" />
              </span>
              <TextInput value={form.youtube} onChange={(v) => set('youtube', v)} placeholder="youtube handle" />
            </div>
            <div className="bm-handle-row">
              <span className="bm-platform-glyph" style={{ background: '#0077FF' }}>
                <IconVK size={13} color="#fff" />
              </span>
              <TextInput value={form.vk} onChange={(v) => set('vk', v)} placeholder="vk handle" />
            </div>
            <div className="bm-handle-row">
              <span className="bm-platform-glyph" style={{ background: '#2AABEE' }}>
                <IconTelegram size={13} color="#fff" />
              </span>
              <TextInput value={form.telegram} onChange={(v) => set('telegram', v)} placeholder="telegram handle" />
            </div>
          </div>

          <Field label="Контакт">
            <TextInput value={form.contact} onChange={(v) => set('contact', v)} placeholder="t.me/handle или e-mail" />
          </Field>

          <Field label="Заметки">
            <textarea
              className="bm-textarea"
              value={form.notes || ''}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Сроки, любимые форматы, особые условия..."
              rows={3}
            />
          </Field>
        </div>

        <div className="bm-divider">
          <span>История размещений</span>
          <span className="bm-count">Всего: {history.length} · {countThisYear} в {year}</span>
        </div>

        {history.length === 0 ? (
          <div className="bm-empty">
            📋 Нет размещений. Запланируйте через «+ Размещение».
          </div>
        ) : (
          <div className="bm-history">
            {history.map(p => {
              const brand = BRAND_BY_ID[p.brandId];
              const conf = conflictMap[p.id]?.hasConflict;
              return (
                <button key={p.id} className="bm-hist-row" onClick={() => onOpenPlacement(p)}>
                  <span className="bm-hist-date mono">{fmtRuShort(p.date)}</span>
                  <span className="dot-mini" style={{ background: brand.color }} />
                  <span className="bm-hist-brand">{brand.short}</span>
                  <span className="bm-hist-cat">{p.category}</span>
                  <span className="bm-hist-tool">{p.tool}</span>
                  <span className="bm-hist-status">
                    {conf
                      ? <span className="badge-conflict-sm"><IconAlert size={10} color="#DC2626" strokeWidth={2.4} />Конфликт</span>
                      : <span className="badge-ok-sm">{p.status === 'Опубликовано' ? 'Опубликовано' : p.status === 'Отменено' ? 'Отменено' : 'OK'}</span>
                    }
                  </span>
                  <IconChevR size={14} color="#9A9AA3" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="m-foot">
        <div className="grow" />
        <button className="btn btn-ghost" onClick={onClose}>Закрыть</button>
        <button className="btn btn-primary" onClick={() => onSave(form)}>Сохранить</button>
      </div>

      <style>{`
        .bm-body { padding: 20px 24px 4px; display: flex; flex-direction: column; gap: 14px; overflow-y: auto; }
        .bm-grid { display: flex; flex-direction: column; gap: 14px; }
        .bm-handles {
          display: grid; grid-template-columns: 140px 1fr; align-items: start; column-gap: 16px; row-gap: 8px;
        }
        .bm-section-label {
          font-size: 13px; color: var(--ink-2); font-weight: 500;
          padding-top: 8px;
        }
        .bm-handle-row {
          grid-column: 2;
          display: flex; align-items: center; gap: 8px;
        }
        .bm-platform-glyph {
          width: 28px; height: 28px; border-radius: 6px;
          display: inline-flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .bm-textarea {
          width: 100%; min-height: 64px;
          padding: 9px 12px; border: 1px solid var(--line-1); border-radius: 8px;
          font-size: 14px; color: var(--ink-1);
          font-family: inherit; resize: vertical;
          background: var(--surface);
        }
        .bm-textarea:focus { outline: none; border-color: var(--ink-1); box-shadow: 0 0 0 3px rgba(11,11,12,0.06); }
        .bm-divider {
          margin-top: 4px;
          padding: 12px 0 6px;
          border-top: 1px solid var(--line-2);
          display: flex; align-items: baseline; justify-content: space-between;
          font-size: 12px; font-weight: 600; color: var(--ink-3);
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .bm-count { font-weight: 500; text-transform: none; letter-spacing: 0; color: var(--ink-3); }
        .bm-empty {
          padding: 24px; text-align: center; color: var(--ink-3);
          background: var(--bg); border-radius: 10px;
        }
        .bm-history { display: flex; flex-direction: column; gap: 2px; margin-bottom: 8px; }
        .bm-hist-row {
          display: grid;
          grid-template-columns: 64px 14px 36px 1fr auto auto 16px;
          align-items: center; gap: 10px;
          padding: 9px 10px;
          background: var(--surface); border: 1px solid var(--line-2); border-radius: 8px;
          font-size: 13px; color: var(--ink-1); text-align: left;
          cursor: pointer;
          transition: background 100ms ease, border-color 100ms ease;
        }
        .bm-hist-row:hover { background: #FBFBF8; border-color: var(--line-1); }
        .bm-hist-date { font-size: 12px; color: var(--ink-2); font-weight: 600; }
        .bm-hist-brand { font-family: var(--font-mono); font-size: 11px; color: var(--ink-2); font-weight: 600; }
        .bm-hist-cat { color: var(--ink-2); }
        .bm-hist-tool { font-size: 12px; color: var(--ink-3); }
        .badge-ok-sm {
          font-size: 11px; color: var(--ink-3); font-weight: 500;
          padding: 2px 6px; border-radius: 4px; background: var(--line-2);
        }
      `}</style>
    </ModalShell>
  );
}

window.BloggerModal = BloggerModal;
