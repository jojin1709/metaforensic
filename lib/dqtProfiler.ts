export interface DqtTable {
  id: number;
  table: number[];
  type: "Luminance" | "Chrominance" | "Custom";
}

export interface DqtResult {
  hasDqt: boolean;
  tables: DqtTable[];
  estimatedQuality: number;
  doubleCompressionLikely: boolean;
  notes: string[];
}

/**
 * Parses JPEG ArrayBuffer for FF DB Quantization Table markers.
 */
export function parseJpegDqt(buffer: ArrayBuffer): DqtResult {
  const bytes = new Uint8Array(buffer);
  const tables: DqtTable[] = [];
  const notes: string[] = [];

  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return { hasDqt: false, tables: [], estimatedQuality: 0, doubleCompressionLikely: false, notes: ["Not a JPEG image."] };
  }

  let offset = 2;
  while (offset + 4 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset++;
      continue;
    }

    const marker = bytes[offset + 1];

    // End of image or Start of Scan
    if (marker === 0xd9 || marker === 0xda) break;

    const length = (bytes[offset + 2] << 8) | bytes[offset + 3];

    // DQT Marker: FF DB
    if (marker === 0xdb) {
      let dqtOffset = offset + 4;
      const endDqt = offset + 2 + length;

      while (dqtOffset < endDqt && dqtOffset < bytes.length) {
        const info = bytes[dqtOffset];
        const tableId = info & 0x0f;
        const precision = (info >> 4) === 0 ? 8 : 16;
        dqtOffset++;

        const tableValues: number[] = [];
        const tableSize = precision === 8 ? 64 : 128;

        for (let i = 0; i < 64 && dqtOffset < bytes.length; i++) {
          if (precision === 8) {
            tableValues.push(bytes[dqtOffset++]);
          } else {
            tableValues.push((bytes[dqtOffset] << 8) | bytes[dqtOffset + 1]);
            dqtOffset += 2;
          }
        }

        tables.push({
          id: tableId,
          table: tableValues,
          type: tableId === 0 ? "Luminance" : "Chrominance",
        });
      }
    }

    offset += 2 + length;
  }

  if (tables.length === 0) {
    return { hasDqt: false, tables: [], estimatedQuality: 0, doubleCompressionLikely: false, notes: ["No DQT quantization tables found."] };
  }

  // Estimate Quality from Luminance Table
  const lum = tables[0]?.table || [];
  let avgLum = 0;
  if (lum.length >= 64) {
    avgLum = lum.reduce((a, b) => a + b, 0) / 64;
  }

  const estimatedQuality = Math.max(1, Math.min(100, Math.round(100 - avgLum * 1.2)));

  // Double compression detection heuristic (non-monotonic matrix entries)
  let nonMonotonicCount = 0;
  for (let i = 1; i < lum.length; i++) {
    if (lum[i] < lum[i - 1] && lum[i] > 1) nonMonotonicCount++;
  }
  const doubleCompressionLikely = nonMonotonicCount > 12;

  if (doubleCompressionLikely) {
    notes.push("⚠ High variance in DQT quantization steps indicates potential double JPEG compression.");
  } else {
    notes.push("Standard single-pass JPEG quantization table profile.");
  }

  return {
    hasDqt: true,
    tables,
    estimatedQuality,
    doubleCompressionLikely,
    notes,
  };
}
