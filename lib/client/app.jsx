'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, analyzeStream } from './api';
import { ingestFile, thumbDataUrl, buildUploadSet } from './image';
import { idbGet, idbSet, idbDel } from './idb';
import { cameraName } from './exif';
import { defaultGear, uid } from './constants';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export const emptyDraft = () => ({
  ref: null, scenes: [], subjectType: 'Auto', count: 0, kitId: null,
  camera: null, lenses: null, extraLenses: [],
  useLocation: false, coords: null,
  custom: { environment: 'auto', flash: 'auto', maxLights: 'auto', priority: 'auto', notes: '' },
});

const slimExif = (e) => (e ? { make: e.make, model: e.model, lens: e.lens, iso: e.iso, fNumber: e.fNumber, exposure: e.exposure, focalLength: e.focalLength } : null);

export function kitOf(gear, draft) {
  if (!gear) return null;
  return gear.kits.find((k) => k.id === (draft.kitId || gear.activeKitId)) || gear.kits[0];
}
export function detectedCamera(draft) {
  for (const s of draft.scenes) { const n = cameraName(s.exif); if (n) return n; }
  return '';
}
export function resolvedSelection(draft, kit) {
  const kitCams = (kit?.items || []).filter((i) => i.cat === 'camera').map((i) => i.name);
  const det = detectedCamera(draft);
  const camera = draft.camera ?? (det || kitCams[0] || '');
  const kitLenses = (kit?.items || []).filter((i) => i.cat === 'lens').map((i) => i.name);
  const lenses = draft.lenses ?? kitLenses;
  return { camera, lenses: [...new Set([...lenses, ...draft.extraLenses])], kitLenses, kitCams, detected: det };
}

