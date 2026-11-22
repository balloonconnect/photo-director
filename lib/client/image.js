import { readExif } from './exif';

export const MAX_EDGE = 1280;

function canvasBlob(canvas, quality) {
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('Could not encode the image.'))), 'image/jpeg', quality));
}

export async function renderBitmap(bmp, { sx = 0, sy = 0, sw = bmp.width, sh = bmp.height, maxEdge = MAX_EDGE, quality = 0.8 } = {}) {
  const scale = Math.min(1, maxEdge / Math.max(sw, sh));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(sw * scale)); c.height = Math.max(1, Math.round(sh * scale));
  c.getContext('2d').drawImage(bmp, sx, sy, sw, sh, 0, 0, c.width, c.height);
  return { blob: await canvasBlob(c, quality), w: c.width, h: c.height };
}

// Re-encodes the photo (strips EXIF/GPS from what gets uploaded) after reading its metadata locally.
export async function ingestFile(file) {
  if (!(file.type || '').startsWith('image/') && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name || '')) throw new Error('That file is not an image.');
  if (file.size > 40 * 1024 * 1024) throw new Error('That image is larger than 40 MB.');
  const exif = await readExif(file).catch(() => null);
  let bmp;
  try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch {
    throw new Error("This image can't be opened here. Use a JPEG, PNG or WebP photo.");
  }
  const { blob, w, h } = await renderBitmap(bmp);
  bmp.close?.();
  return { id: Math.random().toString(36).slice(2, 10), blob, w, h, exif, url: URL.createObjectURL(blob) };
}

export async function thumbDataUrl(blob, maxEdge = 720, quality = 0.7) {
  const bmp = await createImageBitmap(blob);
  const { blob: b } = await renderBitmap(bmp, { maxEdge, quality });
  bmp.close?.();
  return blobToDataUrl(b);
}

export function blobToDataUrl(blob) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); });
}

// Lowers quality until the combined upload stays under what the host accepts.
export async function buildUploadSet(blobs, budget = 3_600_000) {
  const q = [0.8, 0.7, 0.6, 0.5];
  for (const quality of q) {
    const urls = [];
    for (const b of blobs) {
      const bmp = await createImageBitmap(b);
      const { blob } = await renderBitmap(bmp, { maxEdge: quality >= 0.7 ? 1280 : 1024, quality });
      bmp.close?.();
      urls.push(await blobToDataUrl(blob));
    }
    if (urls.reduce((n, u) => n + u.length, 0) <= budget) return urls;
  }
  throw new Error('The photos are too large to upload. Remove one location photo and try again.');
}
