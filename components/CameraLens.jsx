'use client';
import { useState } from 'react';
import { useApp, kitOf, resolvedSelection } from '@/lib/client/app';
import { Icon, Sheet, Badge } from './ui';

export default function CameraLens() {
  const { draft, gear, patchDraft } = useApp();
  const kit = kitOf(gear, draft);
  const sel = resolvedSelection(draft, kit);
  const [camOpen, setCamOpen] = useState(false);
  const [lensOpen, setLensOpen] = useState(false);
  const [custom, setCustom] = useState('');
  const allLenses = [...new Set([...sel.kitLenses, ...draft.extraLenses])];
  const toggle = (name) => {
    const cur = new Set(sel.lenses);
    if (cur.has(name)) cur.delete(name); else cur.add(name);
    patchDraft({ lenses: [...cur].filter((n) => sel.kitLenses.includes(n)), extraLenses: [...cur].filter((n) => !sel.kitLenses.includes(n)) });
  };
  const addLens = () => { const n = custom.trim(); if (!n) return; if (!allLenses.includes(n)) patchDraft((d) => ({ extraLenses: [...d.extraLenses, n] })); setCustom(''); };
  const camOptions = [...new Set([...(sel.detected ? [sel.detected] : []), ...sel.kitCams])];
  const [camCustom, setCamCustom] = useState('');

  return (
    <section className="card" aria-labelledby="cl-h">
      <div className="row"><Icon name="cam" size={20} style={{ color: 'var(--ac)' }} /><h2 id="cl-h" className="h3">Camera & lenses for this shoot</h2></div>
      <button className="tile" style={{ border: '1px solid var(--bd)', textAlign: 'left', minHeight: 64 }} onClick={() => setCamOpen(true)} aria-haspopup="dialog">
        <span className="k">Camera model</span>
        <span className="row"><b className="v grow">{sel.camera || 'Choose camera'}</b>{sel.camera && sel.camera === sel.detected && <Badge tone="ok" icon="check">From photo</Badge>}<Icon name="chevd" size={20} className="muted" /></span>
      </button>
      <div className="stack-s">
        <b style={{ fontSize: 14 }}>Lenses you have with you</b>
        <span className="tiny muted">Tap to select all that apply. The plan only uses these.</span>
      </div>
      <div className="chips">
        {allLenses.map((l) => <button key={l} className={`chip ${sel.lenses.includes(l) ? 'on' : ''}`} aria-pressed={sel.lenses.includes(l)} onClick={() => toggle(l)}>{l}</button>)}
        <button className="chip" style={{ color: 'var(--ac)', borderColor: 'var(--ac)' }} onClick={() => setLensOpen(true)}><Icon name="plus" size={16} style={{ verticalAlign: '-3px', marginRight: 4 }} />Add lens</button>
      </div>
      {!allLenses.length && <p className="tiny muted">No lenses in this kit yet. Add one here, or in My Gear to keep it.</p>}

      <Sheet open={camOpen} onClose={() => setCamOpen(false)} title="Choose camera model" sub="Pulled from My Gear. We pre-select the camera found in your photo.">
        {camOptions.map((c) => (
          <button key={c} className={`opt ${sel.camera === c ? 'on' : ''}`} onClick={() => { patchDraft({ camera: c }); setCamOpen(false); }}>
            <span className="radio"><i /></span>
            <span className="grow"><b style={{ fontSize: 15 }}>{c}</b> {c === sel.detected && <Badge tone="ok" icon="check">Detected</Badge>}<span className="tiny muted" style={{ display: 'block' }}>{sel.kitCams.includes(c) ? `From ${kit.name}` : 'Not in My Gear'}</span></span>
          </button>
        ))}
        <form className="addrow" onSubmit={(e) => { e.preventDefault(); const n = camCustom.trim(); if (n) { patchDraft({ camera: n }); setCamCustom(''); setCamOpen(false); } }}>
          <input className="input" value={camCustom} onChange={(e) => setCamCustom(e.target.value)} placeholder="Use another model, e.g. Canon R6" aria-label="Another camera model" maxLength={80} />
          <button className="btn btn-secondary btn-sm" type="submit" disabled={!camCustom.trim()}>Use</button>
        </form>
        <button className="btn btn-primary" onClick={() => setCamOpen(false)}>Done</button>
      </Sheet>

      <Sheet open={lensOpen} onClose={() => setLensOpen(false)} title="Add a lens" sub="Add a lens that isn’t listed. It applies to this shoot only; add it in My Gear to keep it.">
        <form className="addrow" onSubmit={(e) => { e.preventDefault(); addLens(); setLensOpen(false); }}>
          <input className="input" autoFocus value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="e.g. 50mm f/1.4" aria-label="Lens name" maxLength={80} />
          <button className="btn btn-primary btn-sm" type="submit" disabled={!custom.trim()}>Add</button>
        </form>
      </Sheet>
    </section>
  );
}
