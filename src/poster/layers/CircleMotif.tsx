/**
 * The eclipse-circle motif (PLAN.md §7) — three owner-approved treatments:
 *  - "disc"   glowing gradient orb (also the contained-field look)
 *  - "ring"   black moon disc + bright corona (the iconic totality view)
 *  - "phases" a small row, partial → total → partial
 * Drawn beneath the global grain passes, so it picks up the same texture.
 */
import type { GradientSpec } from "@/poster/gradient";
import type { MotifKind } from "@/poster/variant";

interface CircleMotifProps {
  kind: MotifKind;
  cx: number;
  cy: number;
  /** Radius in px (for "phases", the sun radius). */
  r: number;
  gradient: GradientSpec;
  /** Unique id stem for this poster's gradient defs. */
  uid: string;
  /** −1..1: pushes the corona's bright limb to the left/right edge (the
   *  diamond-ring effect). 0 = even rim. Only used by the ring motif. */
  shadowX?: number;
  /** Bright-limb size as a multiple of the ring radius (ring only). */
  limbSize?: number;
  /** Glow spread of the bright limb, 0..1 (ring only). */
  glowArea?: number;
}

export function CircleMotif({
  kind,
  cx,
  cy,
  r,
  gradient,
  uid,
  shadowX = 0,
  limbSize = 1.18,
  glowArea = 0.34,
}: CircleMotifProps) {
  if (kind === "none") return null;

  const warm = gradient.stops[gradient.stops.length - 2]?.color ?? "#fda689";
  const edge = gradient.stops[0].color;

  if (kind === "disc") {
    const gid = `disc-${uid}`;
    return (
      <g>
        <defs>
          <radialGradient id={gid} cx="50%" cy="42%" r="62%">
            <stop offset="0%" stopColor={warm} />
            <stop offset="58%" stopColor={gradient.stops[Math.max(1, gradient.stops.length - 3)]?.color ?? warm} />
            <stop offset="100%" stopColor={edge} />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill={`url(#${gid})`} opacity={0.92} />
      </g>
    );
  }

  if (kind === "ring") {
    const cid = `corona-${uid}`;
    const lid = `limb-${uid}`;
    // The bright limb: a hotspot whose centre sits inside the disc (so it's
    // hidden there) but spills past the edge on the shadowX side. `limbSize`
    // scales its radius; `glowArea` pushes the warm band outward so the glow
    // reads larger and softer.
    const limbX = cx + shadowX * r * 0.9;
    const corePct = 22 + glowArea * 50; // 22..72%
    // The base (symmetric) corona fades out as the limb is pushed to one side,
    // so the far side goes dark at the extremes — leaving the directional limb.
    const baseFade = 1 - Math.abs(shadowX);
    return (
      <g>
        <defs>
          <radialGradient id={cid} cx="50%" cy="50%" r="50%">
            <stop offset="36%" stopColor={warm} stopOpacity={0} />
            <stop offset="56%" stopColor={warm} stopOpacity={0.34 * baseFade} />
            <stop offset="100%" stopColor={warm} stopOpacity={0} />
          </radialGradient>
          <radialGradient id={lid} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.7} />
            <stop offset={`${corePct * 0.7}%`} stopColor={warm} stopOpacity={0.5} />
            <stop offset="100%" stopColor={warm} stopOpacity={0} />
          </radialGradient>
        </defs>
        {/* base symmetric corona — broad, soft halo */}
        <circle cx={cx} cy={cy} r={r * 1.7} fill={`url(#${cid})`} />
        {/* directional bright limb (covered at centre by the disc) */}
        <circle cx={limbX} cy={cy} r={r * limbSize} fill={`url(#${lid})`} />
        {/* moon disc — the corona halo alone defines the rim (no extra stroke) */}
        <circle cx={cx} cy={cy} r={r} fill="#04070c" />
      </g>
    );
  }

  // phases: 5 circles across, moon crossing the sun
  const steps = [0.62, 0.32, 0, -0.32, -0.62];
  const gap = r * 2.5;
  const startX = cx - (gap * (steps.length - 1)) / 2;
  return (
    <g>
      <defs>
        {steps.map((_, i) => (
          <clipPath id={`ph-${uid}-${i}`} key={i}>
            <circle cx={startX + i * gap} cy={cy} r={r} />
          </clipPath>
        ))}
      </defs>
      {steps.map((off, i) => {
        const x = startX + i * gap;
        if (off === 0) {
          return (
            <g key={i}>
              <circle cx={x} cy={cy} r={r} fill="#04070c" />
              <circle cx={x} cy={cy} r={r} fill="none" stroke={warm} strokeWidth={r * 0.06} opacity={0.85} />
            </g>
          );
        }
        return (
          <g key={i}>
            <circle cx={x} cy={cy} r={r} fill={warm} />
            <circle cx={x + off * r * 2} cy={cy} r={r} fill={edge} clipPath={`url(#ph-${uid}-${i})`} />
          </g>
        );
      })}
    </g>
  );
}
