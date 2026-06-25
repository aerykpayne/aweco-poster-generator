/**
 * Brand design tokens — single source of truth for the poster SVG renderer.
 *
 * Color, type and spacing values are pulled from the Awe Co Figma brand file
 * (key qsIpb1IegFJvWavQTxrpRJ, "Poster / Ticket Research"). Tokens that are NOT
 * defined as Figma variables are marked `UNRESOLVED` — confirm with the owner
 * before treating them as canonical.
 *
 * LOCKED (never randomized): see PLAN.md §2 — fonts, type hierarchy, brand color
 * tokens, and the total-eclipse gradient palette all live here and must not be
 * shuffled by the generator.
 */

/** Flat Swiss color fields — ink / paper / accents. From Figma variables. */
export const color = {
  ink: "#0e1216", // Figma `Primary`
  paper: "#e2e2e2", // Figma `Backgrounds/Secondary BKG`
  white: "#ffffff",
  tertiary: "#8e8d8d", // Figma `Text/Tertiary text`
  sun: "#fe9235", // Figma `Brand/Sun`
  orange: "#ff5c02", // Figma `Orange`
} as const;

/**
 * Total-eclipse gradient (LOCKED primary visual): black → purple → pink → white.
 * Resolved from the Figma "total: black-purple-pink-white" swatch group
 * (node 594:3675); `white` is the named 4th stop (no swatch — literal #ffffff).
 */
export const eclipseGradient = {
  total: ["#04070c", "#2f1b24", "#fda689", "#ffffff"],
} as const;

/**
 * Future-expansion eclipse-type color map (NOT in v1 scope — v1 is total only).
 * Kept for later; resolved from the same Figma swatch group.
 */
export const eclipseTypeColor = {
  partialSolar: "#df8b00", // labelled "yellow"
  annular: "#ba543d", // labelled "orange"
  lunarTotal: "#912a3f", // labelled "pink"
  lunarPartial: "#213443", // labelled "grey-blue"
} as const;

/**
 * The full 7-color Figma master palette (node 594:3675), banded by luminance.
 * Owner-approved as the source pool for randomized gradient variety in the
 * generator (not just the locked total-eclipse four). Light ends (#efe9e4 /
 * #ffffff) are the lifted near-white anchors so grain reads at the bright end.
 */
export const palette = {
  dark: ["#04070c", "#2f1b24", "#213443", "#912a3f"], // near-black, plum, slate-blue, wine
  mid: ["#ba543d", "#df8b00"], // terracotta, gold
  light: ["#fda689"], // peach
  lightEnd: ["#efe9e4", "#f4ede6"], // warm near-whites
  darkAnchor: "#0a0b13", // lifted near-black for the dark end
} as const;

/**
 * Spacing scale. UNRESOLVED: only `sm` (8) and `lg` (20) exist as Figma
 * variables. The intermediate/extended steps below are a sensible 4px-based
 * ramp added to make a usable grid system — replace if the owner defines a
 * full scale.
 */
export const space = {
  xs: 4, // added
  sm: 8, // Figma `sm`
  md: 12, // added
  lg: 20, // Figma `lg`
  xl: 32, // added
  xxl: 48, // added
} as const;

export const radius = {
  round: 999, // Figma `round`
} as const;

/**
 * Type system. Display face is Neue York per PLAN.md §6 direction — the Figma
 * `H1` variable specifies PP Editorial Old, which we deliberately OVERRIDE (do
 * not substitute). Data/metadata copy is Geist Mono.
 *
 * UNRESOLVED: the full display type *scale* is not tokenized in Figma — only a
 * single `Copy` size (22) and the (overridden) `H1` size (82). The scale below
 * is a provisional modular ramp for the fixed hierarchy in PLAN.md §5.
 */
export const type = {
  display: {
    family: '"PP Neue York", Georgia, serif',
    cssVar: "var(--font-neue-york)",
    weights: { light: 300, medium: 500 },
    letterSpacing: -0.01, // em, approx from Figma H1 ls -1 @ 82px
    lineHeight: 1.05,
  },
  data: {
    family: '"Geist Mono", ui-monospace, monospace',
    cssVar: "var(--font-geist-mono)",
    weight: 400,
    letterSpacing: 0,
    lineHeight: 1.4,
  },
} as const;

/** Provisional display scale (px) for the locked hierarchy — see §5. */
export const displayScale = {
  hero: 96, // aspiration line, dominant
  headline: 64,
  sub: 40,
} as const;

/** Data/metadata scale (px). */
export const dataScale = {
  label: 11,
  value: 14,
  tagline: 12,
} as const;

export const tokens = {
  color,
  eclipseGradient,
  eclipseTypeColor,
  space,
  radius,
  type,
  displayScale,
  dataScale,
} as const;

export type Tokens = typeof tokens;
export default tokens;
