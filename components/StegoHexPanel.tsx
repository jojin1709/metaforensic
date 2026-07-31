"use client";

import { useEffect, useState } from "react";
import { Binary, Eye, FileText, Layers, ShieldAlert, Cpu } from "lucide-react";
import Card from "./Card";
import { renderLSBBitPlane, extractBinaryStrings, getHexDump, HexRow } from "@/lib/stego";
import { inspectImageChunks, ChunkResult } from "@/lib/chunkInspector";
import { parseJpegDqt, DqtResult } from "@/lib/dqtProfiler";
import { inspectC2paManifest, C2paResult } from "@/lib/c2paVerifier";

interface Props {
  file: File;
  img: HTMLImageElement;
}

export default function StegoHexPanel({ file, img }: Props) {
  const [activeTab, setActiveTab] = useState<"lsb" | "dqt" | "c2pa" | "hex" | "strings" | "chunks">("lsb");

  // Stego LSB state
  const [channel, setChannel] = useState<"R" | "G" | "B" | "RGB">("R");
  const [bitPos, setBitPos] = useState<number>(0); // Bit 0 is LSB
  const [lsbUrl, setLsbUrl] = useState<string>("");

  // Hex / Binary / Chunks state
  const [hexRows, setHexRows] = useState<HexRow[]>([]);
  const [asciiStrings, setAsciiStrings] = useState<string[]>([]);
  const [chunkResult, setChunkResult] = useState<ChunkResult | null>(null);
  const [dqtResult, setDqtResult] = useState<DqtResult | null>(null);
  const [c2paResult, setC2paResult] = useState<C2paResult | null>(null);

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
      setDqtResult(parseJpegDqt(buffer));
      setC2paResult(inspectC2paManifest(buffer));
    });
    return () => {
      cancelled = true;
    };
  }, [file]);

  return (
    <Card icon={Binary} title="Steganography & Advanced Binary Analysis" tag="LSB · DQT · C2PA AI · Hex">
      {/* Sub-Header Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { id: "lsb", label: "LSB Stego Bit-Plane", icon: Eye },
          { id: "dqt", label: "JPEG DQT Quantization", icon: Cpu },
          { id: "c2pa", label: "C2PA & AI Verifier", icon: ShieldAlert },
          { id: "hex", label: "Embedded Hex Viewer", icon: Binary },
          { id: "strings", label: "ASCII Strings", icon: FileText },
          { id: "chunks", label: "Chunk Inspector", icon: Layers },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
                activeTab === t.id
                  ? "bg-safelight text-void font-bold border-safelight"
                  : "bg-void border-panelBorder text-muted hover:text-paper"
              }`}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* 1. LSB Stego Bit-Plane View */}
      {activeTab === "lsb" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl bg-void border border-panelBorder text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-muted">Color Channel:</span>
              {(["R", "G", "B", "RGB"] as const).map((ch) => (
                <button
                  key={ch}
                  onClick={() => setChannel(ch)}
                  className={`px-2.5 py-1 rounded border transition-colors ${
                    channel === ch ? "bg-safelight text-void font-bold border-safelight" : "bg-panel text-muted border-panelBorder"
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted">Bit Position:</span>
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((b) => (
                  <button
                    key={b}
                    onClick={() => setBitPos(b)}
                    className={`w-7 h-7 rounded text-xs border flex items-center justify-center transition-colors ${
                      bitPos === b ? "bg-safelight text-void font-bold border-safelight" : "bg-panel text-muted border-panelBorder"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
              <span className="text-muted text-[10px] ml-1">({bitPos === 0 ? "LSB - Least Significant" : bitPos === 7 ? "MSB" : `Bit ${bitPos}`})</span>
            </div>
          </div>

          <div className="rounded-xl border border-panelBorder bg-void p-2 flex items-center justify-center min-h-[320px]">
            {lsbUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={lsbUrl} alt="LSB Bit Plane" className="w-full h-auto object-contain max-h-[420px] rounded-lg" />
            ) : (
              <p className="text-muted text-xs font-mono">Rendering LSB Bit-Plane...</p>
            )}
          </div>
        </div>
      )}

      {/* 2. JPEG DQT Quantization Matrix Profiler */}
      {activeTab === "dqt" && dqtResult && (
        <div className="space-y-4 font-mono text-xs">
          <div className="p-3 rounded-xl bg-void border border-panelBorder flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-muted block text-[10px]">JPEG DQT Table Profile</span>
              <span className="text-paper font-bold">{dqtResult.hasDqt ? `Found ${dqtResult.tables.length} Quantization Tables` : "No DQT Tables Present"}</span>
            </div>
            <div>
              <span className="text-muted block text-[10px]">Estimated Compression Quality</span>
              <span className="text-safelight font-bold text-sm">~{dqtResult.estimatedQuality}%</span>
            </div>
          </div>

          {dqtResult.notes.length > 0 && (
            <div className="p-3 rounded-xl bg-safelight/10 border border-safelight/40 text-safelight space-y-1">
              {dqtResult.notes.map((n, i) => (
                <p key={i}>• {n}</p>
              ))}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {dqtResult.tables.map((t) => (
              <div key={t.id} className="p-3 rounded-xl bg-void border border-panelBorder space-y-2">
                <h4 className="font-bold text-safelight text-xs">Table #{t.id} ({t.type} Matrix)</h4>
                <div className="grid grid-cols-8 gap-1 text-[10px] text-center font-mono text-paper">
                  {t.table.map((val, idx) => (
                    <span key={idx} className="p-1 rounded bg-panel border border-panelBorder/50">
                      {val}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. C2PA & AI Synthetic Media Verifier */}
      {activeTab === "c2pa" && c2paResult && (
        <div className="space-y-4 font-mono text-xs">
          <div className={`p-4 rounded-xl border ${c2paResult.isAiGenerated ? "bg-safelight/10 border-safelight/50 text-safelight" : "bg-void border-panelBorder text-paper"}`}>
            <h4 className="font-bold text-sm mb-1 flex items-center gap-2">
              <ShieldAlert size={16} /> {c2paResult.isAiGenerated ? "Synthetic AI Generation Signature Detected!" : "C2PA Provenance Signature Status"}
            </h4>
            {c2paResult.claimGenerator && <p className="text-data font-bold">Engine: {c2paResult.claimGenerator}</p>}
            <div className="mt-2 space-y-1 text-muted text-xs">
              {c2paResult.details.map((d, i) => (
                <p key={i}>• {d}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Hex Viewer */}
      {activeTab === "hex" && (
        <div className="rounded-xl border border-panelBorder bg-void p-3 font-mono text-xs overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-muted border-b border-panelBorder/40">
                <th className="pb-2 font-bold w-20">Offset</th>
                <th className="pb-2 font-bold">Hex Bytes (First 512 Bytes)</th>
                <th className="pb-2 font-bold w-36">ASCII</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panelBorder/20 text-muted">
              {hexRows.map((row) => (
                <tr key={row.offsetStr} className="hover:text-paper transition-colors">
                  <td className="py-1 text-safelight font-bold">{row.offsetStr}</td>
                  <td className="py-1 font-mono tracking-wider text-data">{row.hexStr}</td>
                  <td className="py-1 text-paper">{row.asciiStr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. ASCII Strings */}
      {activeTab === "strings" && (
        <div className="rounded-xl border border-panelBorder bg-void p-3 font-mono text-xs space-y-1 max-h-96 overflow-y-auto">
          <p className="text-muted text-[10px] mb-2 border-b border-panelBorder/40 pb-1">Extracted readable ASCII strings (&gt;= 4 characters):</p>
          {asciiStrings.length > 0 ? (
            asciiStrings.map((s, i) => (
              <p key={i} className="text-paper break-all hover:bg-panel p-0.5 rounded transition-colors">
                {s}
              </p>
            ))
          ) : (
            <p className="text-muted">No ASCII strings found.</p>
          )}
        </div>
      )}

      {/* 6. Chunks Inspector */}
      {activeTab === "chunks" && chunkResult && (
        <div className="space-y-3 font-mono text-xs">
          <div className="p-3 rounded-xl bg-void border border-panelBorder">
            <span className="text-muted block text-[10px]">Detected Container Signature</span>
            <span className="text-safelight font-bold">{chunkResult.format} Container</span>
          </div>

          {chunkResult.notes.length > 0 && (
            <div className="p-3 rounded-xl bg-panel border border-panelBorder text-muted space-y-1">
              {chunkResult.notes.map((n, i) => (
                <p key={i}>• {n}</p>
              ))}
            </div>
          )}

          {chunkResult.chunks.length > 0 && (
            <div className="rounded-xl border border-panelBorder bg-void overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-panelBorder text-muted bg-panel/50">
                    <th className="p-2.5 font-bold">Chunk</th>
                    <th className="p-2.5 font-bold">Size</th>
                    <th className="p-2.5 font-bold">Offset</th>
                    <th className="p-2.5 font-bold">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-panelBorder/30">
                  {chunkResult.chunks.map((c, i) => (
                    <tr key={i} className={c.isStandard ? "hover:bg-panel/40" : "bg-safelight/10 text-safelight"}>
                      <td className="p-2.5 font-bold text-data">{c.name}</td>
                      <td className="p-2.5 text-muted">{c.size} B</td>
                      <td className="p-2.5 text-muted">0x{c.offset.toString(16)}</td>
                      <td className="p-2.5 text-paper">{c.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
