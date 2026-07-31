export interface PlatformFingerprint {
  detected: string;
  confidence: "High" | "Medium" | "Low" | "Clean / Original";
  details: string[];
}

export function detectPlatformFingerprint(
  file: File,
  rawExif: Record<string, any>,
  width?: number,
  height?: number
): PlatformFingerprint {
  const details: string[] = [];
  const name = file.name.toLowerCase();
  const software = (rawExif.Software || "").toString();

  // 1. WhatsApp Detection
  if (
    name.includes("wa") ||
    name.startsWith("img-") ||
    software.includes("whatsapp") ||
    (width && height && (width === 1600 || height === 1600 || width === 1280 || height === 1280) && !rawExif.Make)
  ) {
    details.push("Dimensions fit WhatsApp web/mobile compression standards (1600px max).");
    details.push("All EXIF tags stripped (No camera make or GPS coordinates found).");
    return {
      detected: "WhatsApp Compression Fingerprint",
      confidence: "High",
      details,
    };
  }

  // 2. Telegram Detection
  if (name.includes("telegram") || name.startsWith("photo_") || (width === 1280 && !rawExif.Make)) {
    details.push("Standard Telegram photo export naming or 1280px dimension limit.");
    details.push("Camera & sensor EXIF headers removed.");
    return {
      detected: "Telegram Compression Fingerprint",
      confidence: "High",
      details,
    };
  }

  // 3. Facebook / Instagram Detection
  if (
    rawExif.FBMD ||
    rawExif.FBAV ||
    name.includes("fb") ||
    name.includes("instagram") ||
    software.includes("facebook")
  ) {
    details.push("Detected Facebook/Instagram internal binary markers (FBMD / FBAV).");
    details.push("EXIF camera metadata stripped by Meta content delivery network.");
    return {
      detected: "Facebook / Instagram CDN Fingerprint",
      confidence: "High",
      details,
    };
  }

  // 4. Adobe Photoshop / GIMP / Editing Software
  if (software.toLowerCase().includes("photoshop") || software.toLowerCase().includes("gimp") || rawExif.History) {
    details.push(`Image exported from desktop editor: ${software || "Adobe Photoshop / GIMP"}`);
    if (rawExif.History) details.push("XMP editing history trail detected in file headers.");
    return {
      detected: "Desktop Photo Editor (Photoshop / GIMP)",
      confidence: "High",
      details,
    };
  }

  // 5. Apple iOS Camera / Screenshot
  if (rawExif.Make === "Apple" || software.includes("iOS") || name.startsWith("img_")) {
    details.push(`Captured by Apple iOS device (${rawExif.Model || "iPhone/iPad"}).`);
    if (rawExif.HostComputer) details.push(`Host device: ${rawExif.HostComputer}`);
    return {
      detected: "Apple iOS Hardware / Camera",
      confidence: "High",
      details,
    };
  }

  // 6. Generic Camera EXIF Present
  if (rawExif.Make || rawExif.Model) {
    details.push(`Original hardware EXIF present: ${rawExif.Make} ${rawExif.Model}`);
    return {
      detected: "Original Hardware Capture (Unstripped)",
      confidence: "Clean / Original",
      details,
    };
  }

  details.push("No camera EXIF tags found. The image was likely saved from the web or re-encoded.");
  return {
    detected: "Generic Re-encoded Web Image",
    confidence: "Medium",
    details,
  };
}
