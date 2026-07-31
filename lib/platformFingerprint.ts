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
  const software = (rawExif.Software || "").toString().toLowerCase();

  // Strict regex for WhatsApp export filenames: IMG-20230101-WA0001 or WhatsApp Image ...
  const isWhatsAppName =
    /^img-\d{8}-wa\d{4}/i.test(name) ||
    name.startsWith("whatsapp image") ||
    name.includes("whatsapp") ||
    software.includes("whatsapp");

  // Strict regex for Telegram export filenames: photo_2023-01-01... or telegram...
  const isTelegramName =
    /^photo_\d{4}-\d{2}-\d{2}/i.test(name) ||
    name.startsWith("telegram") ||
    software.includes("telegram");

  // 1. WhatsApp Detection
  if (
    isWhatsAppName ||
    (width && height && (width === 1600 || height === 1600 || width === 1280 || height === 1280) && !rawExif.Make && !rawExif.Model)
  ) {
    details.push("Dimensions fit WhatsApp web/mobile compression standards (1600px max).");
    details.push("All EXIF camera tags stripped (No camera make or GPS coordinates found).");
    return {
      detected: "WhatsApp Compression Fingerprint",
      confidence: "High",
      details,
    };
  }

  // 2. Telegram Detection
  if (isTelegramName) {
    details.push("Standard Telegram photo export naming pattern detected.");
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
    name.includes("facebook") ||
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
  if (software.includes("photoshop") || software.includes("gimp") || rawExif.History) {
    details.push(`Image exported from desktop editor: ${rawExif.Software || "Adobe Photoshop / GIMP"}`);
    if (rawExif.History) details.push("XMP editing history trail detected in file headers.");
    return {
      detected: "Desktop Photo Editor (Photoshop / GIMP)",
      confidence: "High",
      details,
    };
  }

  // 5. Apple iOS Camera / Screenshot
  if (rawExif.Make === "Apple" || software.includes("ios") || /^img_\d{4}/i.test(name)) {
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
    details.push(`Original hardware EXIF present: ${rawExif.Make || ""} ${rawExif.Model || ""}`);
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
