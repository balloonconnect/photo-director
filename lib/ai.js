// AI schema, prompt building, normalisation and a clearly-labelled mock plan.

const str = (description) => ({ type: 'string', description });
const num = (description) => ({ type: 'number', description });
const int = (description) => ({ type: 'integer', description });
const bool = (description) => ({ type: 'boolean', description });
const en = (values, description) => ({ type: 'string', enum: values, description });
const arr = (items, description) => ({ type: 'array', items, description });
const obj = (properties, description) => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
  description,
});

export const CATEGORIES = [
  'camera', 'lens', 'flash', 'continuous', 'modifier', 'gel', 'reflector', 'diffuser', 'accessory',
];
export const CATEGORY_LABELS = {
  camera: 'Camera bodies', lens: 'Lenses', flash: 'Flash units', continuous: 'Continuous lights',
  modifier: 'Modifiers', gel: 'Gels', reflector: 'Reflectors', diffuser: 'Diffusers',
  accessory: 'Triggers & accessories',
};

// IMPORTANT: property order matters. The server maps these top-level keys to the five
// progress stages shown to the user while the model streams its structured answer.
export const STAGE_KEYS = [
  'reference_analysis', // stage 1: analysing reference photograph
  'scene_analysis',     // stage 2: analysing live location and lighting
  'comparison',         // stage 3: comparing composition and style
  'camera',             // stage 4: matching camera and lighting equipment
  'instructions',       // stage 5: preparing shooting instructions
];

