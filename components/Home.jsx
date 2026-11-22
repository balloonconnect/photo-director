'use client';
import { useApp, kitOf } from '@/lib/client/app';
import { Icon } from './ui';

export default function Home() {
  const { draft, gear, plans, health, navigate, run } = useApp();
  const kit = kitOf(gear, draft);
  const hasDraft = draft.ref || draft.scenes.length;
  const recent = (plans || []).slice(0, 3);
  return (
    <div className="page" style={{ gap: 24 }}>
      <header className="stack-s">
        <h1 className="h1">Photo Director</h1>
        <p className="muted" style={{ fontSize: 15, lineHeight: 1.45 }}>Recreate any reference photo at your real location.</p>
      </header>

      {health && !health.ai && (
        <div className="card err" role="alert"><div className="row"><Icon name="alert" className="" style={{ color: 'var(--er)' }} /><b style={{ color: 'var(--er)' }}>AI is not connected</b></div><p className="small muted">The server has no AI key yet, so plans can’t be generated. Add <code>GEMINI_API_KEY</code> (free) or <code>ANTHROPIC_API_KEY</code> in the hosting environment variables.</p></div>
      )}

      <section className="card" style={{ borderRadius: 24 }}>
        <ol className="stack-s" style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.5 }} aria-label="How it works">
          <li><b>Upload</b> the photo whose look you want.</li>
          <li><b>Upload</b> a photo of your location.</li>
          <li><b>Tap Analyse.</b> Everything else is detected for you.</li>
        </ol>
        <button className="btn btn-primary" onClick={() => navigate(run?.status === 'running' ? 'analyzing' : 'new')}>{run?.status === 'running' ? 'View running analysis' : 'Start new analysis'}</button>
      </section>

      {hasDraft && run?.status !== 'running' && (
        <button className="listbtn" onClick={() => navigate('new')}>
          {draft.ref ? <img src={draft.ref.url} alt="" width={56} height={56} style={{ borderRadius: 12, objectFit: 'cover' }} /> : <Icon name="img" />}
          <span className="grow"><b style={{ display: 'block', fontSize: 15 }}>Resume draft</b><span className="small muted">{draft.ref ? '1 reference' : 'No reference yet'} · {draft.scenes.length} location photo{draft.scenes.length === 1 ? '' : 's'}</span></span>
          <Icon name="chev" size={20} className="muted" />
        </button>
      )}

      <section className="stack">
        <div className="row between"><h2 className="h2">Recent shooting plans</h2>{plans?.length > 0 && <a className="link" href="#/plans">See all</a>}</div>
        {plans === null && <p className="small muted">Loading…</p>}
        {plans && !recent.length && <p className="small muted">No plans yet. Your first analysis will show up here.</p>}
        {recent.map((p) => (
          <a key={p.id} href={`#/plan/${p.id}`} className="listbtn" style={{ textDecoration: 'none', color: 'inherit' }}>
            {p.thumbRef ? <img src={p.thumbRef} alt="" width={64} height={64} style={{ borderRadius: 12, objectFit: 'cover' }} /> : <Icon name="img" />}
            <span className="grow"><b style={{ display: 'block', fontSize: 15 }}>{p.title}</b><span className="small muted">{[p.subjectType, p.kitName].filter(Boolean).join(' · ')} · {p.done} of {p.steps} done</span></span>
            <Icon name="chev" size={20} className="muted" />
          </a>
        ))}
      </section>

      <a className="listbtn" href="#/gear" style={{ textDecoration: 'none', color: 'inherit' }}>
        <Icon name="cam" style={{ color: 'var(--ac)' }} />
        <span className="grow"><b style={{ display: 'block', fontSize: 15 }}>Active kit: {kit?.name}</b><span className="small muted">{kit?.items.length || 0} items · used automatically for every plan</span></span>
        <Icon name="chev" size={20} className="muted" />
      </a>
    </div>
  );
}
