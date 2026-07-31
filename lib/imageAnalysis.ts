// Client-side Error Level Analysis and perceptual hashing.
// All processing happens in-browser via <canvas> — no data is ever uploaded anywhere.

export async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export async function runELA(
  img: HTMLImageElement,
  quality = 0.9,
  amplify = 12
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const original = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const recompressedUrl = canvas.toDataURL("image/jpeg", quality);
  const recompressedImg = await new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = recompressedUrl;
  });

  const cCanvas = document.createElement("canvas");
  cCanvas.width = canvas.width;
  cCanvas.height = canvas.height;
  const cCtx = cCanvas.getContext("2d")!;
  cCtx.drawImage(recompressedImg, 0, 0);
  const compressed = cCtx.getImageData(0, 0, cCanvas.width, cCanvas.height);

  const outCanvas = document.createElement("canvas");
  outCanvas.width = canvas.width;
  outCanvas.height = canvas.height;
  const outCtx = outCanvas.getContext("2d")!;
  const outData = outCtx.createImageData(canvas.width, canvas.height);

  const a = original.data;
  const b = compressed.data;
  const out = outData.data;
  for (let i = 0; i < a.length; i += 4) {
    const dr = Math.abs(a[i] - b[i]) * amplify;
    const dg = Math.abs(a[i + 1] - b[i + 1]) * amplify;
    const db = Math.abs(a[i + 2] - b[i + 2]) * amplify;
    out[i] = Math.min(255, dr);
    out[i + 1] = Math.min(255, dg);
    out[i + 2] = Math.min(255, db);
    out[i + 3] = 255;
  }
  outCtx.putImageData(outData, 0, 0);
  return outCanvas.toDataURL("image/png");
}

// Difference hash (dHash) — cheap perceptual fingerprint for spotting
// duplicate / re-uploaded images across a session.
export async function computeDHash(img: HTMLImageElement): Promise<string> {
  const w = 9;
  const h = 8;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  const gray: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    gray.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
  }

  let bits = "";
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w - 1; col++) {
      const left = gray[row * w + col];
      const right = gray[row * w + col + 1];
      bits += left > right ? "1" : "0";
    }
  }

  let hex = "";
  for (let i = 0; i < bits.length; i += 4) {
    hex += parseInt(bits.slice(i, i + 4).padEnd(4, "0"), 2).toString(16);
  }
  return hex;
}

export function hammingDistanceHex(a: string, b: string): number {
  if (a.length !== b.length) return Infinity;
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    const x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    dist += x.toString(2).split("1").length - 1;
  }
  return dist;
}
