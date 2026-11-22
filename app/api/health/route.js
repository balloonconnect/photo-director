import { provider } from '@/lib/llm';
export const dynamic = 'force-dynamic';
export async function GET() {
  return Response.json({
    ai: !!provider() || process.env.MOCK_AI === '1',
    mock: process.env.MOCK_AI === '1',
    storage: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
  });
}
