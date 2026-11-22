import { getContext } from '@/lib/context';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  const u = new URL(req.url);
  const ctx = await getContext(u.searchParams.get('lat'), u.searchParams.get('lon'));
  return Response.json({ context: ctx });
}
