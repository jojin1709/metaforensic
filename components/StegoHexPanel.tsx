"use client";

import { useEffect, useState } from "react";
import { Binary, Eye, FileText, Layers } from "lucide-react";
import Card from "./Card";
import { renderLSBBitPlane, extractBinaryStrings, getHexDump, HexRow } from "@/lib/stego";
import { inspectImageChunks, ChunkResult } from "@/lib/chunkInspector";

interface Props {
  file: File;
  img: HTMLImageElement;
}

export default function StegoHexPanel({ file, img }: Props) {
  const [activeTab, setActiveTab] = useState<"lsb" | "hex" | "strings" | "chunks">("lsb");

  // Stego LSB state
  const [channel, setChannel] = useState<"R" | "G" | "B" | "RGB">("R");
  const [bitPos, setBitPos] = useState<number>(0); // Bit 0 is LSB
  const [lsbUrl, setLsbUrl] = useState<string>("");

  // Hex / Binary / Chunks state
  const [hexRows, setHexRows] = useState<HexRow[]>([]);
  const [asciiStrings, setAsciiStrings] = useState<string[]>([]);
  const [chunkResult, setChunkResult] = useState<ChunkResult | null>(null);

  useEffect(() => {
    if (img && activeTab === "lsb") {
      setLsbUrl(renderLSBBitPlane(img, channel, bitPos));
    }
  }, [img, activeTab, channel, bitPos]);

  useEffect(() => {
    let cancelled = false;
    file.arrayBuffer().then((buffer) => {
      if (cancelled) return;
      setHexRows(getHexDump(buffer, 512));
      setAsciiStrings(extractBinaryStrings(buffer, 4));
      setChunkResult(inspectImageChunks(buffer, file.name));
    });
    return () => {
      cancelled = true;
    };
  }, [file]);

  return (
    <Card icon={Binary} title="Steganography & Binary Inspection" tag="LSB Stego · Hex · Strings · Chunks">
      {/* Sub-Header Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { id: "lsb", label: "LSB Stego Bit-Plane", icon: Eye },
          { id: "hex", label: "Embedded Hex Viewer", icon: Binary },
          { id: "strings", label: "ASCII String Extractor", icon: FileText },
          { id: "chunks", label: "PNG / WebP Chunk Inspector", icon: Layers },
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

      {/* LSB Bit-Plane Stego Viewer */}
      {activeTab === "lsb" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-void border border-panelBorder font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted">Target Channel:</span>
              {(["R", "G", "B", "RGB"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setChannel(c)}
                  className={`px-2 py-0.5 rounded ${
                    channel === c ? "bg-data text-void font-bold" : "text-muted hover:text-paper"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted">Bit Plane (0 = LSB):</span>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((b) => (
                <button
                  key={b}
                  onClick={() => setBitPos(b)}
                  className={`px-2 py-0.5 rounded ${
                    bitPos === b ? "bg-safelight text-void font-bold" : "text-muted hover:text-paper"
                  }`}
                >
                  Bit {b}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border border-panelBorder bg-void max-h-[440px] flex items-center justify-center p-2">
            {lsbUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={lsbUrl} alt="LSB Bit Plane" className="w-full h-auto object-contain max-h-[420px]" />
            )}
          </div>
          <p className="text-xs text-muted leading-relaxed font-mono">
            Extracts individual binary bit planes. Secret payloads, encrypted text, or hidden watermark images are commonly hidden inside Bit 0 (Least Significant Bit) of color channels.
          </p>
        </div>
      )}

      {/* Embedded Hex Viewer */}
      {activeTab === "hex" && (
        <div className="space-y-2">
          <div className="rounded-xl border border-panelBorder bg-void p-3 font-mono text-xs overflow-x-auto max-h-[380px] overflow-y-auto">
            <div className="grid grid-cols-[90px_1fr_160px] gap-4 text-muted pb-2 border-b border-panelBorder font-bold">
              <span>Offset</span>
              <span>Hex Dump (First 512 Bytes)</span>
              <span>ASCII Representation</span>
            </div>
            <div className="divide-y divide-panelBorder/30">
              {hexRows.map((r, i) => (
                <div key={i} className="grid grid-cols-[90px_1fr_160px] gap-4 py-1 hover:bg-panel/40">
                  <span className="text-safelight">{r.offsetStr}</span>
                  <span className="text-data whitespace-pre">{r.hexStr}</span>
                  <span className="text-paper">{r.asciiStr}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ASCII String Extractor */}
      {activeTab === "strings" && (
        <div className="space-y-2 font-mono text-xs">
          <p className="text-muted mb-2">Extracting embedded human-readable ASCII strings (minimum length 4 chars):</p>
          <div className="rounded-xl border border-panelBorder bg-void p-3 max-h-[360px] overflow-y-auto space-y-1">
            {asciiStrings.length > 0 ? (
              asciiStrings.map((s, i) => (
                <div key={i} className="py-0.5 text-data break-all hover:bg-panel/50 px-2 rounded">
                  <span className="text-muted/60 mr-3">[{i + 1}]</span>
                  {s}
                </div>
              ))
            ) : (
              <p className="text-muted">No embedded ASCII strings found.</p>
            )}
          </div>
        </div>
      )}

      {/* PNG / WebP Chunk Inspector */}
      {activeTab === "chunks" && chunkResult && (
        <div className="space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-void border border-panelBorder">
            <span className="text-paper font-bold">Detected Container: {chunkResult.format}</span>
            <span className="text-muted">{chunkResult.chunks.length} chunks parsed</span>
          </div>

          <div className="space-y-1">
            {chunkResult.notes.map((n, i) => (
              <p key={i} className="text-safelight">{n}</p>
            ))}
          </div>

          <div className="rounded-xl border border-panelBorder bg-void max-h-[340px] overflow-y-auto divide-y divide-panelBorder/30">
            {chunkResult.chunks.length > 0 ? (
              chunkResult.chunks.map((c, i) => (
                <div key={i} className="p-2.5 flex items-start justify-between gap-3 hover:bg-panel/40">
                  <div>
                    <span className={`font-bold mr-2 ${c.isStandard ? "text-data" : "text-safelight"}`}>{c.name}</span>
                    <span className="text-paper">{c.description}</span>
                  </div>
                  <div className="text-right text-muted shrink-0">
                    <span>{c.size} bytes</span>
                    <span className="block text-[10px]">offset: 0x{c.offset.toString(16)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="p-4 text-muted text-center">No PNG/WebP chunk structures detected for this file format.</p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
