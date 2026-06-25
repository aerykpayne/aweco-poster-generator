import type { FeatureCollection, LineString } from "geojson";
import path2024 from "./paths/eclipse-2024.json";
import path2026 from "./paths/eclipse-2026.json";

export type EclipseId = "2024-04-08" | "2026-08-12";

export interface EclipseRecord {
  id: EclipseId;
  name: string;
  /** ISO date of greatest eclipse (UTC). */
  date: string;
  type: "total";
  region: string;
  /** Path-of-totality GeoJSON (central line; limits later). */
  path: FeatureCollection<LineString>;
  /** Latitude degrees spanned by the default crop — tuned per eclipse. */
  baseSpanDeg: number;
  /** A representative location to seed the projection/crop and default form. */
  defaultLocation: {
    name: string;
    admin?: string;
    lat: number;
    lon: number;
    tz: string;
  };
}

export const ECLIPSES: Record<EclipseId, EclipseRecord> = {
  "2024-04-08": {
    id: "2024-04-08",
    name: "Total Solar Eclipse — April 8, 2024",
    date: "2024-04-08",
    type: "total",
    region: "Mexico · United States (Texas to Maine) · Eastern Canada",
    path: path2024 as unknown as FeatureCollection<LineString>,
    baseSpanDeg: 26,
    defaultLocation: { name: "Mazatlán", admin: "Sinaloa, MX", lat: 23.2494, lon: -106.4111, tz: "America/Mazatlan" },
  },
  "2026-08-12": {
    id: "2026-08-12",
    name: "Total Solar Eclipse — August 12, 2026",
    date: "2026-08-12",
    type: "total",
    region: "Greenland · Iceland · Spain",
    path: path2026 as unknown as FeatureCollection<LineString>,
    baseSpanDeg: 15,
    defaultLocation: { name: "Reykjavík", admin: "IS", lat: 64.1466, lon: -21.9426, tz: "Atlantic/Reykjavik" },
  },
};

export const ECLIPSE_LIST: EclipseRecord[] = Object.values(ECLIPSES);

export function getEclipse(id: EclipseId): EclipseRecord {
  return ECLIPSES[id];
}
