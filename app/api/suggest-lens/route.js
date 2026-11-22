import Anthropic from '@anthropic-ai/sdk';
import { getDevice, json } from '@/lib/device';
import { provider, geminiJson } from '@/lib/llm';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const hits = new Map(); // best-effort per-instance throttle
function throttled(id) {
  const now = Date.now(); const arr = (hits.get(id) || []).filter((t) => now - t < 3600_000);
  if (arr.length >= 20) return true;
  arr.push(now); hits.set(id, arr); return false;
}

function magicOk(dataUrl) {
  const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl || '');
  return !!m && m[2].length <= 1_200_000;
}

const TARGET = { couple: 85, wedding: 50, portrait: 85, maternity: 70, baby: 50, family: 35, fashion: 85, product: 100, other: 50, auto: 50 };

// Used when no API key is configured or MOCK_AI=1. Clearly marked as basic in the response.
function heuristic(body, cands) {
  const target = Number(body.refFocal) > 8 ? Number(body.refFocal) : TARGET[String(body.subjectType || 'auto').toLowerCase()] || 50;
  const scored = cands.map((c) => {
    const mid = c.zoom ? Math.sqrt(c.wide * c.tele) : c.wide;
    const fit = c.wide <= target && target <= c.tele ? 0 : Math.abs(Math.log(mid / target));
    return { c, score: fit + (c.zoom ? 0.35 : 0) + Math.log(c.ap) * 0.25 };
  }).sort((a, b) => a.score - b.score).slice(0, 3);
  return {
    look: `Basic suggestion based on a ~${Math.round(target)}mm look. Add your API key for a photo-based match.`,
    basic: true,
    recommendations: scored.map(({ c }, i) => ({ name: c.name, rank: i + 1, why: `${c.zoom ? `${c.wide}–${c.tele}mm` : `${c.wide}mm`} f/${c.ap} is closest to the ~${Math.round(target)}mm look${c.ap <= 1.8 ? ' with a soft, shallow background' : ''}.`, focal_mm: String(Math.round(Math.min(Math.max(target, c.wide), c.tele))), aperture: `f/${c.ap}` })),
  };
}

