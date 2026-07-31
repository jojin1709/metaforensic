export interface SolarCalculationResult {
  elevation: number; // in degrees (-90 to +90)
  azimuth: number;   // in degrees (0 to 360, North=0, East=90, South=180, West=270)
  isDaylight: boolean;
  solarNoonUtc: string;
  explanation: string;
}

/**
 * Calculates solar position (elevation & azimuth) from GPS coordinates and Date timestamp.
 * Based on standard NOAA solar position algorithms.
 */
export function calculateSolarPosition(
  lat: number,
  lon: number,
  date: Date
): SolarCalculationResult {
  const rad = Math.PI / 180;
  const deg = 180 / Math.PI;

  // Day of the year
  const startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1;

  // Time in UTC hours
  const hoursUtc = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;

  // Fractional year (rad)
  const gamma = (2 * Math.PI / 365) * (dayOfYear - 1 + (hoursUtc - 12) / 24);

  // Equation of Time (minutes)
  const eqtime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));

  // Solar Declination (rad)
  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  // Solar Time Offset (minutes)
  const timeOffset = eqtime + 4 * lon;

  // True Solar Time (minutes)
  const tst = hoursUtc * 60 + timeOffset;

  // Solar Hour Angle (deg)
  let ha = tst / 4 - 180;
  if (ha < -180) ha += 360;
  if (ha > 180) ha -= 360;

  const haRad = ha * rad;
  const latRad = lat * rad;

  // Solar Zenith Angle (rad)
  const csz =
    Math.sin(latRad) * Math.sin(decl) +
    Math.cos(latRad) * Math.cos(decl) * Math.cos(haRad);

  const zenithRad = Math.acos(Math.max(-1, Math.min(1, csz)));
  const elevation = 90 - zenithRad * deg;

  // Solar Azimuth Angle (deg)
  const azNum = -Math.sin(haRad);
  const azDen = Math.tan(decl) * Math.cos(latRad) - Math.sin(latRad) * Math.cos(haRad);
  let azimuth = Math.atan2(azNum, azDen) * deg;
  if (azimuth < 0) azimuth += 360;

  // Solar Noon UTC
  const solarNoonMinutes = 720 - 4 * lon - eqtime;
  const noonHours = Math.floor(solarNoonMinutes / 60);
  const noonMins = Math.floor(solarNoonMinutes % 60);
  const solarNoonUtc = `${noonHours.toString().padStart(2, "0")}:${noonMins.toString().padStart(2, "0")} UTC`;

  const isDaylight = elevation > 0;
  const explanation = isDaylight
    ? `Sun is at ${elevation.toFixed(1)}° elevation and ${azimuth.toFixed(1)}° azimuth (Compass Direction). Shadows point at ${(azimuth + 180) % 360}° azimuth.`
    : `Sun was below the horizon (${elevation.toFixed(1)}° elevation). Photo was captured during night or twilight hours.`;

  return {
    elevation,
    azimuth,
    isDaylight,
    solarNoonUtc,
    explanation,
  };
}
