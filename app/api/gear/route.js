import { getDevice, json, fail } from '@/lib/device';
import { getGear, setGear } from '@/lib/db';
import { sanitizeGear } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

export async function GET() {
  const device = await getDevice();
  try { return json({ gear: await getGear(device.id) }, device); } catch (e) { return fail(e, device); }
}

export async function PUT(req) {
  const device = await getDevice();
  try {
    const body = await req.json();
    const gear = sanitizeGear(body?.gear);
    if (!gear) return json({ error: 'Add at least one kit.' }, device, 400);
    await setGear(device.id, gear);
    return json({ gear }, device);
  } catch (e) { return fail(e, device); }
}
