// Low-level byte inspection of the raw file — looks past what EXIF exposes
// and into the container itself for structural anomalies.

export interface FileStructureResult {
  format: "JPEG" | "PNG" | "OTHER";
  fileSizeBytes: number;
  eofOffset: number | null;
  trailingBytes: number;
  trailingHexPreview: string | null;
  dqtSegmentCount: number;
  appSegments: string[];
  recompressionLikely: boolean;
  notes: string[];
}

function toHex(bytes: Uint8Array, start: number, len: number): string {
  const slice = bytes.slice(start, start + len);
  return Array.from(slice)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");
}

export async function analyzeFileStructure(file: File): Promise<FileStructureResult> {
  const buf = new Uint8Array(await file.arrayBuffer());
  const notes: string[] = [];
  const appSegments: string[] = [];

  const isJpeg = buf[0] === 0xff && buf[1] === 0xd8;
  const isPng =
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47;

  if (isJpeg) {
    let offset = 2;
    let dqtCount = 0;
    let lastEoi: number | null = null;

    while (offset < buf.length - 1) {
      if (buf[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = buf[offset + 1];

      if (marker === 0xd9) {
        // EOI marker
        lastEoi = offset + 2;
        offset += 2;
        continue;
      }
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        offset += 2;
        continue;
      }
      if (offset + 3 >= buf.length) break;
      const segLen = (buf[offset + 2] << 8) | buf[offset + 3];

      if (marker === 0xdb) dqtCount++;
      if (marker >= 0xe0 && marker <= 0xef) {
        appSegments.push(`APP${marker - 0xe0}`);
      }
      if (marker === 0xda) {
        // Start of Scan — entropy-coded data follows, no length-prefixed
        // segments until we hit the next real marker or EOI. Scan forward
        // byte-by-byte respecting stuffed 0xFF00 bytes.
        offset += 2 + segLen;
        while (offset < buf.length - 1) {
          if (buf[offset] === 0xff && buf[offset + 1] !== 0x00 && !(buf[offset+1] >= 0xd0 && buf[offset+1] <= 0xd7)) {
            break;
          }
          offset++;
        }
        continue;
      }
      offset += 2 + segLen;
    }

    const eofOffset = lastEoi;
    const trailingBytes = eofOffset !== null ? buf.length - eofOffset : 0;

    notes.push(
      dqtCount > 4
        ? `${dqtCount} quantization tables detected — image has likely been re-encoded multiple times (chroma + luma tables typically come in pairs; extra sets suggest repeated JPEG saves).`
        : `${dqtCount} quantization table set(s) found — consistent with a single encoding pass.`
    );

    if (trailingBytes > 8) {
      notes.push(
        `${trailingBytes} bytes found after the final End-Of-Image marker. This is not part of the visible image and can indicate appended data (metadata, a hidden payload, or steganographic content).`
      );
    } else {
      notes.push("No meaningful trailing data after the End-Of-Image marker.");
    }

    return {
      format: "JPEG",
      fileSizeBytes: buf.length,
      eofOffset,
      trailingBytes,
      trailingHexPreview:
        trailingBytes > 0 && eofOffset !== null
          ? toHex(buf, eofOffset, Math.min(64, trailingBytes))
          : null,
      dqtSegmentCount: dqtCount,
      appSegments: Array.from(new Set(appSegments)),
      recompressionLikely: dqtCount > 4,
      notes,
    };
  }

  if (isPng) {
    // Find IEND chunk
    let offset = 8;
    let iendEnd: number | null = null;
    const chunkTypes: string[] = [];
    while (offset < buf.length - 8) {
      const len = (buf[offset] << 24) | (buf[offset + 1] << 16) | (buf[offset + 2] << 8) | buf[offset + 3];
      const type = String.fromCharCode(buf[offset + 4], buf[offset + 5], buf[offset + 6], buf[offset + 7]);
      chunkTypes.push(type);
      offset += 8 + len + 4; // length + type + data + crc
      if (type === "IEND") {
        iendEnd = offset;
        break;
      }
      if (len < 0 || offset > buf.length) break;
    }
    const trailingBytes = iendEnd !== null ? buf.length - iendEnd : 0;
    if (trailingBytes > 0) {
      notes.push(
        `${trailingBytes} bytes found after the PNG IEND chunk — data appended past the point any standard viewer reads.`
      );
    } else {
      notes.push("No trailing data after IEND — file ends cleanly.");
    }
    notes.push(`Chunk sequence: ${chunkTypes.join(", ")}`);

    return {
      format: "PNG",
      fileSizeBytes: buf.length,
      eofOffset: iendEnd,
      trailingBytes,
      trailingHexPreview:
        trailingBytes > 0 && iendEnd !== null ? toHex(buf, iendEnd, Math.min(64, trailingBytes)) : null,
      dqtSegmentCount: 0,
      appSegments: chunkTypes,
      recompressionLikely: false,
      notes,
    };
  }

  return {
    format: "OTHER",
    fileSizeBytes: buf.length,
    eofOffset: null,
    trailingBytes: 0,
    trailingHexPreview: null,
    dqtSegmentCount: 0,
    appSegments: [],
    recompressionLikely: false,
    notes: ["File structure inspection currently supports JPEG and PNG containers only."],
  };
}
