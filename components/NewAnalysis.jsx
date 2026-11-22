'use client';
import { useRef, useState } from 'react';
import { useApp, kitOf, resolvedSelection } from '@/lib/client/app';
import { SUBJECTS } from '@/lib/client/constants';
import { Icon, Switch, Segmented } from './ui';
import CropModal from './CropModal';
import CameraLens from './CameraLens';

function exifLine(e) {
  if (!e) return '';
  return [[e.make, e.model].filter(Boolean).join(' '), e.focalLength && `${Math.round(e.focalLength)}mm`, e.fNumber && `f/${e.fNumber}`, e.exposure, e.iso && `ISO ${e.iso}`].filter(Boolean).join(' · ');
}

export default function NewAnalysis() {
  const a = useApp();
  const { draft, gear, patchDraft, run } = a;
  const kit = kitOf(gear, draft);
  const [crop, setCrop] = useState(null); // {slot,id}
  const [over, setOver] = useState(false);
  const refInput = useRef(null); const galInput = useRef(null); const camInput = useRef(null);
  const refMissing = useRef(null); const sceneMissing = useRef(null);
  const exifScene = draft.scenes.find((s) => s.exif);
  const gpsFound = draft.scenes.some((s) => s.exif?.gps);
  const ready = draft.ref && draft.scenes.length > 0 && run?.status !== 'running';
  const cropImg = crop && (crop.slot === 'ref' ? draft.ref : draft.scenes.find((s) => s.id === crop.id));
  const sel = resolvedSelection(draft, kit);

  const onDrop = (e) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files?.[0]; if (f) a.setRef(f); };
  const onPaste = (e) => { const f = [...(e.clipboardData?.files || [])][0]; if (f) a.setRef(f); };

  const go = () => {
    if (run?.status === 'running') { a.navigate('analyzing'); return; }
    if (!draft.ref) { refMissing.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); a.notify('Add a reference photo first.'); return; }
    if (!draft.scenes.length) { sceneMissing.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); a.notify('Add a photo of your shooting location.'); return; }
    a.runAnalysis();
  };

  return (
    <div className={`page has-cta`} onPaste={onPaste}>
      <header className="row between"><h1 className="h1">New analysis</h1>{(draft.ref || draft.scenes.length > 0) && <button className="link" onClick={a.clearDraft}>Clear</button>}</header>

      <section className="stack" ref={refMissing} aria-labelledby="ref-h">
        <h2 id="ref-h" className="h2">What photo do you want to create?</h2>
        {!draft.ref ? (
          <button className={`drop ${over ? 'over' : ''}`} onClick={() => refInput.current.click()} onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={onDrop}>
            <span className="circ"><Icon name="img" size={24} /></span>
            <b style={{ fontSize: 16 }}>Choose a reference photo</b>
            <span className="tiny muted">Gallery or screenshot · drag & drop or paste on desktop</span>
          </button>
        ) : (
          <div className="preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={draft.ref.url} alt="Reference photo" />
            <div className="actions">
              <button className="pill" onClick={() => refInput.current.click()}><Icon name="swap" size={16} />Replace</button>
              <button className="pill" onClick={() => setCrop({ slot: 'ref' })}><Icon name="crop" size={16} />Crop</button>
              <button className="pill" onClick={a.removeRef}><Icon name="x" size={16} />Remove</button>
            </div>
          </div>
        )}
        <input ref={refInput} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) a.setRef(f); e.target.value = ''; }} />
      </section>

      <section className="stack" ref={sceneMissing} aria-labelledby="scene-h">
        <div className="stack-s"><h2 id="scene-h" className="h2">Where are you shooting?</h2><p className="small muted">Add 1–5 angles of the real location{draft.scenes.length ? ` · ${draft.scenes.length} of 5` : ''}</p></div>
        {draft.scenes.length === 0 ? (
          <div className="src-btns">
            <button onClick={() => camInput.current.click()}><Icon name="cam" size={26} />Take photo</button>
            <button onClick={() => galInput.current.click()}><Icon name="img" size={26} />Gallery</button>
          </div>
        ) : (
          <div className="thumbs">
            {draft.scenes.map((s, i) => (
              <div className="thumb" key={s.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.url} alt={`Location photo ${i + 1}`} />
                <button className="x" aria-label={`Remove location photo ${i + 1}`} onClick={() => a.removeScene(s.id)}><Icon name="x" size={14} /></button>
                <button className="c" aria-label={`Crop location photo ${i + 1}`} onClick={() => setCrop({ slot: 'scene', id: s.id })}><Icon name="crop" size={14} /></button>
              </div>
            ))}
            {draft.scenes.length < 5 && <button className="add-tile" onClick={() => galInput.current.click()} aria-label="Add another angle"><Icon name="plus" size={22} />Add</button>}
          </div>
        )}
        {draft.scenes.length > 0 && draft.scenes.length < 5 && (
          <div className="row"><button className="pill" onClick={() => camInput.current.click()}><Icon name="cam" size={16} />Take photo</button><button className="pill" onClick={() => galInput.current.click()}><Icon name="img" size={16} />Gallery</button></div>
        )}
        <input ref={galInput} type="file" accept="image/*" multiple hidden onChange={(e) => { a.addScenes(e.target.files || []); e.target.value = ''; }} />
        <input ref={camInput} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { a.addScenes(e.target.files || []); e.target.value = ''; }} />

        {exifScene && <div className="card" style={{ flexDirection: 'row', padding: 12, alignItems: 'center' }}><Icon name="check" size={18} style={{ color: 'var(--ok)' }} /><p className="tiny muted">Detected: {exifLine(exifScene.exif) || 'camera info'}{gpsFound ? ' · GPS found' : ''}</p></div>}

        <div className="listbtn" style={{ cursor: 'default' }}>
          <Icon name={a.ctx ? 'sun' : 'pin'} style={{ color: a.ctx ? 'var(--ac)' : 'var(--inf)' }} />
          <div className="grow stack-s" style={{ gap: 2 }}>
            <b style={{ fontSize: 14 }}>{a.ctx ? `${a.ctx.sunset ? `Sunset ${a.ctx.sunset} · ` : ''}${a.ctx.condition || 'Conditions loaded'}${a.ctx.temperatureC != null ? ` ${Math.round(a.ctx.temperatureC)}°` : ''}` : 'Use location for sun & weather'}</b>
            <span className="tiny muted">{a.ctx?.sunNote || (draft.useLocation ? 'Looking up conditions…' : gpsFound ? 'Your photo has GPS. Turn on to use it. Rounded to ~1 km.' : 'Optional · never required')}</span>
          </div>
          <Switch on={draft.useLocation} onChange={a.toggleLocation} label="Use location for sun and weather" />
        </div>
      </section>

      <section className="stack" aria-labelledby="subj-h">
        <h2 id="subj-h" className="h2">Subject</h2>
        <div className="chips" role="group" aria-label="Subject type">
          {SUBJECTS.map((s) => <button key={s} className={`chip ${draft.subjectType === s ? 'on' : ''}`} aria-pressed={draft.subjectType === s} onClick={() => patchDraft({ subjectType: s })}>{s}</button>)}
        </div>
        <div className="listbtn" style={{ cursor: 'default' }}>
          <b className="grow" style={{ fontSize: 15 }}>Number of subjects</b>
          <div className="stepper">
            <button aria-label="Fewer subjects" onClick={() => patchDraft({ count: Math.max(0, draft.count - 1) })}><Icon name="minus" size={20} /></button>
            <b aria-live="polite">{draft.count === 0 ? 'Auto' : draft.count}</b>
            <button aria-label="More subjects" onClick={() => patchDraft({ count: Math.min(20, draft.count + 1) })}><Icon name="plus" size={20} /></button>
          </div>
        </div>
        <label className="listbtn" style={{ position: 'relative' }}>
          <Icon name="cam" style={{ color: 'var(--ac)' }} />
          <span className="grow stack-s" style={{ gap: 2 }}>
            <span className="tiny muted">My equipment</span>
            <b style={{ fontSize: 15 }}>{kit.name} · {kit.items.length} item{kit.items.length === 1 ? '' : 's'}</b>
          </span>
          <Icon name="chevd" size={20} className="muted" />
          <select aria-label="Equipment kit" value={kit.id} onChange={(e) => patchDraft({ kitId: e.target.value, camera: null, lenses: null, extraLenses: [] })} style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%' }}>
            {gear.kits.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
          </select>
        </label>
        {kit.items.length === 0 && <p className="tiny muted">Your kit is empty. <a className="link" href="#/gear">Add your gear</a> for settings made for your equipment.</p>}
      </section>

      <CameraLens />

      <details className="card">
        <summary><Icon name="sliders" style={{ color: 'var(--mu)' }} /><b className="grow" style={{ fontSize: 15 }}>Customize (optional)</b><Icon name="chevd" size={20} className="muted chev" /></summary>
        <div className="stack" style={{ marginTop: 12 }}>
          <div className="stack-s"><span className="small muted">Environment</span><Segmented label="Environment" value={draft.custom.environment} onChange={(v) => patchDraft((d) => ({ custom: { ...d.custom, environment: v } }))} options={[['auto', 'Auto'], ['indoor', 'Indoor'], ['outdoor', 'Outdoor']]} /></div>
          <div className="stack-s"><span className="small muted">Flash</span><Segmented label="Flash" value={draft.custom.flash} onChange={(v) => patchDraft((d) => ({ custom: { ...d.custom, flash: v } }))} options={[['auto', 'Auto'], ['natural', 'Natural only'], ['flash', 'Use flash']]} /></div>
          <div className="stack-s"><span className="small muted">Max lights</span><Segmented label="Max lights" value={draft.custom.maxLights} onChange={(v) => patchDraft((d) => ({ custom: { ...d.custom, maxLights: v } }))} options={[['auto', 'Auto'], ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4']]} /></div>
          <div className="stack-s"><span className="small muted">Priority</span><Segmented label="Priority" value={draft.custom.priority} onChange={(v) => patchDraft((d) => ({ custom: { ...d.custom, priority: v } }))} options={[['auto', 'Balanced'], ['match', 'Match reference'], ['location', 'Best for location']]} /></div>
          <label className="stack-s"><span className="small muted">Notes for the AI</span><textarea className="input" maxLength={300} value={draft.custom.notes} onChange={(e) => patchDraft((d) => ({ custom: { ...d.custom, notes: e.target.value } }))} placeholder="e.g. Couple is shy; I only have 20 minutes" /></label>
        </div>
      </details>

      <div className="cta-bar"><div className="in">
        <button className="btn btn-primary" aria-disabled={!ready} onClick={go}>{run?.status === 'running' ? 'View running analysis' : 'Analyse & Create Shooting Plan'}</button>
        {!ready && run?.status !== 'running' && <p className="tiny muted center" style={{ display: 'flex' }}>{!draft.ref ? 'Add a reference photo and a location photo to continue' : 'Add a photo of your location to continue'}</p>}
      </div></div>

      {cropImg && <CropModal image={cropImg} onClose={() => setCrop(null)} onApply={(blob, w, h) => { a.replaceImage(crop.slot, crop.id, blob, w, h); setCrop(null); }} />}
    </div>
  );
}
