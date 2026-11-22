export const dynamic = 'force-dynamic';
export async function GET() {
  return Response.json({
    ai: !!(process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY) || process.env.MOCK_AI === '1',
    mock: process.env.MOCK_AI === '1',
    storage: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
  });
}
