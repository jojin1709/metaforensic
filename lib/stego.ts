export function renderLSBBitPlane(
  img: HTMLImageElement,
  channel: "R" | "G" | "B" | "RGB",
  bitPosition: number
): string {
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const bitMask = 1 << bitPosition;

  for (let i = 0; i < data.length; i += 4) {
    const rBit = (data[i] & bitMask) ? 255 : 0;
    const gBit = (data[i + 1] & bitMask) ? 255 : 0;
    const bBit = (data[i + 2] & bitMask) ? 255 : 0;

    if (channel === "R") {
      data[i] = rBit; data[i + 1] = rBit; data[i + 2] = rBit;
    } else if (channel === "G") {
      data[i] = gBit; data[i + 1] = gBit; data[i + 2] = gBit;
    } else if (channel === "B") {
      data[i] = bBit; data[i + 1] = bBit; data[i + 2] = bBit;
    } else {
      data[i] = rBit; data[i + 1] = gBit; data[i + 2] = bBit;
    }
    data[i + 3] = 255;
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL("image/png");
}

export function extractBinaryStrings(buffer: ArrayBuffer, minLength: number = 4): string[] {
  const bytes = new Uint8Array(buffer);
  const strings: string[] = [];
  let current = "";

  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    // Printable ASCII character range: 32 to 126
    if (b >= 32 && b <= 126) {
      current += String.fromCharCode(b);
    } else {
      if (current.length >= minLength) {
        strings.push(current);
      }
      current = "";
    }
  }
  if (current.length >= minLength) {
    strings.push(current);
  }

  // Deduplicate and filter out common noise
  return Array.from(new Set(strings)).filter(
    (s) => !/^[0-9]+$/.test(s) && s.trim().length >= minLength
  ).slice(0, 100);
}

export interface HexRow {
  offsetStr: string;
  hexStr: string;
  asciiStr: string;
}

export function getHexDump(buffer: ArrayBuffer, maxBytes: number = 512): HexRow[] {
  const bytes = new Uint8Array(buffer.slice(0, maxBytes));
  const rows: HexRow[] = [];

  for (let i = 0; i < bytes.length; i += 16) {
    const chunk = bytes.subarray(i, i + 16);
    const offsetStr = i.toString(16).padStart(8, "0");

    let hexStr = "";
    let asciiStr = "";

    for (let j = 0; j < 16; j++) {
      if (j < chunk.length) {
        const b = chunk[j];
        hexStr += b.toString(16).padStart(2, "0") + " ";
        asciiStr += b >= 32 && b <= 126 ? String.fromCharCode(b) : ".";
      } else {
        hexStr += "   ";
      }
    }

    rows.push({ offsetStr, hexStr, asciiStr });
  }

  return rows;
}