export const PLAN_TOOL = {
  name: 'create_shooting_plan',
  description: 'Return the complete shooting plan for recreating the reference photograph at the live location.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: [
      'title', 'reference_analysis', 'scene_analysis', 'comparison', 'camera', 'lighting',
      'diagram', 'subject_direction', 'instructions', 'upgrades', 'notes',
    ],
    properties: {
      title: str('Short plan title, max 6 words, e.g. "Rooftop couple portrait at dusk".'),
      reference_analysis: obj({
        style: str('Photography style in plain words.'),
        mood: str('Mood / feeling of the image.'),
        light_direction: str('Where the main light comes from, in plain words.'),
        light_quality: en(['soft', 'medium', 'hard'], 'How soft or hard the light looks.'),
        ambient: str('Ambient light: time of day, brightness, colour of the light.'),
        background: str('Background and environment.'),
        subject_count: int('Number of people/subjects visible. 0 for pure product/still-life with no people.'),
        subject_positions: str('Where the subjects are in the frame and relative to each other.'),
        camera_angle: str('Camera height and angle, e.g. "eye level, slightly low, from the front".'),
        how_it_was_lit: str('Best read of how the reference was lit: natural only, or flash and from where.'),
        subject_type: str('Detected subject type, e.g. couple, portrait, family.'),
      }, 'What the reference photograph shows.'),
      scene_analysis: obj({
        location_summary: str('What the live location is.'),
        light_direction: str('Where the available light comes from at the live location.'),
        light_quality: en(['soft', 'medium', 'hard'], 'Quality of the available light.'),
        ambient: str('Ambient light level and colour at the live location.'),
        background: str('What will be behind the subjects.'),
        best_spot: str('Best place in the live scene to put the subjects and why.'),
        limitations: arr(str('One limitation or risk.'), 'Things that make recreation harder (may be empty).'),
        conditions_note: str('Use weather/sun information if it was supplied, otherwise an empty string.'),
      }, 'What the live location offers.'),
      comparison: obj({
        difficulty: en(['easy', 'moderate', 'challenging'], 'How hard it is to recreate here.'),
        summary: str('2-3 plain sentences: how close the live scene is and what needs to change.'),
        differences: arr(obj({
          aspect: en(['lighting', 'background', 'camera angle', 'composition', 'colour', 'subject placement'], 'Category.'),
          impact: en(['high', 'medium', 'low'], 'How much this changes the final look.'),
          reference: str('What the reference has.'),
          live: str('What the live scene has.'),
          change: str('What to do about it.'),
        }), 'Key differences, most important first (3-7).'),
      }, 'Reference vs live scene.'),
      camera: obj({
        body: str('Camera body to use.'),
        body_owned: bool('true only if this exact body is in the photographer\'s kit.'),
        lens: str('Recommended lens.'),
        lens_owned: bool('true only if this exact lens is in the kit.'),
        focal_length_mm: str('Focal length, e.g. "85mm".'),
        aperture: str('e.g. "f/2.8".'),
        shutter_speed: str('e.g. "1/200s".'),
        iso: str('e.g. "ISO 400".'),
        focus_mode: str('Focus mode and area, e.g. "AF-C, eye detection".'),
        white_balance: str('e.g. "5600K" or "Daylight".'),
        why: str('Plain-language reason for these settings, max 2 sentences.'),
        tips: arr(str('One short tip.'), 'Up to 3 tips.'),
      }, 'Camera settings.'),
      lighting: obj({
        approach: en(['natural_only', 'natural_plus_flash', 'flash_dominant', 'continuous'], 'Overall lighting approach.'),
        summary: str('Plain-language summary of the lighting plan, max 2 sentences.'),
        lights: arr(obj({
          role: en(['key', 'fill', 'rim', 'background', 'hair', 'ambient_helper'], 'Role of this light.'),
          unit: str('Flash or light to use.'),
          unit_owned: bool('true only if in kit.'),
          modifier: str('Modifier, or "None".'),
          modifier_owned: bool('true only if in kit (true if modifier is "None").'),
          gel: str('Gel, or "None".'),
          gel_owned: bool('true only if in kit (true if gel is "None").'),
          power: str('Starting power, e.g. "1/16" or "30%".'),
          power_adjust: str('How to adjust after the first test shot.'),
          distance_m: num('Distance from the subjects in metres.'),
          angle_deg: num('-180..180. 0 = from the camera position, +90 = camera-right side, -90 = camera-left side, +/-180 = behind the subjects.'),
          height_m: num('Light height above the ground in metres.'),
          aim: str('Where to point it.'),
          purpose: str('Why this light exists, in plain words.'),
        }), 'Lights to place. Empty array if natural light only.'),
        reflectors: arr(str('Reflector/diffuser use.'), 'Reflectors/diffusers to use from the kit (may be empty).'),
      }, 'Lighting setup.'),
      diagram: obj({
        camera_distance_m: num('Camera distance from subjects in metres.'),
        background_distance_m: num('Distance from subjects back to the background in metres.'),
        subjects: arr(obj({
          label: str('Short label, e.g. "A" or "Bride".'),
          x_m: num('Left/right offset from group centre in metres (+ = camera-right).'),
          y_m: num('Front/back offset in metres (+ = toward camera).'),
          facing_deg: num('Direction the subject faces. 0 = toward camera, +90 = toward camera-right.'),
        }), 'Subject positions for the top-view diagram.'),
      }, 'Top-view layout.'),
      subject_direction: obj({
        camera_height: str('Camera height.'),
        camera_angle: str('Camera angle.'),
        background_positioning: str('How to position subjects relative to the background.'),
        subjects: arr(obj({
          label: str('Matches diagram label.'),
          pose: str('Pose.'),
          body_direction: str('Where the body points.'),
          face_direction: str('Where the face/eyes go.'),
          hands: str('Hand positions.'),
          expression: str('Expression or action prompt to say out loud.'),
        }), 'Direction for each subject.'),
        interaction: str('How subjects interact (couples/groups), or an empty string.'),
      }, 'Directing the subjects.'),
      instructions: arr(obj({
        title: str('Short imperative step title.'),
        detail: str('1-2 sentences, concrete and actionable.'),
        group: en(['setup', 'lighting', 'camera', 'posing', 'shoot'], 'Phase.'),
      }), 'Numbered steps to follow on location, in order (6-12).'),
      upgrades: arr(obj({
        item: str('Gear item NOT in the kit that would help.'),
        why: str('What it would improve.'),
        category: str('Gear category.'),
      }), 'Optional upgrades only. Empty if none are really needed.'),
      notes: arr(str('Honest caveat or uncertainty.'), 'Caveats, e.g. things that could not be judged from the photos.'),
    },
  },
};

