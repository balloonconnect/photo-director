'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/lib/client/app';
import { Icon, Badge, Segmented, Progress, Empty } from './ui';
import Diagram from './Diagram';

const ROLE_COLOR = { key: '#E0A458', fill: '#8FB4D9', rim: '#C99BE0', background: '#8FBF8A', hair: '#E07A6B', ambient_helper: '#A79D90' };
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1).replace(/_/g, ' ') : '');
const FT = 3.28084;

function Own({ owned, label }) { return owned ? <Badge tone="ok" icon="check">{label || 'Owned'}</Badge> : <Badge tone="up">Upgrade</Badge>; }

function Compare({ plan }) {
  const [mode, setMode] = useState('slide'); const [pos, setPos] = useState(50);
  const ref = plan.thumbs?.ref; const sc = plan.thumbs?.scenes?.[0];
  if (!ref || !sc) return null;
  return (
    <section className="stack" aria-labelledby="cmp-h">
      <div className="row between"><h2 id="cmp-h" className="h2">Reference vs your location</h2>
        <Segmented label="Compare view" value={mode} onChange={setMode} options={[['slide', 'Swipe'], ['side', 'Side by side']]} /></div>
      {mode === 'slide' ? (
        <div className="compare" style={{ aspectRatio: '4 / 3' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sc} alt="Your location" />
          <div className="top" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={ref} alt="Reference" /></div>
          <span className="cmp-tag" style={{ left: 12 }}>Reference</span><span className="cmp-tag" style={{ right: 12 }}>Your location</span>
          <div className="cmp-line" style={{ left: `${pos}%` }} /><div className="cmp-handle" style={{ left: `${pos}%` }}><Icon name="chevs" size={20} /></div>
          <input className="cmp-range" type="range" min="0" max="100" value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label="Compare slider" />
        </div>
      ) : (
        <div className="sbs"><figure>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={ref} alt="Reference" /><figcaption>Reference</figcaption></figure>
          <figure>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={sc} alt="Your location" /><figcaption>Your location</figcaption></figure></div>
      )}
    </section>
  );
}

export default function PlanView({ id }) {
  const { current, openPlan, saveUnsaved, patchCurrent, navigate, notify } = useApp();
  const [err, setErr] = useState('');
  const [unit, setUnit] = useState('m');
  useEffect(() => {
    if (id === 'unsaved') return;
    setErr(''); openPlan(id).catch((e) => setErr(e.message || "Couldn't load this plan."));
  }, [id, openPlan]);

  if (id === 'unsaved' && !current) return <div className="page"><Empty icon="plans" title="Nothing to show" body="This unsaved plan is no longer available."><a className="btn btn-primary" href="#/new">New analysis</a></Empty></div>;
  if (err) return <div className="page"><Empty icon="alert" title="Plan not found" body={err}><a className="btn btn-secondary" href="#/plans">Back to plans</a></Empty></div>;
  if (!current) return <div className="page"><p className="muted" role="status">Loading plan…</p></div>;

  const plan = current; const d = plan.data; const lights = d.lighting.lights;
  const checklist = plan.checklist || {};
  const items = [...d.instructions.map((s) => s.title), ...[d.camera.body && `Set camera: ${[d.camera.aperture, d.camera.shutter_speed, d.camera.iso].filter(Boolean).join(', ')}`].filter(Boolean)];
  const total = items.length; const done = items.filter((_, i) => checklist[i]).length;
  const fmt = (m) => (unit === 'ft' ? `${(m * FT).toFixed(1)} ft` : `${m.toFixed(1)} m`);

  const toggle = (i) => {
    const next = { ...checklist }; if (next[i]) delete next[i]; else next[i] = true;
    patchCurrent({ checklist: next }, (p) => ({ ...p, checklist: next }));
  };
  const editLight = (i, v) => {
    const l = lights[i];
    const upd = { ...l, ...v, edited: true, ai_distance_m: l.ai_distance_m ?? l.distance_m, ai_angle_deg: l.ai_angle_deg ?? l.angle_deg };
    const nl = lights.map((x, k) => (k === i ? upd : x));
    patchCurrent({ lights: nl.map((x) => ({ distance_m: x.distance_m, angle_deg: x.angle_deg, edited: x.edited, ai_distance_m: x.ai_distance_m, ai_angle_deg: x.ai_angle_deg })) },
      (p) => ({ ...p, data: { ...p.data, lighting: { ...p.data.lighting, lights: nl } } }));
  };
  const resetLight = (i) => {
    const l = lights[i];
    const nl = lights.map((x, k) => { if (k !== i) return x; const { edited, ai_distance_m, ai_angle_deg, ...rest } = x; return { ...rest, distance_m: ai_distance_m ?? x.distance_m, angle_deg: ai_angle_deg ?? x.angle_deg }; });
    patchCurrent({ lights: nl.map((x) => ({ distance_m: x.distance_m, angle_deg: x.angle_deg, edited: false })) }, (p) => ({ ...p, data: { ...p.data, lighting: { ...p.data.lighting, lights: nl } } }));
    void l;
  };

  const asText = () => {
    const L = [plan.title, ''];
    L.push(`Camera: ${d.camera.body} · ${d.camera.lens} ${d.camera.focal_length_mm} · ${d.camera.aperture} · ${d.camera.shutter_speed} · ${d.camera.iso} · WB ${d.camera.white_balance}`, '');
    L.push('Lighting: ' + d.lighting.summary);
    lights.forEach((l, i) => L.push(`  ${i + 1}. ${cap(l.role)}: ${l.unit} + ${l.modifier}, power ${l.power}, ${l.distance_m.toFixed(1)} m at ${Math.round(l.angle_deg)}°, ${l.height_m.toFixed(1)} m high`));
    L.push('', 'Steps:'); d.instructions.forEach((s, i) => L.push(`${i + 1}. ${s.title} — ${s.detail}`));
    return L.join('\n');
  };
  const copy = async () => { try { await navigator.clipboard.writeText(asText()); notify('Plan copied.'); } catch { notify("Couldn't copy."); } };

  return (
    <div className="page" style={{ gap: 20 }}>
      <header className="row"><button className="iconbtn" aria-label="Back" onClick={() => history.length > 1 ? history.back() : navigate('plans')}><Icon name="back" /></button>
        <h1 className="h1 grow" style={{ fontSize: 22 }}>{plan.title}</h1>
        <button className="iconbtn" aria-label="Copy plan as text" onClick={copy}><Icon name="copy" /></button></header>

      {plan.meta?.mock && <div className="card sample" role="note"><b>Sample plan</b><p className="small muted">This is demo data, not a real analysis of your photos. Add your API key to get real plans.</p></div>}
      {plan.unsaved && <div className="card" role="alert"><b>Not saved yet</b><p className="small muted">We couldn’t save this plan to your account.</p><button className="btn btn-primary" onClick={saveUnsaved}>Save plan</button></div>}

      <div className="card"><div className="row between"><Badge tone={d.comparison.difficulty === 'easy' ? 'ok' : d.comparison.difficulty === 'challenging' ? 'er' : 'up'}>{cap(d.comparison.difficulty)} to recreate</Badge>
        <span className="tiny muted">{plan.inputs?.subjectType}{plan.inputs?.subjectCount ? ` · ${plan.inputs.subjectCount}` : ''}</span></div>
        <p className="body">{d.comparison.summary}</p></div>

      <Compare plan={plan} />

      <section className="stack" aria-labelledby="diff-h"><h2 id="diff-h" className="h2">What’s different</h2>
        {d.comparison.differences.map((x, i) => (
          <div className="card" key={i}><div className="row between"><b>{cap(x.aspect)}</b><Badge tone={x.impact === 'high' ? 'er' : x.impact === 'medium' ? 'up' : undefined}>{cap(x.impact)} impact</Badge></div>
            <dl className="kv"><dt>Reference</dt><dd>{x.reference}</dd><dt>Your scene</dt><dd>{x.live}</dd><dt className="do">Do this</dt><dd className="do">{x.change}</dd></dl></div>))}
      </section>

      <section className="card" aria-labelledby="cam-h"><h2 id="cam-h" className="h2">Camera settings</h2>
        <div className="tiles">
          <div className="tile"><span className="k">Camera <Own owned={d.camera.body_owned} /></span><b className="v">{d.camera.body}</b></div>
          <div className="tile"><span className="k">Lens <Own owned={d.camera.lens_owned} /></span><b className="v">{d.camera.lens}</b></div>
        </div>
        <div className="tiles four">
          {[['Focal', d.camera.focal_length_mm], ['Aperture', d.camera.aperture], ['Shutter', d.camera.shutter_speed], ['ISO', d.camera.iso.replace(/^ISO\s*/i, '')]].map(([k, v]) => <div className="tile" key={k}><span className="k">{k}</span><b className="v">{v}</b></div>)}
        </div>
        <dl className="kv"><dt>Focus</dt><dd>{d.camera.focus_mode}</dd><dt>White bal.</dt><dd>{d.camera.white_balance}</dd></dl>
        <p className="body muted">{d.camera.why}</p>
        {d.camera.tips.length > 0 && <ul className="small muted" style={{ margin: 0, paddingLeft: 18 }}>{d.camera.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>}
      </section>

      <section className="stack" aria-labelledby="light-h">
        <div className="row between"><h2 id="light-h" className="h2">Lighting setup</h2><Segmented label="Units" value={unit} onChange={setUnit} options={[['m', 'm'], ['ft', 'ft']]} /></div>
        <p className="body muted">{d.lighting.summary}</p>
        <div className="resp-2">
          <div className="card"><Diagram data={d.diagram} lights={lights} unit={unit} editable onMove={editLight} />
            <p className="tiny muted center" style={{ display: 'flex' }}>{lights.length ? 'Drag a numbered light to try another position' : 'Natural light only — no lights to place'}</p></div>
          <div className="stack">
            {lights.map((l, i) => (
              <div className="card" key={i}>
                <div className="row between"><span className="role" style={{ background: ROLE_COLOR[l.role] || '#E0A458' }}>{i + 1} · {cap(l.role)}</span>{l.edited && <button className="link" onClick={() => resetLight(i)}>Reset to AI</button>}</div>
                <dl className="kv"><dt>Light</dt><dd>{l.unit} <Own owned={l.unit_owned} /></dd><dt>Modifier</dt><dd>{l.modifier} {l.modifier !== 'None' && <Own owned={l.modifier_owned} />}</dd>
                  {l.gel !== 'None' && <><dt>Gel</dt><dd>{l.gel} <Own owned={l.gel_owned} /></dd></>}
                  <dt>Power</dt><dd>{l.power}{l.power_adjust ? ` — ${l.power_adjust}` : ''}</dd><dt>Height</dt><dd>{fmt(l.height_m)}</dd><dt>Aim</dt><dd>{l.aim}</dd></dl>
                <div className="tiles">
                  <label className="tile"><span className="k">Distance ({unit})</span><input className="num-in" type="number" step="0.1" min="0.3" max={unit === 'ft' ? 49 : 15} value={unit === 'ft' ? +(l.distance_m * FT).toFixed(1) : +l.distance_m.toFixed(1)} onChange={(e) => { const v = Number(e.target.value); if (Number.isFinite(v)) editLight(i, { distance_m: Math.min(15, Math.max(0.3, unit === 'ft' ? v / FT : v)) }); }} /></label>
                  <label className="tile"><span className="k">Angle (°)</span><input className="num-in" type="number" step="5" min="-180" max="180" value={Math.round(l.angle_deg)} onChange={(e) => { const v = Number(e.target.value); if (Number.isFinite(v)) editLight(i, { angle_deg: Math.min(180, Math.max(-180, v)) }); }} /></label>
                </div>
                <p className="small muted">{l.purpose}</p>
              </div>))}
            {d.lighting.reflectors.length > 0 && <div className="card"><b>Reflectors & diffusers</b><ul className="small muted" style={{ margin: 0, paddingLeft: 18 }}>{d.lighting.reflectors.map((r, i) => <li key={i}>{r}</li>)}</ul></div>}
          </div>
        </div>
      </section>

      <section className="stack" aria-labelledby="dir-h"><h2 id="dir-h" className="h2">Directing your subjects</h2>
        <div className="card"><dl className="kv"><dt>Camera</dt><dd>{d.subject_direction.camera_height}; {d.subject_direction.camera_angle}</dd><dt>Background</dt><dd>{d.subject_direction.background_positioning}</dd>{d.subject_direction.interaction && <><dt>Together</dt><dd>{d.subject_direction.interaction}</dd></>}</dl></div>
        {d.subject_direction.subjects.map((s, i) => (
          <div className="card" key={i}><b>Subject {s.label || i + 1}</b>
            <dl className="kv"><dt>Pose</dt><dd>{s.pose}</dd><dt>Body</dt><dd>{s.body_direction}</dd><dt>Face</dt><dd>{s.face_direction}</dd><dt>Hands</dt><dd>{s.hands}</dd><dt className="do">Say</dt><dd className="do">{s.expression}</dd></dl></div>))}
      </section>

      <section className="stack" aria-labelledby="steps-h"><h2 id="steps-h" className="h2">Step by step</h2>
        <div className="card">{d.instructions.map((s, i) => (
          <div className="row" key={i} style={{ alignItems: 'flex-start' }}><span className="num">{i + 1}</span><div className="stack-s"><b style={{ fontSize: 15 }}>{s.title}</b><span className="small muted">{s.detail}</span></div></div>))}</div>
      </section>

      <section className="card" aria-labelledby="chk-h"><div className="row between"><h2 id="chk-h" className="h2">Final checklist</h2><span className="small muted" aria-live="polite">{done} of {total}</span></div>
        <Progress pct={total ? (done / total) * 100 : 0} />
        {items.map((t, i) => (
          <button key={i} className={`checkrow ${checklist[i] ? 'done' : ''}`} role="checkbox" aria-checked={!!checklist[i]} onClick={() => toggle(i)}>
            <span className="box">{checklist[i] && <Icon name="check" size={18} />}</span><span className="lbl">{t}</span></button>))}
      </section>

      {d.upgrades.length > 0 && <section className="stack" aria-labelledby="up-h"><h2 id="up-h" className="h2">Optional upgrades</h2><p className="small muted">You don’t need these. The plan above works with what you own.</p>
        {d.upgrades.map((u, i) => <div className="card" key={i}><div className="row between"><b>{u.item}</b><Badge tone="up">Upgrade</Badge></div><p className="small muted">{u.why}</p></div>)}</section>}

      {d.notes.length > 0 && <section className="card"><b>Good to know</b><ul className="small muted" style={{ margin: 0, paddingLeft: 18 }}>{d.notes.map((n, i) => <li key={i}>{n}</li>)}</ul></section>}
    </div>
  );
}
