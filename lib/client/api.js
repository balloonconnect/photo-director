async function j(url, opts = {}) {
  const r = await fetch(url, { credentials: 'same-origin', ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } });
  if (!r.ok) {
    let m = 'Request failed';
    try { m = (await r.json()).error || m; } catch {}
    throw Object.assign(new Error(m), { status: r.status });
  }
  return r.json();
}

export const api = {
  health: () => j('/api/health'),
  getGear: () => j('/api/gear'),
  putGear: (gear) => j('/api/gear', { method: 'PUT', body: JSON.stringify({ gear }) }),
  listPlans: () => j('/api/plans'),
  getPlan: (id) => j(`/api/plans/${id}`),
  addPlan: (plan) => j('/api/plans', { method: 'POST', body: JSON.stringify(plan) }),
  patchPlan: (id, patch) => j(`/api/plans/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deletePlan: (id) => j(`/api/plans/${id}`, { method: 'DELETE' }),
  suggestLens: (body) => j('/api/suggest-lens', { method: 'POST', body: JSON.stringify(body) }),
  context: (lat, lon) => j(`/api/context?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`),
};

// Reads the NDJSON stream from /api/analyze. Resolves with the result event or throws.
export async function analyzeStream(payload, { signal, onStage }) {
  const r = await fetch('/api/analyze', {
    method: 'POST', credentials: 'same-origin', signal,
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  if (!r.ok) {
    let m = r.status === 413 ? 'The photos are too large to upload. Remove one and try again.' : 'The analysis could not start.';
    try { m = (await r.json()).error || m; } catch {}
    throw Object.assign(new Error(m), { status: r.status });
  }
  const reader = r.body.getReader();
  const dec = new TextDecoder();
  let buf = ''; let result = null;
  for (;;) {
    const { value, done } = await reader.read();
    if (value) buf += dec.decode(value, { stream: true });
    let nl;
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
      if (!line) continue;
      let ev; try { ev = JSON.parse(line); } catch { continue; }
      if (ev.type === 'stage') onStage?.(ev.stage);
      else if (ev.type === 'error') throw new Error(ev.message);
      else if (ev.type === 'result') result = ev;
    }
    if (done) break;
  }
  if (!result) throw new Error('The connection dropped before the plan was ready.');
  return result;
}
