// Minimal JPEG EXIF reader: camera, lens, exposure and GPS. Returns null if nothing found.
export async function readExif(file) {
  const buf = await file.slice(0, 262144).arrayBuffer();
  const v = new DataView(buf);
  if (v.byteLength < 12 || v.getUint16(0) !== 0xffd8) return null;
  let off = 2;
  while (off < v.byteLength - 4) {
    const marker = v.getUint16(off); const len = v.getUint16(off + 2);
    if (marker === 0xffe1 && v.getUint32(off + 4) === 0x45786966) return parseTiff(v, off + 10);
    if ((marker & 0xff00) !== 0xff00) break;
    off += 2 + len;
  }
  return null;
}

function parseTiff(v, base) {
  const little = v.getUint16(base) === 0x4949;
  const u16 = (o) => v.getUint16(o, little);
  const u32 = (o) => v.getUint32(o, little);
  if (u16(base + 2) !== 42) return null;
  const size = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };
  const readVal = (type, count, o) => {
    const bytes = (size[type] || 1) * count;
    if (o < 0 || o + bytes > v.byteLength) return null;
    if (type === 2) { let s = ''; for (let i = 0; i < count; i++) { const c = v.getUint8(o + i); if (!c) break; s += String.fromCharCode(c); } return s.trim(); }
    const arr = [];
    for (let i = 0; i < count && i < 8; i++) {
      if (type === 3) arr.push(u16(o + 2 * i));
      else if (type === 4) arr.push(u32(o + 4 * i));
      else if (type === 5) { const d = u32(o + 8 * i + 4); arr.push(d ? u32(o + 8 * i) / d : 0); }
      else if (type === 1 || type === 7) arr.push(v.getUint8(o + i));
    }
    return count === 1 ? arr[0] : arr;
  };
  const readIfd = (start) => {
    const out = {};
    if (start < 0 || start + 2 > v.byteLength) return out;
    const n = u16(start);
    for (let i = 0; i < n; i++) {
      const e = start + 2 + i * 12;
      if (e + 12 > v.byteLength) break;
      const tag = u16(e); const type = u16(e + 2); const count = u32(e + 4);
      const bytes = (size[type] || 1) * count;
      out[tag] = readVal(type, count, bytes <= 4 ? e + 8 : base + u32(e + 8));
    }
    return out;
  };
  const ifd0 = readIfd(base + u32(base + 4));
  const exif = ifd0[0x8769] ? readIfd(base + ifd0[0x8769]) : {};
  const gps = ifd0[0x8825] ? readIfd(base + ifd0[0x8825]) : {};
  const dms = (a) => (Array.isArray(a) && a.length >= 3 ? a[0] + a[1] / 60 + a[2] / 3600 : null);
  let loc = null;
  const lat = dms(gps[2]); const lon = dms(gps[4]);
  if (lat != null && lon != null) loc = { lat: gps[1] === 'S' ? -lat : lat, lon: gps[3] === 'W' ? -lon : lon };
  const t = exif[0x829a];
  const out = {
    make: ifd0[0x010f] || '', model: ifd0[0x0110] || '', lens: exif[0xa434] || '',
    iso: Array.isArray(exif[0x8827]) ? exif[0x8827][0] : exif[0x8827] || null,
    fNumber: exif[0x829d] ? Math.round(exif[0x829d] * 10) / 10 : null,
    exposure: t ? (t < 1 ? `1/${Math.round(1 / t)}` : `${t}s`) : null,
    focalLength: exif[0x920a] || null,
    date: typeof exif[0x9003] === 'string' ? exif[0x9003].replace(/^(\d{4}):(\d\d):(\d\d)/, '$1-$2-$3').replace(' ', 'T') : null,
    gps: loc,
  };
  return out.make || out.model || out.lens || out.iso || out.fNumber || loc ? out : null;
}

export function cameraName(e) {
  if (!e) return '';
  const model = (e.model || '').trim(); const make = (e.make || '').trim();
  if (!model) return '';
  return model.toLowerCase().startsWith(make.split(' ')[0].toLowerCase()) ? model : `${make.split(' ')[0]} ${model}`.trim();
}
