/**
 * Local eclipse circumstances, computed client-side from astronomy-engine.
 * No API, no keys (PLAN.md §4e). Feeds the poster metadata block.
 */
import {
  Observer,
  SearchLocalSolarEclipse,
  EclipseKind,
} from "astronomy-engine";

export interface Circumstances {
  /** Whether this eclipse is actually visible (above horizon) at the location. */
  visible: boolean;
  /** total | annular | partial | none (none = not locally visible). */
  kind: "total" | "annular" | "partial" | "none";
  /** True only when the location is inside the path of totality. */
  inTotality: boolean;
  /** Fraction of the sun's disc covered at maximum, 0..1. */
  obscuration: number;
  /** Contact times as UTC Date objects (format with formatLocal). */
  partialBegin?: Date;
  totalBegin?: Date;
  peak?: Date;
  totalEnd?: Date;
  partialEnd?: Date;
  /** Duration of totality in seconds (undefined when not total). */
  totalityDurationSec?: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Compute circumstances of `eclipseDateISO` (YYYY-MM-DD) at a location.
 *
 * SearchLocalSolarEclipse returns the *next* locally-visible eclipse at/after
 * the start time, so if this eclipse is below the horizon at the location it
 * would skip to a later event. We guard by requiring the found peak to fall
 * within a day of the requested date; otherwise the eclipse isn't visible here.
 */
export function computeCircumstances(
  eclipseDateISO: string,
  lat: number,
  lon: number,
): Circumstances {
  const observer = new Observer(lat, lon, 0);
  const start = new Date(`${eclipseDateISO}T00:00:00Z`);
  const target = new Date(`${eclipseDateISO}T12:00:00Z`).getTime();

  const ev = SearchLocalSolarEclipse(start, observer);
  const peak = ev.peak.time.date;

  if (Math.abs(peak.getTime() - target) > DAY_MS) {
    return { visible: false, kind: "none", inTotality: false, obscuration: 0 };
  }

  const totalBegin = ev.total_begin?.time.date;
  const totalEnd = ev.total_end?.time.date;
  const inTotality =
    ev.kind === EclipseKind.Total && !!totalBegin && !!totalEnd;

  return {
    visible: true,
    kind: ev.kind as Circumstances["kind"],
    inTotality,
    obscuration: ev.obscuration,
    partialBegin: ev.partial_begin.time.date,
    totalBegin,
    peak,
    totalEnd,
    partialEnd: ev.partial_end.time.date,
    totalityDurationSec:
      totalBegin && totalEnd
        ? (totalEnd.getTime() - totalBegin.getTime()) / 1000
        : undefined,
  };
}

/** Format a UTC Date as HH:MM:SS in the given IANA timezone. */
export function formatLocalTime(d: Date | undefined, tz: string): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: tz,
  }).format(d);
}

/** Format totality duration as e.g. "4m 28s". */
export function formatDuration(sec: number | undefined): string {
  if (sec == null) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

/** Format obscuration as a percentage string, e.g. "100%" / "87.4%". */
export function formatObscuration(frac: number): string {
  const pct = frac * 100;
  return pct >= 99.95 || pct === 0
    ? `${Math.round(pct)}%`
    : `${pct.toFixed(1)}%`;
}
