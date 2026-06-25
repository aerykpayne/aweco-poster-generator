/** Default aspiration lines from the brand file (PLAN.md §5). User-overridable. */
export const ASPIRATIONS = [
  "Look up.",
  "Chase totality",
  "Wonders are waiting",
  "Reigniting the awe",
  "See the wonders of this world and beyond.",
] as const;

export type Aspiration = (typeof ASPIRATIONS)[number];
