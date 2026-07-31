export type ChannelType = "R" | "G" | "B" | "Alpha" | "H" | "S" | "V" | "Y" | "Cb" | "Cr";

export function renderColorChannel(img: HTMLImageElement, channel: ChannelType): string {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (channel === "R") {
      data[i] = r; data[i + 1] = r; data[i + 2] = r;
    } else if (channel === "G") {
      data[i] = g; data[i + 1] = g; data[i + 2] = g;
    } else if (channel === "B") {
      data[i] = b; data[i + 1] = b; data[i + 2] = b;
    } else if (channel === "Alpha") {
      data[i] = a; data[i + 1] = a; data[i + 2] = a; data[i + 3] = 255;
    } else if (channel === "H" || channel === "S" || channel === "V") {
      const rf = r / 255, gf = g / 255, bf = b / 255;
      const max = Math.max(rf, gf, bf), min = Math.min(rf, gf, bf);
      const d = max - min;
      let h = 0;
      const v = max;
      const s = max === 0 ? 0 : d / max;

      if (max !== min) {
        switch (max) {
          case rf: h = (gf - bf) / d + (gf < bf ? 6 : 0); break;
          case gf: h = (bf - rf) / d + 2; break;
          case bf: h = (rf - gf) / d + 4; break;
        }
        h /= 6;
      }

      let val = 0;
      if (channel === "H") val = Math.round(h * 255);
      else if (channel === "S") val = Math.round(s * 255);
      else if (channel === "V") val = Math.round(v * 255);

      data[i] = val; data[i + 1] = val; data[i + 2] = val;
    } else if (channel === "Y" || channel === "Cb" || channel === "Cr") {
      const y = 0.299 * r + 0.587 * g + 0.114 * b;
      const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
      const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

      let val = y;
      if (channel === "Cb") val = cb;
      else if (channel === "Cr") val = cr;

      val = Math.max(0, Math.min(255, Math.round(val)));
      data[i] = val; data[i + 1] = val; data[i + 2] = val;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL("image/png");
}

export function renderLuminanceGradient(img: HTMLImageElement): string {
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.drawImage(img, 0, 0);
  const srcData = ctx.getImageData(0, 0, width, height);
  const src = srcData.data;

  const gray = new Float32Array(width * height);
  for (let i = 0; i < src.length; i += 4) {
    gray[i / 4] = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
  }

  const outData = ctx.createImageData(width, height);
  const out = outData.data;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;

      // Sobel operators
      const gx =
        -gray[idx - width - 1] + gray[idx - width + 1]
        - 2 * gray[idx - 1] + 2 * gray[idx + 1]
        - gray[idx + width - 1] + gray[idx + width + 1];

      const gy =
        -gray[idx - width - 1] - 2 * gray[idx - width] - gray[idx - width + 1]
        + gray[idx + width - 1] + 2 * gray[idx + width] + gray[idx + width + 1];

      const mag = Math.min(255, Math.sqrt(gx * gx + gy * gy) * 1.5);
      const pIdx = idx * 4;

      out[pIdx] = mag;
      out[pIdx + 1] = mag * 0.8;
      out[pIdx + 2] = mag * 0.4;
      out[pIdx + 3] = 255;
    }
  }

  ctx.putImageData(outData, 0, 0);
  return canvas.toDataURL("image/png");
}

export function renderHighPassNoise(img: HTMLImageElement, gain: number = 4.0): string {
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.drawImage(img, 0, 0);
  const srcData = ctx.getImageData(0, 0, width, height);
  const src = srcData.data;

  const outData = ctx.createImageData(width, height);
  const out = outData.data;

  // Simple 3x3 box blur high pass filter
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            sum += src[((y + dy) * width + (x + dx)) * 4 + c];
          }
        }
        const avg = sum / 9;
        const diff = (src[idx + c] - avg) * gain + 128;
        out[idx + c] = Math.max(0, Math.min(255, Math.round(diff)));
      }
      out[idx + 3] = 255;
    }
  }

  ctx.putImageData(outData, 0, 0);
  return canvas.toDataURL("image/png");
}

export function detectCopyMoveClones(img: HTMLImageElement): { canvasUrl: string; matchCount: number } {
  const canvas = document.createElement("canvas");
  // Downscale canvas to max 400px width for fast block matching computation
  const maxDim = 400;
  let w = img.naturalWidth || img.width;
  let h = img.naturalHeight || img.height;
  if (w > maxDim || h > maxDim) {
    if (w > h) {
      h = Math.round((h * maxDim) / w);
      w = maxDim;
    } else {
      w = Math.round((w * maxDim) / h);
      h = maxDim;
    }
  }

  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { canvasUrl: "", matchCount: 0 };

  ctx.drawImage(img, 0, 0, w, h);
  const srcData = ctx.getImageData(0, 0, w, h);
  const src = srcData.data;

  // Render original in background
  ctx.globalAlpha = 0.6;
  ctx.drawImage(img, 0, 0, w, h);
  ctx.globalAlpha = 1.0;

  const blockSize = 8;
  const blocks: { x: number; y: number; meanR: number; meanG: number; meanB: number }[] = [];

  for (let y = 0; y <= h - blockSize; y += 4) {
    for (let x = 0; x <= w - blockSize; x += 4) {
      let sumR = 0, sumG = 0, sumB = 0;
      for (let by = 0; by < blockSize; by++) {
        for (let bx = 0; bx < blockSize; bx++) {
          const idx = ((y + by) * w + (x + bx)) * 4;
          sumR += src[idx];
          sumG += src[idx + 1];
          sumB += src[idx + 2];
        }
      }
      const count = blockSize * blockSize;
      blocks.push({
        x,
        y,
        meanR: sumR / count,
        meanG: sumG / count,
        meanB: sumB / count,
      });
    }
  }

  let matchCount = 0;
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#ff3b30";

  for (let i = 0; i < blocks.length; i++) {
    const b1 = blocks[i];
    for (let j = i + 1; j < blocks.length; j++) {
      const b2 = blocks[j];
      const dist = Math.sqrt((b1.x - b2.x) ** 2 + (b1.y - b2.y) ** 2);
      if (dist < 24) continue; // Skip immediate neighbors

      const colorDiff = Math.abs(b1.meanR - b2.meanR) + Math.abs(b1.meanG - b2.meanG) + Math.abs(b1.meanB - b2.meanB);
      if (colorDiff < 3.0) {
        matchCount++;
        if (matchCount <= 50) {
          ctx.beginPath();
          ctx.moveTo(b1.x + 4, b1.y + 4);
          ctx.lineTo(b2.x + 4, b2.y + 4);
          ctx.stroke();

          ctx.fillStyle = "rgba(255, 59, 48, 0.4)";
          ctx.fillRect(b1.x, b1.y, blockSize, blockSize);
          ctx.fillRect(b2.x, b2.y, blockSize, blockSize);
        }
      }
    }
  }

  return { canvasUrl: canvas.toDataURL("image/png"), matchCount };
}
