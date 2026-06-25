"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { computeCircumstances } from "@/lib/astronomy";
import { ECLIPSES, ECLIPSE_LIST, type EclipseId } from "@/data/eclipses";
import { searchCities, nearestCityTz, type City } from "@/lib/cities";
import { ASPIRATIONS } from "@/data/copy";
import { makeVariant, type PosterVariant, type Corner, type LayoutConfig } from "@/poster/variant";
import { makeGradient, RECIPES, type GradientSpec } from "@/poster/gradient";
import { makeRng, randomSeed } from "@/lib/rng";
import { PosterSVG } from "@/poster/PosterSVG";
import { TicketSVG } from "@/poster/TicketSVG";
import { FRAME, type PosterLocation, type Ratio } from "@/poster/types";
import { decodePoster, type PosterPayload } from "@/lib/posterLink";

const MONO = "var(--font-geist-mono), monospace";
const RATIOS: Ratio[] = ["3:4", "9:16", "1:1", "ticket"];
const CORNERS: readonly Corner[] = ["tl", "tr", "bl", "br"];
const PREVIEW_H = 760;

const lbl: React.CSSProperties = { fontFamily: MONO, fontSize: 10, color: "#8e8d8d", letterSpacing: 0.5 };
const val: React.CSSProperties = { fontFamily: MONO, fontSize: 10, color: "#e2e2e2", width: 38, textAlign: "right" };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", fontFamily: MONO, fontSize: 12, color: "#e2e2e2", background: "#0e1216", border: "1px solid #2a2d33", borderRadius: 2, padding: "8px 10px" };

function Range({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (n: number) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
      <span style={{ ...lbl, width: 96 }}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} style={{ flex: 1 }} />
      <span style={val}>{value.toFixed(2)}</span>
    </div>
  );
}

function Check({ on, label, onToggle }: { on: boolean; label: string; onToggle: () => void }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 5, marginRight: 12, ...lbl, cursor: "pointer" }}>
      <input type="checkbox" checked={on} onChange={onToggle} />
      {label}
    </label>
  );
}

