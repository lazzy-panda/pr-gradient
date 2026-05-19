/* global React, window */
// ============================================================================
// Modal A — Новое размещение / Редактировать
// ============================================================================
const { useState: useStateM, useMemo: useMemoM, useEffect: useEffectM, useRef: useRefM } = React;

function ModalShell({ title, children, onClose, width = 560 }) {
  // Esc to close
  useEffectM(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="m-overlay" onClick={onClose}>
      <div className="m-shell" style={{ width }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="m-head">
          <div className="m-title">{title}</div>
          <button className="iconbtn" onClick={onClose} aria-label="Закрыть"><IconX size={16} /></button>
        </div>
        {children}
      </div>
      <style>{`
        .m-overlay {
          position: fixed; inset: 0; z-index: 500;
          background: rgba(11,11,12,0.40);
          display: flex; align-items: center; justify-content: center;
          padding: 32px;
          animation: mFade 140ms ease-out;
        }
        @keyframes mFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes mPop  { from { transform: translateY(8px) scale(0.985); opacity: 0; } to { transform: none; opacity: 1; } }
        .m-shell {
          background: var(--surface);
          border-radius: 14px;
          box-shadow: var(--sh-modal);
          max-height: calc(100vh - 64px);
          display: flex; flex-direction: column;
          animation: mPop 160ms ease-out;
          overflow: hidden;
        }
        .m-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 24px;
          border-bottom: 1px solid var(--line-2);
        }
        .m-title { font-size: 18px; font-weight: 600; letter-spacing: -0.005em; }
      `}</style>
    </div>
  );
}

function Field({ label, required, children, error }) {
  return (
    <div className="fld">
      <label className="fld-label">
        {label}{required && <span style={{ color: '#DC2626' }}> *</span>}
      </label>
      <div className="fld-control">{children}</div>
      {error && <div className="fld-error">{error}</div>}
      <style>{`
        .fld { display: grid; grid-template-columns: 140px 1fr; align-items: center; column-gap: 16px; row-gap: 6px; }
        .fld-label {
          font-size: 13px; color: var(--ink-2); font-weight: 500;
        }
        .fld-control { width: 100%; }
        .fld-error {
          grid-column: 2; color: var(--conflict); font-size: 12px;
        }
      `}</style>
    </div>
  );
}

function Select({ value, onChange, options, placeholder, disabled }) {
  return (
    <div className="sel">
      <select value={value || ''} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
        <option value="" disabled>{placeholder ?? '— выбрать —'}</option>
        {options.map(opt => {
          const v = typeof opt === 'string' ? opt : opt.value;
          const l = typeof opt === 'string' ? opt : opt.label;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
      <span className="sel-arrow"><IconChevDown size={14} color="#6B6B73" /></span>
      <style>{`
        .sel { position: relative; }
        .sel select {
          width: 100%;
          appearance: none;
          padding: 9px 32px 9px 12px;
          border: 1px solid var(--line-1);
          border-radius: 8px;
          background: var(--surface);
          font-size: 14px; color: var(--ink-1);
          line-height: 1.3;
          transition: border-color 120ms ease, box-shadow 120ms ease;
        }
        .sel select:focus {
          outline: none;
          border-color: var(--ink-1);
          box-shadow: 0 0 0 3px rgba(11,11,12,0.06);
        }
        .sel-arrow {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text', leftIcon }) {
  return (
    <div className={`tin ${leftIcon ? 'has-left' : ''}`}>
      {leftIcon && <span className="tin-left">{leftIcon}</span>}
      <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      <style>{`
        .tin { position: relative; }
        .tin input {
          width: 100%;
          padding: 9px 12px;
          border: 1px solid var(--line-1);
          border-radius: 8px;
          background: var(--surface);
          font-size: 14px; color: var(--ink-1);
          transition: border-color 120ms ease, box-shadow 120ms ease;
        }
        .tin input::placeholder { color: var(--ink-4); }
        .tin input:focus {
          outline: none; border-color: var(--ink-1);
          box-shadow: 0 0 0 3px rgba(11,11,12,0.06);
        }
        .tin.has-left input { padding-left: 34px; }
        .tin-left { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--ink-3); }
      `}</style>
    </div>
  );
}

// Date picker = native <input type="date"> styled
function DateInput({ value, onChange }) {
  return (
    <div className="din">
      <span className="din-left"><IconCalendar size={14} color="#6B6B73" /></span>
      <input type="date" value={value || ''} onChange={(e) => onChange(e.target.value)} />
      <style>{`
        .din { position: relative; }
        .din input {
          width: 100%; padding: 9px 12px 9px 34px;
          border: 1px solid var(--line-1); border-radius: 8px;
          background: var(--surface);
          font-size: 14px; color: var(--ink-1);
          font-family: inherit;
          transition: border-color 120ms ease, box-shadow 120ms ease;
        }
        .din input:focus { outline: none; border-color: var(--ink-1); box-shadow: 0 0 0 3px rgba(11,11,12,0.06); }
        .din-left { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); }
      `}</style>
    </div>
  );
}

// Brand select with color swatch in each option (custom dropdown)
function BrandSelect({ value, onChange }) {
  const [open, setOpen] = useStateM(false);
  const ref = useRefM(null);
  useEffectM(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  const selected = BRAND_BY_ID[value];
  return (
    <div ref={ref} className="bsel">
      <button type="button" className="bsel-btn" onClick={() => setOpen(o => !o)}>
        {selected ? (
          <>
            <span className="dot-mini" style={{ background: selected.color }} />
            <span>{selected.name}</span>
          </>
        ) : (
          <span style={{ color: 'var(--ink-4)' }}>— выбрать бренд —</span>
        )}
        <IconChevDown size={14} color="#6B6B73" style={{ marginLeft: 'auto' }} />
      </button>
      {open && (
        <div className="bsel-menu">
          {BRANDS.map(b => (
            <button
              type="button"
              key={b.id}
              className={`bsel-item ${b.id === value ? 'is-active' : ''}`}
              onClick={() => { onChange(b.id); setOpen(false); }}
            >
              <span className="dot-mini" style={{ background: b.color }} />
              <span>{b.name}</span>
              <span className="bsel-short">{b.short}</span>
            </button>
          ))}
        </div>
      )}
      <style>{`
        .bsel { position: relative; }
        .bsel-btn {
          display: flex; align-items: center; gap: 8px;
          width: 100%; padding: 9px 12px;
          border: 1px solid var(--line-1); border-radius: 8px;
          background: var(--surface); font-size: 14px; color: var(--ink-1);
          text-align: left;
        }
        .bsel-btn:hover { background: #FBFBF8; }
        .bsel-menu {
          position: absolute; left: 0; right: 0; top: calc(100% + 4px); z-index: 30;
          background: var(--surface);
          border: 1px solid var(--line-1); border-radius: 10px;
          box-shadow: var(--sh-modal);
          padding: 4px;
          max-height: 280px; overflow-y: auto;
        }
        .bsel-item {
          width: 100%;
          display: flex; align-items: center; gap: 10px;
          padding: 8px 10px; border-radius: 6px;
          background: transparent; border: none; text-align: left; font-size: 13px;
          color: var(--ink-1);
        }
        .bsel-item:hover { background: var(--bg); }
        .bsel-item.is-active { background: var(--bg); font-weight: 600; }
        .bsel-short {
          margin-left: auto; font-family: var(--font-mono);
          font-size: 11px; color: var(--ink-3);
        }
      `}</style>
    </div>
  );
}

// Blogger combobox with search + "Add new" inline
function BloggerCombo({ value, onChange, bloggers, onCreateNew }) {
  const [open, setOpen] = useStateM(false);
  const [q, setQ] = useStateM('');
  const [addOpen, setAddOpen] = useStateM(false);
  const ref = useRefM(null);
  useEffectM(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setAddOpen(false); } };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const selected = bloggers.find(b => b.id === value);
  const filtered = q
    ? bloggers.filter(b => b.name.toLowerCase().includes(q.toLowerCase()) || (b.tiktok || '').toLowerCase().includes(q.toLowerCase()))
    : bloggers;

  // Inline-add state
  const [newName, setNewName] = useStateM('');
  const [newPlatform, setNewPlatform] = useStateM(PLATFORMS[0]);
  const [newHandle, setNewHandle] = useStateM('');

  return (
    <div ref={ref} className="bcombo">
      <button type="button" className="bsel-btn" onClick={() => setOpen(o => !o)}>
        {selected ? (
          <>
            <span className="bcombo-avatar">{selected.name[0]}</span>
            <span>{selected.name}</span>
            <span className="bcombo-handle">@{selected.tiktok || selected.instagram || '—'}</span>
          </>
        ) : (
          <span style={{ color: 'var(--ink-4)' }}>— выбрать или найти блогера —</span>
        )}
        <IconChevDown size={14} color="#6B6B73" style={{ marginLeft: 'auto' }} />
      </button>

      {open && (
        <div className="bcombo-menu">
          <div className="bcombo-search">
            <IconSearch size={14} color="#6B6B73" />
            <input
              autoFocus
              placeholder="Поиск по имени или @handle..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="bcombo-list">
            {filtered.length === 0 && (
              <div className="bcombo-empty">Ничего не найдено</div>
            )}
            {filtered.slice(0, 50).map(b => (
              <button type="button" key={b.id}
                className={`bcombo-item ${b.id === value ? 'is-active' : ''}`}
                onClick={() => { onChange(b.id); setOpen(false); setQ(''); }}
              >
                <span className="bcombo-avatar">{b.name[0]}</span>
                <span className="grow truncate" style={{ textAlign: 'left' }}>{b.name}</span>
                <span className="bcombo-handle">@{b.tiktok || b.instagram || '—'}</span>
                <span className="bcombo-lvl">{b.level}</span>
              </button>
            ))}
          </div>
          <div className="bcombo-foot">
            {!addOpen ? (
              <button type="button" className="bcombo-add" onClick={() => setAddOpen(true)}>
                <IconPlus size={14} /> Добавить нового блогера
              </button>
            ) : (
              <div className="bcombo-addform">
                <input className="mini-in" placeholder="Имя (Полина Петухова)" value={newName} onChange={(e) => setNewName(e.target.value)} />
                <div className="row" style={{ gap: 8 }}>
                  <select className="mini-sel" value={newPlatform} onChange={(e) => setNewPlatform(e.target.value)}>
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <input className="mini-in grow" placeholder="handle (без @)" value={newHandle} onChange={(e) => setNewHandle(e.target.value.toLowerCase().replace(/^@/, ''))} />
                </div>
                <div className="row" style={{ gap: 8, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAddOpen(false)}>Отмена</button>
                  <button type="button" className="btn btn-primary btn-sm" disabled={!newName.trim()}
                    onClick={() => {
                      const created = onCreateNew({ name: newName.trim(), platform: newPlatform, handle: newHandle });
                      onChange(created.id);
                      setAddOpen(false); setOpen(false);
                      setNewName(''); setNewHandle('');
                    }}
                  >Сохранить</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .bcombo { position: relative; }
        .bcombo-handle { font-family: var(--font-mono); font-size: 11px; color: var(--ink-3); margin-left: auto; }
        .bcombo-lvl { font-size: 11px; color: var(--ink-3); margin-left: 8px; }
        .bcombo-avatar {
          width: 22px; height: 22px; border-radius: 999px;
          background: var(--ink-1); color: #fff;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 600;
          flex-shrink: 0;
        }
        .bcombo-menu {
          position: absolute; left: 0; right: 0; top: calc(100% + 4px); z-index: 30;
          background: var(--surface); border: 1px solid var(--line-1); border-radius: 10px;
          box-shadow: var(--sh-modal);
          overflow: hidden;
          display: flex; flex-direction: column;
          max-height: 380px;
        }
        .bcombo-search {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 12px; border-bottom: 1px solid var(--line-2);
        }
        .bcombo-search input {
          border: none; outline: none; flex: 1; font-size: 14px; background: transparent;
        }
        .bcombo-list { overflow-y: auto; padding: 4px; flex: 1; }
        .bcombo-empty { padding: 14px 12px; color: var(--ink-3); font-size: 13px; }
        .bcombo-item {
          width: 100%; display: flex; align-items: center; gap: 10px;
          padding: 8px 10px; border-radius: 6px;
          background: transparent; border: none; text-align: left; font-size: 13px;
          color: var(--ink-1);
        }
        .bcombo-item:hover { background: var(--bg); }
        .bcombo-item.is-active { background: var(--bg); font-weight: 600; }
        .bcombo-foot { border-top: 1px solid var(--line-2); padding: 8px; }
        .bcombo-add {
          width: 100%; padding: 8px 10px; border-radius: 6px;
          background: transparent; border: 1px dashed var(--line-1);
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; font-weight: 500; color: var(--ink-1);
        }
        .bcombo-add:hover { background: var(--bg); }
        .bcombo-addform { display: flex; flex-direction: column; gap: 8px; padding: 4px; }
        .mini-in, .mini-sel {
          padding: 8px 10px; border: 1px solid var(--line-1); border-radius: 6px;
          font-size: 13px; background: var(--surface); color: var(--ink-1); width: 100%;
        }
        .mini-in:focus, .mini-sel:focus { outline: none; border-color: var(--ink-1); box-shadow: 0 0 0 3px rgba(11,11,12,0.06); }
      `}</style>
    </div>
  );
}

// =================================================================
function PlacementModal({ mode, placement, prefill, bloggers, placements, onClose, onSave, onDelete, onCreateBlogger }) {
  // mode: 'create' | 'edit'
  const [form, setForm] = useStateM(() => {
    const base = {
      date: prefill?.date || isoToday(),
      bloggerId: '',
      brandId: '',
      category: '',
      product: '',
      tool: '',
      platform: '',
      link: '',
      status: 'Запланировано',
    };
    return { ...base, ...(placement || {}), ...(prefill || {}) };
  });

  // Live conflict preview
  const conflicts = useMemoM(() => {
    if (!form.bloggerId || !form.date || !form.brandId || !form.category) return null;
    const sim = { ...form, id: placement?.id || '__draft__' };
    const others = placements.filter(p => p.id !== sim.id);
    return detectConflicts(sim, others);
  }, [form, placements, placement]);

  const set = (k, v) => setForm(s => ({ ...s, [k]: v }));

  const requiredFilled = ['date','bloggerId','brandId','category','product','tool','platform','status'].every(k => !!form[k]);

  return (
    <ModalShell title={mode === 'edit' ? 'Редактировать размещение' : 'Новое размещение'} onClose={onClose} width={600}>
      <div className="pm-body">
        <Field label="Дата" required>
          <DateInput value={form.date} onChange={(v) => set('date', v)} />
        </Field>

        <Field label="Блогер" required>
          <BloggerCombo
            value={form.bloggerId}
            onChange={(v) => set('bloggerId', v)}
            bloggers={bloggers}
            onCreateNew={onCreateBlogger}
          />
        </Field>

        <Field label="Бренд" required>
          <BrandSelect value={form.brandId} onChange={(v) => set('brandId', v)} />
        </Field>

        <Field label="Категория" required>
          <Select value={form.category} onChange={(v) => set('category', v)} options={CATEGORIES} placeholder="— категория —" />
        </Field>

        <Field label="Продукт" required>
          <TextInput value={form.product} onChange={(v) => set('product', v)} placeholder="Например: Муссовые помады MUSE" />
        </Field>

        <Field label="Инструмент" required>
          <Select value={form.tool} onChange={(v) => set('tool', v)} options={TOOLS} placeholder="— инструмент —" />
        </Field>

        <Field label="Платформа" required>
          <Select value={form.platform} onChange={(v) => set('platform', v)} options={PLATFORMS} placeholder="— платформа —" />
        </Field>

        <Field label="Ссылка на пост">
          <TextInput value={form.link} onChange={(v) => set('link', v)} placeholder="https://… (опционально)" leftIcon={<IconLink size={14} />} />
        </Field>

        <Field label="Статус" required>
          <Select value={form.status} onChange={(v) => set('status', v)} options={STATUSES} placeholder="— статус —" />
        </Field>

        {/* Conflict preview */}
        <div className="pm-conflict-wrap">
          {!conflicts && (
            <div className="pm-hint">Заполните поля выше — проверим конфликты автоматически.</div>
          )}
          {conflicts && !conflicts.hasConflict && (
            <div className="pm-ok">
              <IconCheck size={14} color="#16A34A" strokeWidth={2.4} />
              <span>Конфликтов не найдено</span>
            </div>
          )}
          {conflicts && conflicts.hasConflict && (
            <div className="pm-bad">
              <div className="pm-bad-head">
                <span className="pm-bad-mark"><IconAlert size={12} color="#fff" strokeWidth={2.4} /></span>
                <span style={{ fontWeight: 600 }}>Конфликт</span>
              </div>
              <ul className="pm-bad-list">
                {conflicts.reasons.map((r, i) => (
                  <li key={i}>
                    {(() => {
                      const b = bloggers.find(x => x.id === form.bloggerId);
                      return `У ${b?.name ?? 'блогера'} ${fmtRuShort(r.against.date)} уже запланировано размещение для ${BRAND_BY_ID[r.against.brandId].name} (${r.against.tool}, ${r.against.category}` +
                        (r.kind === 'category' ? ` — та же категория, требуется ≥${r.required} дней между размещениями` :
                         r.kind === 'brand' ? ` — тот же бренд, требуется ≥${r.required} дней` :
                         ` — тот же день`)
                      + ').';
                    })()}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="m-foot">
        {mode === 'edit' && (
          <button className="btn btn-ghost btn-danger" onClick={onDelete}>
            <IconTrash size={14} /> Удалить
          </button>
        )}
        <div className="grow" />
        <button className="btn btn-ghost" onClick={onClose}>Отмена</button>
        <button className="btn btn-primary" disabled={!requiredFilled} onClick={() => onSave(form)}>
          {mode === 'edit' ? 'Сохранить' : 'Создать'}
        </button>
      </div>

      <style>{`
        .pm-body {
          padding: 20px 24px 4px;
          display: flex; flex-direction: column; gap: 14px;
          overflow-y: auto;
        }
        .m-foot {
          padding: 16px 24px;
          display: flex; align-items: center; gap: 8px;
          border-top: 1px solid var(--line-2);
          background: #FBFBF8;
        }
        .pm-conflict-wrap { margin: 8px 0 16px; padding-left: 156px; }
        .pm-hint { color: var(--ink-4); font-size: 13px; }
        .pm-ok {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 8px 12px;
          background: var(--ok-bg);
          border: 1px solid rgba(22,163,74,0.25);
          border-radius: 8px;
          font-size: 13px; color: #166534;
        }
        .pm-bad {
          background: var(--conflict-bg);
          border: 1px solid rgba(220, 38, 38, 0.22);
          border-radius: 10px;
          padding: 12px 14px;
        }
        .pm-bad-head { display: flex; align-items: center; gap: 8px; color: var(--conflict); font-size: 13px; }
        .pm-bad-mark {
          width: 18px; height: 18px; border-radius: 999px; background: var(--conflict);
          display: inline-flex; align-items: center; justify-content: center;
        }
        .pm-bad-list { margin: 8px 0 0; padding-left: 26px; color: var(--ink-2); font-size: 13px; line-height: 1.5; }
      `}</style>
    </ModalShell>
  );
}

window.PlacementModal = PlacementModal;
window.ModalShell = ModalShell;
window.Field = Field;
window.Select = Select;
window.TextInput = TextInput;
window.DateInput = DateInput;
