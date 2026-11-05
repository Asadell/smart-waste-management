/**
 * Reverse geocoding with OpenStreetMap Nominatim (free, no API key).
 * Usage policy: max 1 request/second, so callers debounce map moves.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<string | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1&accept-language=id&lat=${lat}&lon=${lng}`;
  try {
    const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address ?? {};
    const parts = [
      [a.road, a.house_number].filter(Boolean).join(" "),
      a.neighbourhood ?? a.hamlet,
      a.suburb ?? a.village,
      a.city_district,
      a.city ?? a.town ?? a.county,
    ].filter((p): p is string => !!p && p.trim() !== "");
    const unique = [...new Set(parts)];
    return unique.length ? unique.join(", ") : (data.display_name ?? null);
  } catch {
    return null;
  }
}
