import Anthropic from '@anthropic-ai/sdk';
import { getDevice } from '@/lib/device';
import { hit } from '@/lib/db';
import { getContext } from '@/lib/context';
import { provider, geminiStream, anthropicKey } from '@/lib/llm';
import { PLAN_TOOL, SYSTEM_PROMPT, STAGE_KEYS, buildUserContent, normalizePlan, mockPlan } from '@/lib/ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const MODEL = () => process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
const PROVIDER = provider();
const enc = new TextEncoder();

function magicOk(dataUrl) {
  const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl || '');
  if (!m || m[2].length > 1_600_000) return false;
  const head = Buffer.from(m[2].slice(0, 24), 'base64');
  if (m[1] === 'jpeg') return head[0] === 0xff && head[1] === 0xd8;
  if (m[1] === 'png') return head.slice(1, 4).toString() === 'PNG';
  return head.slice(0, 4).toString() === 'RIFF';
}

function effectiveKit(kit, sel) {
  const items = [...(kit?.items || [])].slice(0, 150).map((i) => ({ cat: String(i.cat), name: String(i.name).slice(0, 80) }));
  let out = items;
  if (Array.isArray(sel.lenses)) {
    out = items.filter((i) => i.cat !== 'lens' || sel.lenses.includes(i.name));
    for (const l of sel.lenses) if (!out.some((i) => i.cat === 'lens' && i.name === l)) out.push({ cat: 'lens', name: l });
  }
  if (sel.camera && !out.some((i) => i.cat === 'camera' && i.name === sel.camera)) out.push({ cat: 'camera', name: sel.camera });
  return { name: String(kit?.name || 'Kit').slice(0, 40), items: out };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function POST(req) {
  const device = await getDevice();
  const headers = {
    'Content-Type': 'application/x-ndjson; charset=utf-8',
    'Cache-Control': 'no-store, no-transform',
    'X-Accel-Buffering': 'no',
  };
  if (device.isNew) {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    headers['Set-Cookie'] = `pd_device=${device.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=63072000${secure}`;
  }
  const err = (message, status, code) => new Response(JSON.stringify({ error: message, code }), { status, headers: { 'Content-Type': 'application/json' } });

  const mock = process.env.MOCK_AI === '1';
  if (!mock && !PROVIDER) return err('The AI service is not configured on the server (set GEMINI_API_KEY or ANTHROPIC_API_KEY).', 503, 'no_key');

  let body;
  try { body = await req.json(); } catch { return err('Invalid request.', 400, 'bad_request'); }
  const scenes = Array.isArray(body.scenes) ? body.scenes.slice(0, 5) : [];
  if (!magicOk(body.reference) || !scenes.length || !scenes.every((s) => magicOk(s?.dataUrl))) {
    return err('Please add a valid reference photo and at least one location photo (JPEG, PNG or WebP).', 400, 'bad_images');
  }
  const sel = {
    camera: typeof body.selection?.camera === 'string' ? body.selection.camera.slice(0, 80) : '',
    lenses: Array.isArray(body.selection?.lenses) ? body.selection.lenses.map((x) => String(x).slice(0, 80)).slice(0, 20) : undefined,
  };
  const input = {
    reference: body.reference,
    scenes: scenes.map((s) => ({ dataUrl: s.dataUrl, exif: s.exif && typeof s.exif === 'object' ? s.exif : null })),
    subjectType: String(body.subjectType || 'auto').slice(0, 20),
    subjectCount: Math.max(0, Math.min(50, Number(body.subjectCount) || 0)),
    kit: effectiveKit(body.kit, sel),
    selection: sel,
    custom: body.custom && typeof body.custom === 'object' ? body.custom : {},
  };

  if (!mock) {
    try {
      const ok = await hit(device.id, Number(process.env.ANALYSES_PER_DEVICE_PER_DAY) || 15, Number(process.env.ANALYSES_GLOBAL_PER_DAY) || 300);
      if (!ok) return err('Daily analysis limit reached. Please try again tomorrow.', 429, 'limit');
    } catch { /* storage down: do not block the analysis */ }
  }

  const abort = new AbortController();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (o) => { try { controller.enqueue(enc.encode(JSON.stringify(o) + '\n')); } catch {} };
      try {
        let ctx = null;
        const loc = body.location;
        if (loc && Number.isFinite(Number(loc.lat)) && Number.isFinite(Number(loc.lon))) ctx = await getContext(loc.lat, loc.lon);

        if (mock) {
          for (let i = 1; i <= 5; i++) { send({ type: 'stage', stage: i }); await sleep(900); }
          send({ type: 'result', data: normalizePlan(mockPlan(input), input.kit), context: ctx, model: 'mock', mock: true });
          return;
        }

        let buf = ''; let stage = 1; let stop = null; let modelUsed = MODEL();
        const onText = (t) => {
          buf += t;
          for (let i = STAGE_KEYS.length - 1; i >= stage; i--) {
            if (new RegExp(`"${STAGE_KEYS[i]}"\\s*:`).test(buf)) { stage = i + 1; send({ type: 'stage', stage }); break; }
          }
        };
        send({ type: 'stage', stage: 1 });

        if (PROVIDER === 'gemini') {
          const gen = geminiStream({ system: SYSTEM_PROMPT, content: buildUserContent(input, ctx), schema: PLAN_TOOL.input_schema, maxTokens: 12000, signal: abort.signal });
          for (;;) {
            const { value, done } = await gen.next();
            if (done) { modelUsed = value?.model || modelUsed; if (value?.finish === 'MAX_TOKENS') stop = 'max_tokens'; break; }
            onText(value);
          }
        } else {
          const client = new Anthropic({ apiKey: anthropicKey() });
          const events = await client.messages.create({
            model: MODEL(),
            max_tokens: 8000,
            system: SYSTEM_PROMPT,
            tools: [PLAN_TOOL],
            tool_choice: { type: 'tool', name: PLAN_TOOL.name },
            messages: [{ role: 'user', content: buildUserContent(input, ctx) }],
            stream: true,
          }, { signal: abort.signal });
          for await (const ev of events) {
            if (ev.type === 'content_block_delta' && ev.delta?.type === 'input_json_delta') onText(ev.delta.partial_json);
            else if (ev.type === 'message_delta' && ev.delta?.stop_reason) stop = ev.delta.stop_reason;
          }
        }
        if (stop === 'max_tokens') throw Object.assign(new Error('The plan was too long to finish. Try again.'), { status: 502 });
        let parsed;
        try { parsed = JSON.parse(buf); } catch { throw Object.assign(new Error('The AI returned an unreadable plan. Please try again.'), { status: 502 }); }
        send({ type: 'result', data: normalizePlan(parsed, input.kit), context: ctx, model: modelUsed });
      } catch (e) {
        if (abort.signal.aborted) return;
        const s = e?.status;
        const message = s === 401 || s === 403 ? 'The AI service rejected the server credentials.'
          : s === 429 ? 'The AI service is busy. Please retry in a moment.'
          : s === 529 || s === 503 ? 'The AI service is overloaded. Please retry in a moment.'
          : s === 400 ? 'One of the photos could not be processed. Try a different photo.'
          : (e?.status && e.message && s === 502 ? e.message : 'The analysis failed. Please try again.');
        send({ type: 'error', message });
      } finally {
        try { controller.close(); } catch {}
      }
    },
    cancel() { abort.abort(); },
  });
  return new Response(stream, { headers });
}