export const SYSTEM_PROMPT = `You are an experienced professional photography director standing beside a photographer on a real shoot.
Goal: recreate the REFERENCE photograph at the LIVE location using the photographer's own camera, lenses, flashes, modifiers and gels.

Rules:
- The photographer may be non-technical. Write in plain, direct language. If you must use a term (e.g. "rim light"), explain it in a few words.
- Prefer gear from the provided kit. Mark *_owned true ONLY for items that clearly exist in the kit list. Everything else must be marked false and, if worthwhile, listed under "upgrades". Never present an upgrade as a requirement; always give an owned-gear alternative first.
- If the kit is empty, use a typical camera/lens/flash and mark all of it as not owned. If the photographer's camera is known from the live-scene EXIF metadata, you may assume that body.
- Describe only what you can actually see. If something can't be judged from the photos, say so in "notes". Do not identify real people.
- Give realistic starting points (flash power as fractions like 1/16, distances in metres) and how to adjust after the first test shot.
- Use metres. Angle convention for lights and subjects: 0 = from the camera's position, +90 = camera-right, -90 = camera-left, +/-180 = behind the subjects.
- Respect the photographer's options (flash policy, max lights, environment, notes). If "natural light only", use zero lights and reflectors/diffusers only.
- Use sun/weather information when supplied (it describes the live location now).
- If the live location is a poor match, say so honestly and suggest the best spot or time within it.
- Keep every text field concise. 6-12 instruction steps, most important first. Fill every field of the schema.
- Output only via the create_shooting_plan tool, writing keys in schema order.`;

function imageBlock(dataUrl) {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/s.exec(dataUrl || '');
  if (!m) return null;
  return { type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } };
}

export function describeExif(e) {
  if (!e) return '';
  const bits = [];
  const cam = [e.make, e.model].filter(Boolean).join(' ').trim();
  if (cam) bits.push(`camera: ${cam}`);
  if (e.lens) bits.push(`lens: ${e.lens}`);
  if (e.focalLength) bits.push(`focal length: ${Math.round(e.focalLength)}mm`);
  if (e.fNumber) bits.push(`aperture: f/${e.fNumber}`);
  if (e.exposure) bits.push(`shutter: ${e.exposure}`);
  if (e.iso) bits.push(`ISO ${e.iso}`);
  return bits.join(', ');
}

export function kitToText(kit) {
  if (!kit || !Array.isArray(kit.items) || kit.items.length === 0) {
    return 'The photographer has NOT added any equipment. (Kit is empty.)';
  }
  const lines = [`Kit name: ${kit.name}`];
  for (const cat of CATEGORIES) {
    const names = kit.items.filter((i) => i.cat === cat).map((i) => i.name);
    lines.push(`- ${CATEGORY_LABELS[cat]}: ${names.length ? names.join('; ') : '(none)'}`);
  }
  return lines.join('\n');
}

export function buildUserContent(input, ctx) {
  const content = [];
  content.push({ type: 'text', text: 'REFERENCE PHOTOGRAPH (the look to recreate):' });
  content.push(imageBlock(input.reference));
  input.scenes.forEach((s, i) => {
    const ex = describeExif(s.exif);
    content.push({
      type: 'text',
      text: `LIVE SCENE PHOTO ${i + 1} of ${input.scenes.length} (the real shooting location)${ex ? ` — EXIF: ${ex}` : ''}:`,
    });
    content.push(imageBlock(s.dataUrl));
  });

  const c = input.custom || {};
  const brief = [];
  brief.push(`Subject type: ${input.subjectType === 'auto' ? 'detect from the reference' : input.subjectType}`);
  brief.push(`Number of subjects: ${input.subjectCount > 0 ? input.subjectCount : 'detect from the reference'}`);
  brief.push('');
  brief.push('PHOTOGRAPHER\'S KIT:');
  brief.push(kitToText(input.kit));
  const sel = input.selection || {};
  if (sel.camera) brief.push(`Camera body being used for this shoot: ${sel.camera}`);
  if (Array.isArray(sel.lenses)) {
    brief.push(sel.lenses.length
      ? `Lenses the photographer has WITH THEM today (recommend ONLY these): ${sel.lenses.join('; ')}`
      : 'The photographer did not select any lenses; suggest a lens and mark it as not owned.');
  }
  brief.push('');
  const opts = [];
  if (c.environment && c.environment !== 'auto') opts.push(`environment: ${c.environment}`);
  if (c.flash && c.flash !== 'auto') opts.push(`flash policy: ${c.flash === 'natural' ? 'natural light only, no flash' : 'use flash'}`);
  if (c.maxLights && c.maxLights !== 'auto') opts.push(`max lights: ${c.maxLights}`);
  if (c.priority && c.priority !== 'auto') opts.push(`priority: ${c.priority === 'match' ? 'match the reference as closely as possible' : 'make the best of this location'}`);
  if (c.notes) opts.push(`extra notes from the photographer: ${String(c.notes).slice(0, 300)}`);
  brief.push(opts.length ? `OPTIONS: ${opts.join(' | ')}` : 'OPTIONS: none (use smart defaults).');
  if (ctx) {
    brief.push('');
    brief.push('LIVE CONDITIONS (from location):');
    brief.push(ctxToText(ctx));
  }
  brief.push('');
  brief.push('Create the shooting plan now.');
  content.push({ type: 'text', text: brief.join('\n') });
  return content;
}

