export function computeXorDiff(
  img1: HTMLImageElement,
  img2: HTMLImageElement
): { diffUrl: string; similarityScore: number } {
  const w1 = img1.naturalWidth || img1.width;
  const h1 = img1.naturalHeight || img1.height;
  const w2 = img2.naturalWidth || img2.width;
  const h2 = img2.naturalHeight || img2.height;

  const w = Math.min(w1, w2);
  const h = Math.min(h1, h2);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { diffUrl: "", similarityScore: 0 };

  // Render img1
  ctx.drawImage(img1, 0, 0, w, h);
  const data1 = ctx.getImageData(0, 0, w, h).data;

  // Render img2
  ctx.drawImage(img2, 0, 0, w, h);
  const data2 = ctx.getImageData(0, 0, w, h).data;

  const outData = ctx.createImageData(w, h);
  const out = outData.data;

  let totalDiff = 0;
  const pixelCount = w * h;

  for (let i = 0; i < data1.length; i += 4) {
    const diffR = Math.abs(data1[i] - data2[i]);
    const diffG = Math.abs(data1[i + 1] - data2[i + 1]);
    const diffB = Math.abs(data1[i + 2] - data2[i + 2]);
    const diffSum = diffR + diffG + diffB;

    totalDiff += diffSum / 3;

    if (diffSum > 10) {
      // Highlight changes in vivid neon red/yellow
      out[i] = 255;
      out[i + 1] = Math.min(255, diffSum * 2);
      out[i + 2] = 0;
      out[i + 3] = 255;
    } else {
      // Dim unchanged background
      const avg = (data1[i] + data1[i + 1] + data1[i + 2]) / 3;
      out[i] = avg * 0.2;
      out[i + 1] = avg * 0.2;
      out[i + 2] = avg * 0.2;
      out[i + 3] = 255;
    }
  }

  ctx.putImageData(outData, 0, 0);
  const avgDiffPerPixel = totalDiff / pixelCount;
  const similarityScore = Math.max(0, Math.min(100, Math.round(100 - (avgDiffPerPixel / 255) * 100)));

  return {
    diffUrl: canvas.toDataURL("image/png"),
    similarityScore,
  };
}
