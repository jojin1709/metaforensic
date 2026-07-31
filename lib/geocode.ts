export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=16`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "MetaForensic-OSINT-Lab/2.0 (contact@metaforensic.app)",
        },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.display_name || null;
  } catch {
    return null;
  }
}