export function ctxToText(ctx) {
  const parts = [];
  if (ctx.condition) parts.push(`weather: ${ctx.condition}`);
  if (ctx.cloudCover != null) parts.push(`cloud cover ${ctx.cloudCover}%`);
  if (ctx.temperatureC != null) parts.push(`${ctx.temperatureC}°C`);
  if (ctx.localTime) parts.push(`local time ${ctx.localTime.slice(11, 16)}`);
  if (ctx.sunrise) parts.push(`sunrise ${ctx.sunrise}`);
  if (ctx.sunset) parts.push(`sunset ${ctx.sunset}`);
  if (ctx.sunNote) parts.push(ctx.sunNote);
  return parts.join(', ');
}

// ---------- normalisation & ownership safety net ----------
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
function tokens(s) { return norm(s).split(' ').filter((t) => t.length > 1); }

export function inKit(name, kit) {
  if (!kit || !kit.items || !name) return false;
  const n = norm(name);
  if (!n || n === 'none') return true;
  const nt = tokens(name);
  return kit.items.some((it) => {
    const k = norm(it.name);
    if (!k) return false;
    if (k.includes(n) || n.includes(k)) return true;
    const kt = tokens(it.name);
    if (!kt.length || !nt.length) return false;
    const hit = kt.filter((t) => nt.includes(t)).length;
    return hit / Math.min(kt.length, nt.length) >= 0.75;
  });
}

const clamp = (v, lo, hi, d) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};
const s = (v, d = '') => (typeof v === 'string' ? v.slice(0, 600) : d);
const a = (v) => (Array.isArray(v) ? v : []);

