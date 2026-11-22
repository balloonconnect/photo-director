'use client';
import { useEffect, useRef } from 'react';

const P = {
  home: <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  plus: <path d="M12 5v14M5 12h14" />, minus: <path d="M5 12h14" />,
  plans: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  cam: <><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><circle cx="12" cy="13" r="3.5" /></>,
  img: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="m4 18 5-5 4 4 3-3 4 4" /></>,
  x: <path d="M6 6l12 12M18 6 6 18" />, check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  chev: <path d="m9 18 6-6-6-6" />, chevd: <path d="m6 9 6 6 6-6" />, back: <path d="M15 5l-7 7 7 7" />,
  chevs: <path d="M9 7l-5 5 5 5M15 7l5 5-5 5" />,
  pin: <><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" /></>,
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />, trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  edit: <path d="M4 20h4L19 9l-4-4L4 16z" />, copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></>,
  alert: <><path d="M12 3 2 20h20z" /><path d="M12 10v5M12 18h.01" /></>,
  crop: <path d="M6 2v14a2 2 0 0 0 2 2h14M2 6h14a2 2 0 0 1 2 2v14" />,
  swap: <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.2L3 16M3 21v-5h5" />,
  search: <><circle cx="11" cy="11" r="6" /><path d="m20 20-4-4" /></>,
  sliders: <><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></>,
  move: <path d="M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3" />,
  upload: <path d="M12 16V4M6 10l6-6 6 6M4 20h16" />,
};

export function Icon({ name, size = 22, className = '', style }) {
  return (
    <svg className={`ic ${className}`} style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {P[name]}
    </svg>
  );
}

export function Badge({ tone, icon, children }) {
  return <span className={`badge ${tone || ''}`}>{icon && <Icon name={icon} size={11} />}{children}</span>;
}

export function Switch({ on, onChange, label }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className={`switch ${on ? 'on' : ''}`} onClick={() => onChange(!on)}><i /></button>;
}

export function Segmented({ value, options, onChange, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(([v, l]) => <button key={v} type="button" className={value === v ? 'on' : ''} aria-pressed={value === v} onClick={() => onChange(v)}>{l}</button>)}
    </div>
  );
}

export function Sheet({ open, onClose, title, sub, children }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k);
    ref.current?.focus();
    const ov = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = ov; prev?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <div className="grab" />
        {title && <div className="stack-s"><h2 className="h2" style={{ fontSize: 20 }}>{title}</h2>{sub && <p className="small muted">{sub}</p>}</div>}
        {children}
      </div>
    </div>
  );
}

export function Confirm({ open, title, body, confirmLabel = 'Confirm', danger, onConfirm, onClose }) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      {body && <p className="body muted">{body}</p>}
      <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</button>
      <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
    </Sheet>
  );
}

export function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div className="toast" role="status" aria-live="polite">
      <span>{toast.message}</span>
      {toast.action && <button onClick={() => { toast.action(); onClose(); }}>{toast.label || 'Undo'}</button>}
    </div>
  );
}

export function Progress({ pct }) {
  return <div className="progress" role="progressbar" aria-valuenow={Math.round(pct * 100)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${Math.round(pct * 100)}%` }} /></div>;
}

export function Empty({ icon, title, body, children }) {
  return <div className="empty"><div className="circ"><Icon name={icon} size={32} /></div><h2 className="h2" style={{ fontSize: 20 }}>{title}</h2><p className="body muted" style={{ maxWidth: 320 }}>{body}</p>{children}</div>;
}
