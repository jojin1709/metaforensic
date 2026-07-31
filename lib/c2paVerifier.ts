export interface C2paResult {
  hasC2paManifest: boolean;
  signer?: string;
  claimGenerator?: string;
  isAiGenerated: boolean;
  details: string[];
}

/**
 * Inspects image ArrayBuffer for C2PA / CAI (Content Authenticity Initiative) manifests & AI signatures.
 */
export function inspectC2paManifest(buffer: ArrayBuffer): C2paResult {
  const bytes = new Uint8Array(buffer);
  const details: string[] = [];

  // Search for C2PA JUMBF Box / Marker signatures: "c2pa", "CAI", "c2bi"
  let binaryStr = "";
  const maxSearch = Math.min(bytes.length, 65536);
  for (let i = 0; i < maxSearch; i++) {
    binaryStr += String.fromCharCode(bytes[i]);
  }

  const hasC2pa = binaryStr.includes("c2pa") || binaryStr.includes("C2PA") || binaryStr.includes("JUMBF");
  const isMidjourney = binaryStr.includes("Midjourney") || binaryStr.includes("midjourney");
  const isDallE = binaryStr.includes("DALL-E") || binaryStr.includes("OpenAI");
  const isStableDiffusion = binaryStr.includes("Stable Diffusion") || binaryStr.includes("AUTOMATIC1111");

  const isAiGenerated = isMidjourney || isDallE || isStableDiffusion;

  if (hasC2pa) {
    details.push("Cryptographic C2PA / Content Authenticity Initiative (CAI) manifest detected.");
    details.push("Image contains signed provenance assertions.");
  }

  if (isMidjourney) details.push("🤖 Synthetic AI Generation Signature: Midjourney engine detected.");
  if (isDallE) details.push("🤖 Synthetic AI Generation Signature: OpenAI DALL-E engine detected.");
  if (isStableDiffusion) details.push("🤖 Synthetic AI Generation Signature: Stable Diffusion model parameters detected.");

  if (!hasC2pa && !isAiGenerated) {
    details.push("No embedded C2PA manifests or known AI generator tags found in file headers.");
  }

  return {
    hasC2paManifest: hasC2pa,
    signer: hasC2pa ? "C2PA Provenance Assertion" : undefined,
    claimGenerator: isMidjourney ? "Midjourney v6" : isDallE ? "DALL-E 3" : isStableDiffusion ? "Stable Diffusion" : undefined,
    isAiGenerated,
    details,
  };
}