export function normalizePlan(raw, kit) {
  const p = raw && typeof raw === 'object' ? raw : {};
  const ra = p.reference_analysis || {};
  const sa = p.scene_analysis || {};
  const cmp = p.comparison || {};
  const cam = p.camera || {};
  const lt = p.lighting || {};
  const dg = p.diagram || {};
  const sd = p.subject_direction || {};
  const lightsIn = a(lt.lights).slice(0, 6);
  const lights = lightsIn.map((l, i) => ({
    id: `L${i + 1}`,
    role: s(l.role, 'key'),
    unit: s(l.unit, 'Flash'),
    unit_owned: !!l.unit_owned && inKit(l.unit, kit),
    modifier: s(l.modifier, 'None'),
    modifier_owned: !!l.modifier_owned && inKit(l.modifier, kit),
    gel: s(l.gel, 'None'),
    gel_owned: !!l.gel_owned && inKit(l.gel, kit),
    power: s(l.power, '1/16'),
    power_adjust: s(l.power_adjust),
    distance_m: clamp(l.distance_m, 0.3, 15, 2),
    angle_deg: clamp(l.angle_deg, -180, 180, 45),
    height_m: clamp(l.height_m, 0, 8, 1.8),
    aim: s(l.aim),
    purpose: s(l.purpose),
  }));
  return {
    title: s(p.title, 'Shooting plan').slice(0, 80),
    reference_analysis: {
      style: s(ra.style), mood: s(ra.mood), light_direction: s(ra.light_direction),
      light_quality: s(ra.light_quality, 'medium'), ambient: s(ra.ambient), background: s(ra.background),
      subject_count: clamp(ra.subject_count, 0, 50, 0), subject_positions: s(ra.subject_positions),
      camera_angle: s(ra.camera_angle), how_it_was_lit: s(ra.how_it_was_lit), subject_type: s(ra.subject_type),
    },
    scene_analysis: {
      location_summary: s(sa.location_summary), light_direction: s(sa.light_direction),
      light_quality: s(sa.light_quality, 'medium'), ambient: s(sa.ambient), background: s(sa.background),
      best_spot: s(sa.best_spot), limitations: a(sa.limitations).map((x) => s(x)).filter(Boolean).slice(0, 8),
      conditions_note: s(sa.conditions_note),
    },
    comparison: {
      difficulty: s(cmp.difficulty, 'moderate'),
      summary: s(cmp.summary),
      differences: a(cmp.differences).slice(0, 10).map((d) => ({
        aspect: s(d.aspect, 'lighting'), impact: s(d.impact, 'medium'),
        reference: s(d.reference), live: s(d.live), change: s(d.change),
      })),
    },
    camera: {
      body: s(cam.body), body_owned: !!cam.body_owned && inKit(cam.body, kit),
      lens: s(cam.lens), lens_owned: !!cam.lens_owned && inKit(cam.lens, kit),
      focal_length_mm: s(cam.focal_length_mm), aperture: s(cam.aperture), shutter_speed: s(cam.shutter_speed),
      iso: s(cam.iso), focus_mode: s(cam.focus_mode), white_balance: s(cam.white_balance),
      why: s(cam.why), tips: a(cam.tips).map((x) => s(x)).filter(Boolean).slice(0, 4),
    },
    lighting: {
      approach: s(lt.approach, 'natural_only'),
      summary: s(lt.summary),
      lights,
      reflectors: a(lt.reflectors).map((x) => s(x)).filter(Boolean).slice(0, 6),
    },
    diagram: {
      camera_distance_m: clamp(dg.camera_distance_m, 0.5, 30, 4),
      background_distance_m: clamp(dg.background_distance_m, 0, 40, 3),
      subjects: a(dg.subjects).slice(0, 12).map((x, i) => ({
        label: s(x.label, String.fromCharCode(65 + i)).slice(0, 12),
        x_m: clamp(x.x_m, -5, 5, 0), y_m: clamp(x.y_m, -5, 5, 0), facing_deg: clamp(x.facing_deg, -180, 180, 0),
      })),
    },
    subject_direction: {
      camera_height: s(sd.camera_height), camera_angle: s(sd.camera_angle),
      background_positioning: s(sd.background_positioning),
      subjects: a(sd.subjects).slice(0, 12).map((x) => ({
        label: s(x.label), pose: s(x.pose), body_direction: s(x.body_direction),
        face_direction: s(x.face_direction), hands: s(x.hands), expression: s(x.expression),
      })),
      interaction: s(sd.interaction),
    },
    instructions: a(p.instructions).slice(0, 16).map((x) => ({
      title: s(x.title), detail: s(x.detail), group: s(x.group, 'shoot'),
    })),
    upgrades: a(p.upgrades).slice(0, 8).map((x) => ({ item: s(x.item), why: s(x.why), category: s(x.category) })),
    notes: a(p.notes).map((x) => s(x)).filter(Boolean).slice(0, 8),
  };
}

