/**
 * Audio corona — the uploaded audio signature rendered as a sunburst of tapered
 * rays radiating from the eclipse ring's edge (the "Sound of Totality" look).
 * Sample index → angle around the circle, normalized rms → ray length, with
 * `peak` transients accented longer + brighter. Layers over CircleMotif's glow.
 */
import { toRays, type AudioSignature } from "@/lib/audioSignature";

interface AudioCoronaProps {
  cx: number;
  cy: number;
  /** Ring radius — rays start just outside this. */
  r: number;
  signature: AudioSignature;
  /** Number of rays around the circle. */
  rayCount: number;
  /** Max ray length in px (a loud ray reaches r + rayMax). */
  rayMax: number;
  /** Corona colour. */
  color: string;
  /** Soft round-capped rays instead of sharp tapered spikes. */
  roundTips?: boolean;
}

export function AudioCorona({
  cx,
  cy,
  r,
  signature,
  rayCount,
  rayMax,
  color,
  roundTips = false,
}: AudioCoronaProps) {
  const N = Math.max(24, Math.round(rayCount));
  const { len, accent } = toRays(signature.rms, signature.peak, N);

  const rIn = r * 1.008;
  // Thin needle base: a fraction of the per-ray arc slot, capped so it stays fine.
  const arcSlot = (2 * Math.PI * rIn) / N;
  const baseHalf = Math.min(1.8, arcSlot * 0.24);

  const normalD: string[] = [];
  const accentD: string[] = [];
  for (let i = 0; i < N; i++) {
    const ang = (i / N) * Math.PI * 2 - Math.PI / 2; // start at top
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);
    const L = Math.min(1, len[i] + (accent[i] ? 0.22 : 0)) * rayMax;
    const bx = cx + cos * rIn;
    const by = cy + sin * rIn;

    if (roundTips) {
      // Round-capped line: pull the tip in by the cap radius so the rounded end
      // lands at ~the same length as the sharp version.
      const rOut = rIn + Math.max(0, L - baseHalf);
      const d =
        `M${bx.toFixed(2)} ${by.toFixed(2)}` +
        `L${(cx + cos * rOut).toFixed(2)} ${(cy + sin * rOut).toFixed(2)}`;
      (accent[i] ? accentD : normalD).push(d);
    } else {
      // Sharp tapered spike: a narrow triangle to a point.
      const rOut = rIn + L;
      const tx = -sin;
      const ty = cos;
      const px = cx + cos * rOut;
      const py = cy + sin * rOut;
      const d =
        `M${(bx + tx * baseHalf).toFixed(2)} ${(by + ty * baseHalf).toFixed(2)}` +
        `L${px.toFixed(2)} ${py.toFixed(2)}` +
        `L${(bx - tx * baseHalf).toFixed(2)} ${(by - ty * baseHalf).toFixed(2)}Z`;
      (accent[i] ? accentD : normalD).push(d);
    }
  }

  if (roundTips) {
    return (
      <g fill="none" stroke={color} strokeWidth={baseHalf * 2} strokeLinecap="round">
        <path d={normalD.join("")} opacity={0.6} />
        <path d={accentD.join("")} opacity={0.95} />
      </g>
    );
  }
  return (
    <g fill={color}>
      <path d={normalD.join("")} opacity={0.6} />
      <path d={accentD.join("")} opacity={0.95} />
    </g>
  );
}
