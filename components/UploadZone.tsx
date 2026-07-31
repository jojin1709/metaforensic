"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ScanEye, UploadCloud, ShieldCheck } from "lucide-react";

interface Props {
  onFile: (file: File) => void;
}

export default function UploadZone({ onFile }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) onFile(file);
    },
    [onFile]
  );

  return (
    <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24">
      <div className="absolute inset-0 bg-grid-fade pointer-events-none" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-safelight/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-data/80 border border-dataDim/50 bg-data/5 rounded-full px-3 py-1 mb-8">
          <ShieldCheck size={14} />
          <span>100% client-side · your images never leave this browser</span>
        </div>

        <h1 className="font-display text-4xl md:text-6xl font-semibold tracking-tight text-paper leading-[1.05]">
          Every photo
          <br />
          <span className="text-safelight">tells on itself.</span>
        </h1>

        <p className="mt-6 text-muted text-base md:text-lg max-w-xl mx-auto leading-relaxed">
          Drop an image and MetaForensic pulls the device, the GPS coordinates,
          the timestamps, the hidden thumbnail, and the compression fingerprints
          it left behind — the same evidence trail an OSINT analyst would chase by hand.
        </p>

        <motion.div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          animate={{
            borderColor: isDragging ? "#FF4D3D" : "#22262B",
            scale: isDragging ? 1.01 : 1,
          }}
          className="mt-12 relative mx-auto max-w-lg cursor-pointer rounded-2xl border-2 border-dashed bg-panel/60 backdrop-blur-sm px-8 py-14 group transition-colors"
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFile(file);
            }}
          />
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-safelight/20 blur-xl group-hover:bg-safelight/30 transition-colors" />
              <div className="relative w-16 h-16 rounded-full border border-panelBorder bg-void flex items-center justify-center">
                {isDragging ? (
                  <ScanEye size={26} className="text-safelight" />
                ) : (
                  <UploadCloud size={24} className="text-data" />
                )}
              </div>
            </div>
            <div>
              <p className="font-medium text-paper">
                {isDragging ? "Drop it — running the scan" : "Drag a photo here, or click to browse"}
              </p>
              <p className="text-sm text-muted mt-1">JPEG · PNG · HEIC · TIFF — up to 25MB</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
