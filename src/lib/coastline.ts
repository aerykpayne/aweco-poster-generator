/**
 * Natural Earth 1:110m land outline → a single faint coastline topoline,
 * drawn behind the path on the same projection (PLAN.md §4c, §7).
 */
import { feature } from "topojson-client";
import type { Feature, MultiPolygon } from "geojson";
import land110m from "@/data/coastline/land-110m.json";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const landFeature = feature(
  land110m as any,
  (land110m as any).objects.land,
) as unknown as Feature<MultiPolygon>;
