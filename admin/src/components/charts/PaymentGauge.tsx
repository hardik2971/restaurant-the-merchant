'use client';

// Ticked semicircle gauge (speedometer style) — gradient green→orange ticks,
// big percentage in the centre. Pure SVG so it matches the mockup precisely.

function lerpColor(a: [number, number, number], b: [number, number, number], t: number) {
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

const GREEN: [number, number, number] = [22, 163, 74];
const ORANGE: [number, number, number] = [241, 90, 36];

export function PaymentGauge({ value, label }: { value: number; label: string }) {
  const cx = 120;
  const cy = 118;
  const rInner = 84;
  const rOuter = 108;
  const ticks = 48;

  const lines = Array.from({ length: ticks }, (_, i) => {
    const t = i / (ticks - 1);
    const deg = 180 - t * 180; // 180° (left) → 0° (right)
    const rad = (deg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dim = t * 100 > value + 4; // ticks past the value are muted
    return {
      x1: cx + rInner * cos,
      y1: cy - rInner * sin,
      x2: cx + rOuter * cos,
      y2: cy - rOuter * sin,
      color: dim ? '#e6e8ec' : lerpColor(GREEN, ORANGE, t),
    };
  });

  return (
    <svg viewBox="0 0 240 132" className="w-full" role="img" aria-label={`${value}% ${label}`}>
      {lines.map((l, i) => (
        <line
          key={i}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke={l.color}
          strokeWidth={3}
          strokeLinecap="round"
        />
      ))}
      <text
        x={cx}
        y={cy - 18}
        textAnchor="middle"
        className="fill-fg font-display"
        style={{ fontSize: 30, fontWeight: 600 }}
      >
        {value}%
      </text>
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        className="fill-fg-muted"
        style={{ fontSize: 12 }}
      >
        {label}
      </text>
    </svg>
  );
}