function Seg<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly T[]; onChange: (v: T) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <span style={{ ...lbl, width: 64 }}>{label}</span>
      <div style={{ display: "flex", gap: 4, flex: 1, flexWrap: "wrap" }}>
        {options.map((o) => (
          <button key={o} onClick={() => onChange(o)} style={{
            fontFamily: MONO, fontSize: 9.5, padding: "4px 7px", cursor: "pointer", borderRadius: 2,
            border: "1px solid", borderColor: value === o ? "#e2e2e2" : "#2a2d33",
            background: value === o ? "#e2e2e2" : "transparent", color: value === o ? "#0e1216" : "#8e8d8d",
          }}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Which recipe produced a gradient (matched by its dark+light endpoints). */
function recipeIndexOf(g: GradientSpec): number {
  const i = RECIPES.findIndex(
    (r) => r.colors[0] === g.darkColor && r.colors[r.colors.length - 1] === g.lightColor,
  );
  return i < 0 ? 0 : i;
}

const DEFAULT_SEED = "AWE-2024";

function defaultPayload(): PosterPayload {
  const eclipseId: EclipseId = "2024-04-08";
  const e = ECLIPSES[eclipseId];
  return {
    seed: DEFAULT_SEED,
    eclipseId,
    location: e.defaultLocation,
    headline: ASPIRATIONS[0],
    ratio: "3:4",
    variant: makeVariant(DEFAULT_SEED, e.baseSpanDeg),
  };
}

export function PosterStudio({ encoded }: { encoded?: string | null }) {
  const init = useMemo(() => decodePoster(encoded) ?? defaultPayload(), [encoded]);

  const [eclipseId, setEclipseId] = useState<EclipseId>(init.eclipseId);
  const [location, setLocation] = useState<PosterLocation>(init.location);
  const [query, setQuery] = useState(init.location.name);
  const [open, setOpen] = useState(false);
  const [mLat, setMLat] = useState("");
  const [mLon, setMLon] = useState("");
  const [headline, setHeadline] = useState(init.headline);
  const [ratio, setRatio] = useState<Ratio>(init.ratio);
  const [seed, setSeed] = useState(init.seed);
  const [variant, setVariant] = useState<PosterVariant>(init.variant);
  // Separate seed for gradient re-rolls so other dials stay untouched.
  const [gradSeed, setGradSeed] = useState(init.seed);

  const eclipse = ECLIPSES[eclipseId];
  const base = eclipse.baseSpanDeg;
  const circumstances = useMemo(
    () => computeCircumstances(eclipse.date, location.lat, location.lon),
    [eclipse.date, location],
  );
  const suggestions = useMemo(() => (open ? searchCities(query) : []), [open, query]);

  const isTicket = ratio === "ticket";
  const previewW = isTicket ? 560 : Math.round((PREVIEW_H * FRAME[ratio].w) / FRAME[ratio].h);

  // ── variant helpers ─────────────────────────────────────────
  const m = variant.motif;
  const c = variant.crop;
  const setMotif = (patch: Partial<PosterVariant["motif"]>) =>
    setVariant((v) => ({ ...v, motif: { ...v.motif, ...patch } }));
  const setCrop = (patch: Partial<PosterVariant["crop"]>) =>
    setVariant((v) => ({ ...v, crop: { ...v.crop, ...patch } }));
  const setLayout = (patch: Partial<LayoutConfig>) =>
    setVariant((v) => ({ ...v, layout: { ...v.layout, ...patch } }));
  const setHl = (patch: Partial<LayoutConfig["headline"]>) =>
    setLayout({ headline: { ...variant.layout.headline, ...patch } });
  const setMeta = (patch: Partial<LayoutConfig["meta"]>) =>
    setLayout({ meta: { ...variant.layout.meta, ...patch } });
  const setEcl = (patch: Partial<LayoutConfig["eclipseLogo"]>) =>
    setLayout({ eclipseLogo: { ...variant.layout.eclipseLogo, ...patch } });
  const setAwe = (patch: Partial<LayoutConfig["awe"]>) =>
    setLayout({ awe: { ...variant.layout.awe, ...patch } });

  // Crop presented as zoom (× base span) + pan fractions of the span.
  const zoom = c.spanDeg / base;
  const panX = c.spanDeg ? c.offsetLon / c.spanDeg : 0;
  const panY = c.spanDeg ? c.offsetLat / c.spanDeg : 0;
  const setZoom = (z: number) => {
    const spanDeg = base * z;
    setCrop({ spanDeg, offsetLon: panX * spanDeg, offsetLat: panY * spanDeg });
  };

  const ringOn = m.kind === "ring";
  const toggleRing = () =>
    setMotif(ringOn ? { kind: "none" } : { kind: "ring", scale: m.scale || 0.35 });

  // Gradient is regenerated from a recipe + contained flag + its own seed.
  const recipeIdx = recipeIndexOf(variant.gradient);
  const contained = variant.gradient.mode === "contained";
  const regenGradient = (idx: number, isContained: boolean, gs: string) =>
    setVariant((v) => ({ ...v, gradient: makeGradient(makeRng(gs), { recipes: [RECIPES[idx]], containedProb: isContained ? 1 : 0 }) }));

  const chooseEclipse = (id: EclipseId) => {
    setEclipseId(id);
    const d = ECLIPSES[id].defaultLocation;
    setLocation(d);
    setQuery(d.name);
    // Reset the crop to the new eclipse's natural framing.
    setCrop({ spanDeg: ECLIPSES[id].baseSpanDeg, offsetLat: 0, offsetLon: 0 });
  };
  const pickCity = (city: City) => {
    setLocation({ name: city.name, admin: city.admin, lat: city.lat, lon: city.lon, tz: city.tz });
    setQuery(city.name);
    setOpen(false);
  };
  const applyManual = () => {
    const lat = parseFloat(mLat);
    const lon = parseFloat(mLon);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      setLocation({ name: `${lat.toFixed(2)}, ${lon.toFixed(2)}`, lat, lon, tz: nearestCityTz(lat, lon) });
    }
  };
  const regenerateAll = () => {
    const s = randomSeed();
    setSeed(s);
    setGradSeed(s);
    setVariant(makeVariant(s, base));
  };

  const panel: React.CSSProperties = { background: "#15171c", border: "1px solid #2a2d33", borderRadius: 4, padding: 14 };
  const h: React.CSSProperties = { ...lbl, color: "#cfcad6", fontSize: 11, letterSpacing: 1.5, margin: "0 0 8px" };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 18 }}>
        <Link href="/tune" style={{ ...lbl, color: "#8e8d8d", textDecoration: "none" }}>← BATCH</Link>
        <span style={{ ...lbl, color: "#cfcad6", fontSize: 12, letterSpacing: 1.5 }}>SINGLE POSTER — {seed}</span>
      </div>

      <div style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>
        <div style={{ width: 300, flexShrink: 0, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={panel}>
            <p style={h}>ECLIPSE · LOCATION</p>
            <select style={input} value={eclipseId} onChange={(e) => chooseEclipse(e.target.value as EclipseId)}>
              {ECLIPSE_LIST.map((e) => (
                <option key={e.id} value={e.id} style={{ color: "#000" }}>{e.name}</option>
              ))}
            </select>
            <div style={{ position: "relative", marginTop: 8 }}>
              <input
                style={input}
                value={query}
                placeholder="Search a city…"
                onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                spellCheck={false}
              />
              {suggestions.length > 0 && (
                <ul style={{ listStyle: "none", margin: "4px 0 0", padding: 4, position: "absolute", zIndex: 10, width: "100%", boxSizing: "border-box", background: "#15171c", border: "1px solid #2a2d33", borderRadius: 2, maxHeight: 200, overflowY: "auto" }}>
                  {suggestions.map((city) => (
                    <li key={`${city.name}-${city.lat}`}>
                      <button onMouseDown={(e) => { e.preventDefault(); pickCity(city); }} style={{ width: "100%", textAlign: "left", fontFamily: MONO, fontSize: 12, color: "#e2e2e2", background: "transparent", border: "none", padding: "6px 8px", cursor: "pointer", borderRadius: 2 }}>
                        {city.name} <span style={{ color: "#6a6a6a" }}>· {city.admin}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <input style={{ ...input, flex: 1, fontSize: 11 }} placeholder="lat" value={mLat} onChange={(e) => setMLat(e.target.value)} inputMode="decimal" />
              <input style={{ ...input, flex: 1, fontSize: 11 }} placeholder="long" value={mLon} onChange={(e) => setMLon(e.target.value)} inputMode="decimal" />
              <button onClick={applyManual} style={{ fontFamily: MONO, fontSize: 11, color: "#0e1216", background: "#e2e2e2", border: "none", borderRadius: 2, padding: "0 12px", cursor: "pointer" }}>SET</button>
            </div>
            {!circumstances.visible && (
              <p style={{ fontFamily: MONO, fontSize: 10, color: "#d8915a", margin: "8px 0 0" }}>Not on the path of totality from here.</p>
            )}
          </div>

          <div style={panel}>
            <p style={h}>HEADLINE</p>
            <textarea value={headline} onChange={(e) => setHeadline(e.target.value)} rows={2} spellCheck={false} style={{ ...input, resize: "vertical", lineHeight: 1.5 }} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
              {ASPIRATIONS.map((a) => (
                <button key={a} onClick={() => setHeadline(a)} title={a} style={{ fontFamily: MONO, fontSize: 9, color: "#8e8d8d", background: "transparent", border: "1px solid #2a2d33", borderRadius: 2, padding: "3px 6px", cursor: "pointer" }}>
                  {a.length > 16 ? a.slice(0, 15) + "…" : a}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 10 }}>
              <Range label="size" min={0.6} max={1.6} step={0.01} value={variant.headlineScale} onChange={(n) => setVariant((v) => ({ ...v, headlineScale: n }))} />
            </div>
          </div>

          <div style={panel}>
            <p style={h}>ECLIPSE RING</p>
            <Check on={ringOn} label="ring on" onToggle={toggleRing} />
            <div style={{ marginTop: 10, opacity: ringOn ? 1 : 0.4, pointerEvents: ringOn ? "auto" : "none" }}>
              <Range label="scale" min={0.08} max={2} step={0.01} value={m.scale} onChange={(n) => setMotif({ scale: n })} />
              <Range label="position x" min={0} max={1} step={0.01} value={m.cxFrac} onChange={(n) => setMotif({ cxFrac: n })} />
              <Range label="position y" min={0} max={1} step={0.01} value={m.cyFrac} onChange={(n) => setMotif({ cyFrac: n })} />
              <p style={{ ...lbl, fontSize: 9, letterSpacing: 1.5, margin: "12px 0 6px", borderTop: "1px solid #2a2d33", paddingTop: 9 }}>SUN SETTINGS</p>
              <Range label="shadow x" min={-1} max={1} step={0.05} value={m.shadowX ?? 0} onChange={(n) => setMotif({ shadowX: n })} />
              <Range label="limb size" min={0.5} max={3} step={0.05} value={m.limbSize ?? 1.6} onChange={(n) => setMotif({ limbSize: n })} />
              <Range label="glow area" min={0} max={1} step={0.02} value={m.glowArea ?? 0.6} onChange={(n) => setMotif({ glowArea: n })} />
            </div>
          </div>

          <div style={panel}>
            <p style={h}>GRADIENT</p>
            <Seg label="recipe" value={RECIPES[recipeIdx].name} options={RECIPES.map((r) => r.name)} onChange={(name) => regenGradient(RECIPES.findIndex((r) => r.name === name), contained, gradSeed)} />
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
              <Check on={contained} label="contained" onToggle={() => regenGradient(recipeIdx, !contained, gradSeed)} />
              <button onClick={() => { const gs = randomSeed(); setGradSeed(gs); regenGradient(recipeIdx, contained, gs); }} style={{ fontFamily: MONO, fontSize: 9.5, color: "#8e8d8d", background: "transparent", border: "1px solid #2a2d33", borderRadius: 2, padding: "4px 8px", cursor: "pointer" }}>re-roll ↻</button>
            </div>
          </div>

          <div style={panel}>
            <p style={h}>CROP · GRAIN</p>
            <Range label="zoom" min={0.5} max={2} step={0.01} value={zoom} onChange={setZoom} />
            <Range label="pan x" min={-0.35} max={0.35} step={0.01} value={panX} onChange={(n) => setCrop({ offsetLon: n * c.spanDeg })} />
            <Range label="pan y" min={-0.35} max={0.35} step={0.01} value={panY} onChange={(n) => setCrop({ offsetLat: n * c.spanDeg })} />
            <Range label="grain" min={0.3} max={0.9} step={0.01} value={variant.grainIntensity} onChange={(n) => setVariant((v) => ({ ...v, grainIntensity: n }))} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <span style={{ ...lbl, width: 96 }}>grain field</span>
              <button onClick={() => setVariant((v) => ({ ...v, grainSeed: ((v.grainSeed + 7) % 97) + 1 }))} style={{ fontFamily: MONO, fontSize: 9.5, color: "#8e8d8d", background: "transparent", border: "1px solid #2a2d33", borderRadius: 2, padding: "4px 8px", cursor: "pointer" }}>re-roll ↻</button>
            </div>
          </div>

          <div style={panel}>
            <p style={h}>HEADLINE LAYOUT</p>
            <Seg label="position" value={variant.layout.headline.vpos} options={["high", "low"] as const} onChange={(v) => setHl({ vpos: v })} />
            <Seg label="" value={variant.layout.headline.hpos} options={["left", "center", "right"] as const} onChange={(v) => setHl({ hpos: v })} />
            <Seg label="axis" value={variant.layout.headline.axis} options={["horizontal", "vertical"] as const} onChange={(v) => setHl({ axis: v })} />
            <Seg label="align" value={variant.layout.headline.align} options={["left", "center", "right"] as const} onChange={(v) => setHl({ align: v })} />
            <Check on={variant.layout.headline.editorial} label="editorial italic" onToggle={() => setHl({ editorial: !variant.layout.headline.editorial })} />
          </div>

          <div style={panel}>
            <p style={h}>METADATA</p>
            <Seg label="corner" value={variant.layout.meta.corner} options={CORNERS} onChange={(v) => setMeta({ corner: v })} />
            <Seg label="style" value={variant.layout.meta.style} options={["stack", "spine"] as const} onChange={(v) => setMeta({ style: v })} />
          </div>

          <div style={panel}>
            <p style={h}>ECLIPSE APP BADGE</p>
            <div style={{ marginBottom: 8 }}>
              <Check on={variant.layout.eclipseLogo.on} label="badge on" onToggle={() => setEcl({ on: !variant.layout.eclipseLogo.on })} />
              <Check on={variant.layout.eclipseLogo.aweBadge} label="awe co badge" onToggle={() => setEcl({ aweBadge: !variant.layout.eclipseLogo.aweBadge })} />
            </div>
            <Seg label="corner" value={variant.layout.eclipseLogo.corner} options={CORNERS} onChange={(v) => setEcl({ corner: v })} />
          </div>

          <div style={panel}>
            <p style={h}>AWE CO BRAND TAG</p>
            <div style={{ marginBottom: 8 }}>
              <Check on={variant.layout.awe.on} label="tag on" onToggle={() => setAwe({ on: !variant.layout.awe.on })} />
            </div>
            <Seg label="corner" value={variant.layout.awe.corner} options={CORNERS} onChange={(v) => setAwe({ corner: v })} />
          </div>

          <button onClick={regenerateAll} style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 1, padding: "9px 16px", background: "transparent", color: "#8e8d8d", border: "1px solid #2a2d33", borderRadius: 2, cursor: "pointer" }}>
            REGENERATE FROM NEW SEED ↻
          </button>
        </div>

        <div style={{ flex: 1, minWidth: 0, position: "sticky", top: 16 }}>
          <div style={{ width: previewW, maxWidth: "100%" }}>
            {isTicket ? (
              <TicketSVG model={{ eclipse, location, circumstances, aspiration: headline, ratio }} variant={variant} />
            ) : (
              <PosterSVG model={{ eclipse, location, circumstances, aspiration: headline, ratio }} variant={variant} />
            )}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
            {RATIOS.map((r) => (
              <button key={r} onClick={() => setRatio(r)} style={{ fontFamily: MONO, fontSize: 11, padding: "7px 12px", cursor: "pointer", borderRadius: 2, border: "1px solid", borderColor: ratio === r ? "#e2e2e2" : "#2a2d33", background: ratio === r ? "#e2e2e2" : "transparent", color: ratio === r ? "#0e1216" : "#8e8d8d" }}>
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
