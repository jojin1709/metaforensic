import { MetadataRoute } from "next";

export const revalidate = 86400; // Cache sitemap for 24 hours at the CDN edge for instant 0ms load

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://metaforensic.vercel.app",
      lastModified: "2026-07-31T00:00:00.000Z",
      changeFrequency: "weekly",
      priority: 1.0,
    },
  ];
}
