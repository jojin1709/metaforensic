"use client";

import { useEffect, useState, useRef } from "react";
import { Sliders, Eye, Sun, Sparkles, Copy, ZoomIn } from "lucide-react";
import Card from "./Card";
import {
  ChannelType,
  renderColorChannel,
  renderLuminanceGradient,
  renderHighPassNoise,
  detectCopyMoveClones,
} from "@/lib/visualForensics";

interface Props {
  img: HTMLImageElement;
}

export default function VisualForensicsPanel({ img }: Props) {
  const [activeTab, setActiveTab] = useState<"channels" | "gradient" | "noise" | "clones">("channels");
  const [channel, setChannel] = useState<ChannelType>("R");
  const [renderedUrl, setRenderedUrl] = useState<string>("");
  const [cloneData, setCloneData] = useState<{ canvasUrl: string; matchCount: number } | null>(null);

  // Pixel Loupe State
  const [loupePos, setLoupePos] = useState<{ x: number; y: number; show: boolean }>({ x: 0, y: 0, show: false });
  const [pixelColor, setPixelColor] = useState<{ r: number; g: number; b: number; hex: string; x: number; y: number }>({
    r: 0, g: 0, b: 0, hex: "#000000", x: 0, y: 0,
  });

  const imageRef = useRef<HTMLImageElement>(null);
  const loupeCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!img) return;
    if (activeTab === "channels") {
      setRenderedUrl(renderColorChannel(img, channel));
    } else if (activeTab === "gradient") {
      setRenderedUrl(renderLuminanceGradient(img));
    } else if (activeTab === "noise") {
      setRenderedUrl(renderHighPassNoise(img));
    } else if (activeTab === "clones") {
      const res = detectCopyMoveClones(img);
      setCloneData(res);
      setRenderedUrl(res.canvasUrl);
    }
  }, [img, activeTab, channel]);

  // Pixel Loupe Cursor Inspector Handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor(e.clientX - rect.left);
    const y = Math.floor(e.clientY - rect.top);

    const naturalWidth = img.naturalWidth || img.width;
    const naturalHeight = img.naturalHeight || img.height;

    const scaleX = naturalWidth / rect.width;
    const scaleY = naturalHeight / rect.height;

    const imgX = Math.floor(x * scaleX);
    const imgY = Math.floor(y * scaleY);

    setLoupePos({ x, y, show: true });

    // Extract raw pixel color from offscreen canvas
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = naturalWidth;
    tempCanvas.height = naturalHeight;
    const tempCtx = tempCanvas.getContext("2d");
    if (tempCtx) {
      tempCtx.drawImage(img, 0, 0);
      const pixel = tempCtx.getImageData(imgX, imgY, 1, 1).data;
      const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`;
      setPixelColor({ r: pixel[0], g: pixel[1], b: pixel[2], hex, x: imgX, y: imgY });

      // Draw 15x15 pixel grid in magnifier loupe canvas
      if (loupeCanvasRef.current) {
        const lCtx = loupeCanvasRef.current.getContext("2d");
        if (lCtx) {
          lCtx.imageSmoothingEnabled = false;
          lCtx.clearRect(0, 0, 120, 120);
          lCtx.drawImage(tempCanvas, imgX - 7, imgY - 7, 15, 15, 0, 0, 120, 120);

          // Draw center targeting reticle
          lCtx.strokeStyle = "#ff3b30";
          lCtx.lineWidth = 1;
          lCtx.strokeRect(52, 52, 16, 16);
        }
      }
    }
  };

  return (
    <Card icon={Sliders} title="Advanced Pixel & Visual Forensics" tag="Color · Gradient · Noise · Clones">
      {/* Mode Sub-Header Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { id: "channels", label: "Color Channels", icon: Eye },
          { id: "gradient", label: "Luminance & Gradient", icon: Sun },
          { id: "noise", label: "High-Pass Noise Filter", icon: Sparkles },
          { id: "clones", label: "Copy-Move / Clone Detector", icon: Copy },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg border transition-colors ${
                activeTab === t.id
                  ? "bg-safelight text-void border-safelight"
                  : "bg-void border-panelBorder text-muted hover:text-paper"
              }`}
            >
              <Icon size={13} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Mode Controls */}
      {activeTab === "channels" && (
        <div className="flex flex-wrap items-center gap-1.5 mb-4 p-2 rounded-lg bg-void border border-panelBorder">
          <span className="text-xs font-mono text-muted mr-2">Isolated Channel:</span>
          {(["R", "G", "B", "Alpha", "H", "S", "V", "Y", "Cb", "Cr"] as ChannelType[]).map((c) => (
            <button
              key={c}
              onClick={() => setChannel(c)}
              className={`px-2 py-0.5 text-xs font-mono rounded ${
                channel === c ? "bg-data text-void font-bold" : "text-muted hover:text-paper"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Main Canvas View with Interactive Loupe */}
      <div
        className="relative rounded-xl overflow-hidden border border-panelBorder bg-void cursor-crosshair group"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setLoupePos((p) => ({ ...p, show: false }))}
      >
        {renderedUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img ref={imageRef} src={renderedUrl} alt="Visual Analysis" className="w-full h-auto object-contain max-h-[460px] mx-auto" />
        )}

        {/* Floating Loupe Magnifier Glass */}
        {loupePos.show && (
          <div
            className="absolute pointer-events-none z-30 rounded-full overflow-hidden border-2 border-safelight bg-void shadow-2xl flex flex-col items-center justify-center"
            style={{
              left: `${loupePos.x - 60}px`,
              top: `${loupePos.y - 130}px`,
              width: "120px",
              height: "120px",
            }}
          >
            <canvas ref={loupeCanvasRef} width={120} height={120} className="w-full h-full" />
          </div>
        )}
      </div>

      {/* Pixel Inspector Bar */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-void border border-panelBorder font-mono text-xs text-muted">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-paper">
            <ZoomIn size={13} className="text-safelight" /> Hover image for 10x-50x Pixel Inspector
          </span>
          {loupePos.show && (
            <>
              <span className="text-paper">X: {pixelColor.x} Y: {pixelColor.y}</span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: pixelColor.hex }} />
                <span className="text-paper">{pixelColor.hex}</span> (R:{pixelColor.r} G:{pixelColor.g} B:{pixelColor.b})
              </span>
            </>
          )}
        </div>
        {activeTab === "clones" && cloneData && (
          <span className="text-safelight font-bold">
            {cloneData.matchCount > 0 ? `⚠ ${cloneData.matchCount} candidate clone patches detected` : "No clone matches detected"}
          </span>
        )}
      </div>
    </Card>
  );
}
