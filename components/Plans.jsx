'use client';
import { useState } from 'react';
import { useApp } from '@/lib/client/app';
import { Icon, Empty, Progress, Confirm } from './ui';

export default function Plans() {
  const { plans, plansError, refreshPlans, removePlan, navigate } = useApp();
  const [del, setDel] = useState(null);
  return (
    <div className="page">
      <header className="stack-s"><h1 className="h1">Shooting plans</h1><p className="muted body">Every analysis is saved automatically.</p></header>
      {plansError && <div className="card err" role="alert"><p className="small">{plansError}</p><button className="btn btn-secondary btn-sm" onClick={refreshPlans}>Retry</button></div>}
      {plans === null && <p className="muted" role="status">Loading…</p>}
      {plans && !plans.length && !plansError && (
        <Empty icon="plans" title="No plans yet" body="Upload a reference photo and a photo of your location. Your plan will appear here.">
          <button className="btn btn-primary" onClick={() => navigate('new')}>Start new analysis</button>
        </Empty>
      )}
      <div className="resp-2">
        {(plans || []).map((p) => (
          <div key={p.id} className="card plan-card">
            <a href={`#/plan/${p.id}`} className="row" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="plan-thumbs">{p.thumbRef ? <img src={p.thumbRef} alt="" /> : <i />}{p.thumbScene ? <img src={p.thumbScene} alt="" /> : <i />}</div>
              <div className="grow stack-s" style={{ gap: 3 }}>
                <b style={{ fontSize: 15 }}>{p.title}</b>
                <span className="tiny muted">{[p.subjectType, p.kitName, new Date(p.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })].filter(Boolean).join(' · ')}</span>
                {p.mock && <span className="badge up" style={{ width: 'fit-content' }}>Sample</span>}
              </div>
              <Icon name="chev" size={20} className="muted" />
            </a>
            <Progress pct={p.steps ? p.done / p.steps : 0} />
            <div className="row between">
              <span className="tiny" style={{ color: p.steps && p.done === p.steps ? 'var(--ok)' : 'var(--mu)', fontWeight: 500 }}>{p.steps && p.done === p.steps ? 'Completed' : p.done ? `${p.done} of ${p.steps} steps done` : 'Not started'}</span>
              <button className="iconbtn" style={{ width: 40, height: 40 }} aria-label={`Delete ${p.title}`} onClick={() => setDel(p)}><Icon name="trash" size={18} /></button>
            </div>
          </div>
        ))}
      </div>
      <Confirm open={!!del} title="Delete this plan?" body="This removes the plan and its checklist. It can’t be undone." confirmLabel="Delete plan" danger onConfirm={() => removePlan(del.id)} onClose={() => setDel(null)} />
    </div>
  );
}
