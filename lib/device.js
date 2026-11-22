import { cookies } from 'next/headers';
import { randomUUID } from 'node:crypto';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const NAME = 'pd_device';

// Anonymous device identity: an unguessable UUID in an HttpOnly cookie. It acts as the access key
// to this browser's gear and plans. Add real auth later by swapping this for a user id.
export async function getDevice() {
  const jar = await cookies();
  const existing = jar.get(NAME)?.value;
  if (existing && UUID.test(existing)) return { id: existing, isNew: false };
  return { id: randomUUID(), isNew: true };
}

export function json(data, device, status = 200) {
  const res = Response.json(data, { status });
  if (device?.isNew) {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.headers.append('Set-Cookie', `${NAME}=${device.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=63072000${secure}`);
  }
  return res;
}

export function fail(e, device) {
  const status = e?.status && Number.isInteger(e.status) ? e.status : 500;
  const msg = status >= 500 && status !== 502 && status !== 503 ? 'Something went wrong. Please try again.' : e.message;
  return json({ error: msg }, device, status);
}

export const isUuid = (s) => typeof s === 'string' && UUID.test(s);
