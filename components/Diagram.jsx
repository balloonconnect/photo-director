'use client';
import { useRef, useState } from 'react';

const ROLE = { key: '#E0A458', fill: '#8FB4D9', rim: '#C99BE0', background: '#8FBF8A', hair: '#E07A6B', ambient_helper: '#A79D90' };
const FT = 3.28084;

// Top view. Subjects at the origin; camera at the bottom. Angle 0 = camera side, +90 = camera-right.
export default function Diagram({ data, lights, unit, onMove, editable }) {
  const svg = useRef(null);
  const [drag, setDrag] = useState(null);
  const W = 340, H = 340, cx = W / 2, cy = 168;
  const maxD = Math.max(3, data.camera_distance_m, ...lights.map((l) => l.distance_m)) * 1.1;
  const sc = Math.min(150 / maxD, 60);
  const pos = (l) => { const a = (l.angle_deg * Math.PI) / 180; return [cx + Math.sin(a) * l.distance_m * sc, cy + Math.cos(a) * l.distance_m * sc]; };
  const fmt = (m) => (unit === 'ft' ? `${(m * FT).toFixed(1)} ft` : `${m.toFixed(1)} m`);

  const toPolar = (e) => {
    const r = svg.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W - cx; const y = ((e.clientY - r.top) / r.height) * H - cy;
    const dist = Math.min(15, Math.max(0.3, Math.hypot(x, y) / sc));
    return { distance_m: Math.round(dist * 10) / 10, angle_deg: Math.round((Math.atan2(x, y) * 180) / Math.PI) };
  };
  const move = (e) => { if (drag == null) return; onMove(drag, toPolar(e)); };
  const camY = cy + data.camera_distance_m * sc;
  const bgY = cy - data.background_distance_m * sc;

  return (
    <svg ref={svg} className="diagram" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Top view of subjects, camera and lights"
      onPointerMove={move} onPointerUp={() => setDrag(null)} onPointerCancel={() => setDrag(null)}>
      <line x1="20" x2={W - 20} y1={Math.max(14, bgY)} y2={Math.max(14, bgY)} stroke="#33302B" strokeWidth="6" strokeLinecap="round" />
      <text x={W / 2} y={Math.max(14, bgY) - 8} fill="#A79D90" fontSize="11" textAnchor="middle">Background</text>
      {[1, 2, 3].map((i) => <circle key={i} cx={cx} cy={cy} r={(maxD / 3) * i * sc} fill="none" stroke="#26231F" strokeDasharray="3 5" />)}
      <g transform={`translate(${cx}, ${Math.min(H - 18, camY)})`}>
        <rect x="-14" y="-9" width="28" height="18" rx="4" fill="#F1EBE3" /><circle r="5" fill="#141312" />
        <text y="26" fill="#A79D90" fontSize="11" textAnchor="middle">Camera · {fmt(data.camera_distance_m)}</text>
      </g>
      {data.subjects.map((s, i) => {
        const x = cx + s.x_m * sc; const y = cy - s.y_m * sc;
        const a = (s.facing_deg * Math.PI) / 180;
        return (<g key={i}>
          <circle cx={x} cy={y} r="13" fill="#26231F" stroke="#F1EBE3" strokeWidth="2" />
          <path d={`M${x} ${y} l${Math.sin(a) * 20} ${Math.cos(a) * 20}`} stroke="#F1EBE3" strokeWidth="2" markerEnd="" />
          <text x={x} y={y + 4} fill="#F1EBE3" fontSize="12" fontWeight="700" textAnchor="middle">{s.label}</text>
        </g>);
      })}
      {lights.map((l, i) => {
        const [x, y] = pos(l); const c = ROLE[l.role] || '#E0A458';
        return (<g key={i}>
          <line x1={x} y1={y} x2={cx} y2={cy} stroke={c} strokeOpacity=".5" strokeDasharray="4 4" />
          <g onPointerDown={(e) => { if (!editable) return; e.currentTarget.ownerSVGElement.setPointerCapture?.(e.pointerId); setDrag(i); }} style={{ cursor: editable ? 'grab' : 'default' }} tabIndex={editable ? 0 : -1}
            aria-label={`${l.role} light ${i + 1}, ${fmt(l.distance_m)}, ${Math.round(l.angle_deg)} degrees`}>
            <circle cx={x} cy={y} r="22" fill="transparent" />
            <circle cx={x} cy={y} r="14" fill={c} stroke="#141312" strokeWidth="2" />
            <text x={x} y={y + 4} fill="#1A1209" fontSize="12" fontWeight="800" textAnchor="middle">{i + 1}</text>
          </g>
        </g>);
      })}
    </svg>
  );
}
