'use client';
import { useEffect, useRef, useState } from 'react';
import { Sheet } from './ui';
import { renderBitmap } from '@/lib/client/image';

const RATIOS = [['orig', 'Original'], ['1', '1:1'], ['0.8', '4:5'], ['1.5', '3:2'], ['1.778', '16:9'], ['0.5625', '9:16']];

export default function CropModal({ image, onClose, onApply }) {
  const [bmp, setBmp] = useState(null);
  const [ratio, setRatio] = useState('orig');
  const [zoom, setZoom] = useState(1);
  const off = useRef({ x: 0, y: 0 });
  const [, force] = useState(0);
  const drag = useRef(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { let on = true; createImageBitmap(image.blob).then((b) => on && setBmp(b)); return () => { on = false; }; }, [image]);
  if (!bmp) return <Sheet open onClose={onClose} title="Crop photo"><p className="muted" role="status">Loading…</p></Sheet>;

  const aspect = ratio === 'orig' ? bmp.width / bmp.height : Number(ratio);
  const maxW = Math.min(typeof window !== 'undefined' ? window.innerWidth - 40 : 320, 480);
  const maxH = typeof window !== 'undefined' ? Math.min(window.innerHeight * 0.5, 480) : 360;
  let W = maxW; let H = W / aspect; if (H > maxH) { H = maxH; W = H * aspect; }
  const s = Math.max(W / bmp.width, H / bmp.height) * zoom;
  const iw = bmp.width * s; const ih = bmp.height * s;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const left = clamp((W - iw) / 2 + off.current.x, W - iw, 0);
  const top = clamp((H - ih) / 2 + off.current.y, H - ih, 0);
  off.current = { x: left - (W - iw) / 2, y: top - (H - ih) / 2 };

  const down = (e) => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY }; };
  const move = (e) => { if (!drag.current) return; off.current = { x: off.current.x + e.clientX - drag.current.x, y: off.current.y + e.clientY - drag.current.y }; drag.current = { x: e.clientX, y: e.clientY }; force((n) => n + 1); };
  const up = () => { drag.current = null; };

  const apply = async () => {
    setBusy(true);
    try {
      const out = await renderBitmap(bmp, { sx: -left / s, sy: -top / s, sw: W / s, sh: H / s, quality: 0.85 });
      onApply(out.blob, out.w, out.h);
    } finally { setBusy(false); }
  };

  return (
    <Sheet open onClose={onClose} title="Crop photo" sub="Drag to reposition. Use the slider to zoom.">
      <div className="chips" role="group" aria-label="Aspect ratio">
        {RATIOS.map(([v, l]) => <button key={v} className={`chip ${ratio === v ? 'on' : ''}`} onClick={() => { setRatio(v); off.current = { x: 0, y: 0 }; setZoom(1); }}>{l}</button>)}
      </div>
      <div className="crop-stage" style={{ width: W, height: H }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.url} alt="Crop preview" style={{ width: iw, height: ih, left, top }} />
      </div>
      <label className="row small muted">Zoom
        <input type="range" min="1" max="4" step="0.01" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} style={{ flex: 1, minHeight: 44 }} aria-label="Zoom" />
      </label>
      <button className="btn btn-primary" onClick={apply} disabled={busy}>{busy ? 'Applying…' : 'Apply crop'}</button>
      <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
    </Sheet>
  );
}
