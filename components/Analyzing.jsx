'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/lib/client/app';
import { Icon } from './ui';

const STAGES = [
  ['Analysing reference photograph', 'Reading the style, light and mood'],
  ['Analysing live location and lighting', 'Checking where the light falls'],
  ['Comparing composition and photography style', 'Light direction, background and camera angle'],
  ['Matching available camera and lighting equipment', 'Using the gear you selected'],
  ['Preparing shooting instructions', 'Writing steps you can follow on location'],
];

export default function Analyzing() {
  const { run, draft, cancelAnalysis, runAnalysis, navigate } = useApp();
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { if (!run) navigate('new'); }, [run, navigate]);
  if (!run) return null;
  const stage = run.stage || 0; // number of the stage currently running (1-based); 0 = preparing upload
  const failed = run.status === 'error';
  const secs = Math.max(0, Math.round((now - (run.startedAt || now)) / 1000));

  return (
    <div className="page" style={{ gap: 20 }}>
      <header className="stack-s"><h1 className="h1" style={{ fontSize: 26 }}>Building your shooting plan</h1>
        {!failed && <p className="muted body">This usually takes 20–40 seconds. Keep this tab open.</p>}</header>
      {draft.ref && draft.scenes[0] && (
        <div className="row" style={{ justifyContent: 'center', gap: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={draft.ref.url} alt="" style={{ width: 140, height: 104, objectFit: 'cover', borderRadius: 16 }} />
          <Icon name="chevs" size={20} style={{ color: 'var(--ac)' }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={draft.scenes[0].url} alt="" style={{ width: 140, height: 104, objectFit: 'cover', borderRadius: 16 }} />
        </div>
      )}
      <ol className="card" style={{ gap: 20, padding: 20, margin: 0, listStyle: 'none' }} aria-label="Progress">
        {STAGES.map(([t, sub], i) => {
          const n = i + 1;
          const st = failed ? (n < stage ? 'done' : 'pending') : n < stage ? 'done' : n === stage ? 'active' : 'pending';
          return (
            <li key={t} className={`stage ${st}`} aria-current={st === 'active' ? 'step' : undefined}>
              <span className="ring">{st === 'done' && <Icon name="check" size={16} />}</span>
              <span><span className="t">{t}</span>{st === 'active' && <span className="small muted" style={{ display: 'block' }}>{sub}</span>}</span>
            </li>
          );
        })}
      </ol>
      {failed ? (
        <>
          <div className="card err" role="alert">
            <div className="row"><Icon name="alert" style={{ color: 'var(--er)' }} /><b style={{ color: 'var(--er)' }}>The analysis was interrupted</b></div>
            <p className="body muted">{run.error} Your photos and settings are saved, so nothing needs to be uploaded again.</p>
          </div>
          <button className="btn btn-primary" onClick={runAnalysis}>Try again</button>
          <button className="btn btn-secondary" onClick={() => navigate('new')}>Edit photos & settings</button>
        </>
      ) : (
        <>
          <p className="small muted center" style={{ display: 'flex', gap: 8 }} role="status"><span className="dot" />Working for {secs} s{stage ? ` · step ${stage} of 5` : ' · uploading photos'}</p>
          <button className="btn btn-secondary" onClick={cancelAnalysis}>Cancel</button>
        </>
      )}
    </div>
  );
}
