# Photo Director

Upload a reference photo and photos of your location. Get a step-by-step shooting plan for the gear you own:
camera settings, lighting setup with an editable top-view diagram, subject direction, and a checklist.

Next.js 15 (App Router) · Anthropic API (server-side) · Supabase storage · deploys on Vercel.

## Setup
1. Run `supabase/schema.sql` in your Supabase project (SQL editor).
2. Copy `.env.example` to `.env.local` and fill it in. Keys stay on the server.
3. `npm install && npm run dev`

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Required for real analyses |
| `ANTHROPIC_MODEL` | Defaults to `claude-sonnet-5-5` |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Storage for gear and plans (access only via the SQL functions) |
| `ANALYSES_PER_DEVICE_PER_DAY`, `ANALYSES_GLOBAL_PER_DAY` | Abuse limits (15 / 300) |
| `MOCK_AI=1` | Returns a clearly labelled sample plan without calling the API |

Each browser gets an anonymous device id (HttpOnly cookie). Gear and plans are tied to it; there are no accounts yet.
Photos are re-encoded in the browser (EXIF/GPS removed) and only small thumbnails are stored with a plan.
