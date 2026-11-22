'use client';
import { useState } from 'react';
import { useApp } from '@/lib/client/app';
import { CATS, uid } from '@/lib/client/constants';
import { Icon, Sheet, Confirm } from './ui';

function Category({ cat, items, onAdd, onRemove, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const [val, setVal] = useState('');
  const add = (name) => { const n = name.trim(); if (!n) return; if (items.some((i) => i.name.toLowerCase() === n.toLowerCase())) return; onAdd(n); setVal(''); };
  const sug = cat.sug.filter((s) => !items.some((i) => i.name.toLowerCase() === s.toLowerCase()));
  return (
    <section className="card" style={{ padding: 14, gap: 10 }}>
      <button className="row" style={{ minHeight: 32 }} aria-expanded={open} onClick={() => setOpen(!open)}>
        <b className="grow h3" style={{ textAlign: 'left' }}>{cat.label}</b>
        <span className="small muted" style={{ fontWeight: 600 }}>{items.length}</span>
        <Icon name={open ? 'chevd' : 'chev'} size={18} className="muted" />
      </button>
      {open && (
        <>
          {items.map((i) => (
            <div className="item" key={i.id}><span className="grow">{i.name}</span><button aria-label={`Remove ${i.name}`} onClick={() => onRemove(i.id)}><Icon name="x" size={16} /></button></div>
          ))}
          <form className="addrow" onSubmit={(e) => { e.preventDefault(); add(val); }}>
            <input className="input" value={val} onChange={(e) => setVal(e.target.value)} placeholder={`Add a ${cat.one}`} aria-label={`Add a ${cat.one}`} maxLength={80} />
            <button className="btn btn-secondary btn-sm" type="submit" disabled={!val.trim()}>Add</button>
          </form>
          {sug.length > 0 && (
            <div className="row wrap" style={{ gap: 6 }}>
              <span className="tiny muted">Quick add:</span>
              {sug.slice(0, 5).map((s) => <button key={s} className="pill" style={{ minHeight: 34, fontSize: 12 }} onClick={() => add(s)}><Icon name="plus" size={14} style={{ color: 'var(--ac)' }} />{s}</button>)}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default function Gear() {
  const { gear, setGear } = useApp();
  const kit = gear.kits.find((k) => k.id === gear.activeKitId) || gear.kits[0];
  const [sheet, setSheet] = useState(null); // 'new' | 'rename'
  const [name, setName] = useState('');
  const [del, setDel] = useState(false);

  const update = (fn) => setGear((g) => ({ ...g, kits: g.kits.map((k) => (k.id === kit.id ? fn(k) : k)) }));
  const submitName = () => {
    const n = name.trim().slice(0, 40); if (!n) return;
    if (sheet === 'new') { const id = uid(); setGear((g) => ({ activeKitId: id, kits: [...g.kits, { id, name: n, items: [] }] })); }
    else update((k) => ({ ...k, name: n }));
    setSheet(null);
  };
  const duplicate = () => { const id = uid(); setGear((g) => ({ activeKitId: id, kits: [...g.kits, { ...kit, id, name: `${kit.name} copy`.slice(0, 40), items: kit.items.map((i) => ({ ...i, id: uid() })) }] })); };
  const remove = () => setGear((g) => { const kits = g.kits.filter((k) => k.id !== kit.id); return { activeKitId: kits[0].id, kits }; });

  return (
    <div className="page">
      <header className="stack-s"><h1 className="h1">My gear</h1><p className="muted body">Set up once. The AI uses what you own first.</p></header>
      <div className="chips" role="tablist" aria-label="Kits">
        {gear.kits.map((k) => <button key={k.id} role="tab" aria-selected={k.id === kit.id} className={`chip ${k.id === kit.id ? 'on' : ''}`} onClick={() => setGear((g) => ({ ...g, activeKitId: k.id }))}>{k.name}</button>)}
        <button className="chip" style={{ color: 'var(--ac)', borderColor: 'var(--ac)' }} onClick={() => { setName(''); setSheet('new'); }}><Icon name="plus" size={16} style={{ verticalAlign: '-3px', marginRight: 4 }} />New kit</button>
      </div>
      <div className="row wrap" style={{ gap: 8 }}>
        <span className="pill ok"><Icon name="check" size={14} />Default kit</span>
        <button className="pill" onClick={() => { setName(kit.name); setSheet('rename'); }}><Icon name="edit" size={14} />Rename</button>
        <button className="pill" onClick={duplicate}><Icon name="copy" size={14} />Duplicate</button>
        {gear.kits.length > 1 && <button className="pill" onClick={() => setDel(true)} style={{ color: 'var(--er)' }}><Icon name="trash" size={14} />Delete</button>}
      </div>
      <div className="card" style={{ flexDirection: 'row', padding: 12, alignItems: 'center' }}><Icon name="cam" size={18} style={{ color: 'var(--ac)' }} /><p className="tiny muted">Anything outside this kit is labelled “Optional upgrade” in your plans.</p></div>
      <div className="resp-2">
        {CATS.map((c, i) => (
          <Category key={kit.id + c.id} cat={c} defaultOpen={i < 3} items={kit.items.filter((x) => x.cat === c.id)}
            onAdd={(n) => update((k) => ({ ...k, items: [...k.items, { id: uid(), cat: c.id, name: n }] }))}
            onRemove={(id) => update((k) => ({ ...k, items: k.items.filter((x) => x.id !== id) }))} />
        ))}
      </div>
      <Sheet open={!!sheet} onClose={() => setSheet(null)} title={sheet === 'new' ? 'New kit' : 'Rename kit'}>
        <form className="stack" onSubmit={(e) => { e.preventDefault(); submitName(); }}>
          <input className="input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Wedding kit" maxLength={40} aria-label="Kit name" />
          <button className="btn btn-primary" type="submit" disabled={!name.trim()}>Save</button>
        </form>
      </Sheet>
      <Confirm open={del} title={`Delete “${kit.name}”?`} body="Plans you already made keep their results." confirmLabel="Delete kit" danger onConfirm={remove} onClose={() => setDel(false)} />
    </div>
  );
}
