import { MetadataRoute } from "next";

export const revalidate = 86400; // Cache robots.txt for instant 0ms edge delivery

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://metaforensic.vercel.app/sitemap.xml",
  };
}
