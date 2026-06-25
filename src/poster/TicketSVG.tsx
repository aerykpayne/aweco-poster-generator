/**
 * The "eclipse ticket" — a landscape boarding-pass-style stub generated for a
 * single location: where you are, the local contact time, the eclipse, and your
 * totality duration, with a tear-off stub carrying a unique admit-one code.
 * One self-contained SVG (ticket outline with side notches → clip → faint
 * geography → type), same {model, variant} signature as PosterSVG.
 */
import { fitProjection } from "@/lib/projection";
import { landFeature } from "@/lib/coastline";
import { formatDuration, formatObscuration } from "@/lib/astronomy";
import { FRAME, type PosterModel } from "@/poster/types";
import type { PosterVariant } from "@/poster/variant";

const SANS = "var(--font-geist-sans), system-ui, -apple-system, sans-serif";
const MONO = "var(--font-geist-mono), ui-monospace, monospace";
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Round projection floats to 2dp so SSR and client markup match exactly. */
const round2 = (d: string) => d.replace(/\d+\.\d+/g, (m) => Number(m).toFixed(2));

/** Deterministic admit-one code from the poster seed, e.g. "UMBRA-K9X2". */
function ticketCode(seed: string): string {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(h ^ seed.charCodeAt(i), 16777619)) >>> 0;
  }
  let out = "";
  for (let i = 0; i < 4; i++) {
    out += CODE_ALPHABET[h % CODE_ALPHABET.length];
    h = (Math.imul(h ^ (i + 1), 16777619)) >>> 0;
  }
  return `UMBRA-${out}`;
}

function fmtCoords(lat: number, lon: number): string {
  const la = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? "N" : "S"}`;
  const lo = `${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? "E" : "W"}`;
  return `${la}, ${lo}`;
}

function fmtTime12(d: Date | undefined, tz: string): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: tz,
  }).format(d);
}

export function TicketSVG({
  model,
  variant,
}: {
  model: PosterModel;
  variant: PosterVariant;
}) {
  const { w: W, h: H } = FRAME.ticket;
  const uid = variant.seed.replace(/[^A-Za-z0-9]/g, "");
  const clipId = `ticket-clip-${uid}`;
  const bgId = `ticket-bg-${uid}`;
  const { circumstances: c, location: loc, eclipse } = model;

  const pad = 6;
  const left = pad;
  const right = W - pad;
  const top = pad;
  const bottom = H - pad;
  const cr = 26; // corner radius
  const notchR = 22;
  const midY = H / 2;
  const tearX = Math.round(W * 0.74);

  // Single outline path: rounded rect with a concave notch on each side edge.
  const outline = [
    `M ${left + cr} ${top}`,
    `H ${right - cr}`,
    `A ${cr} ${cr} 0 0 1 ${right} ${top + cr}`,
    `V ${midY - notchR}`,
    `A ${notchR} ${notchR} 0 0 0 ${right} ${midY + notchR}`,
    `V ${bottom - cr}`,
    `A ${cr} ${cr} 0 0 1 ${right - cr} ${bottom}`,
    `H ${left + cr}`,
    `A ${cr} ${cr} 0 0 1 ${left} ${bottom - cr}`,
    `V ${midY + notchR}`,
    `A ${notchR} ${notchR} 0 0 0 ${left} ${midY - notchR}`,
    `V ${top + cr}`,
    `A ${cr} ${cr} 0 0 1 ${left + cr} ${top}`,
    "Z",
  ].join(" ");

  // Faint geography centered on the location, zoomed out to read as a region.
  const fit = fitProjection(eclipse.path, loc, W, H, {
    spanDeg: 64,
    center: { lat: loc.lat, lon: loc.lon + 6 },
  });
  const landD = round2(fit.pathGen(landFeature) ?? "");
  const lineD = round2(fit.pathGen(eclipse.path) ?? "");

  // ── Content ─────────────────────────────────────────────────
  const M = 52;
  const placeName = loc.admin ? `${loc.name}, ${loc.admin}` : loc.name;
  const coordLine = `${fmtCoords(loc.lat, loc.lon)}  ·  ${fmtTime12(c.totalBegin ?? c.peak, loc.tz)}`;
  const eclipseName = `${eclipse.date.slice(0, 4)} Total Solar Eclipse`;
  const inTot = c.inTotality;
  const big = inTot ? formatDuration(c.totalityDurationSec) : formatObscuration(c.obscuration);
  const bigLabel = inTot ? "of totality" : "coverage";
  const code = ticketCode(variant.seed);

  const stubCx = (tearX + W) / 2;
  const sub = "rgba(255,255,255,0.62)";

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "auto" }}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={outline} />
        </clipPath>
        <linearGradient id={bgId} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="#23272e" />
          <stop offset="55%" stopColor="#15181d" />
          <stop offset="100%" stopColor="#0d0f13" />
        </linearGradient>
      </defs>

      {/* Ticket body + faint geography, all clipped to the notched outline */}
      <g clipPath={`url(#${clipId})`}>
        <rect x={0} y={0} width={W} height={H} fill={`url(#${bgId})`} />
        <path d={landD} fill="rgba(255,255,255,0.05)" />
        <path d={lineD} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" />
        <path d={lineD} fill="none" stroke="rgba(255,255,255,0.34)" strokeWidth={1.1} strokeLinejoin="round" strokeLinecap="round" />
      </g>

      {/* Outline + perforated tear line */}
      <path d={outline} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth={1.4} />
      <line x1={tearX} y1={top + 14} x2={tearX} y2={bottom - 14} stroke="rgba(255,255,255,0.28)" strokeWidth={1.2} strokeDasharray="2 6" />

      {/* ── Main info (left of the tear) ─────────────────────── */}
      <text x={M} y={88} fontFamily={SANS} fontSize={31} fontWeight={600} fill="#ffffff" letterSpacing={-0.2}>
        {placeName}
      </text>
      <text x={M} y={118} fontFamily={SANS} fontSize={14} fill={sub} letterSpacing={0.2}>
        {coordLine}
      </text>
      <text x={M} y={141} fontFamily={SANS} fontSize={14} fill={sub} letterSpacing={0.2}>
        {eclipseName}
      </text>

      <text x={M} y={H - 60} fontFamily={SANS} fill="#ffffff">
        <tspan fontSize={70} fontWeight={700} letterSpacing={-2}>{big}</tspan>
        <tspan fontSize={24} fontWeight={400} fill="rgba(255,255,255,0.6)" dx={12}>{bigLabel}</tspan>
      </text>

      {/* ── Stub (right of the tear) ─────────────────────────── */}
      <text transform={`translate(${stubCx - 8} ${midY}) rotate(-90)`} textAnchor="middle" fontFamily={MONO} fontSize={29} fontWeight={700} fill="#ffffff" letterSpacing={1.5}>
        {code}
      </text>
      <text transform={`translate(${stubCx + 30} ${midY}) rotate(-90)`} textAnchor="middle" fontFamily={MONO} fontSize={9.5} fill="rgba(255,255,255,0.5)" letterSpacing={3}>
        ADMIT ONE: TOTALITY
      </text>
    </svg>
  );
}
