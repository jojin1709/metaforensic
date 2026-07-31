"use client";

import { useState, useRef, useEffect } from "react";
import { GitCompare, Upload, AlertTriangle, ArrowLeftRight } from "lucide-react";
import Card from "./Card";
import { computeXorDiff } from "@/lib/imageCompare";
import { loadImageFromFile } from "@/lib/imageAnalysis";

export default function ImageCompareModal() {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);

  const [url1, setUrl1] = useState<string>("");
  const [url2, setUrl2] = useState<string>("");

  const [sliderPos, setSliderPos] = useState<number>(50); // Curtain slider %
  const [diffUrl, setDiffUrl] = useState<string>("");
  const [similarityScore, setSimilarityScore] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"curtain" | "xor">("curtain");

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!file1) return;
    const u1 = URL.createObjectURL(file1);
    setUrl1(u1);
    return () => URL.revokeObjectURL(u1);
  }, [file1]);

  useEffect(() => {
    if (!file2) return;
    const u2 = URL.createObjectURL(file2);
    setUrl2(u2);
    return () => URL.revokeObjectURL(u2);
  }, [file2]);

  useEffect(() => {
    if (!file1 || !file2) return;
    let cancelled = false;

    async function runDiff() {
      try {
        const img1 = await loadImageFromFile(file1!);
        const img2 = await loadImageFromFile(file2!);
        if (cancelled) return;

        const { diffUrl, similarityScore } = computeXorDiff(img1, img2);
        setDiffUrl(diffUrl);
        setSimilarityScore(similarityScore);
      } catch (e) {
        console.error("Comparison error:", e);
      }
    }

    runDiff();
    return () => {
      cancelled = true;
    };
  }, [file1, file2]);

  const handleSliderMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    setSliderPos(Math.round((x / rect.width) * 100));
  };

  return (
    <section className="max-w-6xl mx-auto px-6 pb-24 font-mono">
      <h2 className="text-xl font-bold text-paper mb-4 flex items-center gap-2">
        <GitCompare className="text-safelight" /> Side-by-Side Image Comparison & XOR Diff
      </h2>

      {/* Dual File Selection Inputs */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="rounded-xl border border-dashed border-panelBorder p-6 text-center bg-panel hover:border-safelight/50 transition-colors">
          <input
            type="file"
            accept="image/*"
            id="file1-input"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && setFile1(e.target.files[0])}
          />
          <label htmlFor="file1-input" className="cursor-pointer space-y-2 block">
            <Upload size={24} className="mx-auto text-muted" />
            <span className="block text-xs font-bold text-paper">
              {file1 ? file1.name : "Select Image A (Original Evidence)"}
            </span>
          </label>
        </div>

        <div className="rounded-xl border border-dashed border-panelBorder p-6 text-center bg-panel hover:border-safelight/50 transition-colors">
          <input
            type="file"
            accept="image/*"
            id="file2-input"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && setFile2(e.target.files[0])}
          />
          <label htmlFor="file2-input" className="cursor-pointer space-y-2 block">
            <Upload size={24} className="mx-auto text-muted" />
            <span className="block text-xs font-bold text-paper">
              {file2 ? file2.name : "Select Image B (Suspected Edit)"}
            </span>
          </label>
        </div>
      </div>

      {file1 && file2 && url1 && url2 && (
        <Card icon={ArrowLeftRight} title="Interactive Visual Comparison" tag={similarityScore !== null ? `${similarityScore}% Visual Match` : undefined}>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setViewMode("curtain")}
              className={`px-3 py-1.5 rounded-lg text-xs border ${
                viewMode === "curtain" ? "bg-safelight text-void font-bold" : "bg-void text-muted border-panelBorder"
              }`}
            >
              Curtain Split Slider
            </button>
            <button
              onClick={() => setViewMode("xor")}
              className={`px-3 py-1.5 rounded-lg text-xs border ${
                viewMode === "xor" ? "bg-safelight text-void font-bold" : "bg-void text-muted border-panelBorder"
              }`}
            >
              XOR Pixel Difference Heatmap
            </button>
          </div>

          {viewMode === "curtain" ? (
            <div
              ref={containerRef}
              onMouseMove={handleSliderMove}
              onTouchMove={handleSliderMove}
              className="relative w-full h-[460px] rounded-xl overflow-hidden border border-panelBorder select-none cursor-ew-resize bg-void"
            >
              {/* Image B (Background full width) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url2} alt="Image B" className="absolute inset-0 w-full h-full object-contain" />

              {/* Image A (Clipped foreground) */}
              <div
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: `${sliderPos}%` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url1} alt="Image A" className="absolute inset-y-0 left-0 w-full h-full object-contain max-w-none" style={{ width: containerRef.current?.clientWidth || "100%" }} />
              </div>

              {/* Slider Line */}
              <div
                className="absolute inset-y-0 w-0.5 bg-safelight shadow-2xl z-20"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-safelight text-void flex items-center justify-center shadow-lg font-bold text-xs">
                  ↔
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-panelBorder bg-void p-2 flex items-center justify-center max-h-[460px]">
              {diffUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={diffUrl} alt="XOR Difference" className="w-full h-auto object-contain max-h-[440px]" />
              ) : (
                <p className="text-muted text-xs p-8">Calculating pixel difference heatmap...</p>
              )}
            </div>
          )}

          <div className="mt-4 p-3 rounded-lg bg-void border border-panelBorder flex flex-wrap items-center justify-between text-xs">
            <div className="space-x-4">
              <span className="text-muted">Image A: <span className="text-paper">{file1.name}</span></span>
              <span className="text-muted">Image B: <span className="text-paper">{file2.name}</span></span>
            </div>
            {similarityScore !== null && (
              <span className={`font-bold ${similarityScore > 90 ? "text-data" : "text-safelight"}`}>
                {similarityScore < 95 && <AlertTriangle size={13} className="inline mr-1" />}
                Visual Similarity Score: {similarityScore}%
              </span>
            )}
          </div>
        </Card>
      )}
    </section>
  );
}