export async function POST(req) {
  const device = await getDevice();
  let body; try { body = await req.json(); } catch { return json({ error: 'Invalid request.' }, device, 400); }
  const cands = (Array.isArray(body.candidates) ? body.candidates : []).slice(0, 60)
    .filter((c) => c && typeof c.name === 'string').map((c) => ({ name: c.name.slice(0, 80), wide: Number(c.wide) || 0, tele: Number(c.tele) || 0, ap: Number(c.ap) || 2.8, zoom: !!c.zoom }));
  if (!cands.length) return json({ error: 'No lenses to choose from.' }, device, 400);
  if (!magicOk(body.reference)) return json({ error: 'Add a reference photo first.' }, device, 400);
  if (throttled(device.id)) return json({ error: 'Too many suggestions. Try again in a little while.' }, device, 429);
  const PROV = provider();
  if (process.env.MOCK_AI === '1' || !PROV) return json(heuristic(body, cands), device);

  const names = cands.map((c) => c.name);
  const tool = {
    name: 'recommend_lenses',
    description: 'Recommend lenses that best recreate the look of the reference photograph.',
    input_schema: {
      type: 'object', additionalProperties: false, required: ['look', 'recommendations'],
      properties: {
        look: { type: 'string', description: 'The lens look of the reference in plain words: apparent focal length, perspective compression, background blur, max 2 sentences.' },
        recommendations: {
          type: 'array', minItems: 1, maxItems: 3,
          items: {
            type: 'object', additionalProperties: false, required: ['name', 'why', 'focal_mm', 'aperture'],
            properties: {
              name: { type: 'string', enum: names, description: 'Exactly one of the allowed lens names.' },
              why: { type: 'string', description: 'One plain sentence on why this lens gives the same look.' },
              focal_mm: { type: 'string', description: 'Focal length to shoot at, e.g. "85".' },
              aperture: { type: 'string', description: 'Aperture to shoot at, e.g. "f/1.8".' },
            },
          },
          description: 'Best first. Prefer lenses in the owned list when they would work almost as well.',
        },
      },
    },
  };
  const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/s.exec(body.reference);
  const owned = (Array.isArray(body.owned) ? body.owned : []).map((x) => String(x).slice(0, 80)).slice(0, 20);
  const crop = Number(body.crop) || 1;
  try {
    const system = 'You are a photography lens expert. Judge the REFERENCE photo\'s lens look (apparent focal length from perspective and compression, depth of field) and recommend lenses from the allowed list that would recreate it on the photographer\'s camera. Be honest if the look can\'t be judged. Respond only via the tool.';
    const userText = `Camera: ${String(body.camera || 'unknown').slice(0, 80)} (crop factor ${crop}, focal lengths below are as marked on the lens).\nSubject: ${String(body.subjectType || 'auto').slice(0, 20)}.\nReference EXIF focal length (35mm equivalent): ${Number(body.refFocal) > 0 ? Math.round(Number(body.refFocal)) + 'mm' : 'unknown'}.\nLenses the photographer already owns: ${owned.join('; ') || 'none listed'}.\nAllowed lenses:\n${cands.map((c) => `- ${c.name} (${c.zoom ? `${c.wide}-${c.tele}mm` : `${c.wide}mm`} f/${c.ap})`).join('\n')}`;
    if (PROV === 'gemini') {
      const out = await geminiJson({ system, schema: tool.input_schema, maxTokens: 1500, content: [{ type: 'image', source: { media_type: m[1], data: m[2] } }, { type: 'text', text: userText }] });
      const rec = (out.recommendations || []).filter((r) => names.includes(r.name)).slice(0, 3).map((r, i) => ({ ...r, rank: i + 1 }));
      if (!rec.length) throw new Error('empty');
      return json({ look: String(out.look || '').slice(0, 300), recommendations: rec }, device);
    }
    const client = new Anthropic();
    const res = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5', max_tokens: 900,
      system: 'You are a photography lens expert. Judge the REFERENCE photo\'s lens look (apparent focal length from perspective and compression, depth of field) and recommend lenses from the allowed list that would recreate it on the photographer\'s camera. Be honest if the look can\'t be judged. Respond only via the tool.',
      tools: [tool], tool_choice: { type: 'tool', name: 'recommend_lenses' },
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } },
        { type: 'text', text: `Camera: ${String(body.camera || 'unknown').slice(0, 80)} (crop factor ${crop}, focal lengths below are as marked on the lens).\nSubject: ${String(body.subjectType || 'auto').slice(0, 20)}.\nReference EXIF focal length (35mm equivalent): ${Number(body.refFocal) > 0 ? Math.round(Number(body.refFocal)) + 'mm' : 'unknown'}.\nLenses the photographer already owns: ${owned.join('; ') || 'none listed'}.\nAllowed lenses:\n${cands.map((c) => `- ${c.name} (${c.zoom ? `${c.wide}-${c.tele}mm` : `${c.wide}mm`} f/${c.ap})`).join('\n')}` },
      ] }],
    });
    const use = res.content.find((b) => b.type === 'tool_use');
    const out = use?.input;
    if (!out || !Array.isArray(out.recommendations)) throw new Error('bad output');
    const rec = out.recommendations.filter((r) => names.includes(r.name)).slice(0, 3).map((r, i) => ({ ...r, rank: i + 1 }));
    if (!rec.length) throw new Error('empty');
    return json({ look: String(out.look || '').slice(0, 300), recommendations: rec }, device);
  } catch (e) {
    return json({ ...heuristic(body, cands), look: 'Couldn’t analyse the photo just now, so this is a basic suggestion.' }, device);
  }
}
