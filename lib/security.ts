export interface SecurityCheckResult {
  isAllowed: boolean;
  reason?: string;
}

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/tiff",
  "image/bmp",
]);

const DANGEROUS_EXTENSIONS = new Set([
  "php", "phtml", "php3", "php4", "php5", "phps", "phar", "inc", "hhp", "pht",
  "exe", "sh", "bat", "cmd", "pl", "cgi", "py", "js", "vbs", "ps1", "wsf",
  "asp", "aspx", "jsp", "war", "dll", "so", "bin", "htaccess", "config", "env"
]);

/**
 * Sanitizes input text to prevent XSS (Cross-Site Scripting) injection.
 */
export function sanitizeText(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sanitizes filenames to prevent Path Traversal attacks (../ or \..\).
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[\/\\]/g, "_")
    .replace(/\.\.+/g, ".")
    .replace(/[^\w\.\-\s]/gi, "_");
}

/**
 * Validates file security against malicious RCE scripts, web shells, and unsafe MIME types.
 */
export async function validateFileSecurity(file: File): Promise<SecurityCheckResult> {
  const cleanName = sanitizeFilename(file.name);
  const ext = cleanName.split(".").pop()?.toLowerCase() || "";

  // 1. Block dangerous executable & web shell extensions
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return {
      isAllowed: false,
      reason: `Blocked executable script (.${ext}). Web shells and scripts are strictly rejected.`,
    };
  }

  // 2. MIME type whitelisting
  if (file.type && !ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
    return {
      isAllowed: false,
      reason: `Unsupported file type (${file.type}). Only valid image formats (JPEG, PNG, WEBP, TIFF, HEIC) are accepted.`,
    };
  }

  // 3. Binary Magic Byte Validation
  try {
    const headerBytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());

    const isJpeg = headerBytes[0] === 0xff && headerBytes[1] === 0xd8 && headerBytes[2] === 0xff;
    const isPng = headerBytes[0] === 0x89 && headerBytes[1] === 0x50 && headerBytes[2] === 0x4e && headerBytes[3] === 0x47;
    const isWebP = headerBytes[0] === 0x52 && headerBytes[1] === 0x49 && headerBytes[2] === 0x46 && headerBytes[3] === 0x46 && headerBytes[8] === 0x57;
    const isTiff = (headerBytes[0] === 0x49 && headerBytes[1] === 0x49) || (headerBytes[0] === 0x4d && headerBytes[1] === 0x4d);
    const isHeic = headerBytes[4] === 0x66 && headerBytes[5] === 0x74 && headerBytes[6] === 0x79 && headerBytes[7] === 0x70;

    if (!isJpeg && !isPng && !isWebP && !isTiff && !isHeic) {
      return {
        isAllowed: false,
        reason: "Invalid image header signature. File magic bytes do not match a recognized image container.",
      };
    }
  } catch {
    return {
      isAllowed: false,
      reason: "Failed to read binary container signature.",
    };
  }

  return { isAllowed: true };
}