export function AppProvider({ children }) {
  const [health, setHealth] = useState(null);
  const [gear, setGearState] = useState(null);
  const [plans, setPlans] = useState(null);
  const [plansError, setPlansError] = useState('');
  const [draft, setDraft] = useState(emptyDraft);
  const [hydrated, setHydrated] = useState(false);
  const [run, setRun] = useState(null);
  const [current, setCurrent] = useState(null);
  const [toast, setToast] = useState(null);
  const [route, setRoute] = useState('');

  const draftRef = useRef(draft); draftRef.current = draft;
  const gearRef = useRef(gear); gearRef.current = gear;
  const currentRef = useRef(current); currentRef.current = current;
  const abortRef = useRef(null);
  const gearTimer = useRef(null);
  const patchTimer = useRef(null);
  const patchAcc = useRef({});

  // ---- routing (hash based, so the whole app is one static shell)
  useEffect(() => {
    const read = () => setRoute(decodeURIComponent(location.hash.replace(/^#\/?/, '')));
    read(); window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);
  const navigate = useCallback((p) => { location.hash = '#/' + p; window.scrollTo?.(0, 0); }, []);

  const notify = useCallback((message, opts = {}) => {
    const id = uid(); setToast({ id, message, ...opts });
    setTimeout(() => setToast((t) => (t && t.id === id ? null : t)), opts.duration || 4500);
  }, []);

  // ---- gear
  const persistGear = useCallback((g) => {
    try { localStorage.setItem('pd_gear', JSON.stringify(g)); } catch {}
    clearTimeout(gearTimer.current);
    gearTimer.current = setTimeout(() => { api.putGear(g).catch(() => notify("Couldn't sync your gear. It's saved on this device.")); }, 600);
  }, [notify]);
  const setGear = useCallback((updater) => {
    setGearState((prev) => { const next = typeof updater === 'function' ? updater(prev) : updater; persistGear(next); return next; });
  }, [persistGear]);

  const refreshPlans = useCallback(async () => {
    try { const r = await api.listPlans(); setPlans(r.plans || []); setPlansError(''); } catch (e) { setPlansError(e.message); setPlans((p) => p || []); }
  }, []);

  // ---- boot
  useEffect(() => {
    (async () => {
      api.health().then(setHealth).catch(() => setHealth({ ai: false, storage: false }));
      let local = null; try { local = JSON.parse(localStorage.getItem('pd_gear') || 'null'); } catch {}
      let g = null;
      try { g = (await api.getGear()).gear; } catch {}
      if (!g && local?.kits?.length) { g = local; api.putGear(local).catch(() => {}); }
      setGearState(g || defaultGear());
      refreshPlans();
      // restore draft (images live in IndexedDB so they survive navigation and reloads)
      const saved = await idbGet('draft');
      if (saved) {
        const mk = (i) => (i ? { ...i, id: uid(), url: URL.createObjectURL(i.blob) } : null);
        setDraft({ ...emptyDraft(), ...saved.rest, ref: mk(saved.ref), scenes: (saved.scenes || []).map(mk) });
      }
      setHydrated(true);
    })();
  }, [refreshPlans]);

  // ---- draft autosave
  useEffect(() => {
    if (!hydrated) return undefined;
    const t = setTimeout(() => {
      const { ref, scenes, ...rest } = draft;
      const strip = (i) => (i ? { blob: i.blob, w: i.w, h: i.h, exif: i.exif } : null);
      if (!ref && !scenes.length) { idbDel('draft'); return; }
      idbSet('draft', { ref: strip(ref), scenes: scenes.map(strip), rest: { ...rest, coords: null } });
    }, 400);
    return () => clearTimeout(t);
  }, [draft, hydrated]);

  const patchDraft = useCallback((p) => setDraft((d) => ({ ...d, ...(typeof p === 'function' ? p(d) : p) })), []);

  const setRef = useCallback(async (file) => {
    try { const img = await ingestFile(file); patchDraft((d) => { if (d.ref) URL.revokeObjectURL(d.ref.url); return { ref: img }; }); }
    catch (e) { notify(e.message); }
  }, [patchDraft, notify]);
  const addScenes = useCallback(async (files) => {
    const list = [...files]; let added = 0;
    for (const f of list) {
      if (draftRef.current.scenes.length + added >= 5) { notify('You can add up to 5 location photos.'); break; }
      try { const img = await ingestFile(f); added++; patchDraft((d) => ({ scenes: [...d.scenes, img].slice(0, 5) })); } catch (e) { notify(e.message); }
    }
  }, [patchDraft, notify]);
  const removeRef = useCallback(() => patchDraft((d) => { if (d.ref) URL.revokeObjectURL(d.ref.url); return { ref: null }; }), [patchDraft]);
  const removeScene = useCallback((id) => patchDraft((d) => ({ scenes: d.scenes.filter((s) => s.id !== id) })), [patchDraft]);
  const replaceImage = useCallback((slot, id, blob, w, h) => {
    const url = URL.createObjectURL(blob);
    patchDraft((d) => (slot === 'ref' ? { ref: { ...d.ref, blob, w, h, url } } : { scenes: d.scenes.map((s) => (s.id === id ? { ...s, blob, w, h, url } : s)) }));
  }, [patchDraft]);
  const clearDraft = useCallback(() => { setDraft(emptyDraft()); idbDel('draft'); }, []);

  // ---- location (optional, only after the user turns it on)
  const [ctx, setCtx] = useState(null);
  const coordsOf = useCallback((d) => {
    if (!d.useLocation) return null;
    const g = d.scenes.find((s) => s.exif?.gps)?.exif.gps;
    return g || d.coords || null;
  }, []);
  const toggleLocation = useCallback(async (on) => {
    if (!on) { patchDraft({ useLocation: false, coords: null }); setCtx(null); return; }
    patchDraft({ useLocation: true });
    const photo = draftRef.current.scenes.find((s) => s.exif?.gps)?.exif.gps;
    let c = photo;
    if (!c) {
      if (!navigator.geolocation) { patchDraft({ useLocation: false }); notify("This browser can't share a location."); return; }
      c = await new Promise((res) => navigator.geolocation.getCurrentPosition((p) => res({ lat: p.coords.latitude, lon: p.coords.longitude }), () => res(null), { timeout: 8000, maximumAge: 300000 }));
      if (!c) { patchDraft({ useLocation: false }); notify('Location is blocked. You can enable it in your browser settings, or continue without it.'); return; }
      patchDraft({ coords: c });
    }
  }, [patchDraft, notify]);
  const coords = coordsOf(draft);
  const coordKey = coords ? `${coords.lat.toFixed(2)},${coords.lon.toFixed(2)}` : '';
  useEffect(() => {
    if (!coordKey) { setCtx(null); return undefined; }
    let off = false;
    api.context(coords.lat, coords.lon).then((r) => { if (!off) setCtx(r.context); }).catch(() => {});
    return () => { off = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordKey]);

  // ---- analysis
  const runAnalysis = useCallback(async () => {
    const d = draftRef.current; const g = gearRef.current;
    if (!d.ref || !d.scenes.length) return;
    const kit = kitOf(g, d);
    const sel = resolvedSelection(d, kit);
    const ac = new AbortController(); abortRef.current = ac;
    setRun({ status: 'running', stage: 0, startedAt: Date.now() });
    navigate('analyzing');
    try {
      const urls = await buildUploadSet([d.ref.blob, ...d.scenes.map((s) => s.blob)]);
      const c = coordsOf(d);
      const payload = {
        reference: urls[0],
        scenes: d.scenes.map((s, i) => ({ dataUrl: urls[i + 1], exif: slimExif(s.exif) })),
        subjectType: d.subjectType.toLowerCase(), subjectCount: d.count,
        kit: { name: kit.name, items: kit.items.map(({ cat, name }) => ({ cat, name })) },
        selection: { camera: sel.camera, lenses: sel.lenses },
        custom: d.custom, location: c,
      };
      const res = await analyzeStream(payload, { signal: ac.signal, onStage: (n) => setRun((r) => (r ? { ...r, stage: n } : r)) });
      const thumbs = { ref: await thumbDataUrl(d.ref.blob), scenes: await Promise.all(d.scenes.map((s) => thumbDataUrl(s.blob))) };
      const plan = {
        title: res.data.title,
        inputs: { subjectType: d.subjectType, subjectCount: d.count, kitName: kit.name, camera: sel.camera, lenses: sel.lenses, context: res.context || null },
        thumbs, data: res.data, meta: { mock: !!res.mock, model: res.model },
      };
      try {
        const { id } = await api.addPlan(plan);
        setCurrent({ ...plan, id, createdAt: new Date().toISOString(), checklist: {} });
        refreshPlans(); setRun({ status: 'done' }); navigate('plan/' + id);
      } catch (e) {
        setCurrent({ ...plan, id: null, unsaved: true, checklist: {} });
        setRun({ status: 'done' }); navigate('plan/unsaved');
        notify("The plan is ready but couldn't be saved. Use Save to try again.");
      }
    } catch (e) {
      if (ac.signal.aborted) { setRun(null); return; }
      setRun({ status: 'error', error: e.message || 'The analysis failed.' });
    }
  }, [navigate, coordsOf, refreshPlans, notify]);
  const cancelAnalysis = useCallback(() => { abortRef.current?.abort(); setRun(null); navigate('new'); }, [navigate]);

  // ---- plans
  const openPlan = useCallback(async (id) => {
    if (currentRef.current?.id === id) return currentRef.current;
    setCurrent(null);
    const { plan } = await api.getPlan(id);
    setCurrent(plan); return plan;
  }, []);
  const saveUnsaved = useCallback(async () => {
    const p = currentRef.current; if (!p || p.id) return;
    try { const { id } = await api.addPlan(p); setCurrent({ ...p, id, unsaved: false }); refreshPlans(); navigate('plan/' + id); notify('Plan saved.'); }
    catch (e) { notify(e.message || "Couldn't save the plan."); }
  }, [navigate, notify, refreshPlans]);
  const patchCurrent = useCallback((patch, localApply) => {
    setCurrent((p) => (p ? localApply(p) : p));
    const id = currentRef.current?.id; if (!id) return;
    patchAcc.current = { ...patchAcc.current, ...patch };
    clearTimeout(patchTimer.current);
    patchTimer.current = setTimeout(() => {
      const body = patchAcc.current; patchAcc.current = {};
      api.patchPlan(id, body).then(() => { if (body.checklist) refreshPlans(); }).catch(() => notify("Couldn't save your changes."));
    }, 500);
  }, [notify, refreshPlans]);
  const removePlan = useCallback(async (id) => {
    try { await api.deletePlan(id); setPlans((p) => (p || []).filter((x) => x.id !== id)); if (currentRef.current?.id === id) setCurrent(null); }
    catch (e) { notify(e.message || "Couldn't delete the plan."); }
  }, [notify]);

  const value = useMemo(() => ({
    health, gear, setGear, plans, plansError, refreshPlans, draft, patchDraft, hydrated,
    setRef, addScenes, removeRef, removeScene, replaceImage, clearDraft, toggleLocation, ctx, coords,
    run, runAnalysis, cancelAnalysis, current, openPlan, saveUnsaved, patchCurrent, removePlan,
    route, navigate, toast, notify, setToast,
  }), [health, gear, setGear, plans, plansError, refreshPlans, draft, patchDraft, hydrated, setRef, addScenes, removeRef, removeScene, replaceImage, clearDraft, toggleLocation, ctx, coords, run, runAnalysis, cancelAnalysis, current, openPlan, saveUnsaved, patchCurrent, removePlan, route, navigate, toast, notify]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
