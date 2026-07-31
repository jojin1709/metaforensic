import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MetaForensic — Image Metadata & Forensics Lab",
  description:
    "Drop a photo, see what it's hiding: device, GPS, timestamps, edit history, and recompression artifacts. Fully client-side — nothing you upload leaves your browser.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-body bg-void text-paper min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