// ---------- mock (only when MOCK_AI=1; the UI labels it clearly) ----------
export function mockPlan(input) {
  const items = (input.kit && input.kit.items) || [];
  const first = (cat) => (items.find((i) => i.cat === cat) || {}).name;
  const body = first('camera'); const lens = first('lens'); const flash = first('flash'); const mod = first('modifier');
  return {
    title: 'Sample: golden hour couple portrait',
    reference_analysis: {
      style: 'Warm, candid couple portrait with soft backlight', mood: 'Romantic, relaxed',
      light_direction: 'From behind and slightly camera-left (backlight)', light_quality: 'soft',
      ambient: 'Low sun, warm orange glow', background: 'Open sky with blurred trees', subject_count: 2,
      subject_positions: 'Both centred, close together, upper body and hips visible',
      camera_angle: 'Eye level, slightly low, from the front',
      how_it_was_lit: 'Sun as a rim light with soft fill from the front', subject_type: 'couple',
    },
    scene_analysis: {
      location_summary: 'Open terrace with a plain wall on one side', light_direction: 'Side light from camera-right',
      light_quality: 'medium', ambient: 'Bright, slightly cool', background: 'Plain wall and some greenery',
      best_spot: 'Two metres from the wall with the brightest side behind them',
      limitations: ['Background is closer than in the reference', 'Light is harsher than the reference'],
      conditions_note: 'Sample data — no real analysis was run.',
    },
    comparison: {
      difficulty: 'moderate',
      summary: 'Sample output. The live scene has stronger side light and a closer background than the reference. Turn the couple so the light is behind them and add a soft fill from the front.',
      differences: [
        { aspect: 'lighting', impact: 'high', reference: 'Soft backlight', live: 'Hard side light', change: 'Rotate the couple 90° so the sun is behind them.' },
        { aspect: 'background', impact: 'medium', reference: 'Distant, blurred', live: 'Plain wall nearby', change: 'Use a wide aperture and move them away from the wall.' },
        { aspect: 'camera angle', impact: 'low', reference: 'Slightly low', live: 'Eye level', change: 'Crouch slightly.' },
      ],
    },
    camera: {
      body: body || 'Your camera body', body_owned: !!body, lens: lens || '85mm f/1.8', lens_owned: !!lens,
      focal_length_mm: '85mm', aperture: 'f/2', shutter_speed: '1/250s', iso: 'ISO 200',
      focus_mode: 'AF-C with eye detection', white_balance: '5600K',
      why: 'A wide aperture blurs the background; 1/250s keeps both people sharp.',
      tips: ['Shoot a test frame and check the highlights.', 'Slightly underexpose to protect the sky.'],
    },
    lighting: {
      approach: 'natural_plus_flash',
      summary: 'Sun behind as a rim light; one soft flash in front to lift the faces.',
      lights: [{
        role: 'key', unit: flash || 'Speedlight', unit_owned: !!flash, modifier: mod || 'Softbox 60cm', modifier_owned: !!mod,
        gel: 'None', gel_owned: true, power: '1/16', power_adjust: 'Up one stop if faces look dark; down if they look flat.',
        distance_m: 2.2, angle_deg: 35, height_m: 2, aim: 'At the couple\'s faces', purpose: 'Soft fill so faces are not in shadow',
      }],
      reflectors: [],
    },
    diagram: {
      camera_distance_m: 4, background_distance_m: 4,
      subjects: [{ label: 'A', x_m: -0.3, y_m: 0, facing_deg: 20 }, { label: 'B', x_m: 0.3, y_m: 0, facing_deg: -20 }],
    },
    subject_direction: {
      camera_height: 'Chest height, tilted slightly up', camera_angle: 'From the front, slightly low',
      background_positioning: 'Keep them 3-4 m from the wall.',
      subjects: [
        { label: 'A', pose: 'Standing, weight on back foot', body_direction: 'Turned 20° toward B', face_direction: 'Looking at B', hands: 'One hand on B\'s waist', expression: 'Whisper something funny' },
        { label: 'B', pose: 'Standing close, chin slightly down', body_direction: 'Turned 20° toward A', face_direction: 'Looking at the camera', hands: 'Hands resting on A\'s chest', expression: 'Soft smile' },
      ],
      interaction: 'Close and relaxed; keep movement slow.',
    },
    instructions: [
      { title: 'Place the couple', detail: 'Put them two metres from the wall with the brightest light behind them.', group: 'setup' },
      { title: 'Set up the flash', detail: 'Place the flash 2.2 m away at about 35° camera-right, 2 m high.', group: 'lighting' },
      { title: 'Set the camera', detail: 'f/2, 1/250s, ISO 200, 5600K.', group: 'camera' },
      { title: 'Take a test shot', detail: 'Check faces. Adjust flash power by one stop if needed.', group: 'shoot' },
      { title: 'Direct the pose', detail: 'Turn them toward each other 20°, hand on waist.', group: 'posing' },
    ],
    upgrades: [{ item: '5-in-1 reflector', why: 'Would let you skip the flash in softer light.', category: 'reflector' }],
    notes: ['This is SAMPLE output generated without AI (MOCK_AI is on).'],
  };
}
