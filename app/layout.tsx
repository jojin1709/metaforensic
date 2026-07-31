import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MetaForensic — Browser Image Forensics & OSINT Suite",
  description:
    "Autonomous 100% client-side image forensics & OSINT lab. Extract EXIF/GPS, Error Level Analysis (ELA) heatmaps, LSB steganography bit planes, Solar OSINT, DQT matrices, and SHA-256 legal PDF evidence reports.",
  keywords: [
    "metaforensic",
    "image forensics",
    "osint tools",
    "exif extractor",
    "steganography online",
    "error level analysis",
    "ela heatmap",
    "gps metadata extractor",
    "digital forensics tool",
    "jojin john",
    "browser image forensics",
    "photo manipulation detector",
    "dhash perceptual hash",
    "c2pa verifier",
    "solar osint"
  ],
  authors: [{ name: "JOJIN JOHN", url: "https://www.linkedin.com/in/jojin-john/" }],
  creator: "JOJIN JOHN",
  publisher: "MetaForensic Lab",
  metadataBase: new URL("https://metaforensic.vercel.app"),
  alternates: {
    canonical: "https://metaforensic.vercel.app",
  },
  openGraph: {
    title: "MetaForensic — Browser Image Forensics & OSINT Suite",
    description:
      "100% Client-Side Privacy-First Image Forensics Lab. Extract EXIF/GPS, ELA heatmaps, LSB stego bit-planes, and PDF evidence reports.",
    url: "https://metaforensic.vercel.app",
    siteName: "MetaForensic",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "MetaForensic Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MetaForensic — Browser Image Forensics & OSINT Suite",
    description: "100% Client-Side Privacy-First Image Forensics Lab by JOJIN JOHN.",
    images: ["/logo.png"],
    creator: "@jojin1709",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "MetaForensic",
  url: "https://metaforensic.vercel.app",
  author: {
    "@type": "Person",
    name: "JOJIN JOHN",
    url: "https://www.linkedin.com/in/jojin-john/",
  },
  description:
    "Autonomous 100% client-side image forensics & OSINT lab. Extract EXIF/GPS, Error Level Analysis (ELA) heatmaps, LSB steganography bit planes, Solar OSINT, DQT matrices, and SHA-256 legal PDF evidence reports.",
  applicationCategory: "SecurityApplication",
  operatingSystem: "All",
  browserRequirements: "Requires WebGL, HTML5 Canvas, WebAssembly",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#FF4D3D" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-body bg-void text-paper min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
