import { CATEGORIES } from './ai.js';

const txt = (v, n) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);

export function sanitizeGear(g) {
  const kits = Array.isArray(g?.kits) ? g.kits.slice(0, 20) : [];
  const out = kits.map((k, i) => ({
    id: txt(k.id, 24) || `kit${i}`,
    name: txt(k.name, 40) || `Kit ${i + 1}`,
    items: (Array.isArray(k.items) ? k.items : []).slice(0, 150)
      .filter((it) => CATEGORIES.includes(it?.cat) && txt(it.name, 80))
      .map((it, j) => ({ id: txt(it.id, 24) || `i${i}_${j}`, cat: it.cat, name: txt(it.name, 80) })),
  }));
  if (!out.length) return null;
  const active = out.some((k) => k.id === g.activeKitId) ? g.activeKitId : out[0].id;
  return { activeKitId: active, kits: out };
}

const isJpeg = (u) => typeof u === 'string' && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(u) && u.length < 400_000;

export function sanitizeNewPlan(p) {
  if (!p || typeof p !== 'object' || !p.data || typeof p.data !== 'object') return null;
  return {
    title: txt(p.title || p.data.title, 80) || 'Shooting plan',
    inputs: {
      subjectType: txt(p.inputs?.subjectType, 20),
      subjectCount: Number(p.inputs?.subjectCount) || 0,
      kitName: txt(p.inputs?.kitName, 40),
      camera: txt(p.inputs?.camera, 80),
      lenses: (Array.isArray(p.inputs?.lenses) ? p.inputs.lenses : []).slice(0, 20).map((x) => txt(x, 80)),
      context: p.inputs?.context && typeof p.inputs.context === 'object' ? p.inputs.context : null,
    },
    thumbs: {
      ref: isJpeg(p.thumbs?.ref) ? p.thumbs.ref : null,
      scenes: (Array.isArray(p.thumbs?.scenes) ? p.thumbs.scenes : []).filter(isJpeg).slice(0, 5),
    },
    data: p.data,
    meta: { mock: !!p.meta?.mock, model: txt(p.meta?.model, 60) },
    checklist: {},
  };
}

// Only these fields can be edited after creation.
export function applyPatch(plan, patch) {
  if (patch.checklist && typeof patch.checklist === 'object') {
    const c = {};
    for (const [k, v] of Object.entries(patch.checklist)) if (/^\d{1,2}$/.test(k) && v) c[k] = true;
    plan.checklist = c;
  }
  if (Array.isArray(patch.lights) && plan.data?.lighting?.lights) {
    patch.lights.forEach((l, i) => {
      const t = plan.data.lighting.lights[i];
      if (!t || !l) return;
      const dist = Number(l.distance_m); const ang = Number(l.angle_deg);
      if (Number.isFinite(dist)) t.distance_m = Math.min(15, Math.max(0.3, dist));
      if (Number.isFinite(ang)) t.angle_deg = Math.min(180, Math.max(-180, ang));
      if (l.edited) {
        t.edited = true;
        if (Number.isFinite(Number(l.ai_distance_m))) t.ai_distance_m = Number(l.ai_distance_m);
        if (Number.isFinite(Number(l.ai_angle_deg))) t.ai_angle_deg = Number(l.ai_angle_deg);
      } else { delete t.edited; delete t.ai_distance_m; delete t.ai_angle_deg; }
    });
  }
  if (typeof patch.title === 'string' && txt(patch.title, 80)) plan.title = txt(patch.title, 80);
  return plan;
}
