/**
 * Bundled city dataset → typeahead geocoding without an API (PLAN.md §4d).
 * Also resolves a timezone for manual lat/lon entry via nearest city.
 */
import citiesData from "@/data/cities.json";

export interface City {
  name: string;
  admin: string;
  lat: number;
  lon: number;
  tz: string;
}

export const CITIES = citiesData as City[];

/** Case-insensitive name match, prefix matches first. */
export function searchCities(query: string, limit = 8): City[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const starts: City[] = [];
  const contains: City[] = [];
  for (const c of CITIES) {
    const n = c.name.toLowerCase();
    if (n.startsWith(q)) starts.push(c);
    else if (n.includes(q) || c.admin.toLowerCase().includes(q)) contains.push(c);
  }
  return [...starts, ...contains].slice(0, limit);
}

/** Nearest city's timezone — a reasonable tz for a manual lat/lon. */
export function nearestCityTz(lat: number, lon: number): string {
  let best = CITIES[0];
  let bestD = Infinity;
  for (const c of CITIES) {
    const d = (c.lat - lat) ** 2 + (c.lon - lon) ** 2;
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best.tz;
}
