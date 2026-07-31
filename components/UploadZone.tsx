"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ScanEye, UploadCloud, ShieldCheck, AlertTriangle } from "lucide-react";

interface Props {
  onFile: (file: File) => void;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB limit

export default function UploadZone({ onFile }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndProcess = useCallback(
    (file: File) => {
      setErrorMsg(null);
      if (file.size > MAX_FILE_SIZE) {
        setErrorMsg(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 25MB limit.`);
        return;
      }
      onFile(file);
    },
    [onFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) validateAndProcess(file);
    },
    [validateAndProcess]
  );

  // Paste from clipboard support
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) validateAndProcess(file);
          break;
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [validateAndProcess]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

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

        {errorMsg && (
          <div className="mt-6 p-3 rounded-xl bg-safelight/10 border border-safelight/40 text-safelight font-mono text-xs inline-flex items-center gap-2">
            <AlertTriangle size={15} /> {errorMsg}
          </div>
        )}

        <motion.div
          tabIndex={0}
          role="button"
          aria-label="Upload evidence image"
          onKeyDown={handleKeyDown}
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
          className="mt-12 relative mx-auto max-w-lg cursor-pointer rounded-2xl border-2 border-dashed bg-panel/60 backdrop-blur-sm px-8 py-14 group transition-colors focus:outline-none focus:border-safelight"
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) validateAndProcess(file);
            }}
          />
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-safelight/20 blur-xl group-hover:bg-safelight/30 transition-colors" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="MetaForensic Logo"
                className="relative w-16 h-16 rounded-2xl object-cover border border-safelightDim/50 shadow-2xl transition-transform group-hover:scale-105"
              />
            </div>
            <div>
              <p className="font-medium text-paper">
                {isDragging ? "Drop it — running the scan" : "Drag a photo here, paste from clipboard, or click"}
              </p>
              <p className="text-sm text-muted mt-1">JPEG · PNG · HEIC · TIFF — up to 25MB</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
