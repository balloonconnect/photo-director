// Provider selection and a small Gemini client (REST, no SDK). Keys stay on the server.

export function provider() {
  const p = (process.env.AI_PROVIDER || '').toLowerCase();
  if (p === 'gemini' && process.env.GEMINI_API_KEY) return 'gemini';
  if (p === 'anthropic' && process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  return null;
}

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
export const geminiModels = () => (process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : ['gemini-3.5-flash', 'gemini-2.5-flash']);

// JSON Schema (as used for the Claude tool) -> Gemini responseSchema.
export function toGeminiSchema(s) {
  if (!s || typeof s !== 'object') return s;
  const out = { type: String(s.type || 'string').toUpperCase() };
  if (s.description) out.description = s.description;
  if (s.enum) out.enum = s.enum;
  if (s.minItems != null) out.minItems = String(s.minItems);
  if (s.maxItems != null) out.maxItems = String(s.maxItems);
  if (s.type === 'object' && s.properties) {
    out.properties = Object.fromEntries(Object.entries(s.properties).map(([k, v]) => [k, toGeminiSchema(v)]));
    out.required = s.required || Object.keys(s.properties);
    out.propertyOrdering = Object.keys(s.properties); // keeps output in schema order (drives progress stages)
  }
  if (s.type === 'array' && s.items) out.items = toGeminiSchema(s.items);
  return out;
}

// Claude-style content blocks -> Gemini parts.
export function toParts(content) {
  return content.filter(Boolean).map((b) => (b.type === 'image'
    ? { inlineData: { mimeType: b.source.media_type, data: b.source.data } }
    : { text: b.text }));
}

function apiError(status, bodyText) {
  let msg = 'The AI service returned an error.';
  try { msg = JSON.parse(bodyText)?.error?.message || msg; } catch {}
  let s = status;
  if (status === 400 && /api key/i.test(msg)) s = 401;
  if (status === 403 || status === 401) s = 401;
  return Object.assign(new Error(msg), { status: s, raw: status });
}

function request(model, body, stream, signal) {
  const url = `${BASE}/${model}:${stream ? 'streamGenerateContent?alt=sse' : 'generateContent'}`;
  return fetch(url, {
    method: 'POST', signal,
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify(body),
  });
}

const modelMissing = (r, text) => r.status === 404 || (r.status === 400 && /not found|not supported|unknown model/i.test(text));

function buildBody({ system, content, schema, maxTokens, temperature, loose }) {
  const gc = { responseMimeType: 'application/json', maxOutputTokens: maxTokens || 8192, temperature: temperature ?? 0.6 };
  // loose mode: if Gemini rejects the strict schema as too complex, describe it in the prompt instead.
  if (!loose) gc.responseSchema = toGeminiSchema(schema);
  const sys = loose ? `${system}\n\nReturn ONLY a JSON object, with keys in this exact order, matching this JSON Schema:\n${JSON.stringify(schema)}` : system;
  return { systemInstruction: { parts: [{ text: sys }] }, contents: [{ role: 'user', parts: toParts(content) }], generationConfig: gc };
}

const schemaRejected = (r, text) => r.status === 400 && /schema|constraint|too many|nesting|state/i.test(text) && !/api key/i.test(text);

// Tries each model; falls back to loose mode when the strict schema is rejected.
async function open(args, stream) {
  let r; let model;
  for (const m of geminiModels()) {
    model = m;
    for (const loose of [false, true]) {
      r = await request(m, buildBody({ ...args, loose }), stream, args.signal);
      if (r.ok) return { r, model };
      const text = await r.text();
      if (!loose && schemaRejected(r, text)) continue;
      if (modelMissing(r, text)) break;
      throw apiError(r.status, text);
    }
  }
  throw apiError(r?.status || 502, '');
}

// Streams text chunks. Returns { model, finish } via the generator's return value.
export async function* geminiStream({ system, content, schema, maxTokens, signal }) {
  const { r, model } = await open({ system, content, schema, maxTokens, signal }, true);
  const reader = r.body.getReader(); const dec = new TextDecoder();
  let buf = ''; let finish = null;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true }).replace(/\r\n/g, '\n');
    let i;
    while ((i = buf.indexOf('\n\n')) >= 0) {
      const evt = buf.slice(0, i); buf = buf.slice(i + 2);
      const line = evt.split('\n').find((l) => l.startsWith('data:'));
      if (!line) continue;
      let j; try { j = JSON.parse(line.slice(5)); } catch { continue; }
      const cand = j.candidates?.[0];
      if (j.promptFeedback?.blockReason) throw Object.assign(new Error('The AI could not process these photos.'), { status: 400 });
      for (const p of cand?.content?.parts || []) if (typeof p.text === 'string' && !p.thought) yield p.text;
      if (cand?.finishReason) finish = cand.finishReason;
    }
  }
  return { model, finish };
}

export async function geminiJson({ system, content, schema, maxTokens, signal }) {
  const { r } = await open({ system, content, schema, maxTokens, signal, temperature: 0.4 }, false);
  const j = await r.json();
  const text = (j.candidates?.[0]?.content?.parts || []).filter((p) => !p.thought).map((p) => p.text || '').join('');
  return JSON.parse(text);
}
