import { getDevice, json, fail, isUuid } from '@/lib/device';
import { getPlan, updatePlan, deletePlan } from '@/lib/db';
import { applyPatch } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

export async function GET(_req, { params }) {
  const device = await getDevice();
  const { id } = await params;
  if (!isUuid(id)) return json({ error: 'Not found' }, device, 404);
  try {
    const plan = await getPlan(device.id, id);
    return plan ? json({ plan }, device) : json({ error: 'Plan not found' }, device, 404);
  } catch (e) { return fail(e, device); }
}

export async function PATCH(req, { params }) {
  const device = await getDevice();
  const { id } = await params;
  if (!isUuid(id)) return json({ error: 'Not found' }, device, 404);
  try {
    const patch = await req.json();
    const plan = await getPlan(device.id, id);
    if (!plan) return json({ error: 'Plan not found' }, device, 404);
    delete plan.id; delete plan.createdAt;
    applyPatch(plan, patch || {});
    await updatePlan(device.id, id, plan);
    return json({ ok: true }, device);
  } catch (e) { return fail(e, device); }
}

export async function DELETE(_req, { params }) {
  const device = await getDevice();
  const { id } = await params;
  if (!isUuid(id)) return json({ error: 'Not found' }, device, 404);
  try { await deletePlan(device.id, id); return json({ ok: true }, device); } catch (e) { return fail(e, device); }
}
