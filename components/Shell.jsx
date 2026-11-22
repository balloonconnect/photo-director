'use client';
import { useApp } from '@/lib/client/app';
import { Icon, Toast } from './ui';
import Home from './Home';
import NewAnalysis from './NewAnalysis';
import Analyzing from './Analyzing';
import PlanView from './PlanView';
import Plans from './Plans';
import Gear from './Gear';

export default function Shell() {
  const { route, run, toast, setToast, hydrated, gear } = useApp();
  const r = route || '';
  const newHref = run?.status === 'running' || run?.status === 'error' ? '#/analyzing' : '#/new';
  const tabs = [
    { id: 'home', href: '#/', label: 'Home', icon: 'home', on: r === '' },
    { id: 'new', href: newHref, label: 'New Analysis', icon: 'plus', on: r === 'new' || r === 'analyzing', primary: true },
    { id: 'plans', href: '#/plans', label: 'Shooting Plans', icon: 'plans', on: r === 'plans' || r.startsWith('plan/') },
    { id: 'gear', href: '#/gear', label: 'My Gear', icon: 'cam', on: r === 'gear' },
  ];
  let view;
  if (!hydrated || !gear) view = <div className="page"><p className="muted" role="status">Loading…</p></div>;
  else if (r === '') view = <Home />;
  else if (r === 'new') view = <NewAnalysis />;
  else if (r === 'analyzing') view = <Analyzing />;
  else if (r === 'plans') view = <Plans />;
  else if (r === 'gear') view = <Gear />;
  else if (r.startsWith('plan/')) view = <PlanView id={r.slice(5)} />;
  else view = <Home />;
  return (
    <div className="shell">
      <nav className="nav" aria-label="Main">
        <div className="brand">Photo Director</div>
        {tabs.map((t) => (
          <a key={t.id} href={t.href} className={t.on ? 'active' : ''} aria-current={t.on ? 'page' : undefined}>
            {t.primary ? <span className="new-dot"><Icon name="plus" size={22} /></span> : <Icon name={t.icon} size={24} />}
            <span>{t.label}</span>
          </a>
        ))}
      </nav>
      <main className="main">{view}</main>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
