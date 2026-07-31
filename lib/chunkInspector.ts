export interface ImageChunk {
  name: string;
  size: number;
  offset: number;
  description: string;
  isStandard: boolean;
}

export interface ChunkResult {
  format: "PNG" | "WEBP" | "JPEG" | "UNKNOWN";
  chunks: ImageChunk[];
  notes: string[];
}

export function inspectImageChunks(buffer: ArrayBuffer, filename: string): ChunkResult {
  const bytes = new Uint8Array(buffer);
  const chunks: ImageChunk[] = [];
  const notes: string[] = [];

  // Check PNG Signature: 89 50 4E 47 0D 0A 1A 0A
  const isPng =
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47;

  if (isPng) {
    let offset = 8;
    let foundIend = false;

    while (offset + 8 <= bytes.length) {
      const length =
        (bytes[offset] << 24) |
        (bytes[offset + 1] << 16) |
        (bytes[offset + 2] << 8) |
        bytes[offset + 3];

      const name = String.fromCharCode(
        bytes[offset + 4],
        bytes[offset + 5],
        bytes[offset + 6],
        bytes[offset + 7]
      );

      const isStandard = [
        "IHDR", "PLTE", "IDAT", "IEND", "tRNS", "cHRM", "gAMA", "iCCP",
        "sBIT", "sRGB", "tEXt", "zTXt", "iTXt", "bKGD", "hIST", "pHYs",
        "sSPL", "eXIf", "tIME"
      ].includes(name);

      let description = "Standard PNG chunk";
      if (name === "IHDR") description = "Image Header (dimensions, bit depth, color type)";
      else if (name === "IDAT") description = "Compressed Image Pixel Data";
      else if (name === "IEND") { description = "Image End Marker"; foundIend = true; }
      else if (name === "iCCP") description = "Embedded ICC Color Profile";
      else if (name === "eXIf") description = "EXIF Metadata Block";
      else if (name === "tEXt" || name === "zTXt" || name === "iTXt") description = "Text Metadata String Chunk";
      else if (!isStandard) description = "Non-standard custom chunk — potential steganography container";

      chunks.push({
        name,
        size: Math.max(0, length),
        offset,
        description,
        isStandard,
      });

      offset += 12 + Math.max(0, length); // 4 len + 4 name + data + 4 CRC
      if (name === "IEND") break;
    }

    if (foundIend && offset < bytes.length) {
      const extraBytes = bytes.length - offset;
      notes.push(`⚠ Detected ${extraBytes} trailing bytes after PNG IEND chunk (potential appended payload).`);
    } else {
      notes.push("Clean PNG container structure with no trailing bytes.");
    }

    return { format: "PNG", chunks, notes };
  }

  // Check WebP Signature: "RIFF" .... "WEBP"
  const isWebP =
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;

  if (isWebP) {
    let offset = 12;
    while (offset + 8 <= bytes.length) {
      const name = String.fromCharCode(
        bytes[offset],
        bytes[offset + 1],
        bytes[offset + 2],
        bytes[offset + 3]
      );
      const length =
        bytes[offset + 4] |
        (bytes[offset + 5] << 8) |
        (bytes[offset + 6] << 16) |
        (bytes[offset + 7] << 24);

      let description = "WebP RIFF chunk";
      if (name === "VP8 ") description = "Lossy Image Bitstream";
      else if (name === "VP8L") description = "Lossless Image Bitstream";
      else if (name === "VP8X") description = "Extended Header (Features, Alpha, EXIF)";
      else if (name === "EXIF") description = "EXIF Metadata Block";
      else if (name === "XMP ") description = "XMP Metadata Block";

      chunks.push({
        name,
        size: Math.max(0, length),
        offset,
        description,
        isStandard: true,
      });

      offset += 8 + Math.max(0, length) + (length % 2); // Padded to even byte
    }
    notes.push("Parsed WebP RIFF container structure.");
    return { format: "WEBP", chunks, notes };
  }

  return { format: "JPEG", chunks: [], notes: ["Container format is JPEG or non-chunked format."] };
}
