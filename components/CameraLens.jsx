'use client';
import { useMemo, useState } from 'react';
import { useApp, kitOf, resolvedSelection } from '@/lib/client/app';
import { thumbDataUrl } from '@/lib/client/image';
import { api } from '@/lib/client/api';
import { CAMERA_BRANDS, MOUNTS, lensList, allLenses, lensBrands, findCamera, cameraFullName, focalLabel } from '@/lib/catalog';
import { Icon, Sheet, Badge } from './ui';

export default function CameraLens() {
  const { draft, gear, patchDraft, notify } = useApp();
  const kit = kitOf(gear, draft);
  const sel = resolvedSelection(draft, kit);
  const cam = findCamera(sel.camera);
  const mount = cam?.mount || null;

  const [camOpen, setCamOpen] = useState(false);
  const [brand, setBrand] = useState(null);
  const [camCustom, setCamCustom] = useState('');
  const [lensOpen, setLensOpen] = useState(false);
  const [lBrand, setLBrand] = useState('');
  const [lModel, setLModel] = useState('');
  const [otherMounts, setOtherMounts] = useState(false);
  const [custom, setCustom] = useState('');
  const [sug, setSug] = useState(null);
  const [sugBusy, setSugBusy] = useState(false);

  const allSel = [...new Set([...sel.kitLenses, ...draft.extraLenses])];
  const toggle = (name) => {
    const cur = new Set(sel.lenses);
    if (cur.has(name)) cur.delete(name); else cur.add(name);
    patchDraft({ lenses: [...cur].filter((n) => sel.kitLenses.includes(n)), extraLenses: [...cur].filter((n) => !sel.kitLenses.includes(n)) });
  };
  const addLens = (name) => {
    if (!name) return;
    if (!allSel.includes(name)) patchDraft((d) => ({ extraLenses: [...d.extraLenses, name] }));
    else if (!sel.lenses.includes(name)) toggle(name);
  };

  const pool = useMemo(() => (mount && !otherMounts ? lensList(mount) : allLenses()), [mount, otherMounts]);
  const brands = useMemo(() => lensBrands(pool), [pool]);
  const models = pool.filter((l) => l.brand === lBrand);
  const mountCands = useMemo(() => (mount ? lensList(mount) : allLenses()), [mount]);

  const pickCamera = (name) => { patchDraft({ camera: name, lenses: null, extraLenses: [] }); setCamOpen(false); setSug(null); };
  const kitCams = sel.kitCams;
  const brandModels = brand ? CAMERA_BRANDS.find(([b]) => b === brand)?.[1] || [] : [];

  const suggest = async () => {
    if (!draft.ref) { notify('Add your reference photo first, then I can suggest a lens.'); return; }
    setSugBusy(true); setSug(null);
    try {
      const reference = await thumbDataUrl(draft.ref.blob, 640, 0.7);
      const res = await api.suggestLens({
        reference, camera: sel.camera, crop: mount ? MOUNTS[mount].crop : 1, subjectType: draft.subjectType,
        refFocal: draft.ref.exif?.focalLength35 || null, owned: sel.lenses,
        candidates: mountCands.map(({ name, wide, tele, ap, zoom }) => ({ name, wide, tele, ap, zoom })),
      });
      setSug(res);
    } catch (e) { notify(e.message || "Couldn't get a suggestion."); }
    setSugBusy(false);
  };

  return (
    <section className="card" aria-labelledby="cl-h">
      <div className="row"><Icon name="cam" size={20} style={{ color: 'var(--ac)' }} /><h2 id="cl-h" className="h3">Camera & lenses for this shoot</h2></div>
      <button className="tile" style={{ border: '1px solid var(--bd)', textAlign: 'left', minHeight: 64 }} onClick={() => { setBrand(cam?.brand || null); setCamOpen(true); }} aria-haspopup="dialog">
        <span className="k">Camera model</span>
        <span className="row"><b className="v grow">{sel.camera || 'Choose brand and model'}</b>
          {sel.camera && sel.camera === sel.detected && <Badge tone="ok" icon="check">From photo</Badge>}
          <Icon name="chevd" size={20} className="muted" /></span>
        {mount && <span className="tiny muted">{mount} mount · {cam.sensor}</span>}
      </button>

      <div className="stack-s"><b style={{ fontSize: 14 }}>Lenses you have with you</b>
        <span className="tiny muted">Tap to select all that apply. The plan only uses these.</span></div>
      <div className="chips">
        {allSel.map((l) => <button key={l} className={`chip ${sel.lenses.includes(l) ? 'on' : ''}`} aria-pressed={sel.lenses.includes(l)} onClick={() => toggle(l)}>{l}</button>)}
        <button className="chip" style={{ color: 'var(--ac)', borderColor: 'var(--ac)' }} onClick={() => { setLBrand(''); setLModel(''); setLensOpen(true); }}><Icon name="plus" size={16} style={{ verticalAlign: '-3px', marginRight: 4 }} />Add lens</button>
      </div>
      {!allSel.length && <p className="tiny muted">No lenses selected yet. Add one from the list, or keep them in My Gear.</p>}

      <button className="btn btn-secondary" onClick={suggest} disabled={sugBusy} aria-busy={sugBusy}>
        <Icon name="sun" size={18} />{sugBusy ? 'Reading your reference photo…' : 'Suggest the best lens for my reference photo'}
      </button>
      {sug && (
        <div className="stack" role="region" aria-label="Lens suggestions">
          <p className="small muted">{sug.look}</p>
          {sug.recommendations.map((r) => {
            const have = sel.lenses.includes(r.name);
            return (
              <div key={r.name} className={`sug ${r.rank === 1 ? 'best' : ''}`}>
                <div className="row"><span className="rank">{r.rank}</span><b className="grow" style={{ fontSize: 15 }}>{r.name}</b>{have ? <Badge tone="ok" icon="check">Selected</Badge> : null}</div>
                <p className="small muted">{r.why}</p>
                <div className="row between"><span className="tiny muted">Shoot at {r.focal_mm}mm · {r.aperture}</span>
                  {!have && <button className="pill ac" onClick={() => { addLens(r.name); notify('Lens added to this shoot.'); }}><Icon name="plus" size={16} />Use this lens</button>}</div>
              </div>);
          })}
          {sug.basic && <p className="tiny muted">Basic estimate. A photo-based match needs the AI service turned on.</p>}
        </div>
      )}

      <Sheet open={camOpen} onClose={() => setCamOpen(false)} title="Choose camera" sub="Pick the brand, then the model.">
        {kitCams.length > 0 && (<div className="stack-s"><b style={{ fontSize: 14 }}>From My Gear</b>
          {kitCams.map((c) => <button key={c} className={`opt ${sel.camera === c ? 'on' : ''}`} onClick={() => pickCamera(c)}><span className="radio"><i /></span><b className="grow" style={{ fontSize: 15 }}>{c}</b></button>)}</div>)}
        {sel.detected && !kitCams.includes(sel.detected) && <button className={`opt ${sel.camera === sel.detected ? 'on' : ''}`} onClick={() => pickCamera(sel.detected)}><span className="radio"><i /></span><span className="grow"><b style={{ fontSize: 15 }}>{sel.detected}</b> <Badge tone="ok" icon="check">Detected</Badge></span></button>}
        <div className="stack-s"><b style={{ fontSize: 14 }}>Brand</b>
          <div className="brandgrid" role="group" aria-label="Camera brand">{CAMERA_BRANDS.map(([b]) => <button key={b} className={brand === b ? 'on' : ''} aria-pressed={brand === b} onClick={() => setBrand(b)}>{b}</button>)}</div></div>
        {brand && (
          <label className="field"><span>Model</span>
            <select className="input" value={cam && cam.brand === brand ? cam.name : ''} onChange={(e) => e.target.value && pickCamera(e.target.value)}>
              <option value="">Select a {brand.split(' ')[0]} model…</option>
              {brandModels.map(([m, mt, sensor]) => <option key={m} value={cameraFullName(brand, m)}>{brand.split(' ')[0]} {m} · {mt} · {sensor}</option>)}
            </select></label>)}
        <form className="addrow" onSubmit={(e) => { e.preventDefault(); const n = camCustom.trim(); if (n) { pickCamera(n); setCamCustom(''); } }}>
          <input className="input" value={camCustom} onChange={(e) => setCamCustom(e.target.value)} placeholder="Not listed? Type your camera" aria-label="Other camera model" maxLength={80} />
          <button className="btn btn-secondary btn-sm" type="submit" disabled={!camCustom.trim()}>Use</button></form>
      </Sheet>

      <Sheet open={lensOpen} onClose={() => setLensOpen(false)} title="Add a lens" sub={mount ? `Showing lenses for ${mount} mount${cam ? ` (${cam.name})` : ''}.` : 'Choose a camera first to see matching lenses.'}>
        <label className="field"><span>Brand</span>
          <select className="input" value={lBrand} onChange={(e) => { setLBrand(e.target.value); setLModel(''); }}>
            <option value="">Select a brand…</option>{brands.map((b) => <option key={b} value={b}>{b}</option>)}</select></label>
        <label className="field"><span>Lens model</span>
          <select className="input" value={lModel} disabled={!lBrand} onChange={(e) => setLModel(e.target.value)}>
            <option value="">{lBrand ? 'Select a lens…' : 'Choose a brand first'}</option>
            {models.map((l) => <option key={l.name} value={l.name}>{l.name} · {focalLabel(l)} f/{l.ap}{otherMounts ? ` · ${l.mount}` : ''}</option>)}</select></label>
        {mount && <label className="listbtn"><span className="grow small">Show lenses from other mounts (needs an adapter)</span><input type="checkbox" checked={otherMounts} onChange={(e) => { setOtherMounts(e.target.checked); setLBrand(''); setLModel(''); }} style={{ width: 22, height: 22 }} /></label>}
        <button className="btn btn-primary" disabled={!lModel} onClick={() => { addLens(lModel); setLensOpen(false); }}>Add lens</button>
        <form className="addrow" onSubmit={(e) => { e.preventDefault(); const n = custom.trim(); if (n) { addLens(n); setCustom(''); setLensOpen(false); } }}>
          <input className="input" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Not listed? Type it, e.g. 50mm f/1.4" aria-label="Other lens" maxLength={80} />
          <button className="btn btn-secondary btn-sm" type="submit" disabled={!custom.trim()}>Add</button></form>
      </Sheet>
    </section>
  );
}
