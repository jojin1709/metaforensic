import exifr from "exifr";

export interface TimestampEntry {
  label: string;
  value: string;
}

export interface ExifResult {
  raw: Record<string, any>;
  make?: string;
  model?: string;
  lensModel?: string;
  software?: string;
  timestamps: TimestampEntry[];
  timestampMismatch: boolean;
  gps?: { lat: number; lon: number; altitude?: number };
  orientation?: string;
  exposure?: string;
  iso?: string;
  focalLength?: string;
  flash?: string;
  colorSpace?: string;
  hasIcc: boolean;
  hasIptc: boolean;
  width?: number;
  height?: number;
}

function fmtDate(d: any): string | null {
  if (!d) return null;
  try {
    const date = d instanceof Date ? d : new Date(d);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().replace("T", " ").replace("Z", " UTC");
  } catch {
    return null;
  }
}

export async function extractExif(file: File): Promise<ExifResult> {
  const raw =
    (await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: true,
      iptc: true,
      icc: true,
      jfif: true,
      ihdr: true,
      xmp: true,
      translateValues: true,
      reviveValues: true,
    })) || {};

  const timestamps: TimestampEntry[] = [];
  const dtOriginal = fmtDate(raw.DateTimeOriginal);
  const dtDigitized = fmtDate(raw.CreateDate || raw.DateTimeDigitized);
  const dtModified = fmtDate(raw.ModifyDate || raw.DateTime);

  if (dtOriginal) timestamps.push({ label: "Captured (Original)", value: dtOriginal });
  if (dtDigitized) timestamps.push({ label: "Digitized", value: dtDigitized });
  if (dtModified) timestamps.push({ label: "Last Modified", value: dtModified });

  const uniqueDates = new Set(timestamps.map((t) => t.value.split(" ")[0]));
  const timestampMismatch = timestamps.length > 1 && uniqueDates.size > 1;

  let gps: ExifResult["gps"];
  if (typeof raw.latitude === "number" && typeof raw.longitude === "number") {
    gps = { lat: raw.latitude, lon: raw.longitude, altitude: raw.GPSAltitude };
  }

  return {
    raw,
    make: raw.Make,
    model: raw.Model,
    lensModel: raw.LensModel || raw.LensInfo,
    software: raw.Software,
    timestamps,
    timestampMismatch,
    gps,
    orientation: raw.Orientation,
    exposure: raw.ExposureTime ? `1/${Math.round(1 / raw.ExposureTime)}s` : undefined,
    iso: raw.ISO ? String(raw.ISO) : undefined,
    focalLength: raw.FocalLength ? `${raw.FocalLength}mm` : undefined,
    flash: raw.Flash,
    colorSpace: raw.ColorSpace,
    hasIcc: !!raw.ProfileDescription || !!raw.ColorSpaceData,
    hasIptc: !!raw.Headline || !!raw.Byline || !!raw.Caption,
    width: raw.ExifImageWidth || raw.ImageWidth,
    height: raw.ExifImageHeight || raw.ImageHeight,
  };
}

export async function extractThumbnail(file: File): Promise<string | null> {
  try {
    const buf = await exifr.thumbnail(file);
    if (!buf) return null;
    const blob = new Blob([new Uint8Array(buf)], { type: "image/jpeg" });
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}
