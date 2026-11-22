import { getDevice, json, fail } from '@/lib/device';
import { listPlans, addPlan } from '@/lib/db';
import { sanitizeNewPlan } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

export async function GET() {
  const device = await getDevice();
  try { return json({ plans: await listPlans(device.id) }, device); } catch (e) { return fail(e, device); }
}

export async function POST(req) {
  const device = await getDevice();
  try {
    const plan = sanitizeNewPlan(await req.json());
    if (!plan) return json({ error: 'Invalid plan.' }, device, 400);
    const id = await addPlan(device.id, plan);
    return json({ id }, device, 201);
  } catch (e) { return fail(e, device); }
}
