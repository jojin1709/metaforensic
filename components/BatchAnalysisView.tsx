"use client";

import { useState } from "react";
import { FolderCheck, Upload, Loader2, CheckCircle2, AlertTriangle, Fingerprint } from "lucide-react";
import Card from "./Card";
import { extractExif, ExifResult } from "@/lib/exif";
import { loadImageFromFile, computeDHash, hammingDistanceHex } from "@/lib/imageAnalysis";

interface BatchItem {
  file: File;
  exif?: ExifResult;
  dhash?: string;
  status: "pending" | "processing" | "done" | "error";
}

export default function BatchAnalysisView() {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  const handleFiles = async (filesList: FileList) => {
    const newItems: BatchItem[] = Array.from(filesList).map((file) => ({
      file,
      status: "pending",
    }));
    setItems(newItems);
    setAnalyzing(true);

    for (let i = 0; i < newItems.length; i++) {
      newItems[i].status = "processing";
      setItems([...newItems]);

      try {
        const exif = await extractExif(newItems[i].file);
        const img = await loadImageFromFile(newItems[i].file);
        const dhash = await computeDHash(img);

        newItems[i].exif = exif;
        newItems[i].dhash = dhash;
        newItems[i].status = "done";
      } catch {
        newItems[i].status = "error";
      }
      setItems([...newItems]);
    }
    setAnalyzing(false);
  };

  return (
    <section className="max-w-6xl mx-auto px-6 pb-24 font-mono">
      <h2 className="text-xl font-bold text-paper mb-4 flex items-center gap-2">
        <FolderCheck className="text-safelight" /> Multi-File Batch Evidence Analysis
      </h2>

      {/* Multi File Dropzone */}
      <div className="rounded-xl border border-dashed border-panelBorder p-8 text-center bg-panel mb-6 hover:border-safelight/50 transition-colors">
        <input
          type="file"
          accept="image/*"
          multiple
          id="batch-file-input"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <label htmlFor="batch-file-input" className="cursor-pointer space-y-2 block">
          <Upload size={32} className="mx-auto text-muted" />
          <span className="block text-sm font-bold text-paper">
            Drop multiple evidence photos here, or click to browse
          </span>
          <span className="block text-xs text-muted">
            Processes multiple evidence items simultaneously to detect camera clusters, timeline gaps, and duplicate hashes.
          </span>
        </label>
      </div>

      {items.length > 0 && (
        <Card icon={FolderCheck} title="Evidence Batch Matrix" tag={`${items.length} files`}>
          <div className="rounded-xl border border-panelBorder bg-void overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-panelBorder text-muted bg-panel/50">
                  <th className="p-3 font-bold">Status</th>
                  <th className="p-3 font-bold">Filename</th>
                  <th className="p-3 font-bold">Camera Make / Model</th>
                  <th className="p-3 font-bold">Capture Timestamp</th>
                  <th className="p-3 font-bold">GPS</th>
                  <th className="p-3 font-bold">Perceptual Hash (dHash)</th>
                  <th className="p-3 font-bold">Cross-File Duplicate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-panelBorder/30">
                {items.map((item, idx) => {
                  // Check cross-file duplicate perceptual hash match
                  let isDuplicate = false;
                  if (item.dhash) {
                    isDuplicate = items.some(
                      (other, oIdx) => oIdx !== idx && other.dhash && hammingDistanceHex(item.dhash!, other.dhash) <= 4
                    );
                  }

                  return (
                    <tr key={idx} className="hover:bg-panel/40 transition-colors">
                      <td className="p-3">
                        {item.status === "processing" ? (
                          <Loader2 size={14} className="animate-spin text-safelight" />
                        ) : item.status === "done" ? (
                          <CheckCircle2 size={14} className="text-data" />
                        ) : (
                          <AlertTriangle size={14} className="text-safelight" />
                        )}
                      </td>
                      <td className="p-3 text-paper font-bold truncate max-w-[180px]">{item.file.name}</td>
                      <td className="p-3 text-muted">
                        {item.exif?.make || item.exif?.model
                          ? `${item.exif.make || ""} ${item.exif.model || ""}`
                          : "N/A"}
                      </td>
                      <td className="p-3 text-muted font-mono">
                        {item.exif?.timestamps?.[0]?.value || "No Timestamp"}
                      </td>
                      <td className="p-3 font-mono">
                        {item.exif?.gps ? (
                          <span className="text-data">
                            {item.exif.gps.lat.toFixed(4)}, {item.exif.gps.lon.toFixed(4)}
                          </span>
                        ) : (
                          <span className="text-muted/60">No GPS</span>
                        )}
                      </td>
                      <td className="p-3 text-data font-mono break-all max-w-[140px]">{item.dhash || "—"}</td>
                      <td className="p-3 font-mono">
                        {isDuplicate ? (
                          <span className="inline-flex items-center gap-1 text-safelight font-bold">
                            <Fingerprint size={12} /> Hash Match
                          </span>
                        ) : (
                          <span className="text-muted/40">Unique</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </section>
  );
}
